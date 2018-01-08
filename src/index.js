import { relative } from 'path';

import scms from './scms';
import formatFiles from './formatFiles';
import createIgnorer from './createIgnorer';
import isSupportedExtension from './isSupportedExtension';

export default (
  directory,
  {
    config,
    since,
    staged,
    onFoundSinceRevision,
    onFoundChangedFiles,
    onWriteFile,
  } = {}
) => {
  const scm = scms(directory);
  if (!scm) {
    throw new Error('Unable to detect a source control manager.');
  }

  const revision = since || scm.getSinceRevision(directory, { staged });

  onFoundSinceRevision && onFoundSinceRevision(scm.name, revision);

  const changedFiles = scm
    .getChangedFiles(directory, revision)
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
