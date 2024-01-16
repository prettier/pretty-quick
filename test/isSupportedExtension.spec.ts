/* eslint-disable unicorn/filename-case */

import prettier from 'prettier'

// eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
// @ts-ignore -- No idea how to fix
import isSupportedExtension from 'pretty-quick/isSupportedExtension'

afterEach(() => jest.clearAllMocks())

test('return true when file with supported extension passed in', () => {
  expect(isSupportedExtension(true)('banana.js')).toEqual(true)
  expect(prettier.getFileInfo.sync).toHaveBeenCalledWith('banana.js', {
    file: 'banana.js',
    resolveConfig: true,
  })
})

test('return false when file with not supported extension passed in', () => {
  // eslint-disable-next-line sonarjs/no-duplicate-string
  expect(isSupportedExtension(true)('banana.txt')).toEqual(false)
  expect(prettier.getFileInfo.sync).toHaveBeenCalledWith('banana.txt', {
    file: 'banana.txt',
    resolveConfig: true,
  })
})

test('do not resolve config when false passed', () => {
  expect(isSupportedExtension(false)('banana.txt')).toEqual(false)
  expect(prettier.getFileInfo.sync).toHaveBeenCalledWith('banana.txt', {
    file: 'banana.txt',
    resolveConfig: false,
  })
})
