module.exports = {
  apps: [
    {
      name: 'fablab-website',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 1659,
        HOST: '0.0.0.0'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 1659,
        HOST: '0.0.0.0'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
}
