import { readFileSync, writeFileSync } from 'fs';
import { resolveConfig, format } from 'prettier';
import { join } from 'path';

export default (directory, files, { config, onWriteFile } = {}) => {
  for (const relative of files) {
    const file = join(directory, relative);
    const options = resolveConfig.sync(file, { config });
    const input = readFileSync(file, 'utf8');
    const output = format(
      input,
      Object.assign({}, options, {
        filepath: file,
      })
    );

    if (output !== input) {
      writeFileSync(file, output);
      onWriteFile && onWriteFile(relative);
    }
  }
};
