import mock from 'mock-fs'
import execa from 'execa'
import fs from 'fs'

import prettyQuick from '..'

jest.mock('execa')

afterEach(() => {
  mock.restore()
  jest.clearAllMocks()
})

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
  )
  execa.sync.mockImplementation((command, args) => {
    if (command !== 'hg') {
      throw new Error(`unexpected command: ${command}`)
    }
    switch (args[0]) {
      case 'status':
        return { stdout: './foo.js\n' + './bar.md\n' }
      case 'diff':
        return { stdout: './foo.js\n' + './bar.md\n' }
      case 'add':
        return { stdout: '' }
      case 'log':
        return { stdout: '' }
      default:
        throw new Error(`unexpected arg0: ${args[0]}`)
    }
  })
}

describe('with hg', () => {
  test('calls `hg debugancestor`', () => {
    mock({
      '/.hg': {},
    })

    prettyQuick('root')

    expect(execa.sync).toHaveBeenCalledWith(
      'hg',
      ['debugancestor', 'tip', 'default'],
      { cwd: '/' },
    )
  })

  test('calls `hg debugancestor` with root hg directory', () => {
    mock({
      '/.hg': {},
      '/other-dir': {},
    })

    prettyQuick('/other-dir')
    expect(execa.sync).toHaveBeenCalledWith(
      'hg',
      ['debugancestor', 'tip', 'default'],
      { cwd: '/' },
    )
  })

  test('calls `hg status` with revision', () => {
    mock({
      '/.hg': {},
    })

    prettyQuick('root', { since: 'banana' })

    expect(execa.sync).toHaveBeenCalledWith(
      'hg',
      ['status', '-n', '-a', '-m', '--rev', 'banana'],
      { cwd: '/' },
    )
  })

  test('calls onFoundSinceRevision with return value from `hg debugancestor`', () => {
    const onFoundSinceRevision = jest.fn()

    mock({
      '/.hg': {},
    })
    execa.sync.mockReturnValue({ stdout: 'banana' })

    prettyQuick('root', { onFoundSinceRevision })

    expect(onFoundSinceRevision).toHaveBeenCalledWith('hg', 'banana')
  })

  test('calls onFoundChangedFiles with changed files', () => {
    const onFoundChangedFiles = jest.fn()
    mockHgFs()

    prettyQuick('root', { since: 'banana', onFoundChangedFiles })

    expect(onFoundChangedFiles).toHaveBeenCalledWith(['./foo.js', './bar.md'])
  })

  test('calls onWriteFile with changed files', () => {
    const onWriteFile = jest.fn()
    mockHgFs()

    prettyQuick('root', { since: 'banana', onWriteFile })

    expect(onWriteFile).toHaveBeenCalledWith('./foo.js')
    expect(onWriteFile).toHaveBeenCalledWith('./bar.md')
  })

  test('calls onWriteFile with changed files for the given pattern', () => {
    const onWriteFile = jest.fn()
    mockHgFs()
    prettyQuick('root', { pattern: '*.md', since: 'banana', onWriteFile })
    expect(onWriteFile.mock.calls).toEqual([['./bar.md']])
  })

  test('calls onWriteFile with changed files for the given globstar pattern', () => {
    const onWriteFile = jest.fn()
    mockHgFs()
    prettyQuick('root', {
      pattern: '**/*.md',
      since: 'banana',
      onWriteFile,
    })
    expect(onWriteFile.mock.calls).toEqual([['./bar.md']])
  })

  test('calls onWriteFile with changed files for the given extglob pattern', () => {
    const onWriteFile = jest.fn()
    mockHgFs()
    prettyQuick('root', {
      pattern: '*.*(md|foo|bar)',
      since: 'banana',
      onWriteFile,
    })
    expect(onWriteFile.mock.calls).toEqual([['./bar.md']])
  })

  test('writes formatted files to disk', () => {
    const onWriteFile = jest.fn()

    mockHgFs()

    prettyQuick('root', { since: 'banana', onWriteFile })

    expect(fs.readFileSync('/foo.js', 'utf8')).toEqual('formatted:foo()')
    expect(fs.readFileSync('/bar.md', 'utf8')).toEqual('formatted:# foo')
  })

  test('succeeds if a file was changed and bail is not set', () => {
    mockHgFs()

    const result = prettyQuick('root', { since: 'banana' })

    expect(result).toEqual({ errors: [], success: true })
  })

  test('fails if a file was changed and bail is set to true', () => {
    mockHgFs()

    const result = prettyQuick('root', { since: 'banana', bail: true })

    expect(result).toEqual({ errors: ['BAIL_ON_WRITE'], success: false })
  })

  test('calls onWriteFile with changed files for an array of globstar patterns', () => {
    const onWriteFile = jest.fn()
    mockHgFs()
    prettyQuick('root', {
      pattern: ['**/*.foo', '**/*.md', '**/*.bar'],
      since: 'banana',
      onWriteFile,
    })
    expect(onWriteFile.mock.calls).toEqual([['./bar.md']])
  })

  test('without --staged does NOT stage changed files', () => {
    mockHgFs()

    prettyQuick('root', { since: 'banana' })

    expect(execa.sync).not.toHaveBeenCalledWith('hg', ['add', './foo.js'], {
      cwd: '/',
    })
    expect(execa.sync).not.toHaveBeenCalledWith('hg', ['add', './bar.md'], {
      cwd: '/',
    })
  })

  test('with --verbose calls onExamineFile', () => {
    const onExamineFile = jest.fn()
    mockHgFs()
    prettyQuick('root', { since: 'banana', verbose: true, onExamineFile })

    expect(onExamineFile).toHaveBeenCalledWith('./foo.js')
    expect(onExamineFile).toHaveBeenCalledWith('./bar.md')
  })

  test('without --verbose does NOT call onExamineFile', () => {
    const onExamineFile = jest.fn()
    mockHgFs()
    prettyQuick('root', { since: 'banana', onExamineFile })

    expect(onExamineFile).not.toHaveBeenCalledWith('./foo.js')
    expect(onExamineFile).not.toHaveBeenCalledWith('./bar.md')
  })

  test('ignore files matching patterns from the repositories root .prettierignore', () => {
    const onWriteFile = jest.fn()
    mockHgFs({
      '/.prettierignore': '*.md',
    })
    prettyQuick('/sub-directory/', { since: 'banana', onWriteFile })
    expect(onWriteFile.mock.calls).toEqual([['./foo.js']])
  })

  test('ignore files matching patterns from the working directories .prettierignore', () => {
    const onWriteFile = jest.fn()
    mockHgFs({
      '/sub-directory/.prettierignore': '*.md',
    })
    prettyQuick('/sub-directory/', { since: 'banana', onWriteFile })
    expect(onWriteFile.mock.calls).toEqual([['./foo.js']])
  })

  test('with --ignore-path to ignore files matching patterns from the repositories root .ignorePath', () => {
    const onWriteFile = jest.fn()
    mockHgFs({
      '/.ignorePath': '*.md',
    })
    prettyQuick('/sub-directory/', {
      since: 'banana',
      onWriteFile,
      ignorePath: '/.ignorePath',
    })
    expect(onWriteFile.mock.calls).toEqual([['./foo.js']])
  })

  test('with --ignore-path to ignore files matching patterns from the working directories .ignorePath', () => {
    const onWriteFile = jest.fn()
    mockHgFs({
      '/.ignorePath': '*.md',
    })
    prettyQuick('/sub-directory/', {
      since: 'banana',
      onWriteFile,
      ignorePath: '/.ignorePath',
    })
    expect(onWriteFile.mock.calls).toEqual([['./foo.js']])
  })
})
