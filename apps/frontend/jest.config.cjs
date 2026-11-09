/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: '<rootDir>/jest.environment.cjs',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        // Type checking runs separately with `tsc`. Jest only transpiles, to CommonJS.
        diagnostics: false,
        tsconfig: {
          jsx: 'react-jsx',
          module: 'commonjs',
          moduleResolution: 'node10',
          ignoreDeprecations: '6.0',
          esModuleInterop: true,
          isolatedModules: true,
        },
      },
    ],
  },
  moduleNameMapper: {
    // import.meta.env doesn't exist under Jest, so tests use a stub (order matters: first match wins).
    '^@/config/env$': '<rootDir>/src/test/envStub.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@fitgeng/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '\\.(css)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setupTests.ts'],
};
