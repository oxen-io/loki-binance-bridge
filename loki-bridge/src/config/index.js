import defaultConfig from './default';
import productionConfig from './production';

const env = process.env.APP_ENV || 'development';
const prod = env === 'production' ? productionConfig : {};

export default { ...defaultConfig, ...prod };

