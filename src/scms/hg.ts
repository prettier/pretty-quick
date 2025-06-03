import path from 'path'

import { findUp } from '@pkgr/core'
import { Output, exec } from 'tinyexec'

export const name = 'hg'

export const detect = (directory: string) => {
  const found = findUp({
    entry: path.resolve(directory),
    search: '.hg',
    type: 'directory',
  })
  return found ? path.dirname(found) : null
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

export const stageFiles = async (directory: string, files: string[]) => {
  const maxArguments = 100
  const result = files.reduce<string[][]>((resultArray, file, index) => {
    const chunkIndex = Math.floor(index / maxArguments)

    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = [] // start a new chunk
    }

    resultArray[chunkIndex].push(file)

    return resultArray
  }, [])

  for (const batchedFiles of result) {
    await runHg(directory, ['add', ...batchedFiles])
  }
}
