import path from 'path'

import * as find from 'empathic/find'
import { exec, Output } from 'tinyexec'

export const name = 'git'

export const detect = (directory: string) => {
  const found = find.up('.git', { cwd: directory })
  return found ? path.dirname(found) : null
}

const runGit = (directory: string, args: string[]) =>
  exec('git', args, {
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

export const stageFile = (directory: string, file: string) =>
  runGit(directory, ['add', file])
