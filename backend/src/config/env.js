import "dotenv/config";

const required = [
  "MONGO_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
];

if (process.env.NODE_ENV === "production") {
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(
        `Missing required environment variable: ${key}`
      );
    }
  }
}

export const env = {
  // Server
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),

  // Frontend
  clientUrl:
    process.env.CLIENT_URL || "http://localhost:5173",

  // MongoDB
  mongoUri: process.env.MONGO_URI || "",

  // JWT
  accessSecret:
    process.env.JWT_ACCESS_SECRET ||
    "dev-access-secret-change-me",

  refreshSecret:
    process.env.JWT_REFRESH_SECRET ||
    "dev-refresh-secret-change-me",

  accessExpires:
    process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",

  refreshExpires:
    process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",

  // Redis
  redisUrl:
    process.env.REDIS_URL || "",

  // Razorpay
  razorpayKeyId:
    process.env.RAZORPAY_KEY_ID || "",

  razorpayKeySecret:
    process.env.RAZORPAY_KEY_SECRET || "",

  razorpayWebhookSecret:
    process.env.RAZORPAY_WEBHOOK_SECRET || "",

  // Logging
  logLevel:
    process.env.LOG_LEVEL || "info",
};