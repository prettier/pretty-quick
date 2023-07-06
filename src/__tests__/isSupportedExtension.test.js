import isSupportedExtension from '../isSupportedExtension';
import prettier from 'prettier';

afterEach(() => jest.clearAllMocks());

test('return true when file with supported extension passed in', async () => {
  expect(await isSupportedExtension(true)('banana.js')).toEqual(true);
  expect(prettier.getFileInfo).toHaveBeenCalledWith('banana.js', {
    file: 'banana.js',
    resolveConfig: true,
  });
});

test('return false when file with not supported extension passed in', async () => {
  expect(await isSupportedExtension(true)('banana.txt')).toEqual(false);
  expect(prettier.getFileInfo).toHaveBeenCalledWith('banana.txt', {
    file: 'banana.txt',
    resolveConfig: true,
  });
});

test('do not resolve config when false passed', async () => {
  expect(await isSupportedExtension(false)('banana.txt')).toEqual(false);
  expect(prettier.getFileInfo).toHaveBeenCalledWith('banana.txt', {
    file: 'banana.txt',
    resolveConfig: false,
  });
});
