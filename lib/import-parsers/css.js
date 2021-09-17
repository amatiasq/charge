import { readFileSync } from "fs"
import { dirname as pathDirname, join as pathJoin } from "path"
import postcssParse from "postcss/lib/parse"
import valueParser from "postcss-value-parser"

export default (stylesheetPath) => {
  const css = readFileSync(stylesheetPath).toString()
  const ast = postcssParse(css)

  return ast.nodes.reduce((importedStylesheetPaths, node) => {
    if (node.type === "atrule" && node.name === "import") {
      const importedStylesheetPath = valueParser(node.params).nodes[0].value

      if (importedStylesheetPath.startsWith(".")) {
        const importedStylesheetPathRelativeToSourceDirectory = pathJoin(
          pathDirname(stylesheetPath),
          importedStylesheetPath,
        )
        importedStylesheetPaths.push(importedStylesheetPathRelativeToSourceDirectory)
      }
    }

    return importedStylesheetPaths
  }, [])
}
