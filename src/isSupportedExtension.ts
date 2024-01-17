/* eslint-disable unicorn/filename-case */

import {
  type FileInfoOptions,
  getFileInfo,
  resolveConfig as prettierResolveConfig,
} from 'prettier'

export default (resolveConfig?: boolean) => async (file: string) => {
  const config = (await prettierResolveConfig(file, {
    editorconfig: true,
  })) as FileInfoOptions
  const fileInfo = await getFileInfo(file, {
    resolveConfig,
    ...config,
  })
  return !!fileInfo.inferredParser
}
