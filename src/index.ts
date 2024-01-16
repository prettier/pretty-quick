import createIgnorer from './createIgnorer'
import createMatcher from './createMatcher'
import isSupportedExtension from './isSupportedExtension'
import processFiles from './processFiles'
import scms from './scms'
import { PrettyQuickOptions } from './types'

export = (
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

  const changedFiles = scm
    .getChangedFiles(directory, revision, staged)
    .filter(createMatcher(pattern))
    .filter(rootIgnorer)
    .filter(cwdIgnorer)
    .filter(isSupportedExtension(resolveConfig))

  const unstagedFiles = staged
    ? scm
        .getUnstagedChangedFiles(
          directory,
          // @ts-expect-error -- TODO: check
          revision,
        )
        .filter(isSupportedExtension(resolveConfig))
        .filter(createMatcher(pattern))
        .filter(rootIgnorer)
        .filter(cwdIgnorer)
    : []

  const wasFullyStaged = (f: string) => !unstagedFiles.includes(f)

  onFoundChangedFiles?.(changedFiles)

  const failReasons = new Set()

  processFiles(directory, changedFiles, {
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
