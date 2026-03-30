/**
 * Configuration Factory
 * Type-safe configuration object
 * Reference: https://docs.nestjs.com/techniques/configuration
 */

export default () => ({
  environment: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3847', 10),

  clerk: {
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  meilisearch: {
    host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
    apiKey: process.env.MEILISEARCH_API_KEY,
  },

  storage: {
    endpoint: process.env.AWS_ENDPOINT,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    bucketName: process.env.AWS_BUCKET_NAME,
    forcePathStyle: process.env.AWS_FORCE_PATH_STYLE === 'true',
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '1025', 10),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM,
  },

  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '10', 10),
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
});
