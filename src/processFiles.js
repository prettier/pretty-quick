import * as fs from 'fs';
import * as prettier from 'prettier';
import { join } from 'path';

const processInternal = async () => {};

export default async (
  directory,
  files,
  { check, config, onExamineFile, onCheckFile, onWriteFile } = {},
) => {
  const promises = [];
  for (const relative of files) {
    promises.push(
      (async () => {
        onExamineFile && (await onExamineFile(relative));
        const file = join(directory, relative);

        const options = Object.assign(
          {},
          await prettier.resolveConfig(file, {
            config,
            editorconfig: true,
          }),
          { filepath: file },
        );

        const input = await fs.promises.readFile(file, 'utf8');

        if (check) {
          const isFormatted = prettier.check(input, options);
          onCheckFile && (await onCheckFile(relative, isFormatted));
          return;
        }

        const output = prettier.format(input, options);

        if (output !== input) {
          await fs.promises.writeFile(file, output);
          onWriteFile && (await onWriteFile(relative));
        }
      })(),
    );
  }
  await Promise.all(promises);
};
