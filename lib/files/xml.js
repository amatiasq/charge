import TextFile from '../text-file'
import jsxBuilder from '../builders/jsx'

class XMLFile extends TextFile {
  get outputPath() {
    const extension = super.extensions.slice(-1)[0]
    return super.outputPath.replace(`.${extension}`, '')
  }

  async build(props) {
    const built = await jsxBuilder(this.path, props)

    return {
      ...built,
      output: `<?xml version="1.0" encoding="UTF-8"?>\n\n${built.output}`,
    }
  }
}

TextFile.registerFileType({
  extension: '.xml.jsx',
  klass: XMLFile,
})

export default XMLFile
