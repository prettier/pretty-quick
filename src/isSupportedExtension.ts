/* eslint-disable unicorn/filename-case */

import * as prettier from 'prettier'

export default (resolveConfig?: boolean) => (file: string) => {
  const config = prettier.resolveConfig.sync(file, {
    editorconfig: true,
  }) as prettier.FileInfoOptions
  const fileInfo = prettier.getFileInfo.sync(file, {
    resolveConfig,
    ...config,
  })
  return !!fileInfo.inferredParser
}
