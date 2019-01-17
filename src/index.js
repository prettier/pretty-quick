import scms from './scms';
import formatFiles from './formatFiles';
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
    verbose,
    onFoundSinceRevision,
    onFoundChangedFiles,
    onPartiallyStagedFile,
    onWriteFile,
    onExamineFile,
  } = {}
) => {
  const scm = scms(currentDirectory);
  if (!scm) {
    throw new Error('Unable to detect a source control manager.');
  }
  const directory = scm.rootDirectory;

  const revision = since || scm.getSinceRevision(directory, { staged, branch });

  onFoundSinceRevision && onFoundSinceRevision(scm.name, revision);

  const rootIgnorer = createIgnorer(directory);
  const cwdIgnorer =
    currentDirectory !== directory
      ? createIgnorer(currentDirectory)
      : () => true;

  const changedFiles = scm
    .getChangedFiles(directory, revision, staged)
    .filter(isSupportedExtension)
    .filter(createMatcher(pattern))
    .filter(rootIgnorer)
    .filter(cwdIgnorer);

  const unstagedFiles = staged
    ? scm
        .getUnstagedChangedFiles(directory, revision)
        .filter(isSupportedExtension)
        .filter(createMatcher(pattern))
        .filter(rootIgnorer)
        .filter(cwdIgnorer)
    : [];

  const wasFullyStaged = f => unstagedFiles.indexOf(f) < 0;

  onFoundChangedFiles && onFoundChangedFiles(changedFiles);

  const failReasons = new Set();

  formatFiles(directory, changedFiles, {
    config,
    onWriteFile: file => {
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
    onExamineFile: verbose && onExamineFile,
  });

  return {
    success: failReasons.size === 0,
    errors: Array.from(failReasons),
  };
};
