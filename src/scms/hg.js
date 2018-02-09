import findUp from 'find-up';
import execa from 'execa';
import { dirname } from 'path';

export const name = 'hg';

export const detect = directory => {
  const hgDirectory = findUp.sync('.hg', { cwd: directory });
  if (hgDirectory) {
    return dirname(hgDirectory);
  }
};

const runHg = (directory, args) =>
  execa.sync('hg', args, {
    cwd: directory,
  });

const getLines = execaResult => execaResult.stdout.split('\n');

export const getSinceRevision = (directory, { branch }) => {
  const revision = runHg(directory, [
    'debugancestor',
    'HEAD',
    branch || 'master',
  ]).stdout.trim();
  return runHg(directory, ['id', '-r', revision]).stdout.trim();
};

export const getChangedFiles = (directory, revision) => {
  return [
    ...getLines(runHg(directory, ['diff', `-r ${revision}`])),
    ...getLines(runHg(directory, ['status', 're', '-n', '-a', '-m'])),
  ].filter(Boolean);
};

export const stageFile = (directory, file) => {
  runHg(directory, ['add', file]);
};
