import createIgnorer from './createIgnorer.js'
import createMatcher from './createMatcher.js'
import isSupportedExtension from './isSupportedExtension.js'
import processFiles from './processFiles.js'
import scms from './scms/index.js'
import { PrettyQuickOptions } from './types.js'
import { filterAsync } from './utils.js'

export = async function prettyQuick(
  currentDirectory: string,
  {
    config,
    since,
    staged,
    pattern,
    restage = true,
    branch,
    bail,
    check,
    ignorePath,
    verbose,
    onFoundSinceRevision,
    onFoundChangedFiles,
    onPartiallyStagedFile,
    onExamineFile,
    onCheckFile,
    onWriteFile,
    resolveConfig = true,
  }: Partial<PrettyQuickOptions> = {},
) {
  const scm = scms(currentDirectory)
  if (!scm) {
    throw new Error('Unable to detect a source control manager.')
  }
  const directory = scm.rootDirectory

  const revision =
    since || (await scm.getSinceRevision(directory, { staged, branch }))

  onFoundSinceRevision?.(scm.name, revision)

  const rootIgnorer = createIgnorer(directory, ignorePath)
  const cwdIgnorer =
    currentDirectory === directory
      ? () => true
      : createIgnorer(currentDirectory, ignorePath)

  const patternMatcher = createMatcher(pattern)

  const isFileSupportedExtension = isSupportedExtension(resolveConfig)

  const unfilteredChangedFiles = await scm.getChangedFiles(
    directory,
    revision,
    staged,
  )
  const changedFiles = await filterAsync(
    unfilteredChangedFiles
      .filter(patternMatcher)
      .filter(rootIgnorer)
      .filter(cwdIgnorer),
    isFileSupportedExtension,
  )

  const unfilteredStagedFiles = await scm.getUnstagedChangedFiles(directory)
  const unstagedFiles = staged
    ? await filterAsync(
        unfilteredStagedFiles
          .filter(patternMatcher)
          .filter(rootIgnorer)
          .filter(cwdIgnorer),
        isFileSupportedExtension,
      )
    : []

  const wasFullyStaged = (file: string) => !unstagedFiles.includes(file)

  onFoundChangedFiles?.(changedFiles)

  const failReasons = new Set<string>()

  await processFiles(directory, changedFiles, {
    check,
    config,
    onWriteFile: async (file: string) => {
      await onWriteFile?.(file)
      if (bail) {
        failReasons.add('BAIL_ON_WRITE')
      }
      if (staged && restage) {
        if (wasFullyStaged(file)) {
          await scm.stageFile(directory, file)
        } else {
          onPartiallyStagedFile?.(file)
          failReasons.add('PARTIALLY_STAGED_FILE')
        }
      }
    },
    onCheckFile: (file: string, isFormatted: boolean) => {
      onCheckFile?.(file, isFormatted)
      if (!isFormatted) {
        failReasons.add('CHECK_FAILED')
      }
    },
    onExamineFile: verbose ? onExamineFile : undefined,
  })

  return {
    success: failReasons.size === 0,
    errors: [...failReasons],
  }
}
