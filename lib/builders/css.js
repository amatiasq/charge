import { readFileSync } from 'fs'
import postcss from 'postcss'

import atImport from 'postcss-import'
import presetEnv from 'postcss-preset-env'

export default async stylesheetPath => {
  const css = readFileSync(stylesheetPath).toString()

  const result = await postcss([
    atImport(),
    presetEnv({
      features: {
        'custom-media-queries': true,
      },
      stage: 2,
    }),
  ]).process(css, { from: stylesheetPath })

  return result.css
}
