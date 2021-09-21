import { readFileSync } from 'fs'
import { dirname as pathDirname, join as pathJoin } from 'path'
import babelTraverse from '@babel/traverse'
import { parse as babelParse } from '@babel/parser'
import { sync as mdxTransform } from '@mdx-js/mdx'

export default modulePath => {
  const code = readFileSync(modulePath).toString()

  const jsxWithMDXTags = mdxTransform(code)

  const jsx = `
    import React from "react"
    import { mdx } from "@mdx-js/react"

    ${jsxWithMDXTags}
  `

  const ast = babelParse(jsx, {
    sourceType: 'module',
    plugins: ['jsx', 'objectRestSpread'],
  })

  const importedModulePaths = []

  const visitor = {
    ImportDeclaration(path) {
      const node = path.node
      const moduleName =
        node.source && node.source.value ? node.source.value : null

      if (moduleName.startsWith('.')) {
        const modulePathRelativeToSourceDirectory = pathJoin(
          pathDirname(modulePath),
          moduleName,
        )

        if (!modulePathRelativeToSourceDirectory.includes('.')) {
          modulePathRelativeToSourceDirectory = `${modulePathRelativeToSourceDirectory}.js`
        }

        importedModulePaths.push(modulePathRelativeToSourceDirectory)
      }
    },
  }

  babelTraverse(ast, visitor)

  return importedModulePaths
}
