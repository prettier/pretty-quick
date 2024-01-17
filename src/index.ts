import createIgnorer from './createIgnorer.js'
import createMatcher from './createMatcher.js'
import isSupportedExtension from './isSupportedExtension.js'
import processFiles from './processFiles.js'
import scms from './scms/index.js'
import { PrettyQuickOptions } from './types.js'
import { filterAsync } from './utils.js'

export = async (
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
  // eslint-disable-next-line sonarjs/cognitive-complexity
) => {
  const scm = scms(currentDirectory)
  if (!scm) {
    throw new Error('Unable to detect a source control manager.')
  }
  const directory = scm.rootDirectory

  const revision = since || scm.getSinceRevision(directory, { staged, branch })

  onFoundSinceRevision?.(scm.name, revision)

  const rootIgnorer = createIgnorer(directory, ignorePath)
  const cwdIgnorer =
    currentDirectory === directory
      ? () => true
      : createIgnorer(currentDirectory, ignorePath)

  const patternMatcher = createMatcher(pattern)

  const isFileSupportedExtension = isSupportedExtension(resolveConfig)

  const changedFiles = await filterAsync(
    scm
      .getChangedFiles(directory, revision, staged)
      .filter(patternMatcher)
      .filter(rootIgnorer)
      .filter(cwdIgnorer),
    isFileSupportedExtension,
  )

  const unstagedFiles = staged
    ? await filterAsync(
        scm
          .getUnstagedChangedFiles(directory)
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
    onWriteFile(file: string) {
      onWriteFile?.(file)
      if (bail) {
        failReasons.add('BAIL_ON_WRITE')
      }
      if (staged && restage) {
        if (wasFullyStaged(file)) {
          scm.stageFile(directory, file)
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
