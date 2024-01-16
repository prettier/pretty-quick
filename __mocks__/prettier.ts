import path from 'path'

export = {
  format: jest.fn((input: string) => 'formatted:' + input),
  resolveConfig: {
    sync: jest.fn((file: string) => ({ file })),
  },
  getFileInfo: {
    sync: jest.fn((file: string) => {
      const ext = path.extname(file)
      if (ext === '.js' || ext === '.md') {
        return { ignored: false, inferredParser: 'babel' }
      }
      return { ignored: false, inferredParser: null }
    }),
  },
}
