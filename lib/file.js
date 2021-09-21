import { readFileSync } from 'fs'
import { resolve as pathResolve, sep as pathSeparator } from 'path'

class File {
  constructor({ path, relativePath }) {
    this.path = pathResolve(path)
    this.relativePath = relativePath
  }

  build(_data) {
    return {
      meta: {},
      output: readFileSync(this.path),
    }
  }

  get outputPath() {
    return this.relativePath
  }

  get importedDependencyPaths() {
    return []
  }

  get extensions() {
    return this.relativePath.split(pathSeparator).pop().split('.').slice(1)
  }

  get _extension() {
    const filename = this.relativePath.split(pathSeparator).pop()

    if (!filename.match(/\./)) {
      return ''
    }

    return filename.match(/(\..+)/)[1]
  }

  get isComponent() {
    return false
  }

  static instantiateByType({ path, relativePath }) {
    const file = new this({ path, relativePath })
    const fileClass = this.fileTypes[file._extension]

    if (fileClass) {
      return new fileClass({ path, relativePath })
    } else {
      return file
    }
  }

  static registerFileType({ extension, klass }) {
    this.fileTypes[extension] = klass
  }
}

File.fileTypes = {}

File.registerFileType({
  extension: '',
  klass: File,
})

export default File
