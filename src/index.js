import scms from './scms';
import formatFiles from './formatFiles';
import createIgnorer from './createIgnorer';
import isFileSupported from './isFileSupported';

export default (
  currentDirectory,
  {
    config,
    since,
    staged,
    restage = true,
    branch,
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
  const { rootDirectory } = scm;

  const revision =
    since || scm.getSinceRevision(rootDirectory, { staged, branch });

  onFoundSinceRevision && onFoundSinceRevision(scm.name, revision);

  const changedFiles = scm
    .getChangedFiles(rootDirectory, revision, staged)
    .filter(isFileSupported)
    .filter(createIgnorer(rootDirectory));

  const unstagedFiles = staged
    ? scm
        .getUnstagedChangedFiles(rootDirectory, revision)
        .filter(isFileSupported)
        .filter(createIgnorer(rootDirectory))
    : [];

  const wasFullyStaged = f => unstagedFiles.indexOf(f) < 0;

  onFoundChangedFiles && onFoundChangedFiles(changedFiles);

  formatFiles(rootDirectory, changedFiles, {
    config,
    onWriteFile: file => {
      onWriteFile && onWriteFile(file);
      if (staged && restage) {
        if (wasFullyStaged(file)) {
          scm.stageFile(rootDirectory, file);
        } else {
          onPartiallyStagedFile && onPartiallyStagedFile(file);
        }
      }
    },
    onExamineFile: verbose && onExamineFile,
  });
};
