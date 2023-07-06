const path = require('path');

const prettierMock = {
  format: jest.fn().mockImplementation((input) => 'formatted:' + input),
  resolveConfig: jest.fn().mockImplementation(async (file) => ({ file })),
  getFileInfo: jest.fn().mockImplementation(async (file) => {
    const ext = path.extname(file);
    if (ext === '.js' || ext === '.md') {
      return { ignored: false, inferredParser: 'babel' };
    } else {
      return { ignored: false, inferredParser: null };
    }
  }),
};

module.exports = prettierMock;
