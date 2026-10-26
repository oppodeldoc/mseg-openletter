'use strict';

// MSEG-specific behaviour: anonymous signers and the letter-creation gate.
const { test, before, after, trait } = use('Test/Suite')('MSEG');
const Letter = use('App/Models/Letter');
const Signature = use('App/Models/Signature');
const User = use('App/Models/User');
const Factory = use('Factory');
const Mail = use('Mail');

trait('Test/ApiClient');

async function cleandb() {
  await Signature.query().delete();
  await Letter.query().delete();
  await User.query().delete();
}

{
  let letter;

  before(async () => {
    await cleandb();
    Mail.fake();
    const user = await Factory.model('App/Models/User').create();
    letter = await Factory.model('App/Models/Letter').make();
    letter.locale = 'en';
    await user.letters().save(letter);
  });

  after(async () => {
    Mail.restore();
  });

  test('a signer who unticks show_name is listed as anonymous but still counted', async ({ client, assert }) => {
    const sign = (data) => client.post(`/letters/${letter.slug}/${letter.locale}/sign`).send(data).end();

    const shown = await sign({
      name: 'Shown Parent',
      occupation: 'OUSD Parent/Guardian',
      email: 'shown@example.org',
      show_name: true,
    });
    shown.assertStatus(200);
    const hidden = await sign({
      name: 'Hidden Teacher',
      occupation: 'OUSD Teacher',
      email: 'hidden@example.org',
      show_name: false,
    });
    hidden.assertStatus(200);

    // confirm both, as the email link would
    for (const email of ['shown@example.org', 'hidden@example.org']) {
      const s = await Signature.query()
        .where('letter_id', letter.id)
        .where('name', email === 'shown@example.org' ? 'Shown Parent' : 'Hidden Teacher')
        .first();
      (await client.post('/signatures/confirm').send({ token: s.token }).end()).assertStatus(200);
    }

    // name is kept in the database
    const stored = await Signature.query().where('letter_id', letter.id).where('show_name', false).first();
    assert.equal(stored.name, 'Hidden Teacher');

    const response = await client.get(`/letters/${letter.slug}/${letter.locale}`).end();
    response.assertStatus(200);
    assert.equal(response.body.signatures_stats.verified, 2);
    const byRole = {};
    response.body.signatures.forEach((s) => (byRole[s.occupation] = s.name));
    assert.equal(byRole['OUSD Parent/Guardian'], 'Shown Parent');
    assert.isNull(byRole['OUSD Teacher']);
  });

  test('show_name defaults to true when omitted', async ({ client, assert }) => {
    const response = await client
      .post(`/letters/${letter.slug}/${letter.locale}/sign`)
      .send({ name: 'Default Signer', occupation: 'Community Member', email: 'default@example.org' })
      .end();
    response.assertStatus(200);
    const stored = await Signature.query().where('letter_id', letter.id).where('name', 'Default Signer').first();
    assert.isTrue(stored.show_name);
  });

  test('POST /letters/create is refused unless ALLOW_LETTER_CREATE=true', async ({ client, assert }) => {
    const previous = process.env.ALLOW_LETTER_CREATE;
    process.env.ALLOW_LETTER_CREATE = 'false';
    try {
      const response = await client
        .post('/letters/create')
        .send({ letters: [{ locale: 'en', title: 'Nope', text: 'Nope', email: 'nope@example.org' }] })
        .end();
      response.assertStatus(200);
      assert.equal(response.body.error.code, 403);
      assert.equal(await Letter.query().where('title', 'Nope').getCount(), 0);
    } finally {
      process.env.ALLOW_LETTER_CREATE = previous;
    }
  });
}
