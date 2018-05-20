import scms from './scms';
import formatFiles from './formatFiles';
import createIgnorer from './createIgnorer';
import isSupportedExtension from './isSupportedExtension';

export default (
  currentDirectory,
  {
    config,
    eslintFix,
    since,
    staged,
    branch,
    onFoundSinceRevision,
    onFoundChangedFiles,
    onPartiallyStagedFile,
    onWriteFile,
  } = {}
) => {
  if (eslintFix) {
    try {
      require.resolve('eslint');
    } catch (e) {
      throw new Error(
        'Eslint should be installed in order to use --eslintFix.'
      );
    }
  }

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
    eslintFix,
    onWriteFile: file => {
      onWriteFile && onWriteFile(file);
      if (staged) {
        if (wasFullyStaged(file)) {
          scm.stageFile(directory, file);
        } else {
          onPartiallyStagedFile && onPartiallyStagedFile(file);
        }
      }
    },
  });
};
