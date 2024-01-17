import mock from 'mock-fs'

import prettyQuick from 'pretty-quick'

jest.mock('execa')

afterEach(() => mock.restore())

test('throws an error when no vcs is found', async () => {
  mock({
    'root/README.md': '',
  })

  await expect(() => prettyQuick('root')).rejects.toThrow(
    'Unable to detect a source control manager.',
  )
})
