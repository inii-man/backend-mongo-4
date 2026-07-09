module.exports = {
  apps: [{
    name: 'playground-express',
    script: './app.js',
    watch: true, // Enable watch for development
    ignore_watch: ['node_modules', 'views'], // Ignore these directories
    env: {
      NODE_ENV: 'development',
    },
    env_production: {
      NODE_ENV: 'production',
    }
  }],
};
