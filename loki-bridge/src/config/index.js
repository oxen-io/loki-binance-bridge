import deepmerge from 'deepmerge';
import defaultConfig from './default';
import productionConfig from './production';

const env = process.env.APP_ENV || 'development';
const production = env === 'production' ? productionConfig : {};

export default deepmerge(defaultConfig, production);

