const nextJest = require('next/jest')

const createJestConfig = nextJest({ dir: './' })

const customJestConfig = {
  setupFiles: ['<rootDir>/jest.globals.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^msw/node$': '<rootDir>/node_modules/msw/lib/node/index.js',
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
}

module.exports = createJestConfig(customJestConfig)
