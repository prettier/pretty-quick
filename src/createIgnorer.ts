/* eslint-disable unicorn-x/filename-case */

import fs from 'fs'
import path from 'path'

import ignore from 'ignore'

export default function createIgnorer(
  directory: string,
  filename = '.prettierignore',
) {
  const file = path.join(directory, filename)

  if (fs.existsSync(file)) {
    const text = fs.readFileSync(file, 'utf8')
    const filter = ignore().add(text).createFilter()
    return (filepath: string) => filter(path.join(filepath))
  }

  return () => true
}
