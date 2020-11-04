'use strict';

const path = require('path');

const fs = jest.createMockFromModule('fs');

// This is a custom function that our tests can use during setup to specify
// what the files on the "mock" filesystem should look like when any of the
// `fs` APIs are used.
let mockFiles = Object.create(null);

function __setMockFiles(newMockFiles) {
  mockFiles = Object.create(null);
  for (const file in newMockFiles) {
    const dir = path.dirname(file);

    if (!mockFiles[dir]) {
      mockFiles[dir] = [];
    }
    mockFiles[dir].push(path.basename(file));
  }
}

function resetMock() {
  mockFiles = {};
}

// Write custom mock functions

function existsSync(filePath) {
  return !!mockFiles[filePath];
}

function readFileSync(filePath) {
  return mockFiles[filePath];
}

function writeFileSync(filePath, data) {
  mockFiles[filePath] = data;
}

function unlinkSync(filePath) {
  delete mockFiles[filePath];
}

fs.__setMockFiles = __setMockFiles;
fs.existsSync = existsSync;
fs.readFileSync = readFileSync;
fs.writeFileSync = writeFileSync;
fs.unlinkSync = unlinkSync;

fs.__resetMock = resetMock;

module.exports = fs;
