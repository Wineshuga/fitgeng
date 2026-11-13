// Runs before every test file, before any app module is imported.
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.MONGO_URI ?? 'mongodb://placeholder/test'; // replaced by the memory server
process.env.REDIS_URL = '';
process.env.APP_URL = 'http://localhost:3000';
process.env.JWT_ACCESS_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.EMAIL_PROVIDER = 'memory';
process.env.AUTH_RATE_LIMIT = '1000';
