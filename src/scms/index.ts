import * as gitScm from './git.js'
import * as hgScm from './hg.js'

const scms = [gitScm, hgScm]

export default function detectScm(directory: string) {
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
