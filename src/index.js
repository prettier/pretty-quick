import scms from './scms';
import processFiles from './processFiles';
import createIgnorer from './createIgnorer';
import createMatcher from './createMatcher';
import isSupportedExtension from './isSupportedExtension';

export default async (
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
    onStageFiles,
    resolveConfig = true,
  } = {},
) => {
  console.log('SCM...');
  const scm = await scms(currentDirectory);
  if (!scm) {
    throw new Error('Unable to detect a source control manager.');
  }
  const directory = scm.rootDirectory;

  const revision =
    since || (await scm.getSinceRevision(directory, { staged, branch }));

  onFoundSinceRevision && onFoundSinceRevision(scm.name, revision);
  console.log('IGNORER...');
  const rootIgnorer = await createIgnorer(directory, ignorePath);
  const cwdIgnorer =
    currentDirectory !== directory
      ? await createIgnorer(currentDirectory, ignorePath)
      : () => true;
  console.log('CHANGED FILES...');
  const rawChangedFiles = await scm.getChangedFiles(
    directory,
    revision,
    staged,
  );

  const changedFiles = rawChangedFiles
    .filter(createMatcher(pattern))
    .filter(rootIgnorer)
    .filter(cwdIgnorer)
    .filter(isSupportedExtension(resolveConfig));
  console.log('UNSTAGED FILES...');
  const unstagedFiles = staged
    ? (await scm.getUnstagedChangedFiles(directory, revision))
        .filter(isSupportedExtension)
        .filter(createMatcher(pattern))
        .filter(rootIgnorer)
        .filter(cwdIgnorer)
    : [];

  const wasFullyStaged = (f) => unstagedFiles.indexOf(f) < 0;

  onFoundChangedFiles && onFoundChangedFiles(changedFiles);

  const failReasons = new Set();

  const filesToStage = [];
  processFiles(directory, changedFiles, {
    check,
    config,
    onWriteFile: async (file) => {
      onWriteFile && onWriteFile(file);

      if (bail) {
        failReasons.add('BAIL_ON_WRITE');
      }
      if (staged && restage) {
        if (wasFullyStaged(file)) {
          filesToStage.push(file);
        } else {
          onPartiallyStagedFile && onPartiallyStagedFile(file);
          failReasons.add('PARTIALLY_STAGED_FILE');
        }
      }
    },
    onCheckFile: async (file, isFormatted) => {
      console.log('ON CHECK...');
      onCheckFile && onCheckFile(file, isFormatted);
      if (!isFormatted) {
        failReasons.add('CHECK_FAILED');
      }
    },
    onExamineFile: verbose && onExamineFile,
  });

  if (filesToStage.length > 0) {
    try {
      onStageFiles && onStageFiles();
      await scm.stageFiles(directory, filesToStage);
    } catch (e) {
      failReasons.add('STAGE_FAILED');
    }
  }

  return {
    success: failReasons.size === 0,
    errors: Array.from(failReasons),
  };
};
