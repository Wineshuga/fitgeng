// Runs before each test file's imports (jest `setupFiles`).
// Browsers resolve the relative '/api/v1' against the page URL. Node's fetch
// (used under jsdom) can't, so tests use an absolute base.
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost/api/v1';
process.env.NEXT_PUBLIC_SITE_URL = 'https://fitgeng.test';
