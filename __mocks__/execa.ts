const mockStream = () => ({
  once: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
  pipe: jest.fn(),
})

const mockExeca = jest.fn().mockReturnValue({
  stdout: mockStream(),
  stderr: mockStream(),
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  kill: () => {},
})

const mockExecaSync = jest.fn().mockReturnValue({
  stdout: '',
  stderr: '',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  kill: () => {},
})

export = mockExeca

// @ts-expect-error -- intended
mockExeca.sync = mockExecaSync
