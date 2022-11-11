import { PgAttribute, PgType } from './corePlugin.js'

/**
 * Rules
 * 1. Accumulators
 */

export interface TypeParserAccumulator<A> {
  init:()=>A
  acc:<E=unknown>(elem:E, acc:A, attName?:string|undefined)=>void
  finalize:<T>(acc:A)=>T,
  inherit:boolean
}
// consider using generators
interface ArrayTypeVisitor<E, A=Array<E>> {
  accumulator?:TypeParserAccumulator<A>
}

export interface ArrayTypeParser<E, A = Array<E>> {
  transformElem?:(parsed:E, acc:A)=>E
}

export interface CompositeTypeParser<A = Record<string, unknown>> {
  TransformAtt?:(parsed:unknown, acc:A, attName:string )=>unknown
}

export interface InheritedParser {
  transformInhAtt:<V>(value:V, attName:string, valueWasNull:boolean)=>V
}

export interface RangeTypeParser<E> {
  beforeParseBound?:(bound:string|null, inclusive:boolean, lower:boolean)=>{bound:string|null, inclusive:boolean}
  parseBound?:(bound:string|null, inclusive:boolean, lower:boolean)=>{bound:E, inclusive:boolean}
  afterParseBound?:(bound:E|null, inclusive:boolean, lower:boolean)=>{bound:E, inclusive:boolean}
}

export interface DomainTypeParser<T> {
  beforeParseBase?:(value:string)=>string
  parseBase?:(value:string)=>T
  afterParseBase?:(value:T)=>T
}

type onArrayType = <T>(type:PgType) => ArrayTypeParser<T>


interface ParserContext {
  inArray:boolean


}


interface ParserState {
    i: number
    char:string | null
    str:string
    quoted: boolean
    last: number
    p?:string | undefined
}

const arrayParserState:ParserState = {
  i: 0,
  char: null,
  str: '',
  quoted: false,
  last: 0
}

type ParseFn<T> = (value:string) => T

export const arrayParser = function arrayParser<T>(x:string, parser:ParseFn<T>, typdelim:string) {
  arrayParserState.i = arrayParserState.last = 0
  return arrayParserLoop<T>(arrayParserState, x, parser, typdelim)
}

type ParsedArray<T> = Array<T | ParsedArray<T>>

function arrayParserLoop<T>(s:ParserState, x:string, parser:ParseFn<T>, typdelim:string) {
  const xs:ParsedArray<T | string | null> = []
  const nullAwareParser = (v:string) => (v.toLowerCase() === 'null') ? null : parser ? parser(v) : v
  for (; s.i < x.length; s.i++) {
    s.char = x[s.i]
    if (s.quoted) {
      if (s.char === '\\') {
        s.str += x[++s.i]
      } else if (s.char === '"') {
        xs.push(parser ? parser(s.str) : s.str)
        s.str = ''
        s.quoted = x[s.i + 1] === '"'
        s.last = s.i + 2
      } else {
        s.str += s.char
      }
    } else if (s.char === '"') {
      s.quoted = true
    } else if (s.char === '{') {
      s.last = ++s.i
      xs.push(arrayParserLoop<T>(s, x, parser, typdelim))
    } else if (s.char === '}') {
      s.last < s.i && xs.push(nullAwareParser(x.slice(s.last, s.i)))
      s.quoted = false
      s.last = s.i + 1
      break
    } else if (s.char === typdelim && s.p !== '}' && s.p !== '"') {
      xs.push(nullAwareParser(x.slice(s.last, s.i)))
      s.last = s.i + 1
    }
    s.p = s.char
  }
  s.last < s.i && xs.push(nullAwareParser(x.slice(s.last, s.i + 1)))
  return xs
}
