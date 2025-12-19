/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup/mock-prisma-d1.js'],
  testPathIgnorePatterns: ['/tests/e2e/'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.tests.json' }],
  },
};
