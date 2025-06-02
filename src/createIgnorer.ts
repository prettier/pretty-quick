/* eslint-disable unicorn-x/filename-case */

import fs from 'fs/promises'
import path from 'path'

import { tryFile } from '@pkgr/core'
import ignore from 'ignore'

export default async function createIgnorer(
  directory: string,
  filename = '.prettierignore',
) {
  const file = path.join(directory, filename)

  if (tryFile(file)) {
    const text = await fs.readFile(file, 'utf8')
    const filter = ignore().add(text).createFilter()
    return (filepath: string) => filter(path.join(filepath))
  }

  return () => true
}
