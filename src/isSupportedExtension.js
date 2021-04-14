import { getFileInfo, resolveConfig as prettierResolveConfig } from 'prettier';

export default (resolveConfig) => (file) =>
  Boolean(
    getFileInfo.sync(file, {
      resolveConfig,
      ...prettierResolveConfig.sync(
        file,
        { editorconfig: true },
        { filepath: file },
      ),
    }).inferredParser,
  );
