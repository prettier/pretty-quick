/* eslint-disable @typescript-eslint/require-await */

import path from 'path'

export const format = jest.fn(async (input: string) => 'formatted:' + input)

export const resolveConfig = jest.fn(async (file: string) => ({ file }))

export const getFileInfo = jest.fn(async (file: string) => {
  const ext = path.extname(file)
  return {
    ignored: false,
    inferredParser: ext === '.js' || ext === '.md' ? 'babel' : null,
  }
})
