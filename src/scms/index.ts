import * as gitScm from './git.js'
import * as hgScm from './hg.js'

const scmList = [gitScm, hgScm]

export default (directory: string) => {
  for (const scm of scmList) {
    const rootDirectory = scm.detect(directory)
    if (rootDirectory) {
      return {
        rootDirectory,
        ...scm,
      }
    }
  }
}
