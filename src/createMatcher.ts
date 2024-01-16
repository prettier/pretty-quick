/* eslint-disable unicorn/filename-case */

import path from 'path'

import multimatch from 'multimatch'

export default (pattern: string[] | string | undefined) => {
  // Match everything if no pattern was given
  if (typeof pattern !== 'string' && !Array.isArray(pattern)) {
    return () => true
  }
  const patterns = Array.isArray(pattern) ? pattern : [pattern]
  return (file: string) =>
    multimatch(path.normalize(file), patterns, { dot: true }).length > 0
}
