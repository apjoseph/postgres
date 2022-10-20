
export interface PostgresFieldSelector<T> {
  pgVersion?:string | undefined
  select: ((alias:string) => string) | string
  transform?:(<U>(value:U) => T) | undefined
  required?:boolean | undefined,
  cast?:string | undefined
}

export type PostgresFieldSelectorObject = {[p:string]: PostgresFieldSelector<unknown>}

export interface RelationLike {
  name:string
  namespace?:string | undefined
}

export interface PostgresRelationSelection<T extends PostgresFieldSelectorObject>{
  fields:T
  relation: RelationLike
}
export type PostgresRelationSelections = {[p:string]: PostgresRelationSelection<PostgresFieldSelectorObject>}


type UnwrapField<T> = T extends PostgresFieldSelector<infer U> ? U : never
type UnwrapObject<T> = {[p in keyof T] : UnwrapField<T[p]> }
export type UnwrapSelections<T extends PostgresRelationSelections> = {[p in keyof T] : UnwrapObject<T[p]['fields']>[]}

export interface PostgresPlugin<T extends PostgresRelationSelections, U> {
  name:string
  version:string
  selections:T
  selectMetadata:(config:unknown, state:UnwrapSelections<T>)=>U
}




