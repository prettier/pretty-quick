import mock from 'mock-fs';
import execa from 'execa';
import fs from 'fs';

import prettyQuick from '..';

jest.mock('execa');

afterEach(() => {
  mock.restore();
  jest.clearAllMocks();
});

const mockGitFs = (additionalUnstaged = '') => {
  mock({
    '/.git': {},
    '/raz.js': 'raz()',
    '/foo.js': 'foo()',
    '/bar.md': '# foo',
  });
  execa.sync.mockImplementation((command, args) => {
    if (command !== 'git') {
      throw new Error(`unexpected command: ${command}`);
    }
    switch (args[0]) {
      case 'ls-files':
        return { stdout: '' };
      case 'diff':
        return args[2] === '--cached'
          ? { stdout: './raz.js\n' }
          : { stdout: './foo.js\n' + './bar.md\n' + additionalUnstaged };
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
      '/.git': {},
    });

    prettyQuick('root');

    expect(execa.sync).toHaveBeenCalledWith(
      'git',
      ['merge-base', 'HEAD', 'master'],
      { cwd: '/' }
    );
  });

  test('calls `git merge-base` with root git directory', () => {
    mock({
      '/.git': {},
      '/other-dir': {},
    });

    prettyQuick('/other-dir');

    expect(execa.sync).toHaveBeenCalledWith(
      'git',
      ['merge-base', 'HEAD', 'master'],
      { cwd: '/' }
    );
  });

  test('with --staged does NOT call `git merge-base`', () => {
    mock({
      '/.git': {},
    });

    prettyQuick('root');

    expect(execa.sync).not.toHaveBeenCalledWith('git', [
      'merge-base',
      'HEAD',
      'master',
    ]);
  });

  test('with --staged calls diff without revision', () => {
    mock({
      '/.git': {},
    });

    prettyQuick('root', { since: 'banana', staged: true });

    expect(execa.sync).toHaveBeenCalledWith(
      'git',
      ['diff', '--name-only', '--diff-filter=ACMRTUB'],
      { cwd: '/' }
    );
  });

  test('calls `git diff --name-only` with revision', () => {
    mock({
      '/.git': {},
    });

    prettyQuick('root', { since: 'banana' });

    expect(execa.sync).toHaveBeenCalledWith(
      'git',
      ['diff', '--name-only', '--diff-filter=ACMRTUB', 'banana'],
      { cwd: '/' }
    );
  });

  test('calls `git ls-files`', () => {
    mock({
      '/.git': {},
    });

    prettyQuick('root', { since: 'banana' });

    expect(execa.sync).toHaveBeenCalledWith(
      'git',
      ['ls-files', '--others', '--exclude-standard'],
      { cwd: '/' }
    );
  });

  test('calls onFoundSinceRevision with return value from `git merge-base`', () => {
    const onFoundSinceRevision = jest.fn();

    mock({
      '/.git': {},
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

    expect(fs.readFileSync('/foo.js', 'utf8')).toEqual('formatted:foo()');
    expect(fs.readFileSync('/bar.md', 'utf8')).toEqual('formatted:# foo');
  });

  test('with --staged stages fully-staged files', () => {
    mockGitFs();

    prettyQuick('root', { since: 'banana', staged: true });

    expect(execa.sync).toHaveBeenCalledWith('git', ['add', './raz.js'], {
      cwd: '/',
    });
    expect(execa.sync).not.toHaveBeenCalledWith('git', ['add', './foo.js'], {
      cwd: '/',
    });
    expect(execa.sync).not.toHaveBeenCalledWith('git', ['add', './bar.md'], {
      cwd: '/',
    });
  });

  test('with --staged AND --no-restage does not re-stage any files', () => {
    mockGitFs();

    prettyQuick('root', { since: 'banana', staged: true, restage: false });

    expect(execa.sync).not.toHaveBeenCalledWith('git', ['add', './raz.js'], {
      cwd: '/',
    });
    expect(execa.sync).not.toHaveBeenCalledWith('git', ['add', './foo.js'], {
      cwd: '/',
    });
    expect(execa.sync).not.toHaveBeenCalledWith('git', ['add', './bar.md'], {
      cwd: '/',
    });
  });

  test('with --staged does not stage previously partially staged files AND aborts commit', () => {
    const additionalUnstaged = './raz.js\n'; // raz.js is partly staged and partly not staged
    mockGitFs(additionalUnstaged);

    prettyQuick('root', { since: 'banana', staged: true });

    expect(execa.sync).not.toHaveBeenCalledWith('git', ['add', './raz.js'], {
      cwd: '/',
    });
  });

  test('without --staged does NOT stage changed files', () => {
    mockGitFs();

    prettyQuick('root', { since: 'banana' });

    expect(execa.sync).not.toHaveBeenCalledWith('git', ['add', './foo.js'], {
      cwd: '/',
    });
    expect(execa.sync).not.toHaveBeenCalledWith('git', ['add', './bar.md'], {
      cwd: '/',
    });
  });
});
