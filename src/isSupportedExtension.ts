/* eslint-disable unicorn-x/filename-case */

import fs from 'fs/promises'

import {
  type FileInfoOptions,
  getFileInfo,
  resolveConfig as prettierResolveConfig,
} from 'prettier'

const isSupportedExtension =
  (resolveConfig?: boolean) => async (file: string) => {
    const stat = await fs.stat(file).catch(_error => null)
    /* If file exists but is actually a directory, getFileInfo might end up trying
     * to open it and read it as a file, so let's not let that happen.  On the
     * other hand, the tests depend on our not failing out with files that don't
     * exist, so permit nonexistent files to go through (they appear to be
     * detected by suffix, so never get read).
     */
    if (stat?.isDirectory()) {
      return false
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

export default isSupportedExtension
