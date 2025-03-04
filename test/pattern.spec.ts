import mock from 'mock-fs'
import * as tinyexec from 'tinyexec'

import prettyQuick from 'pretty-quick'

afterEach(() => {
  mock.restore()
  jest.clearAllMocks()
})

describe('match pattern', () => {
  it('issue #73 #125 - regex grouping (round pattern)', async () => {
    const onFoundChangedFiles = jest.fn()

    mock({
      '/.git': {},
      '/src/apps/hello/foo.js': "export const foo = 'foo'",
      '/src/libs/hello/bar.js': "export const bar = 'bar'",
      '/src/tools/hello/baz.js': "export const baz = 'baz'",
      '/src/should-not-be-included/hello/zoo.js': "export const zoo = 'zoo'",
    })

    const xSpy = jest.spyOn(tinyexec, 'x') as jest.Mock
    xSpy.mockImplementation((_command: string, args: string[]) => {
      switch (args[0]) {
        case 'ls-files': {
          return { stdout: '' }
        }
        case 'diff': {
          return args[2] === '--cached'
            ? { stdout: '' }
            : {
                stdout: [
                  '/src/apps/hello/foo.js',
                  '/src/libs/hello/bar.js',
                  '/src/tools/hello/baz.js',
                  '/src/should-not-be-included/hello/zoo.js',
                ].join('\n'),
              }
        }
        default: {
          throw new Error(`unexpected arg0: ${args[0]}`)
        }
      }
    })

    await prettyQuick('root', {
      pattern: '**/(apps|libs|tools)/**/*',
      since: 'fox', // This is required to prevent `scm.getSinceRevision` call
      onFoundChangedFiles,
    })

    expect(onFoundChangedFiles).toHaveBeenCalledWith([
      '/src/apps/hello/foo.js',
      '/src/libs/hello/bar.js',
      '/src/tools/hello/baz.js',
    ])
  })
})
