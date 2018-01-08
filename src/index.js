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
  }
) => {
  const scm = scms(directory);
  if (!scm) {
    throw new Error('Unable to detect a source control manager.');
  }

  const revision = since || scm.getSinceRevision(directory, { staged });

  onFoundSinceRevision && onFoundSinceRevision(scm.name, revision);

  const changedFiles = scm
    .getChangedFiles(directory, revision)
    .map(file => relative(directory, file))
    .filter(isSupportedExtension)
    .filter(createIgnorer(directory));

  onFoundChangedFiles && onFoundChangedFiles(changedFiles);

  formatFiles(changedFiles, {
    config,
    onWriteFile: file => {
      onWriteFile(file);
      scm.stageFile(directory, file);
    },
  });
};
