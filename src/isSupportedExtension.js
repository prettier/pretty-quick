import { getFileInfo, resolveConfig as prettierResolveConfig } from 'prettier';

export default (resolveConfig) => async (file) =>
  Boolean(
    (
      await getFileInfo(file, {
        resolveConfig,
        ...(await prettierResolveConfig(
          file,
          { editorconfig: true },
          { filepath: file },
        )),
      })
    ).inferredParser,
  );
