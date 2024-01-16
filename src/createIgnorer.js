import * as fs from 'fs';
import { join } from 'path';
import ignore from 'ignore';

export default async (directory, filename = '.prettierignore') => {
  const file = join(directory, filename);
  if (fs.existsSync(file)) {
    const text = await fs.promises.readFile(file, 'utf8');
    const filter = ignore().add(text).createFilter();
    return (path) => filter(join(path));
  }

  return () => true;
};
