const path = require('path');

const resolveConfigMock = jest.fn().mockImplementation((file) =>
  Promise.resolve({
    file,
  }),
);
resolveConfigMock.sync = jest.fn().mockImplementation((file) => ({ file }));

const getFileInfoMock = jest.fn().mockImplementation((file) => {
  const ext = path.extname(file);
  if (ext === '.js' || ext === '.md') {
    return Promise.resolve({ ignored: false, inferredParser: 'babel' });
  } else {
    return Promise.resolve({ ignored: false, inferredParser: null });
  }
});
getFileInfoMock.sync = jest.fn().mockImplementation((file) => {
  const ext = path.extname(file);
  if (ext === '.js' || ext === '.md') {
    return { ignored: false, inferredParser: 'babel' };
  } else {
    return { ignored: false, inferredParser: null };
  }
});

const prettierMock = {
  format: jest.fn().mockImplementation((input) => 'formatted:' + input),
  resolveConfig: resolveConfigMock,
  getFileInfo: getFileInfoMock,
};

module.exports = prettierMock;
