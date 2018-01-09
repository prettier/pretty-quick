import * as gitScm from './git';

const scms = [gitScm];

export default directory => {
  for (const scm of scms) {
    const rootDirectory = scm.detect(directory);
    if (rootDirectory) {
      return Object.assign({ rootDirectory }, scm);
    }
  }
};
