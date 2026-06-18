const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  testEnvironment: '<rootDir>/jest.env.js',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you soon)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/app/api/activities/route.js',
    'src/app/api/user/profile/route.js',
    'src/app/api/goals/route.js',
    'src/app/api/coach/route.js',
    'src/components/DigitalTwin.js',
    'src/components/Navigation.js',
    'src/lib/calculator.js',
    'src/lib/gridFactors.js',
  ],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 80,
      functions: 90,
      lines: 90,
    },
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
