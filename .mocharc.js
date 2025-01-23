const chai = require('chai');
chai.use(require('sinon-chai'));

module.exports = {
  require: 'ts-node/register', // Enables TypeScript support
  extension: ['ts', 'js'], // File extensions to load
  spec: 'tests/**/*.spec.ts', // Location of test files
  timeout: 5000, // Set a test timeout (optional)
  recursive: true, // Include subdirectories (optional)
};
