import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import ignore from 'ignore'

export default (directory, filename = '.prettierignore') => {
  const file = join(directory, filename)
  if (existsSync(file)) {
    const text = readFileSync(file, 'utf8')
    const filter = ignore().add(text).createFilter()
    return path => filter(join(path))
  }

  return () => true
}
