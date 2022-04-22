import mock from 'mock-fs';
import execa from 'execa';
import fs from 'fs';

import prettyQuick from '..';

jest.mock('execa');

afterEach(() => {
  mock.restore();
  jest.clearAllMocks();
});

const mockHgFs = (additionalFiles = {}) => {
  mock(
    Object.assign(
      {
        '/.hg': {},
        '/foo.js': 'foo()',
        '/bar.md': '# foo',
      },
      additionalFiles,
    ),
  );
  execa.mockImplementation(async (command, args) => {
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
  test('calls `hg debugancestor`', async () => {
    mock({
      '/.hg': {},
    });

    await prettyQuick('/');

    expect(execa).toHaveBeenCalledWith(
      'hg',
      ['debugancestor', 'tip', 'default'],
      { cwd: '/' },
    );
  });

  test('calls `hg debugancestor` with root hg directory', async () => {
    mock({
      '/.hg': {},
      '/other-dir': {},
    });

    await prettyQuick('/other-dir');
    expect(execa).toHaveBeenCalledWith(
      'hg',
      ['debugancestor', 'tip', 'default'],
      { cwd: '/' },
    );
  });

  test('calls `hg status` with revision', async () => {
    mock({
      '/.hg': {},
    });

    await prettyQuick('/', { since: 'banana' });

    expect(execa).toHaveBeenCalledWith(
      'hg',
      ['status', '-n', '-a', '-m', '--rev', 'banana'],
      { cwd: '/' },
    );
  });

  test('calls onFoundSinceRevision with return value from `hg debugancestor`', async () => {
    const onFoundSinceRevision = jest.fn();

    mock({
      '/.hg': {},
    });
    execa.mockReturnValue(Promise.resolve({ stdout: 'banana' }));

    await prettyQuick('/', { onFoundSinceRevision });

    expect(onFoundSinceRevision).toHaveBeenCalledWith('hg', 'banana');
  });

  test('calls onFoundChangedFiles with changed files', async () => {
    const onFoundChangedFiles = jest.fn();
    mockHgFs();

    await prettyQuick('/', { since: 'banana', onFoundChangedFiles });

    expect(onFoundChangedFiles).toHaveBeenCalledWith(['./foo.js', './bar.md']);
  });

  test('calls onWriteFile with changed files', async () => {
    const onWriteFile = jest.fn();
    mockHgFs();

    await prettyQuick('/', { since: 'banana', onWriteFile });

    expect(onWriteFile).toHaveBeenCalledWith('./foo.js');
    expect(onWriteFile).toHaveBeenCalledWith('./bar.md');
  });

  test('calls onWriteFile with changed files for the given pattern', async () => {
    const onWriteFile = jest.fn();
    mockHgFs();
    await prettyQuick('/', {
      pattern: '*.md',
      since: 'banana',
      onWriteFile,
    });
    expect(onWriteFile.mock.calls).toEqual([['./bar.md']]);
  });

  test('calls onWriteFile with changed files for the given globstar pattern', async () => {
    const onWriteFile = jest.fn();
    mockHgFs();
    await prettyQuick('/', {
      pattern: '**/*.md',
      since: 'banana',
      onWriteFile,
    });
    expect(onWriteFile.mock.calls).toEqual([['./bar.md']]);
  });

  test('calls onWriteFile with changed files for the given extglob pattern', async () => {
    const onWriteFile = jest.fn();
    mockHgFs();
    await prettyQuick('/', {
      pattern: '*.*(md|foo|bar)',
      since: 'banana',
      onWriteFile,
    });
    expect(onWriteFile.mock.calls).toEqual([['./bar.md']]);
  });

  test('writes formatted files to disk', async () => {
    const onWriteFile = jest.fn();

    mockHgFs();

    await prettyQuick('/', { since: 'banana', onWriteFile });

    expect(fs.readFileSync('/foo.js', 'utf8')).toEqual('formatted:foo()');
    expect(fs.readFileSync('/bar.md', 'utf8')).toEqual('formatted:# foo');
  });

  test('succeeds if a file was changed and bail is not set', async () => {
    mockHgFs();

    const result = await prettyQuick('/', { since: 'banana' });

    expect(result).toEqual({ errors: [], success: true });
  });

  test('fails if a file was changed and bail is set to true', async () => {
    mockHgFs();

    const result = await prettyQuick('/', { since: 'banana', bail: true });

    expect(result).toEqual({ errors: ['BAIL_ON_WRITE'], success: false });
  });

  test('calls onWriteFile with changed files for an array of globstar patterns', async () => {
    const onWriteFile = jest.fn();
    mockHgFs();
    await prettyQuick('/', {
      pattern: ['**/*.foo', '**/*.md', '**/*.bar'],
      since: 'banana',
      onWriteFile,
    });
    expect(onWriteFile.mock.calls).toEqual([['./bar.md']]);
  });

  test('without --staged does NOT stage changed files', async () => {
    mockHgFs();

    await prettyQuick('/', { since: 'banana' });

    expect(execa).not.toHaveBeenCalledWith('hg', ['add', './foo.js'], {
      cwd: '/',
    });
    expect(execa).not.toHaveBeenCalledWith('hg', ['add', './bar.md'], {
      cwd: '/',
    });
  });

  test('with --verbose calls onExamineFile', async () => {
    const onExamineFile = jest.fn();
    mockHgFs();
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
    mockHgFs();
    await prettyQuick('/', { since: 'banana', onExamineFile });

    expect(onExamineFile).not.toHaveBeenCalledWith('./foo.js');
    expect(onExamineFile).not.toHaveBeenCalledWith('./bar.md');
  });

  test('ignore files matching patterns from the repositories root .prettierignore', async () => {
    const onWriteFile = jest.fn();
    mockHgFs({
      '/.prettierignore': '*.md',
    });
    await prettyQuick('/sub-directory/', { since: 'banana', onWriteFile });
    expect(onWriteFile.mock.calls).toEqual([['./foo.js']]);
  });

  test('ignore files matching patterns from the working directories .prettierignore', async () => {
    const onWriteFile = jest.fn();
    mockHgFs({
      '/sub-directory/.prettierignore': '*.md',
    });

    await prettyQuick('/sub-directory/', { since: 'banana', onWriteFile });
    expect(onWriteFile.mock.calls).toEqual([['./foo.js']]);
  });

  test('with --ignore-path to ignore files matching patterns from the repositories root .ignorePath', async () => {
    const onWriteFile = jest.fn();
    mockHgFs({
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
    mockHgFs({
      '/.ignorePath': '*.md',
    });
    await prettyQuick('/sub-directory/', {
      since: 'banana',
      onWriteFile,
      ignorePath: '/.ignorePath',
    });
    expect(onWriteFile.mock.calls).toEqual([['./foo.js']]);
  });
});
