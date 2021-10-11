require("dotenv").config();
module.exports = {
  apps: [
    {
      name: process.env.PM2_APP_NAME,
      script: "./index.js",
      watch: false,
      env: {
        PORT: 3000,
        NODE_ENV: "development",
      },
      env_production: {
        PORT: process.env.NODE_PORT,
        NODE_ENV: "production",
        WEBHOOK_URL: process.env.WEBHOOK_URL,
        TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,
      },
    },
  ],
};
