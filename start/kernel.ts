import Server from '@ioc:Adonis/Core/Server';

/*
|--------------------------------------------------------------------------
| Global middleware
|--------------------------------------------------------------------------
|
| An array of global middleware, that will be executed in the order they
| are defined for every HTTP requests.
|
*/
Server.middleware.register([
  'Adonis/Core/BodyParserMiddleware',
  'Adonis/Addons/ShieldMiddleware',
  'App/Middleware/ConvertEmptyStringsToNull',
  // TODO: Check
  //'Adonis/Middleware/AuthInit',
  //'Adonis/Middleware/Session',
]);

/*
|--------------------------------------------------------------------------
| Named middleware
|--------------------------------------------------------------------------
|
| Named middleware are defined as key-value pair. The value is the namespace
| or middleware function and key is the alias. Later you can use these
| alias on individual routes. For example:
|
| { auth: 'App/Auth/Middleware' }
|
| and then use it as follows
|
| Route.get('dashboard', 'UserController.dashboard').middleware('auth')
|
*/
Server.middleware.registerNamed({
  // TODO: Fix
  //auth: 'Adonis/Middleware/Auth',
  //guest: 'Adonis/Middleware/AllowGuestOnly',
});

/*
|--------------------------------------------------------------------------
| Server Middleware
|--------------------------------------------------------------------------
|
| Server level middleware are executed even when route for a given URL is
| not registered. Features like `static assets` and `cors` needs better
| control over request lifecycle.
|
*/
// TODO: Fix
/*const serverMiddleware = [
  'Adonis/Middleware/Static',
  'Adonis/Middleware/Cors',
  'App/Middleware/HandleDoubleSlash',
];*/
