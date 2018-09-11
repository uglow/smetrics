// Coverage only shows for Vue components that have data, methods, or computed properties
// See https://github.com/vuejs/vue-cli/issues/1879#issuecomment-412300256

module.exports = {
  moduleFileExtensions: ['js', 'json'],
  testMatch: ['<rootDir>/src/**/*.spec.js'],
  testURL: 'http://localhost/',

  reporters: ['default'],

  collectCoverageFrom: ['<rootDir>/src/**/*.js'],
  coverageReporters: ['json-summary', 'lcov', 'text', 'html'],
  coverageDirectory: '<rootDir>/test-reports/coverage',
  coverageThreshold: {
    global: {
      statements: 95,
      branches: 50,
      functions: 95,
      lines: 95,
    },
  },
};
