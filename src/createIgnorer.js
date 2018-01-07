import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import ignore from 'ignore';

export default (directory, filename = '.prettierignore') => {
  const file = join(directory, filename);
  if (existsSync(file)) {
    const text = readFileSync(file, 'utf8');
    return ignore()
      .add(text)
      .createFilter();
  }

  return () => true;
};
