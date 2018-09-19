import scms from './scms';
import formatFiles from './formatFiles';
import createIgnorer from './createIgnorer';
import isSupportedExtension from './isSupportedExtension';

export default (
  currentDirectory,
  {
    config,
    since,
    staged,
    restage = true,
    branch,
    onFoundSinceRevision,
    onFoundChangedFiles,
    onPartiallyStagedFile,
    onWriteFile,
  } = {}
) => {
  const scm = scms(currentDirectory);
  if (!scm) {
    throw new Error('Unable to detect a source control manager.');
  }
  const directory = scm.rootDirectory;

  const revision = since || scm.getSinceRevision(directory, { staged, branch });

  onFoundSinceRevision && onFoundSinceRevision(scm.name, revision);

  const changedFiles = scm
    .getChangedFiles(directory, revision, staged)
    .filter(isSupportedExtension)
    .filter(createIgnorer(directory));

  const unstagedFiles = staged
    ? scm
        .getUnstagedChangedFiles(directory, revision)
        .filter(isSupportedExtension)
        .filter(createIgnorer(directory))
    : [];

  const wasFullyStaged = f => unstagedFiles.indexOf(f) < 0;

  onFoundChangedFiles && onFoundChangedFiles(changedFiles);

  formatFiles(directory, changedFiles, {
    config,
    onWriteFile: file => {
      onWriteFile && onWriteFile(file);
      if (staged && restage) {
        if (wasFullyStaged(file)) {
          scm.stageFile(directory, file);
        } else {
          onPartiallyStagedFile && onPartiallyStagedFile(file);
        }
      }
    },
  });
};
