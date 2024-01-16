import * as gitScm from './git'
import * as hgScm from './hg'

const scms = [gitScm, hgScm]

export default (directory: string) => {
  for (const scm of scms) {
    const rootDirectory = scm.detect(directory)
    if (rootDirectory) {
      return {
        rootDirectory,
        ...scm,
      }
    }
  }
}
