import { getFileInfo } from 'prettier';

export default (resolveConfig) => (file) =>
  Boolean(
    getFileInfo.sync(file, { resolveConfig: resolveConfig }).inferredParser,
  );
