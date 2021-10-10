require("dotenv").config();
module.exports = {
  apps: [
    {
      name: "hq_kafka",
      script: "./index.js",
      watch: false,
      env: {
        PORT: 3000,
        NODE_ENV: "development",
      },
      env_production: {
        PORT: 8989,
        NODE_ENV: "production",
        WEBHOOK_URL: process.env.WEBHOOK_URL,
        TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,
      },
    },
  ],
};
