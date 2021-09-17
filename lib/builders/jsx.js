import React from "react"
import ReactDOMServer from "react-dom/server"
import { addHook as overrideRequire } from "pirates"
import { transformSync as babelTransform } from "@babel/core"
import { importComponent } from "../utilities"

export const transform = (code) => {
  code = `import React from ${JSON.stringify(require.resolve("react"))}\n${code}`

  const result = babelTransform(code, {
    // There appears to be a bug (?) in babel from 6.2 onwards where
    // when developing with `npm link` these modules are resolved
    // relative to the wrong directory.
    //
    // https://github.com/webpack/webpack/issues/1866
    // https://github.com/babel/babel-loader/issues/166
    // plugins: require.resolve("babel-plugin-react-require"),
    presets: [
      require.resolve("@babel/preset-react"),
      [
        require.resolve("@babel/preset-env"),
        {
          targets: {
            node: "current",
          },
        },
      ],
    ],
  })

  return result.code
}

overrideRequire(transform, { exts: [".jsx"] })

export default async (modulePath, props) => {
  const component = await importComponent(modulePath)
  const element = React.createElement(component.default, props)

  const html = ReactDOMServer.renderToStaticMarkup(element)

  return {
    meta: component.meta || {},
    output: html,
  }
}
