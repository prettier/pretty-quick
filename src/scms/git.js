import { statSync } from 'fs';
import { join } from 'path';
import execa from 'execa';

export const name = 'git';

export const detect = directory => {
  try {
    return statSync(join(directory, '.git')).isDirectory();
  } catch (error) {
    return false;
  }
};

const runGit = (directory, args) =>
  execa.sync('git', args, {
    cwd: directory,
  });

const getLines = execaResult => execaResult.stdout.split('\n');

export const getSinceRevision = (directory, { staged }) => {
  if (staged) {
    return 'HEAD';
  }
  return runGit(directory, ['merge-base', 'HEAD', 'master']).stdout.trim();
};

export const getChangedFiles = (directory, revision) => {
  return [
    ...getLines(
      runGit(directory, [
        'diff',
        '--name-only',
        '--diff-filter=ACMRTUB',
        revision,
      ])
    ),
    ...getLines(
      runGit(directory, ['ls-files', '--others', '--exclude-standard'])
    ),
  ].filter(Boolean);
};

export const stageFile = (directory, file) => {
  runGit(directory, ['add', file]);
};
