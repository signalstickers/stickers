module.exports = require('@darkobits/ts').jest({
  setupFilesAfterEnv: ['jest-expect-message'],
  moduleFileExtensions: [
    'js',
    'json',
    'node',
    'ts',
    'yml'
  ],
  clearMocks: true
  // coverageThreshold: {
  //   global: {
  //     statements: 100,
  //     branches: 95,
  //     functions: 100,
  //     lines: 100
  //   }
  // }
});
