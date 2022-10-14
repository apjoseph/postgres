import {
    PostgresFieldSelector,
    PostgresFieldSelectorObject,
    PostgresPlugin, PostgresRelationSelection,
    PostgresRelationSelections,
    UnwrapSelections
} from "./types.js";

interface PostgresFieldHelper {
    addField: <T>(
        select: ((alias: string) => string) | string,
        options?: { required?: boolean, pgVersion?: string, transform: <U>(value: U) => T }
    ) => PostgresFieldSelector<T>
}

export interface PostgresPluginHelper {
    readonly name: string
    readonly version: string
    table: <T extends PostgresFieldSelectorObject>(name: string, schema: string, fieldSelectors: (helper: PostgresFieldHelper) => T) => PostgresRelationSelection<T>
    configure: <T extends PostgresRelationSelections, U>(
        tables: T,
        metadata: (config: PostgresPluginHelper, state: UnwrapSelections<T>) => U
    ) => PostgresPlugin<T, U>
}

const addField = <T>(
    select: ((alias: string) => string) | string,
    options?: { required?: boolean, pgVersion?: string, transform: <V>(value: V) => T }
): PostgresFieldSelector<T> => {
    const {required, pgVersion, transform} = {required: true, ...options}
    return {
        required,
        pgVersion,
        select,
        transform
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
                relation: {name, namespace},
                fields: fieldSelectors({
                    addField
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
