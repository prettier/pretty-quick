import findUp from 'find-up';
import execa from 'execa';
import { dirname } from 'path';

export const name = 'hg';

export const detect = async (directory) => {
  const hgDirectory = await findUp('.hg', {
    cwd: directory,
    type: 'directory',
  });
  if (hgDirectory) {
    return dirname(hgDirectory);
  }
};

const runHg = async (directory, args) =>
  await execa('hg', args, {
    cwd: directory,
  });

const getLines = (execaResult) => execaResult.stdout.split('\n');

export const getSinceRevision = async (directory, { branch }) => {
  const revision = await runHg(directory, [
    'debugancestor',
    'tip',
    branch || 'default',
  ]).stdout.trim();
  return (await runHg(directory, ['id', '-i', '-r', revision])).stdout.trim();
};

export const getChangedFiles = async (directory, revision) => {
  return [
    ...getLines(
      await runHg(directory, ['status', '-n', '-a', '-m', '--rev', revision]),
    ),
  ].filter(Boolean);
};

export const getUnstagedChangedFiles = () => {
  return [];
};

export const stageFiles = async (directory, files) => {
  await runHg(directory, ['add', ...files]);
};
