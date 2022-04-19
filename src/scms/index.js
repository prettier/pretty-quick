import * as gitScm from './git';
import * as hgScm from './hg';

const scms = [gitScm, hgScm];

export default async (directory) => {
  for (const scm of scms) {
    const rootDirectory = await scm.detect(directory);
    if (rootDirectory) {
      return Object.assign({ rootDirectory }, scm);
    }
  }
};
