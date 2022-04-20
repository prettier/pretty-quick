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

export const stageFiles = (directory, files) => {
  const maxArguments = 100;
  const result = files.reduce((resultArray, file, index) => {
    const chunkIndex = Math.floor(index / maxArguments);

    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = []; // start a new chunk
    }

    resultArray[chunkIndex].push(file);

    return resultArray;
  }, []);
  result.forEach((batchedFiles) => runHg(directory, ['add', ...batchedFiles]));
};
