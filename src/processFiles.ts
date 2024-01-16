/* eslint-disable unicorn/filename-case */

import fs from 'fs'
import path from 'path'

import prettier from 'prettier'

import { PrettyQuickOptions } from './types'

export default (
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
      ...prettier.resolveConfig.sync(file, {
        config,
        editorconfig: true,
      }),
      filepath: file,
    }
    const input = fs.readFileSync(file, 'utf8')

    if (check) {
      const isFormatted = prettier.check(input, options)
      onCheckFile?.(relative, isFormatted)
      continue
    }

    const output = prettier.format(input, options)

    if (output !== input) {
      fs.writeFileSync(file, output)
      onWriteFile?.(relative)
    }
  }
}
