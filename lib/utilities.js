import glob from 'glob'
import { normalize, sep as separator } from 'path'

export const importComponent = path => {
  try {
    return import(path)
  } catch (error) {
    const relativePath = path.replace(`${process.cwd()}${separator}`, '')
    const file = `\nFile: ${relativePath}`

    let description = error.toString()
    let codeFrame = error.codeFrame

    error.stack = [file, description, codeFrame].join('\n')

    throw error
  }
}

export const globSync = (pattern, options = {}) => {
  return glob.sync(pattern, options)
}

export const globSyncNormalize = (pattern, options = {}) => {
  return globSync(pattern, options).map(path => normalize(path))
}

export const createIndexPages = path => {
  const pagesShouldEndWith = `${separator}index.html`
  return path.endsWith(pagesShouldEndWith)
    ? path
    : path.replace('.html', pagesShouldEndWith)
}
