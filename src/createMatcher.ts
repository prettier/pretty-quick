/* eslint-disable unicorn-x/filename-case */

import path from 'path'

import picomatch from 'picomatch'

export default function createMatcher(pattern: string[] | string | undefined) {
  // Match everything if no pattern was given
  if (typeof pattern !== 'string' && !Array.isArray(pattern)) {
    return () => true
  }
  const patterns = Array.isArray(pattern) ? pattern : [pattern]

  const isMatch = picomatch(patterns, { dot: true })
  return (file: string) => isMatch(path.normalize(file))
}
