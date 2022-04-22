import mock from 'mock-fs';
import execa from 'execa';
import fs from 'fs';

import prettyQuick from '..';

jest.mock('execa');

afterEach(() => {
  mock.restore();
  jest.clearAllMocks();
});

const mockGitFs = (additionalUnstaged = '', additionalFiles = {}) => {
  mock(
    Object.assign(
      {
        '/.git': {},
        '/raz.js': 'raz()',
        '/foo.js': 'foo()',
        '/bar.md': '# foo',
      },
      additionalFiles,
    ),
  );
  execa.mockImplementation(async (command, args) => {
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
  test('calls `git merge-base`', async () => {
    mock({
      '/.git': {},
    });

    await prettyQuick('/');

    expect(execa).toHaveBeenCalledWith(
      'git',
      ['merge-base', 'HEAD', 'master'],
      { cwd: '/' },
    );
  });

  test('calls `git merge-base` with root git directory', async () => {
    mock({
      '/.git': {},
      '/other-dir': {},
    });

    await prettyQuick('/other-dir');

    expect(execa).toHaveBeenCalledWith(
      'git',
      ['merge-base', 'HEAD', 'master'],
      { cwd: '/' },
    );
  });

  test('with --staged does NOT call `git merge-base`', async () => {
    mock({
      '/.git': {},
    });

    await prettyQuick('/');

    expect(execa).not.toHaveBeenCalledWith('git', [
      'merge-base',
      'HEAD',
      'master',
    ]);
  });

  test('with --staged calls diff without revision', async () => {
    mock({
      '/.git': {},
    });

    await prettyQuick('/', { since: 'banana', staged: true });

    expect(execa).toHaveBeenCalledWith(
      'git',
      ['diff', '--name-only', '--diff-filter=ACMRTUB'],
      { cwd: '/' },
    );
  });

  test('calls `git diff --name-only` with revision', async () => {
    mock({
      '/.git': {},
    });

    await prettyQuick('/', { since: 'banana' });

    expect(execa).toHaveBeenCalledWith(
      'git',
      ['diff', '--name-only', '--diff-filter=ACMRTUB', 'banana'],
      { cwd: '/' },
    );
  });

  test('calls `git ls-files`', async () => {
    mock({
      '/.git': {},
    });

    await prettyQuick('/', { since: 'banana' });

    expect(execa).toHaveBeenCalledWith(
      'git',
      ['ls-files', '--others', '--exclude-standard'],
      { cwd: '/' },
    );
  });

  test('calls onFoundSinceRevision with return value from `git merge-base`', async () => {
    const onFoundSinceRevision = jest.fn();

    mock({
      '/.git': {},
    });
    execa.mockReturnValue(Promise.resolve({ stdout: 'banana' }));

    await prettyQuick('/', { onFoundSinceRevision });

    expect(onFoundSinceRevision).toHaveBeenCalledWith('git', 'banana');
  });

  test('calls onFoundChangedFiles with changed files', async () => {
    const onFoundChangedFiles = jest.fn();
    mockGitFs();

    await prettyQuick('/', { since: 'banana', onFoundChangedFiles });

    expect(onFoundChangedFiles).toHaveBeenCalledWith(['./foo.js', './bar.md']);
  });

  test('calls onWriteFile with changed files', async () => {
    const onWriteFile = jest.fn();
    mockGitFs();

    await prettyQuick('/', { since: 'banana', onWriteFile });

    expect(onWriteFile).toHaveBeenCalledWith('./foo.js');
    expect(onWriteFile).toHaveBeenCalledWith('./bar.md');
    expect(onWriteFile.mock.calls.length).toBe(2);
  });

  test('calls onWriteFile with changed files for the given pattern', async () => {
    const onWriteFile = jest.fn();
    mockGitFs();
    await prettyQuick('/', {
      pattern: '*.md',
      since: 'banana',
      onWriteFile,
    });
    expect(onWriteFile.mock.calls).toEqual([['./bar.md']]);
  });

  test('calls onWriteFile with changed files for the given globstar pattern', async () => {
    const onWriteFile = jest.fn();
    mockGitFs();
    await prettyQuick('/', {
      pattern: '**/*.md',
      since: 'banana',
      onWriteFile,
    });
    expect(onWriteFile.mock.calls).toEqual([['./bar.md']]);
  });

  test('calls onWriteFile with changed files for the given extglob pattern', async () => {
    const onWriteFile = jest.fn();
    mockGitFs();
    await prettyQuick('/', {
      pattern: '*.*(md|foo|bar)',
      since: 'banana',
      onWriteFile,
    });
    expect(onWriteFile.mock.calls).toEqual([['./bar.md']]);
  });

  test('calls onWriteFile with changed files for an array of globstar patterns', async () => {
    const onWriteFile = jest.fn();
    mockGitFs();
    await prettyQuick('/', {
      pattern: ['**/*.foo', '**/*.md', '**/*.bar'],
      since: 'banana',
      onWriteFile,
    });
    expect(onWriteFile.mock.calls).toEqual([['./bar.md']]);
  });

  test('writes formatted files to disk', async () => {
    const onWriteFile = jest.fn();

    mockGitFs();

    await prettyQuick('/', { since: 'banana', onWriteFile });

    expect(fs.readFileSync('/foo.js', 'utf8')).toEqual('formatted:foo()');
    expect(fs.readFileSync('/bar.md', 'utf8')).toEqual('formatted:# foo');
  });

  test('succeeds if a file was changed and bail is not set', async () => {
    mockGitFs();

    const result = await prettyQuick('/', { since: 'banana' });

    expect(result).toEqual({ errors: [], success: true });
  });

  test('fails if a file was changed and bail is set to true', async () => {
    mockGitFs();

    const result = await prettyQuick('/', { since: 'banana', bail: true });

    expect(result).toEqual({ errors: ['BAIL_ON_WRITE'], success: false });
  });

  test('with --staged stages fully-staged files', async () => {
    mockGitFs();

    await prettyQuick('/', { since: 'banana', staged: true });

    expect(execa).toHaveBeenCalledWith('git', ['add', './raz.js'], {
      cwd: '/',
    });
    expect(execa).not.toHaveBeenCalledWith('git', ['add', './foo.js'], {
      cwd: '/',
    });
    expect(execa).not.toHaveBeenCalledWith('git', ['add', './bar.md'], {
      cwd: '/',
    });
  });

  test('with --staged AND --no-restage does not re-stage any files', async () => {
    mockGitFs();

    await prettyQuick('/', {
      since: 'banana',
      staged: true,
      restage: false,
    });

    expect(execa).not.toHaveBeenCalledWith('git', ['add', './raz.js'], {
      cwd: '/',
    });
    expect(execa).not.toHaveBeenCalledWith('git', ['add', './foo.js'], {
      cwd: '/',
    });
    expect(execa).not.toHaveBeenCalledWith('git', ['add', './bar.md'], {
      cwd: '/',
    });
  });

  test('with --staged does not stage previously partially staged files AND aborts commit', async () => {
    const additionalUnstaged = './raz.js\n'; // raz.js is partly staged and partly not staged
    mockGitFs(additionalUnstaged);

    await prettyQuick('/', { since: 'banana', staged: true });

    expect(execa).not.toHaveBeenCalledWith('git', ['add', './raz.js'], {
      cwd: '/',
    });
  });

  test('with --staged returns false', async () => {
    const additionalUnstaged = './raz.js\n'; // raz.js is partly staged and partly not staged
    mockGitFs(additionalUnstaged);

    const result = await prettyQuick('/', { since: 'banana', staged: true });
    expect(result).toEqual({
      errors: ['PARTIALLY_STAGED_FILE'],
      success: false,
    });
  });

  test('without --staged does NOT stage changed files', async () => {
    mockGitFs();

    await prettyQuick('/', { since: 'banana' });

    expect(execa).not.toHaveBeenCalledWith('git', ['add', './foo.js'], {
      cwd: '/',
    });
    expect(execa).not.toHaveBeenCalledWith('git', ['add', './bar.md'], {
      cwd: '/',
    });
  });

  test('with --verbose calls onExamineFile', async () => {
    const onExamineFile = jest.fn();
    mockGitFs();

    await prettyQuick('/', {
      since: 'banana',
      verbose: true,
      onExamineFile,
    });

    expect(onExamineFile).toHaveBeenCalledWith('./foo.js');
    expect(onExamineFile).toHaveBeenCalledWith('./bar.md');
  });

  test('without --verbose does NOT call onExamineFile', async () => {
    const onExamineFile = jest.fn();
    mockGitFs();

    await prettyQuick('/', { since: 'banana', onExamineFile });

    expect(onExamineFile).not.toHaveBeenCalledWith('./foo.js');
    expect(onExamineFile).not.toHaveBeenCalledWith('./bar.md');
  });

  test('ignore files matching patterns from the repositories root .prettierignore', async () => {
    const onWriteFile = jest.fn();
    mockGitFs('', {
      '/.prettierignore': '*.md',
    });
    await prettyQuick('/sub-directory/', { since: 'banana', onWriteFile });
    expect(onWriteFile.mock.calls).toEqual([['./foo.js']]);
  });

  test('ignore files matching patterns from the working directories .prettierignore', async () => {
    const onWriteFile = jest.fn();
    mockGitFs('', {
      '/sub-directory/.prettierignore': '*.md',
    });
    await prettyQuick('/sub-directory/', {
      since: 'banana',
      onWriteFile,
    });
    expect(onWriteFile.mock.calls).toEqual([['./foo.js']]);
  });

  test('with --ignore-path to ignore files matching patterns from the repositories root .ignorePath', async () => {
    const onWriteFile = jest.fn();
    mockGitFs('', {
      '/.ignorePath': '*.md',
    });
    await prettyQuick('/sub-directory/', {
      since: 'banana',
      onWriteFile,
      ignorePath: '/.ignorePath',
    });
    expect(onWriteFile.mock.calls).toEqual([['./foo.js']]);
  });

  test('with --ignore-path to ignore files matching patterns from the working directories .ignorePath', async () => {
    const onWriteFile = jest.fn();
    mockGitFs('', {
      '/sub-directory/.ignorePath': '*.md',
    });
    await prettyQuick('/sub-directory/', {
      since: 'banana',
      onWriteFile,
      ignorePath: '/.ignorePath',
    });
    expect(onWriteFile.mock.calls).toEqual([['./foo.js']]);
  });
});
