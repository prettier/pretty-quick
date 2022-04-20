import findUp from 'find-up';
import execa from 'execa';
import { dirname, join } from 'path';
import * as fs from 'fs';

export const name = 'git';

export const detect = async (directory) => {
  if (fs.existsSync(join(directory, '.git'))) {
    return directory;
  }

  const gitDirectory = await findUp('.git', {
    cwd: directory,
    type: 'directory',
  });
  if (gitDirectory) {
    return dirname(gitDirectory);
  }

  const gitWorktreeFile = await findUp('.git', {
    cwd: directory,
    type: 'file',
  });

  if (gitWorktreeFile) {
    return dirname(gitWorktreeFile);
  }
};

const runGit = async (directory, args) =>
  await execa('git', args, {
    cwd: directory,
  });

const getLines = (execaResult) => execaResult.stdout.split('\n');

export const getSinceRevision = async (directory, { staged, branch }) => {
  try {
    const revision = staged
      ? 'HEAD'
      : await runGit(directory, [
          'merge-base',
          'HEAD',
          branch || 'master',
        ]).stdout.trim();
    return (
      await runGit(directory, ['rev-parse', '--short', revision])
    ).stdout.trim();
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

export const getChangedFiles = async (directory, revision, staged) => {
  return [
    ...getLines(
      await runGit(
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
          await runGit(directory, [
            'ls-files',
            '--others',
            '--exclude-standard',
          ]),
        )),
  ].filter(Boolean);
};

export const getUnstagedChangedFiles = async (directory) => {
  return await getChangedFiles(directory, null, false);
};

export const stageFiles = async (directory, files) => {
  const maxArguments = 100;
  const result = files.reduce((resultArray, file, index) => {
    const chunkIndex = Math.floor(index / maxArguments);

    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = []; // start a new chunk
    }

    resultArray[chunkIndex].push(file);

    return resultArray;
  }, []);

  for (let batchedFiles of result) {
    await runGit(directory, ['add', ...batchedFiles]);
  }
};
