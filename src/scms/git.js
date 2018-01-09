import findUp from 'find-up';
import execa from 'execa';
import { dirname } from 'path';

export const name = 'git';

export const detect = directory => {
  const gitDirectory = findUp.sync('.git', { cwd: directory });
  if (gitDirectory) {
    return dirname(gitDirectory);
  }
};

const runGit = (directory, args) =>
  execa.sync('git', args, {
    cwd: directory,
  });

const getLines = execaResult => execaResult.stdout.split('\n');

export const getSinceRevision = (directory, { staged }) => {
  const revision = staged
    ? 'HEAD'
    : runGit(directory, ['merge-base', 'HEAD', 'master']).stdout.trim();
  return runGit(directory, ['rev-parse', '--short', revision]).stdout.trim();
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
