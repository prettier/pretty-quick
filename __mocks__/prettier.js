const prettierMock = {
  format: jest.fn().mockImplementation((input) => 'formatted:' + input),
  resolveConfig: {
    sync: jest.fn().mockImplementation((file) => ({ file })),
  },
  getSupportInfo: jest.fn().mockReturnValue({
    languages: [
      {
        name: 'JavaScript',
        extensions: ['.js'],
      },
      {
        name: 'Markdown',
        extensions: ['.md'],
      },
    ],
  }),
};

module.exports = prettierMock;
