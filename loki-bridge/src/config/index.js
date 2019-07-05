import deepmerge from 'deepmerge';
import defaultConfig from './default';

const env = process.env.APP_ENV || 'development';

let production = {};
if (env === production) {
  try {
    production = require('./production');
  } catch (e) {
    // Ignore
  }
}

export default deepmerge(defaultConfig, production);

