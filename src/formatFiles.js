import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolveConfig, getFileInfo, format as prettierFormat } from 'prettier';
import { join } from 'path';

export default (
  rootDirectory,
  files,
  { config, onWriteFile, onExamineFile } = {}
) => {
  // Use local "prettier-tslint" if possible.
  const tslintFormat = loadFormat(rootDirectory, 'prettier-tslint', 'format');
  // Use local "prettier-eslint" if possible.
  const eslintFormat = loadFormat(rootDirectory, 'prettier-eslint');

  for (const relative of files) {
    onExamineFile && onExamineFile(relative);
    const file = join(rootDirectory, relative);
    const input = readFileSync(file, 'utf8');

    const parser = getFileInfo.sync(file).inferredParser;
    const format =
      (parser === 'babylon' && (eslintFormat || tslintFormat)) ||
      (parser === 'typescript' && (tslintFormat || eslintFormat)) ||
      prettierFormat;

    const options = resolveConfig.sync(file, { config, editorconfig: true });
    const output =
      format === prettierFormat
        ? format(input, ((options.filepath = file), options))
        : format({
            text: input,
            filePath: file,
            prettierOptions: options,
          });

    if (output !== input) {
      writeFileSync(file, output);
      onWriteFile && onWriteFile(relative);
    }
  }
};

function loadFormat(rootDirectory, formatName, exportKey) {
  const formatPath = join(rootDirectory, 'node_modules', formatName);
  if (existsSync(formatPath)) {
    const exports = require(formatPath);
    return exportKey ? exports[exportKey] : exports;
  }
}
