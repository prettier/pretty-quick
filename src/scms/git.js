import findUp from 'find-up';
import execa from 'execa';
import { dirname, join } from 'path';
import * as fs from 'fs';

export const name = 'git';

export const detect = (directory) => {
  if (fs.existsSync(join(directory, '.git'))) {
    return directory;
  }

  const gitDirectory = findUp.sync('.git', {
    cwd: directory,
    type: 'directory',
  });
  if (gitDirectory) {
    return dirname(gitDirectory);
  }

  const gitWorktreeFile = findUp.sync('.git', {
    cwd: directory,
    type: 'file',
  });

  if (gitWorktreeFile) {
    return dirname(gitWorktreeFile);
  }
};

const runGit = (directory, args) =>
  execa.sync('git', args, {
    cwd: directory,
  });

const getLines = (execaResult) => execaResult.stdout.split('\n');

export const getSinceRevision = (directory, { staged, branch }) => {
  try {
    const revision = staged
      ? 'HEAD'
      : runGit(directory, [
          'merge-base',
          'HEAD',
          branch || 'master',
        ]).stdout.trim();
    return runGit(directory, ['rev-parse', '--short', revision]).stdout.trim();
  } catch (error) {
    if (
      /HEAD/.test(error.message) ||
      (staged && /Needed a single revision/.test(error.message))
    ) {
      return null;
    }
    throw error;
  }
};

export const getChangedFiles = (directory, revision, staged) => {
  return [
    ...getLines(
      runGit(
        directory,
        [
          'diff',
          '--name-only',
          staged ? '--cached' : null,
          '--diff-filter=ACMRTUB',
          revision,
        ].filter(Boolean),
      ),
    ),
    ...(staged
      ? []
      : getLines(
          runGit(directory, ['ls-files', '--others', '--exclude-standard']),
        )),
  ].filter(Boolean);
};

export const getUnstagedChangedFiles = (directory) => {
  return getChangedFiles(directory, null, false);
};

export const stageFile = (directory, file) => {
  runGit(directory, ['add', file]);
};
