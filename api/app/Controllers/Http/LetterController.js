'use strict';

const crypto = use('crypto');
const Letter = use('App/Models/Letter');
const Signature = use('App/Models/Signature');
const User = use('App/Models/User');
const acceptLanguageParser = use('accept-language-parser');
const Logger = use('Logger');
Logger.level = 'info';

const availableLocales = require('../../../locales.json');
const allowedRoles = require('../../../config/roles');

const { sendEmail } = use('App/Libs/email');
const { getImageSize } = use('App/Libs/image');

function containsURL(str) {
  const patterns = [
    /https?:\/\/.+\..+/,
    /www\..+\..+/,
    /(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,8}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/,
  ];
  return patterns.some((pattern) => pattern.test(str));
}

// Letter creation/edition is a one-time admin operation for MSEG; keep it off unless explicitly enabled
function letterEditingDisabled() {
  return process.env.ALLOW_LETTER_CREATE !== 'true';
}
const letterEditingDisabledError = {
  error: { code: 403, message: 'Letter creation is disabled on this server' },
};

// must match the column sizes of the signatures table
const signatureMaxLengths = { name: 128, occupation: 64, city: 64, organization: 64 };

const latestSignatureTimestampByIpAddress = {};
console.log('>>> Setting up latestSignatureTimestampByIpAddress');
setInterval(() => {
  console.log('>>> Resetting latestSignatureTimestampByIpAddress');
  // Clear the keys instead of reassigning: the binding is a const, and the
  // reassignment threw "TypeError: Assignment to constant variable" once a day,
  // inside a timer where nothing could catch it — killing the whole API.
  for (const ipAddress of Object.keys(latestSignatureTimestampByIpAddress)) {
    delete latestSignatureTimestampByIpAddress[ipAddress];
  }
}, 1000 * 60 * 60 * 24); // reset every day

class LetterController {
  async index(ctx) {
    const request = ctx.request.only(['locale', 'featured', 'limit', 'minSignatures']);
    return await Letter.list({
      locale: request.locale,
      featured: request.featured,
      limit: request.limit,
      minSignatures: request.minSignatures,
    });
  }
  async featured(ctx) {
    const request = ctx.request.only(['locale']);
    return await Letter.list({ locale: request.locale, featured: true });
  }

  async get(ctx) {
    const resultSet = await Letter.query()
      .whereSlug(ctx.params.slug)
      .with('signatures', (builder) => {
        builder.orderBy('id', 'asc');
      })
      .with('parentLetter', (builder) => {
        // builder.select('slug', 'title')
      })
      .with('updates')
      .fetch();

    const request = ctx.request.only(['locale', 'limit']);
    const limit = request.limit === '0' ? null : parseInt(request.limit, 10) || 1000;
    const locale =
      request.locale ||
      acceptLanguageParser.pick(Object.keys(availableLocales), ctx.request.headers()['accept-language'], {
        loose: true,
      }) ||
      'en';
    console.log('GET', ctx.params.slug, locale);
    let res;
    if (resultSet.rows.length > 0) {
      const letters = resultSet.rows;
      const signatures_stats = {
        verified: 0,
        unverified: 0,
        total: 0,
      };

      let index = 0;
      const signatures = [];
      const locales = [];
      const verified_signatures = [];
      letters.map((l, i) => {
        const letter = l.toJSON();
        letter.signatures.map((s) => {
          if (!s.show_name) s.name = null; // signer asked to stay anonymous; still counted
          if (s.is_verified) {
            verified_signatures.push(s);
            signatures_stats.verified++;
          } else {
            signatures_stats.unverified++;
          }
          signatures.push(s);
        });
        locales.push(letter.locale);
        if (letter.locale === locale) index = i;
      });

      signatures.sort((a, b) => {
        return a.created_at < b.created_at ? -1 : 1;
      });
      signatures_stats.total = signatures.length;
      res = letters[index].toJSON();
      res.signatures_stats = signatures_stats;
      res.signatures = limit ? signatures.slice(0, limit) : signatures;

      if (limit) {
        res.first_verified_signatures = verified_signatures.slice(0, 20);
        res.latest_verified_signatures = verified_signatures.slice(-20);
      }
      res.locales = locales;
      res.type = res.parent_letter_id ? 'update' : 'letter';
      if (res.updates) {
        res.updates = res.updates.filter((u) => u.locale === locale);
      }

      if (res.image) {
        res.image = await getImageSize(res.image);
      }

      return res;
    }

    if (resultSet.rows.length == 1) {
      res = resultSet.rows[0].toJSON();
      res.locales = [res.locale];
      res.type = res.parent_letter_id ? 'update' : 'letter';
      return res;
    } else {
      return { error: { code: 404, message: 'not found' } };
    }
  }

