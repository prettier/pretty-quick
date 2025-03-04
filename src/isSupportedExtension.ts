/* eslint-disable unicorn/filename-case */

import fs, { promises as fsp } from 'fs'

import {
  type FileInfoOptions,
  getFileInfo,
  resolveConfig as prettierResolveConfig,
} from 'prettier'

export default (resolveConfig?: boolean) => async (file: string) => {
  if (fs.existsSync(file)) {
    const stat = await fsp.stat(file)
    /* If file exists but is actually a directory, getFileInfo might end up
     * trying to open it and read it as a file, so let's not let that happen.
     * On the other hand, the tests depend on our not failing out with files
     * that don't exist, so permit nonexistent files to go through (they appear
     * to be detected by suffix, so never get read).
     */
    if (stat.isDirectory()) return false
  }
  const config = (await prettierResolveConfig(file, {
    editorconfig: true,
  })) as FileInfoOptions
  const fileInfo = await getFileInfo(file, {
    resolveConfig,
    ...config,
  })
  return !!fileInfo.inferredParser
}
