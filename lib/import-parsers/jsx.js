import { readFileSync } from "fs"
import { dirname as pathDirname, join as pathJoin } from "path"
import babelTraverse from "@babel/traverse"
import { parse as babelParse } from "@babel/parser"

export default (modulePath) => {
  const code = readFileSync(modulePath).toString()

  const ast = babelParse(code, {
    sourceType: "module",
    plugins: ["jsx"],
  })

  const importedModulePaths = []

  const visitor = {
    ImportDeclaration(path) {
      const node = path.node
      const moduleName = node.source && node.source.value ? node.source.value : null

      if (moduleName.startsWith(".")) {
        const modulePathRelativeToSourceDirectory = pathJoin(pathDirname(modulePath), moduleName)

        if (!modulePathRelativeToSourceDirectory.includes(".")) {
          modulePathRelativeToSourceDirectory = `${modulePathRelativeToSourceDirectory}.js`
        }

        importedModulePaths.push(modulePathRelativeToSourceDirectory)
      }
    },
  }

  babelTraverse(ast, visitor)

  return importedModulePaths
}
