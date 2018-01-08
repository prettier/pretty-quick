import { readFileSync, writeFileSync } from 'fs';
import { resolveConfig, format } from 'prettier';

export default (files, { config, onWriteFile }) => {
  for (const file of files) {
    const options = resolveConfig.sync(file, { config });
    const input = readFileSync(file, 'utf8');
    const output = format(
      input,
      Object.assign(options, {
        filepath: file,
      })
    );

    if (output !== input) {
      writeFileSync(file, output);
      onWriteFile && onWriteFile(file);
    }
  }
};
