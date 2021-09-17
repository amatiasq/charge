export default async (modulePath, props) => {
  const transform = await import(modulePath)
  const json = transform.default(props)

  return JSON.stringify(json, null, 2)
}
