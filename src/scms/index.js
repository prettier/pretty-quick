import * as gitScm from './git';
import * as hgScm from './hg';

const scms = [gitScm, hgScm];

export default (directory) => {
  for (const scm of scms) {
    const rootDirectory = scm.detect(directory);
    if (rootDirectory) {
      return Object.assign({ rootDirectory }, scm);
    }
  }
};
