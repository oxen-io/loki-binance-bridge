module.exports = {
  apps: [{
    name: 'API',
    script: './server.js',

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    node_args: '-r esm',
    instances: 1,
    autorestart: false,
    watch: false,
    max_memory_restart: '1G',
    env: { NODE_ENV: 'development' },
    env_production: { NODE_ENV: 'production' },
  }],
};
