import TextFile from '../text-file'
import jsxImportParser from '../import-parsers/jsx'
import jsxBuilder from '../builders/jsx'
import { createIndexPages } from '../utilities'

class JSXFile extends TextFile {
  get importedDependencyPaths() {
    return jsxImportParser(this.path)
  }

  get outputPath() {
    const extension = super.extensions.slice(-1)[0]
    const withoutExtension = super.outputPath.replace(`.${extension}`, '')
    return createIndexPages(withoutExtension)
  }

  async build(props) {
    const built = await jsxBuilder(this.path, props)

    return {
      ...built,
      output: `<!DOCTYPE html>\n\n${built.output}`,
    }
  }

  get isComponent() {
    return true
  }
}

TextFile.registerFileType({
  extension: '.html.jsx',
  klass: JSXFile,
})

export default JSXFile
