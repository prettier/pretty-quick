import mock from 'mock-fs';
import execa from 'execa';
import fs from 'fs';

import prettyQuick from '..';

jest.mock('execa');

afterEach(() => {
  mock.restore();
  jest.clearAllMocks();
});

const mockGitFs = () => {
  mock({
    'root/.git': {},
    'root/foo.js': 'foo()',
    'root/bar.md': '# foo',
  });
  execa.sync.mockImplementation((command, args) => {
    if (command !== 'git') {
      throw new Error(`unexpected command: ${command}`);
    }
    switch (args[0]) {
      case 'ls-files':
        return { stdout: '' };
      case 'diff':
        return { stdout: './foo.js\n' + './bar.md\n' };
      case 'add':
        return { stdout: '' };
      default:
        throw new Error(`unexpected arg0: ${args[0]}`);
    }
  });
};

describe('with git', () => {
  test('calls `git merge-base`', () => {
    mock({
      'root/.git': {},
    });

    prettyQuick('root');

    expect(execa.sync).toHaveBeenCalledWith(
      'git',
      ['merge-base', 'HEAD', 'master'],
      { cwd: 'root' }
    );
  });

  test('with --staged does NOT call `git merge-base`', () => {
    mock({
      'root/.git': {},
    });

    prettyQuick('root');

    expect(execa.sync).not.toHaveBeenCalledWith('git', [
      'merge-base',
      'HEAD',
      'master',
    ]);
  });

  test('calls `git diff --name-only` with revision', () => {
    mock({
      'root/.git': {},
    });

    prettyQuick('root', { since: 'banana' });

    expect(execa.sync).toHaveBeenCalledWith(
      'git',
      ['diff', '--name-only', '--diff-filter=ACMRTUB', 'banana'],
      { cwd: 'root' }
    );
  });

  test('calls `git ls-files`', () => {
    mock({
      'root/.git': {},
    });

    prettyQuick('root', { since: 'banana' });

    expect(execa.sync).toHaveBeenCalledWith(
      'git',
      ['ls-files', '--others', '--exclude-standard'],
      { cwd: 'root' }
    );
  });

  test('calls onFoundSinceRevision with return value from `git merge-base`', () => {
    const onFoundSinceRevision = jest.fn();

    mock({
      'root/.git': {},
    });
    execa.sync.mockReturnValue({ stdout: 'banana' });

    prettyQuick('root', { onFoundSinceRevision });

    expect(onFoundSinceRevision).toHaveBeenCalledWith('git', 'banana');
  });

  test('calls onFoundChangedFiles with changed files', () => {
    const onFoundChangedFiles = jest.fn();
    mockGitFs();

    prettyQuick('root', { since: 'banana', onFoundChangedFiles });

    expect(onFoundChangedFiles).toHaveBeenCalledWith(['./foo.js', './bar.md']);
  });

  test('calls onWriteFile with changed files', () => {
    const onWriteFile = jest.fn();
    mockGitFs();

    prettyQuick('root', { since: 'banana', onWriteFile });

    expect(onWriteFile).toHaveBeenCalledWith('./foo.js');
    expect(onWriteFile).toHaveBeenCalledWith('./bar.md');
  });

  test('writes formatted files to disk', () => {
    const onWriteFile = jest.fn();

    mockGitFs();

    prettyQuick('root', { since: 'banana', onWriteFile });

    expect(fs.readFileSync('root/foo.js', 'utf8')).toEqual('formatted:foo()');
    expect(fs.readFileSync('root/bar.md', 'utf8')).toEqual('formatted:# foo');
  });

  test('with --staged stages changed files', () => {
    mockGitFs();

    prettyQuick('root', { since: 'banana', staged: true });

    expect(execa.sync).toHaveBeenCalledWith('git', ['add', './foo.js'], {
      cwd: 'root',
    });
    expect(execa.sync).toHaveBeenCalledWith('git', ['add', './bar.md'], {
      cwd: 'root',
    });
  });

  test('without --staged does NOT stage changed files', () => {
    mockGitFs();

    prettyQuick('root', { since: 'banana' });

    expect(execa.sync).not.toHaveBeenCalledWith('git', ['add', './foo.js'], {
      cwd: 'root',
    });
    expect(execa.sync).not.toHaveBeenCalledWith('git', ['add', './bar.md'], {
      cwd: 'root',
    });
  });
});
