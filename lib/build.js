import { globSync, globSyncNormalize } from './utilities'
import {
  parse as pathParse,
  resolve as pathResolve,
  join as pathJoin,
  sep as pathSeparator,
} from 'path'
import { emptyDirSync, readFileSync, outputFileSync } from 'fs-extra'
import flatMap from 'lodash.flatmap'
import uniqBy from 'lodash.uniqby'
import logger from './logger'
import File from './file'
import { importComponent } from './utilities'

// These need to be required here. The modules aren’t used here but requiring them
// registers their types on the File module so the proper class can be found.
globSync(`${__dirname}/files/*`).forEach(module => require(module))

const loadData = source => {
  const dataDirectory = pathResolve(`${source}/../data`)
  const dataFiles = globSyncNormalize(`${dataDirectory}/*.json`)

  return dataFiles.reduce((data, file) => {
    const fileName = pathParse(file).name
    data[fileName] = JSON.parse(readFileSync(file))
    return data
  }, {})
}

const dependentsOfDependency = (sourceFiles, file) => {
  const sourceFilesThatImportFile = sourceFiles.filter(sourceFile => {
    try {
      return sourceFile.importedDependencyPaths.includes(file.path)
    } catch (_error) {
      return false
    }
  })

  if (sourceFilesThatImportFile.length) {
    const files = flatMap(
      sourceFilesThatImportFile,
      sourceFileThatImportFile => {
        return dependentsOfDependency(sourceFiles, sourceFileThatImportFile)
      },
    )

    return uniqBy(files, 'path')
  } else {
    return [file]
  }
}

const dependentsThatAreNotDependencies = sourceFiles => {
  const importedDependencyPaths = flatMap(sourceFiles, sourceFile => {
    try {
      return sourceFile.importedDependencyPaths
    } catch (_error) {
      return []
    }
  })

  return sourceFiles.filter(sourceFile => {
    return !importedDependencyPaths.includes(sourceFile.path)
  })
}

export default async ({ source, target, file, environment = 'production' }) => {
  const files = globSyncNormalize(`${source}/**/*`, {
    nodir: true,
  })

  const sourceFiles = files.map(file => {
    return File.instantiateByType({
      path: file,
      relativePath: file.replace(source, ''),
    })
  })

  sourceFiles.forEach(sourceFile => {
    delete require.cache[sourceFile.path]
  })

  const sourceFilesThatCouldBeBuilt = dependentsThatAreNotDependencies(
    sourceFiles,
  )
  let sourceFilesToBuild

  if (file) {
    file = File.instantiateByType({
      path: file,
      relativePath: file.replace(source, ''),
    })

    sourceFilesToBuild = dependentsOfDependency(sourceFiles, file)
  } else {
    sourceFilesToBuild = sourceFilesThatCouldBeBuilt

    emptyDirSync(target)
  }

  const data = loadData(source)
  const componentSourceFiles = sourceFilesThatCouldBeBuilt.filter(
    sourceFile => sourceFile.isComponent,
  )

  const pages = await Promise.all(
    componentSourceFiles.map(async sourceFile => {
      const component = await importComponent(sourceFile.path)
      const outputPath = sourceFile.outputPath

      return {
        component: component.default,
        meta: component.meta || {},
        path:
          outputPath === `${pathSeparator}index.html`
            ? '/'
            : outputPath.replace(/\.html$/, '').replace(/\\/g, '/'),
      }
    }),
  )

  for (const sourceFile of sourceFilesToBuild) {
    let output

    try {
      const built = await sourceFile.build({
        data: data,
        environment: environment,
        pages: pages,
      })

      output = built.output

      logger.builder.building(sourceFile.outputPath)
    } catch (error) {
      logger.builder.building(
        `Error building to "${sourceFile.outputPath}: ${error.message}`,
      )

      if (process.env.DEBUG) {
        console.error(error)
        console.log('')
        continue
      }
    }

    const fullOutputPath = pathJoin(target, sourceFile.outputPath)

    outputFileSync(fullOutputPath, output)
  }

  return sourceFilesToBuild.map(sourceFile => sourceFile.outputPath)
}
