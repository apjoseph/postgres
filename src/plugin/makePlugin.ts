import {
  PostgresFieldSelector,
  PostgresFieldSelectorObject,
  PostgresPlugin, PostgresRelationSelection,
  PostgresRelationSelections,
  UnwrapSelections
} from './types.js'

interface PostgresFieldHelper {
    addField: <T>(
        select: ((alias: string) => string) | string,
        options?: { cast?:string, required?: boolean, pgVersion?: string, transform?: <U>(value: U) => T }
    ) => PostgresFieldSelector<T>
    addIntCastField:(
        select:((alias: string) => string) | string,
        options?: { required?: boolean, pgVersion?: string, transform?: <U>(value: U) => number }
    ) => PostgresFieldSelector<number>


}

export interface PostgresPluginHelper {
    readonly name: string
    readonly version: string
    table: <T extends PostgresFieldSelectorObject>(
        name: string,
        schema: string,
        fieldSelectors: (helper: PostgresFieldHelper) => T)
        => PostgresRelationSelection<T>
    configure: <T extends PostgresRelationSelections, U>(
        tables: T,
        metadata: (config:unknown, state: UnwrapSelections<T>) => U
    ) => PostgresPlugin<T, U>
}

const addField:PostgresFieldHelper['addField'] = <T>(
  select: ((alias: string) => string) | string,
  options?: {cast?: string, required?: boolean, pgVersion?: string, transform?: <V>(value: V) => T }
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

const addIntCastField:PostgresFieldHelper['addIntCastField'] = <T>(
  select: ((alias: string) => string) | string,
  options?: { required?: boolean, pgVersion?: string, transform?: <V>(value: V) => T }
): PostgresFieldSelector<T> => {
  const { required, pgVersion, transform } = { required: true, ...options }
  return {
    required,
    pgVersion,
    select,
    transform,
    cast: 'integer'
  }
}

export function makePlugin<T extends PostgresRelationSelections, U>(
  name: string,
  version: string,
  configure: (config: PostgresPluginHelper) => PostgresPlugin<T, U>): PostgresPlugin<T, U> {
  return configure({
    name,
    version,
    table(name: string, namespace: string, fieldSelectors) {
      return {
        relation: { name, namespace },
        fields: fieldSelectors({
          addField,
          addIntCastField
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
