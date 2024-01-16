export interface PrettyQuickOptions {
  config: string
  since: string
  staged: boolean
  pattern: string[] | string
  restage: boolean
  branch: string
  bail: boolean
  check: boolean
  ignorePath: string
  resolveConfig: boolean
  verbose: boolean
  onFoundSinceRevision(name: string, revision: string | null): void
  onFoundChangedFiles(changedFiles: string[]): void
  onPartiallyStagedFile(file: string): void
  onExamineFile(relative: string): void
  onCheckFile(relative: string, isFormatted: boolean): void
  onWriteFile(relative: string): void
}
