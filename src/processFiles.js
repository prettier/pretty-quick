import { readFileSync, writeFileSync } from 'fs';
import * as prettier from 'prettier';
import { join } from 'path';

export default (
  directory,
  files,
  { check, config, onProcessFile, onCheckFile, onWriteFile } = {}
) => {
  for (const relative of files) {
    onProcessFile && onProcessFile(relative);
    const file = join(directory, relative);
    const options = Object.assign(
      {},
      prettier.resolveConfig.sync(file, {
        config,
        editorconfig: true,
      }),
      { filepath: file }
    );
    const input = readFileSync(file, 'utf8');

    if (check) {
      const isFormatted = prettier.check(input, options);
      onCheckFile && onCheckFile(relative, isFormatted);
      continue;
    }

    const output = prettier.format(input, options);

    if (output !== input) {
      writeFileSync(file, output);
      onWriteFile && onWriteFile(relative);
    }
  }
};
