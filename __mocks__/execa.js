const mockExeca = jest.fn().mockReturnValue(
  Promise.resolve({
    stdout: '',
    stderr: '',
    kill: () => {},
  }),
);

const mockExecaSync = jest.fn().mockReturnValue({
  stdout: '',
  stderr: '',
  kill: () => {},
});

module.exports = mockExeca;
module.exports.sync = mockExecaSync;
