import * as gitScm from './git';

const scms = [gitScm];

export default directory => {
  for (const scm of scms) {
    if (scm.detect(directory)) {
      return scm;
    }
  }
};
