import fs from 'fs'
import path from 'path'

import execa from 'execa'
import findUp from 'find-up'

export const name = 'git'

export const detect = (directory: string) => {
  if (fs.existsSync(path.join(directory, '.git'))) {
    return directory
  }

  const gitDirectory = findUp.sync('.git', {
    cwd: directory,
    type: 'directory',
  })

  if (gitDirectory) {
    return path.dirname(gitDirectory)
  }

  const gitWorkTreeFile = findUp.sync('.git', {
    cwd: directory,
    type: 'file',
  })

  if (gitWorkTreeFile) {
    return path.dirname(gitWorkTreeFile)
  }
}

const runGit = (directory: string, args: string[]) =>
  execa.sync('git', args, {
    cwd: directory,
  })

const getLines = (execaResult: execa.ExecaSyncReturnValue) =>
  execaResult.stdout.split('\n')

export const getSinceRevision = (
  directory: string,
  { staged, branch }: { staged?: boolean; branch?: string },
) => {
  try {
    const revision = staged
      ? 'HEAD'
      : runGit(directory, [
          'merge-base',
          'HEAD',
          branch || 'master',
        ]).stdout.trim()
    return runGit(directory, ['rev-parse', '--short', revision]).stdout.trim()
  } catch (err) {
    const error = err as Error
    if (
      /HEAD/.test(error.message) ||
      (staged && /Needed a single revision/.test(error.message))
    ) {
      return null
    }
    throw error
  }
}

export const getChangedFiles = (
  directory: string,
  revision: string | null,
  staged?: boolean | undefined,
) =>
  [
    ...getLines(
      runGit(
        directory,
        [
          'diff',
          '--name-only',
          staged ? '--cached' : null,
          '--diff-filter=ACMRTUB',
          revision,
        ].filter(Boolean),
      ),
    ),
    ...(staged
      ? []
      : getLines(
          runGit(directory, ['ls-files', '--others', '--exclude-standard']),
        )),
  ].filter(Boolean)

export const getUnstagedChangedFiles = (directory: string) => {
  return getChangedFiles(directory, null, false)
}

export const stageFile = (directory: string, file: string) => {
  runGit(directory, ['add', file])
}
