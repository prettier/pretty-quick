import mock from 'mock-fs';
import execa from 'execa';
import fs from 'fs';

import prettyQuick from '..';

jest.mock('execa');

afterEach(() => {
  mock.restore();
  jest.clearAllMocks();
});

const mockHgFs = () => {
  mock({
    '/.hg': {},
    '/foo.js': 'foo()',
    '/bar.md': '# foo',
  });
  execa.sync.mockImplementation((command, args) => {
    if (command !== 'hg') {
      throw new Error(`unexpected command: ${command}`);
    }
    switch (args[0]) {
      case 'status':
        return { stdout: '' };
      case 'diff':
        return { stdout: './foo.js\n' + './bar.md\n' };
      case 'add':
        return { stdout: '' };
      case 'log':
        return { stdout: '' };
      default:
        throw new Error(`unexpected arg0: ${args[0]}`);
    }
  });
};

describe('with hg', () => {
  test('calls `hg debugancestor`', () => {
    mock({
      '/.hg': {},
    });

    prettyQuick('root');

    expect(execa.sync).toHaveBeenCalledWith(
      'hg',
      ['debugancestor', 'HEAD', 'master'],
      { cwd: '/' }
    );
  });
});
