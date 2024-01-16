const mockStream = () => ({
  once: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
  pipe: jest.fn(),
})

const mockExeca = jest.fn().mockReturnValue({
  stdout: mockStream(),
  stderr: mockStream(),
  // eslint-disable-next-line no-empty-function
  kill: () => {},
})

const mockExecaSync = jest.fn().mockReturnValue({
  stdout: '',
  stderr: '',
  // eslint-disable-next-line no-empty-function
  kill: () => {},
})

module.exports = mockExeca
module.exports.sync = mockExecaSync