  async create({ request }) {
    if (letterEditingDisabled()) return letterEditingDisabledError;
    const formData = request.only(['letters']);
    console.log('>>> LetterController.create', formData);
    let user = {};
    if (formData.letters[0].email) {
      try {
        user = await User.findOrCreate(
          { email: formData.letters[0].email },
          {
            email: formData.letters[0].email,
          },
        );
      } catch (e) {
        console.error(e);
      }
    }

    let letters;
    try {
      letters = await Letter.createWithLocales(formData.letters, {
        image: formData.letters[0].image,
        user_id: user && user.id,
      });
    } catch (e) {
      console.error('error', e);
    }

    if (formData.letters[0].email) {
      const subject = 'KEEP: Link to post updates to your statement';

      try {
        await sendEmail(formData.letters[0].email, subject, 'emails.en.link_to_edit_openletter', {
          letter: letters[0],
          env: process.env,
        });
      } catch (e) {
        console.error('error', e);
      }
      console.log('>>> email sent');
    }
    return letters[0].toJSON();
  }

  /**
   * Post an update to an existing open letter
   * @param {*} param0
   */
  async update({ request }) {
    if (letterEditingDisabled()) return letterEditingDisabledError;
    const formData = request.only(['letters', 'parent_letter_id', 'token']);
    console.log('>>> LetterController.update', formData);

    const parentLetter = await Letter.find(formData.parent_letter_id);

    if (formData.token !== parentLetter.token) {
      return { error: { code: 403, message: 'Unauthorized: Invalid token' } };
    }

    let updates;
    try {
      updates = await Letter.createUpdate(parentLetter, formData.letters);
    } catch (e) {
      console.error('error', e);
    }

    const subscribersByLocale = await parentLetter.getSubscribersByLocale();
    await Promise.all(
      updates.map(async (localeUpdate) => {
        const subscribers = subscribersByLocale[localeUpdate.locale];
        const emailData = {
          update: localeUpdate.toJSON(),
          parentLetter: localeUpdate.toJSON().parentLetter.toJSON(),
          env: process.env,
        };
        console.log(`>>> sending ${localeUpdate.locale} update to ${subscribers.length} subscribers`, subscribers);

        await Promise.all(
          subscribers.map(async (email) => {
            try {
              await sendEmail(email, localeUpdate.title, 'emails.update', emailData);
            } catch (e) {
              console.error('error', e);
            }

            console.log('>>> email sent');
          }),
        );
      }),
    );
    const res = updates[0].toJSON();
    res.locales = updates.map((u) => u.locale);
    res.type = 'update';
    return res;
  }

  /**
   * Delete an existing open letter
   * @param {*} param0
   */
  async delete({ request }) {
    if (letterEditingDisabled()) return letterEditingDisabledError;
    const formData = request.only(['parent_letter_id', 'token']);
    console.log('>>> LetterController.delete', formData);

    const parentLetter = await Letter.find(formData.parent_letter_id);

    if (!parentLetter) {
      return { error: { code: 404, message: 'This open letter cannot be found in the database' } };
    }

    if (formData.token !== parentLetter.token) {
      return { error: { code: 403, message: 'Unauthorized: Invalid token' } };
    }

    await parentLetter.updates().delete();
    await parentLetter.signatures().delete();
    await parentLetter.delete();

    return {
      code: 200,
      status: 'success',
      action: 'delete',
      letter_url: `${process.env.WEBSITE_URL}/${parentLetter.slug}`,
      message: `Open letter removed successfully`,
    };
  }

