import path from 'path'

import findUp from 'find-up'
import { Output, exec } from 'tinyexec'

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

const runHg = async (directory: string, args: string[]) =>
  exec('hg', args, {
    nodeOptions: {
      cwd: directory,
    },
  })

const getLines = (tinyexecOutput: Output) => tinyexecOutput.stdout.split('\n')

export const getSinceRevision = async (
  directory: string,
  { branch }: { branch?: string },
) => {
  const revisionOutput = await runHg(directory, [
    'debugancestor',
    'tip',
    branch || 'default',
  ])
  const revision = revisionOutput.stdout.trim()

  const hgOutput = await runHg(directory, ['id', '-i', '-r', revision])
  return hgOutput.stdout.trim()
}

export const getChangedFiles = async (
  directory: string,
  revision: string | null,
  _staged?: boolean,
) =>
  [
    ...getLines(
      await runHg(directory, [
        'status',
        '-n',
        '-a',
        '-m',
        ...(revision ? ['--rev', revision] : []),
      ]),
    ),
  ].filter(Boolean)

export const getUnstagedChangedFiles = () => []

export const stageFile = async (directory: string, file: string) => {
  await runHg(directory, ['add', file])
}
