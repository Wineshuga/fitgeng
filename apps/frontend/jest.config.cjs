const nextJest = require('next/jest.js');

// next/jest compiles with SWC, loads next.config and .env, and mocks CSS,
// images and next/font, so ts-jest and CSS stubs are no longer needed.
const createJestConfig = nextJest({ dir: __dirname });

/** @type {import('jest').Config} */
module.exports = createJestConfig({
  // jsdom plus Node's Fetch API (Request/Response/fetch), which jsdom lacks.
  testEnvironment: '<rootDir>/jest.environment.cjs',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleNameMapper: {
    // server-only throws outside a React Server environment; tests import server modules directly.
    '^server-only$': '<rootDir>/src/test/emptyModule.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@fitgeng/shared$': '<rootDir>/../../packages/shared/src/index.ts',
  },
  setupFiles: ['<rootDir>/src/test/env.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setupTests.ts'],
});
