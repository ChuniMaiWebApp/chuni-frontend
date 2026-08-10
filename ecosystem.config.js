// =============================================================================
// PM2 process definition for the Nuxt app.
//
//   pm2 start ecosystem.config.js
//   pm2 startOrReload ecosystem.config.js --update-env
//   pm2 save
// =============================================================================

const { join } = require('node:path');

module.exports = {
  apps: [
    {
      name: 'chuni-frontend',
      cwd: __dirname,
      script: '.output/server/index.mjs',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '768M',
      kill_timeout: 5000,
      listen_timeout: 20000,
      exp_backoff_restart_delay: 200,
      time: true,
      merge_logs: true,
      error_file: join(__dirname, 'logs', 'error.log'),
      out_file: join(__dirname, 'logs', 'out.log'),
      env: {
        NODE_ENV: 'production',
        // Loopback only: nginx is the sole way in.
        HOST: '127.0.0.1',
        PORT: 3100,
        // What the *browser* is told to call.
        NUXT_PUBLIC_API_BASE: 'https://chunithm-api.novaseele.com/api/v1',
        // What *this process* calls during SSR. Deliberately not the public
        // URL: that address resolves to Cloudflare, so every server-rendered
        // page would leave the VPS and come back in through nginx to reach a
        // process on the same machine.
        NUXT_API_BASE_SERVER: 'http://127.0.0.1:3333/api/v1',
      },
    },
  ],
};
