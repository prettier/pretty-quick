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
        return { stdout: './foo.js\n' + './bar.md\n' };
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
      ['debugancestor', 'tip', 'default'],
      { cwd: '/' }
    );
  });

  test('calls `hg debugancestor` with root hg directory', () => {
    mock({
      '/.hg': {},
      '/other-dir': {},
    });

    prettyQuick('/other-dir');
    expect(execa.sync).toHaveBeenCalledWith(
      'hg',
      ['debugancestor', 'tip', 'default'],
      { cwd: '/' }
    );
  });

  test('calls `hg status` with revision', () => {
    mock({
      '/.hg': {},
    });

    prettyQuick('root', { since: 'banana' });

    expect(execa.sync).toHaveBeenCalledWith(
      'hg',
      ['status', '-n', '-a', '-m', '--rev', 'banana'],
      { cwd: '/' }
    );
  });

  test('calls onFoundSinceRevision with return value from `hg debugancestor`', () => {
    const onFoundSinceRevision = jest.fn();

    mock({
      '/.hg': {},
    });
    execa.sync.mockReturnValue({ stdout: 'banana' });

    prettyQuick('root', { onFoundSinceRevision });

    expect(onFoundSinceRevision).toHaveBeenCalledWith('hg', 'banana');
  });

  test('calls onFoundChangedFiles with changed files', () => {
    const onFoundChangedFiles = jest.fn();
    mockHgFs();

    prettyQuick('root', { since: 'banana', onFoundChangedFiles });

    expect(onFoundChangedFiles).toHaveBeenCalledWith(['./foo.js', './bar.md']);
  });

  test('calls onWriteFile with changed files', () => {
    const onWriteFile = jest.fn();
    mockHgFs();

    prettyQuick('root', { since: 'banana', onWriteFile });

    expect(onWriteFile).toHaveBeenCalledWith('./foo.js');
    expect(onWriteFile).toHaveBeenCalledWith('./bar.md');
  });

  test('writes formatted files to disk', () => {
    const onWriteFile = jest.fn();

    mockHgFs();

    prettyQuick('root', { since: 'banana', onWriteFile });

    expect(fs.readFileSync('/foo.js', 'utf8')).toEqual('formatted:foo()');
    expect(fs.readFileSync('/bar.md', 'utf8')).toEqual('formatted:# foo');
  });

  test('without --staged does NOT stage changed files', () => {
    mockHgFs();

    prettyQuick('root', { since: 'banana' });

    expect(execa.sync).not.toHaveBeenCalledWith('hg', ['add', './foo.js'], {
      cwd: '/',
    });
    expect(execa.sync).not.toHaveBeenCalledWith('hg', ['add', './bar.md'], {
      cwd: '/',
    });
  });
});
