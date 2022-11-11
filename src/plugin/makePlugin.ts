import { PgTypeRef } from '../types.js'
import { PgType } from './corePlugin.js'
import { ArrayTypeParser } from './parse.js'

export interface PostgresFieldSelector<T> {
  pgVersion?: string | undefined
  select: ((alias: string) => string) | string
  transform?: (<U>(value: U) => T) | undefined
  required?: boolean | undefined,
  cast?: string | undefined
}

export type PostgresFieldSelectorObject = { [p: string]: PostgresFieldSelector<unknown> }

export interface RelationLike {
  name: string
  namespace?: string | undefined
}

export interface PostgresRelationSelection<T extends PostgresFieldSelectorObject> {
  fields: T
  relation: RelationLike
}

export type PostgresRelationSelections = { [p: string]: PostgresRelationSelection<PostgresFieldSelectorObject> }
type UnwrapField<T> = T extends PostgresFieldSelector<infer U> ? U : never
type UnwrapObject<T> = { [p in keyof T]: UnwrapField<T[p]> }
export type UnwrapSelections<T extends PostgresRelationSelections> = { [p in keyof T]: UnwrapObject<T[p]['fields']>[] }



const addField = <T>(
  select: ((alias: string) => string) | string,
  options?: {cast?: string, required?: boolean, pgVersion?: string, transform?: <V, X=T>(value: V) => X }
): PostgresFieldSelector<T> => {
  const { required, pgVersion, transform, cast } = { required: true, ...options }
  return {
    required,
    pgVersion,
    select,
    transform,
    cast
  }
}
type Default<T, X> = T extends infer R ? R : X
const addTextField = <T=string>(
  select: ((alias: string) => string) | string,
  options?: { required?: boolean, pgVersion?: string, transform?: <V>(value: V) => Default<T, string> }
): PostgresFieldSelector<Default<T, string>> => {
  const { required, pgVersion, transform } = { required: true, ...options }
  return {
    required,
    pgVersion,
    select,
    transform,
    cast: 'text'
  }
}
const addIntField = <T=number>(
  select: ((alias: string) => string) | string,
  options?:{ required?: boolean, pgVersion?: string, transform?: <V>(value: V) => Default<T, number> }
): PostgresFieldSelector<Default<T, number>> => {
  const { required, pgVersion, transform } = { required: true, ...options }
  return {
    required,
    pgVersion,
    select,
    transform,
    cast: 'integer'
  }
}

interface PostgresFieldHelper {
    addField: typeof addField
    addTextField: typeof addTextField
    addIntField: typeof addIntField
}

type PgTypeFilterFn = (typ:PgType)=>boolean

interface PostgresPluginHookConfig {
  name?:string
  before?:string[],
  after?:string[]
  pgVersion?:string
}

interface ArrayTypeParserHookConfig extends PostgresPluginHookConfig {
  filter:PgTypeRef|number|PgTypeFilterFn
  parser:<T>(pgType:PgType) => ArrayTypeParser<T>
}


export interface PostgresPlugin<T extends PostgresRelationSelections, U> {
  name: string
  version: string
  selections: T
  selectMetadata: (config: unknown, state: UnwrapSelections<T>) => U
}


export interface PostgresPluginBuilder {
    readonly name: string
    readonly version: string
    relation: <T extends PostgresFieldSelectorObject>(
        name: string,
        schema: string,
        fieldSelectors: (helper: PostgresFieldHelper) => T)
        => PostgresRelationSelection<T>
    configure: <T extends PostgresRelationSelections, U>(
        relations: T,
        selector: (config:unknown, state: UnwrapSelections<T>) => U
    ) => PostgresPlugin<T, U>
}


export function makePlugin<T extends PostgresRelationSelections, U>(
  name: string,
  version: string,
  configure: (config: PostgresPluginBuilder) => PostgresPlugin<T, U>): PostgresPlugin<T, U> {
  return configure({
    name,
    version,
    relation(name: string, namespace: string, fieldSelectors) {
      return {
        relation: { name, namespace },
        fields: fieldSelectors({
          addField,
          addTextField,
          addIntField
        })
      }
    },
    configure(selections, selectMetadata) {
      return {
        name,
        version,
        selections,
        selectMetadata
      }
    }
  })
}
