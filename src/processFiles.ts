/* eslint-disable unicorn-x/filename-case */

import fs from 'fs/promises'
import path from 'path'

import { format, check as prettierCheck, resolveConfig } from 'prettier'

import type { PrettyQuickOptions } from './types.js'

export default async function processFiles(
  directory: string,
  files: string[],
  {
    check,
    config,
    onExamineFile,
    onCheckFile,
    onWriteFile,
  }: Partial<PrettyQuickOptions> = {},
) {
  return Promise.all(
    files.map(async relative => {
      onExamineFile?.(relative)
      const file = path.join(directory, relative)
      const options = {
        ...(await resolveConfig(file, {
          config,
          editorconfig: true,
        })),
        filepath: file,
      }
      const input = await fs.readFile(file, 'utf8')

      if (check) {
        const isFormatted = await prettierCheck(input, options)
        onCheckFile?.(relative, isFormatted)
        return
      }

      const output = await format(input, options)

      if (output !== input) {
        await fs.writeFile(file, output)
        await onWriteFile?.(relative)
      }
    }),
  )
}
