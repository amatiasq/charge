import TextFile from '../text-file'
import mdxImportParser from '../import-parsers/mdx'
import mdxBuilder from '../builders/mdx'
import { createIndexPages } from '../utilities'

class MDXFile extends TextFile {
  get importedDependencyPaths() {
    return mdxImportParser(this.path)
  }

  get outputPath() {
    const extension = super.extensions.slice(-1)[0]
    const withoutExtension = super.outputPath.replace(`.${extension}`, '')
    return createIndexPages(withoutExtension)
  }

  async build(props) {
    const built = await mdxBuilder(this.path, props)

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
  extension: '.html.mdx',
  klass: MDXFile,
})

export default MDXFile
