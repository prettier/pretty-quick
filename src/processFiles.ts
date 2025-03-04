/* eslint-disable unicorn/filename-case */

import fs from 'fs'
import path from 'path'

import { format, check as prettierCheck, resolveConfig } from 'prettier'

import type { PrettyQuickOptions } from './types.js'

export default async (
  directory: string,
  files: string[],
  {
    check,
    config,
    onExamineFile,
    onCheckFile,
    onWriteFile,
  }: Partial<PrettyQuickOptions> = {},
) => {
  for (const relative of files) {
    onExamineFile?.(relative)
    const file = path.join(directory, relative)
    const options = {
      ...(await resolveConfig(file, {
        config,
        editorconfig: true,
      })),
      filepath: file,
    }
    const input = fs.readFileSync(file, 'utf8')

    if (check) {
      const isFormatted = await prettierCheck(input, options)
      onCheckFile?.(relative, isFormatted)
      continue
    }

    const output = await format(input, options)

    if (output !== input) {
      fs.writeFileSync(file, output)
      await onWriteFile?.(relative)
    }
  }
}
