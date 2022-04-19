import findUp from 'find-up';
import execa from 'execa';
import { dirname } from 'path';

export const name = 'hg';

export const detect = (directory) => {
  const hgDirectory = findUp.sync('.hg', {
    cwd: directory,
    type: 'directory',
  });
  if (hgDirectory) {
    return dirname(hgDirectory);
  }
};

const runHg = (directory, args) =>
  execa.sync('hg', args, {
    cwd: directory,
  });

const getLines = (execaResult) => execaResult.stdout.split('\n');

export const getSinceRevision = (directory, { branch }) => {
  const revision = runHg(directory, [
    'debugancestor',
    'tip',
    branch || 'default',
  ]).stdout.trim();
  return runHg(directory, ['id', '-i', '-r', revision]).stdout.trim();
};

export const getChangedFiles = (directory, revision) => {
  return [
    ...getLines(
      runHg(directory, ['status', '-n', '-a', '-m', '--rev', revision]),
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
