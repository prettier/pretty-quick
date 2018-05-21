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
    branch,
    onFoundSinceRevision,
    onFoundChangedFiles,
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

  onFoundChangedFiles && onFoundChangedFiles(changedFiles);

  formatFiles(directory, changedFiles, {
    config,
    onWriteFile: file => {
      onWriteFile && onWriteFile(file);
      staged && scm.stageFile(directory, file);
    },
  });
};
