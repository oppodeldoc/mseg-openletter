'use strict';

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route');

Route.on('/').render('welcome');

// Used by the docker-compose healthcheck and the reverse proxy
Route.get('health', () => ({ ok: true }));

Route.get('stats', 'MainController.stats');
Route.get('homepage', 'MainController.homepage');
Route.get('letters', 'LetterController.index');
Route.get('letters/featured', 'LetterController.featured');
Route.get('letters/:slug', 'LetterController.get');
Route.get('letters/:slug/:locale', 'LetterController.get');
// create/update/delete are disabled unless ALLOW_LETTER_CREATE=true (see LetterController)
Route.post('letters/create', 'LetterController.create');
Route.post('letters/update', 'LetterController.update');
Route.post('letters/delete', 'LetterController.delete');
Route.get('signatures/:token', 'SignatureController.get');
Route.get('signatures/:id/:token', 'SignatureController.get'); // deprecated
Route.post('letters/:slug/:locale/sign', 'LetterController.sign');
Route.post('signatures/confirm', 'SignatureController.confirm');
