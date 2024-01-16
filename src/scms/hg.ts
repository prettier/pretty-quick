import path from 'path'

import execa from 'execa'
import findUp from 'find-up'

export const name = 'hg'

export const detect = (directory: string) => {
  const hgDirectory = findUp.sync('.hg', {
    cwd: directory,
    type: 'directory',
  })
  if (hgDirectory) {
    return path.dirname(hgDirectory)
  }
}

const runHg = (directory: string, args: string[]) =>
  execa.sync('hg', args, {
    cwd: directory,
  })

const getLines = (execaResult: execa.ExecaSyncReturnValue) =>
  execaResult.stdout.split('\n')

export const getSinceRevision = (
  directory: string,
  { branch }: { branch?: string },
) => {
  const revision = runHg(directory, [
    'debugancestor',
    'tip',
    branch || 'default',
  ]).stdout.trim()
  return runHg(directory, ['id', '-i', '-r', revision]).stdout.trim()
}

export const getChangedFiles = (
  directory: string,
  revision: string | null,
  _staged?: boolean,
) =>
  [
    ...getLines(
      runHg(directory, [
        'status',
        '-n',
        '-a',
        '-m',
        ...(revision ? ['--rev', revision] : []),
      ]),
    ),
  ].filter(Boolean)

export const getUnstagedChangedFiles = () => []

export const stageFile = (directory: string, file: string) => {
  runHg(directory, ['add', file])
}
