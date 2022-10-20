import { Errors } from '../errors.js'
import { Parameter } from '../types.js'

const escapeBackslash = /\\/g
const escapeQuote = /"/g

function arrayEscape(x:string) {
  return x
    .replace(escapeBackslash, '\\\\')
    .replace(escapeQuote, '\\"')
}

// interface Parameter<T> {
//   value:T
//   type:number
// }

type ParameterizedArray<T> = Array<T | Parameter> & Parameter
type SerializeArray<T> = Array<T | SerializeArray<T> | ParameterizedArray<T>>
interface SerializeOptions<T> {
  transform: {
    undefined:T | null
  }
}
type SerializeFn<T> = (value:T, context:unknown) => string
export const arraySerializer = function arraySerializer<T>(
  xs:SerializeArray<T | null | undefined>,
  serializer:SerializeFn<T | null> | undefined,
  typdelim:string, options:SerializeOptions<T>,
  context:unknown) : string {
  if (Array.isArray(xs) === false)
    return xs as unknown as string

  if (!xs.length)
    return '{}'

  const first = xs[0]

  if (Array.isArray(first) && !(first as ParameterizedArray<T>).type) {
    return '{' + xs.map(x => arraySerializer(x as SerializeArray<T>, serializer, typdelim, options, context))
        .join(typdelim) + '}'

  }

  return '{' + xs.map(x => {
    if (x === undefined) {
      x = options.transform.undefined
      if (x === undefined)
        throw Errors.generic('UNDEFINED_VALUE', 'Undefined values are not allowed')
    }

    return x === null
      ? 'null'
      : '"' + arrayEscape(serializer ? serializer(x instanceof Parameter ? x.value : x, context) : '' + x) + '"'
  }).join(typdelim) + '}'
}
