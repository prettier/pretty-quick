import isSupportedExtension from '../isSupportedExtension';

test('return true when file with supported extension passed in', () => {
  expect(isSupportedExtension('banana.js')).toEqual(true);
});

test('return false when file with not supported extension passed in', () => {
  expect(isSupportedExtension('banana.txt')).toEqual(false);
});
