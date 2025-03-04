/* eslint-disable unicorn/filename-case */

import mock from 'mock-fs'
import { getFileInfo } from 'prettier'

import isSupportedExtension from 'pretty-quick/isSupportedExtension'

beforeEach(() => {
  mock({
    'banana.js': 'banana()',
    'banana.txt': 'yellow',
    'bsym.js': mock.symlink({ path: 'banana.js' }),
    'bsym.txt': mock.symlink({ path: 'banana.js' }), // Yes extensions don't match
    dsym: mock.symlink({ path: 'subdir' }),
    subdir: {},
  })
})

afterEach(() => {
  mock.restore()
  jest.clearAllMocks()
})

test('return true when file with supported extension passed in', async () => {
  expect(await isSupportedExtension(true)('banana.js')).toEqual(true)
  expect(getFileInfo).toHaveBeenCalledWith('banana.js', {
    file: 'banana.js',
    resolveConfig: true,
  })
})

test('return false when file with not supported extension passed in', async () => {
  // eslint-disable-next-line sonarjs/no-duplicate-string
  expect(await isSupportedExtension(true)('banana.txt')).toEqual(false)
  expect(getFileInfo).toHaveBeenCalledWith('banana.txt', {
    file: 'banana.txt',
    resolveConfig: true,
  })
})

test('do not resolve config when false passed', async () => {
  expect(await isSupportedExtension(false)('banana.txt')).toEqual(false)
  expect(getFileInfo).toHaveBeenCalledWith('banana.txt', {
    file: 'banana.txt',
    resolveConfig: false,
  })
})

test('return true when file symlink with supported extension passed in', async () => {
  expect(await isSupportedExtension(true)('bsym.js')).toEqual(true)
  expect(getFileInfo).toHaveBeenCalledWith('bsym.js', {
    file: 'bsym.js',
    resolveConfig: true,
  })
})

test('return false when file symlink with unsupported extension passed in', async () => {
  expect(await isSupportedExtension(true)('bsym.txt')).toEqual(false)
  expect(getFileInfo).toHaveBeenCalledWith('bsym.txt', {
    file: 'bsym.txt',
    resolveConfig: true,
  })
})

test('return false when directory symlink passed in', async () => {
  expect(await isSupportedExtension(true)('dsym')).toEqual(false)
  expect(getFileInfo).not.toHaveBeenCalled()
})
