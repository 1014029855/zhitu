module.exports = {
  apps: [
    {
      name: 'q11-api',
      script: 'server/index.js',
      cwd: '/var/www/q11/current',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        API_PORT: '1234',
        DB_PATH: '/var/www/q11/shared/data/platform.db'
      },
      error_file: '/var/www/q11/shared/logs/q11-api-error.log',
      out_file: '/var/www/q11/shared/logs/q11-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
}
