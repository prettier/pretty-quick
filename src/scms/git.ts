import fs from 'fs'
import path from 'path'

import findUp from 'find-up'
import { Output, x } from 'tinyexec'

export const name = 'git'

export const detect = (directory: string) => {
  if (fs.existsSync(path.join(directory, '.git'))) {
    return directory
  }

  const gitDirectory = findUp.sync('.git', {
    cwd: directory,
    type: 'directory',
  })

  const gitWorkTreeFile = findUp.sync('.git', {
    cwd: directory,
    type: 'file',
  })

  // if both of these are null then return null
  if (!gitDirectory && !gitWorkTreeFile) {
    return null
  }

  // if only one of these exists then return it
  if (gitDirectory && !gitWorkTreeFile) {
    return path.dirname(gitDirectory)
  }

  if (gitWorkTreeFile && !gitDirectory) {
    return path.dirname(gitWorkTreeFile)
  }

  const gitRepoDirectory = path.dirname(gitDirectory!)
  const gitWorkTreeDirectory = path.dirname(gitWorkTreeFile!)
  // return the deeper of these two
  return gitRepoDirectory.length > gitWorkTreeDirectory.length
    ? gitRepoDirectory
    : gitWorkTreeDirectory
}

const runGit = async (directory: string, args: string[]) =>
  x('git', args, {
    nodeOptions: {
      cwd: directory,
    },
  })

const getLines = (tinyexecOutput: Output) => tinyexecOutput.stdout.split('\n')

export const getSinceRevision = async (
  directory: string,
  { staged, branch }: { staged?: boolean; branch?: string },
) => {
  try {
    let revision = 'HEAD'
    if (!staged) {
      const revisionOutput = await runGit(directory, [
        'merge-base',
        'HEAD',
        branch || 'master',
      ])
      revision = revisionOutput.stdout.trim()
    }

    const revParseOutput = await runGit(directory, [
      'rev-parse',
      '--short',
      revision,
    ])
    return revParseOutput.stdout.trim()
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

export const getChangedFiles = async (
  directory: string,
  revision: string | null,
  staged?: boolean | undefined,
) =>
  [
    ...getLines(
      await runGit(
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
          await runGit(directory, [
            'ls-files',
            '--others',
            '--exclude-standard',
          ]),
        )),
  ].filter(Boolean)

export const getUnstagedChangedFiles = (directory: string) => {
  return getChangedFiles(directory, null, false)
}

export const stageFile = async (directory: string, file: string) => {
  await runGit(directory, ['add', file])
}
