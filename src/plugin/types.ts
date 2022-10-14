import {PostgresPluginHelper} from "./makePlugin.js";

export interface PostgresFieldSelector<T> {
  pgVersion?:string | undefined
  select: ((alias:string) => string) | string
  transform?:(<U>(value:U) => T) | undefined
  required?:boolean | undefined
}

export type PostgresFieldSelectorObject = {[p:string]: PostgresFieldSelector<any>}



export interface RelationLike {
  name:string
  namespace?:string | undefined
}



export interface PostgresRelationSelection<T extends PostgresFieldSelectorObject>{
  fields:T
  relation: RelationLike
}
export type PostgresRelationSelections = {[p:string]: PostgresRelationSelection<any>}



type UnwrapObject<T> = {[p in keyof T] : UnwrapField<T[p]> }
type UnwrapField<T> = T extends PostgresFieldSelector<infer U>
    ? U extends object ? UnwrapObject<U> : U
    : T extends object ? UnwrapObject<T> : T

export type UnwrapSelections<T extends PostgresRelationSelections> = {[p in keyof T] : UnwrapObject<T[p]["fields"]>[]}
// type UnwrapField<T> = T extends PostgresRelationSelection<infer U> ? U : never
// type UnwrapObject<T> = {[p in keyof T] : Array<UnwrapField<T[p]>> }

export interface PostgresPlugin<T extends PostgresRelationSelections,U> {
  name:string
  version:string
  selections:T
  selectMetadata:(config:PostgresPluginHelper, state:UnwrapSelections<T>)=>U
}




