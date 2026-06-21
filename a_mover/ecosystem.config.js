// PM2 — Mantiene la app Next.js corriendo en Hostinger
module.exports = {
  apps: [
    {
      name: 'la-dulceria',
      script: 'server.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Logs
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_file: './logs/combined.log',
      time: true,
    },
  ],
}
