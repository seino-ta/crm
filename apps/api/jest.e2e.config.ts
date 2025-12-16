/** @type {import('jest').Config} */
module.exports = {
  displayName: 'api-e2e',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/e2e/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.tests.json' }],
  },
  globalSetup: '<rootDir>/tests/e2e/setup/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/e2e/setup/globalTeardown.ts',
  setupFilesAfterEnv: ['<rootDir>/tests/e2e/setup/jest.setup.ts'],
  maxWorkers: 1, // DB を共有するため直列実行
  reporters: ['default'],
};
