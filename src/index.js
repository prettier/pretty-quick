import scms from './scms';
import processFiles from './processFiles';
import createIgnorer from './createIgnorer';
import createMatcher from './createMatcher';
import isSupportedExtension from './isSupportedExtension';

export default (
  currentDirectory,
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
  } = {},
) => {
  const scm = scms(currentDirectory);
  if (!scm) {
    throw new Error('Unable to detect a source control manager.');
  }
  const directory = scm.rootDirectory;

  const revision = since || scm.getSinceRevision(directory, { staged, branch });

  onFoundSinceRevision && onFoundSinceRevision(scm.name, revision);

  const rootIgnorer = createIgnorer(directory, ignorePath);
  const cwdIgnorer =
    currentDirectory !== directory
      ? createIgnorer(currentDirectory, ignorePath)
      : () => true;

  const changedFiles = scm
    .getChangedFiles(directory, revision, staged)
    .filter(createMatcher(pattern))
    .filter(rootIgnorer)
    .filter(cwdIgnorer)
    .filter(isSupportedExtension(resolveConfig));

  const unstagedFiles = staged
    ? scm
        .getUnstagedChangedFiles(directory, revision)
        .filter(isSupportedExtension)
        .filter(createMatcher(pattern))
        .filter(rootIgnorer)
        .filter(cwdIgnorer)
    : [];

  const wasFullyStaged = (f) => unstagedFiles.indexOf(f) < 0;

  onFoundChangedFiles && onFoundChangedFiles(changedFiles);

  const failReasons = new Set();

  processFiles(directory, changedFiles, {
    check,
    config,
    onWriteFile: (file) => {
      onWriteFile && onWriteFile(file);
      if (bail) {
        failReasons.add('BAIL_ON_WRITE');
      }
      if (staged && restage) {
        if (wasFullyStaged(file)) {
          scm.stageFile(directory, file);
        } else {
          onPartiallyStagedFile && onPartiallyStagedFile(file);
          failReasons.add('PARTIALLY_STAGED_FILE');
        }
      }
    },
    onCheckFile: (file, isFormatted) => {
      onCheckFile && onCheckFile(file, isFormatted);
      if (!isFormatted) {
        failReasons.add('CHECK_FAILED');
      }
    },
    onExamineFile: verbose && onExamineFile,
  });

  return {
    success: failReasons.size === 0,
    errors: Array.from(failReasons),
  };
};
