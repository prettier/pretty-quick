import path from 'path'

import * as find from 'empathic/find'
import { exec, Output } from 'tinyexec'

export const name = 'hg'

export const detect = (directory: string) => {
  const found = find.up('.hg', { cwd: directory })
  if (found) return path.dirname(found)
}

const runHg = (directory: string, args: string[]) =>
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

export const stageFile = (directory: string, file: string) =>
  runHg(directory, ['add', file])
