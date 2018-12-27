import { extname } from 'path';
import { getFileInfo, getSupportInfo } from 'prettier';

const extensions = getSupportInfo().languages.reduce(
  (prev, language) => prev.concat(language.extensions || []),
  []
);

export default file =>
  extensions.includes(extname(file)) ||
  getFileInfo.sync(file).inferredParser !== null;
