import { readFileSync, writeFileSync } from 'fs';
import * as prettier from 'prettier';
import { join } from 'path';

export default (
  directory,
  files,
  { check, config, onProcessFile, onExamineFile } = {}
) => {
  for (const relative of files) {
    onExamineFile && onExamineFile(relative);
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

    if (check && !prettier.check(input, options)) {
      onProcessFile && onProcessFile(relative);
      return;
    }

    const output = prettier.format(input, options);

    if (output !== input) {
      writeFileSync(file, output);
      onProcessFile && onProcessFile(relative);
    }
  }
};
