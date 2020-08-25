import { getFileInfo } from 'prettier';

export default (file) =>
  Boolean(getFileInfo.sync(file, { resolveConfig: true }).inferredParser);
