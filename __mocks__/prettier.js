const path = require('path')

const prettierMock = {
  format: jest.fn().mockImplementation(input => 'formatted:' + input),
  resolveConfig: {
    sync: jest.fn().mockImplementation(file => ({ file })),
  },
  getFileInfo: {
    sync: jest.fn().mockImplementation(file => {
      const ext = path.extname(file)
      if (ext === '.js' || ext === '.md') {
        return { ignored: false, inferredParser: 'babel' }
      }
      return { ignored: false, inferredParser: null }
    }),
  },
}

module.exports = prettierMock
