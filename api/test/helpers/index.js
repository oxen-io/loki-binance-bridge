import * as dbHelper from './db';

const wrapRouterFunction = (routerFunc, params) => new Promise(resolve => {
  // eslint-disable-next-line prefer-const
  let response = {
    status: () => {},
    body: {},
  };

  // eslint-disable-next-line no-unused-vars
  const next = (error, req, res, func) => {
    resolve(res.body);
  };

  routerFunc({ body: params, query: params }, response, next);
});

export { dbHelper, wrapRouterFunction };
