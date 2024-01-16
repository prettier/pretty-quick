import mock from 'mock-fs'

// eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
// @ts-ignore -- No idea how to fix
import prettyQuick from 'pretty-quick'

jest.mock('execa')

afterEach(() => mock.restore())

test('throws an error when no vcs is found', () => {
  mock({
    'root/README.md': '',
  })

  expect(() => prettyQuick('root')).toThrow(
    'Unable to detect a source control manager.',
  )
})
