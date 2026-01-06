/*
 * PM2 ecosystem file for site (screenie.org)
 * - Single app: web (Next.js standalone)
 * - Uses PM2 env_file to load /var/www/screenie.org/.env.pm2
 * - Defaults are provided when env vars are missing
 */

const OVERRIDE_ENVS = {
  NODE_ENV: 'production',
  PORT: '3000',
  // NB: EVERYTHING IN HERE WILL TAKE ABSOLUTE PRECEDENCE OVER .env FILES!!
};

module.exports = {
  apps: [
    {
      name: 'web',
      cwd: '/var/www/screenie.org/dist-standalone',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      env: OVERRIDE_ENVS,
      env_file: '/var/www/screenie.org/.env.pm2',
      out_file: '/var/www/screenie.org/logs/web.out.log',
      error_file: '/var/www/screenie.org/logs/web.err.log',
      time: true,
    },
  ],
};
