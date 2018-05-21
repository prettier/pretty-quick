import { readFileSync, writeFileSync } from 'fs';
import { resolveConfig, format } from 'prettier';
import path, { join } from 'path';

export default (directory, files, { config, eslintFix, onWriteFile } = {}) => {
  const eslintExtensions = ['.js', '.jsx' /*, '.ts', '.tsx'*/];
  const eslintCliEngine = eslintFix && require('./eslintLoader');

  for (const relative of files) {
    const file = join(directory, relative);
    const options = resolveConfig.sync(file, { config, editorconfig: true });
    const input = readFileSync(file, 'utf8');
    const pritiffied = format(
      input,
      Object.assign({}, options, {
        filepath: file,
      })
    );
    const output =
      (eslintFix &&
        eslintExtensions.includes(path.extname(file || '')) &&
        eslintCliEngine(file).eslintFixer(pritiffied)) ||
      pritiffied;

    if (output !== input) {
      writeFileSync(file, output);
      onWriteFile && onWriteFile(relative);
    }
  }
};
