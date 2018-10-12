import { readFileSync, writeFileSync } from 'fs';
import { resolveConfig, format } from 'prettier';
import { join } from 'path';

export default (
  directory,
  files,
  { config, onWriteFile, onExamineFile } = {}
) => {
  for (const relative of files) {
    onExamineFile && onExamineFile(relative);
    const file = join(directory, relative);
    const options = resolveConfig.sync(file, { config, editorconfig: true });
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
