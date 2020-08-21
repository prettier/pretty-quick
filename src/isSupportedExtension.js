import { getSupportInfo } from 'prettier';

const extensions = getSupportInfo().languages.reduce(
  (prev, language) => prev.concat(language.extensions || []),
  [],
);

export default (file) => extensions.some((ext) => file.endsWith(ext));
