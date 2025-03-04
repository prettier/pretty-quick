export const exec = jest.fn().mockReturnValue({
  stdout: '',
  stderr: '',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  kill: () => {},
})