  async sign({ request }) {
    const signatureData = request.only([
      'name',
      'occupation',
      'city',
      'organization',
      'share_email',
      'show_name',
      'id',
      'token',
    ]);
    // checkbox semantics: anything but an explicit false means "show my name"
    signatureData.show_name = !(signatureData.show_name === false || signatureData.show_name === 'false');

    // only accept one signature per 30s per ip address (not enforced in the test suite)
    const ipAddress = request.headers()['x-forwarded-for'] || request.ip;
    if (ipAddress && process.env.NODE_ENV !== 'testing') {
      if (latestSignatureTimestampByIpAddress[ipAddress] > new Date(Date.now() - 30000)) {
        console.log('>>> Too many requests: please try again later', ipAddress, JSON.stringify(signatureData));
        return {
          error: { code: 429, message: 'Too many requests: please try again later' },
        };
      }
    }

    if (containsURL(JSON.stringify(signatureData))) {
      console.log('>>> containsURL', JSON.stringify(signatureData));
      return {
        error: { code: 400, message: 'Invalid signature: it should not contain any URL' },
      };
    }

    for (const field in signatureMaxLengths) {
      const value = signatureData[field];
      if (typeof value === 'string' && value.length > signatureMaxLengths[field]) {
        console.log('>>> field too long', field, value.length);
        return {
          error: {
            code: 400,
            message: `Invalid signature: ${field} should be at most ${signatureMaxLengths[field]} characters`,
          },
        };
      }
    }

    if (!allowedRoles.includes(signatureData.occupation)) {
      console.log('>>> invalid role', signatureData.occupation);
      return { error: { code: 400, message: 'Invalid signature: please choose a role from the list' } };
    }

    if (signatureData.id && signatureData.token) {
      const existingSignature = await Signature.query()
        .where('id', signatureData.id)
        .where('token', signatureData.token)
        .first();
      if (!existingSignature) {
        return {
          error: { code: 400, message: 'Unable to update signature. Invalid id and token.' },
        };
      }
      delete signatureData.share_email; // no a db column
      existingSignature.merge(signatureData);
      await existingSignature.save();
      return existingSignature.toJSON();
    }

    const letter = await Letter.query()
      .where('slug', request.params.slug)
      .where('locale', request.params.locale)
      .first();

    const email = request.body.email;

    if (!email) {
      return { error: { code: 400, message: 'Email is required' } };
    }

    const tokenData = `${letter.slug}-${email}-${process.env.APP_KEY}`;
    signatureData.token = crypto.createHash('md5').update(tokenData).digest('hex');

    if (signatureData.share_email && email) {
      signatureData.email = email;
    }
    delete signatureData.share_email;

    let signature;
    try {
      signature = await letter.signatures().create(signatureData);
    } catch (e) {
      if (e.constraint === 'signatures_token_unique') {
        signature = await Signature.query().where('token', signatureData.token).first();
        if (!signature || signature.is_verified) {
          return {
            error: { code: 400, message: 'you already signed this open letter' },
          };
        } else {
          // we update the signature and continue to send a new email confirmation
          signature.merge(signatureData);
          await signature.save();
        }
      } else {
        console.error('error', e);
        return { error: { code: 500, message: 'Unable to save your signature, please try again later' } };
      }
    }

    const emailData = {
      letter: letter.toJSON(),
      signature: signature.toJSON(),
      env: process.env,
    };
    emailData.signature.token = signature.token;
    const subject = 'ACTION REQUIRED: Please confirm your signature on the MSEG statement';

    await sendEmail(request.body.email, subject, 'emails.en.confirm_signature', emailData);
    // if successful, we remove the email from database if the user didn't subscribe for updates
    if (!request.body.share_email) {
      signature.email = null;
      signature.save();
    }

    if (ipAddress) {
      latestSignatureTimestampByIpAddress[ipAddress] = new Date();
    }

    return signature.toJSON();
  }
}

module.exports = LetterController;
