import {escapeIdentifier} from "../types.js";
import {PostgresFieldSelector, PostgresPlugin, PostgresRelationSelection, RelationLike} from "./types.js";

type GenerifiedPlugin = PostgresPlugin<Record<string, PostgresRelationSelection<Record<string, PostgresFieldSelector<any>>>>, unknown>
export const registerPlugins = function (plugins: GenerifiedPlugin[], options: unknown) {

    const tblPrefix = 'porsager_postgres_'
    const relationsByFqn: Record<string, RelationLike & { alias: string, selections: string[] }> = {}
    const pluginStates: Record<string, Pick<GenerifiedPlugin, "name" | 'version' | 'selectMetadata'> & { selections: { name: string, transformers: { transform: any, name: string, rowIdx: number }[] }[] }> = {}

    plugins.forEach(({name: pluginName, version: pluginVersion, selections: relationSelections, selectMetadata}) => {
        const selections = Object.entries(relationSelections)
            .map(([objName, {relation: {namespace: relNamespace, name: relName}, fields}]) => {
                const fqn = escapeIdentifier(relNamespace) as string + '.' + escapeIdentifier(relName) as string

                let relation = relationsByFqn[fqn]

                if (!relation) {
                    relation = {
                        name: relName,
                        namespace: relNamespace,
                        alias: escapeIdentifier(tblPrefix + relName) as string,
                        selections: [],
                    }
                    relationsByFqn[fqn] = relation
                }
                const {alias, selections} = relation
                let rowIdx = selections.length - 1
                const transformers = Object.entries(fields).map(([fieldName, {select, transform}]) => {
                    rowIdx++
                    selections.push(typeof select === 'string' ? alias + '.' + escapeIdentifier(select) : select(alias))
                    return {
                        transform,
                        name: fieldName,
                        rowIdx
                    }
                })

                return {
                    name: objName,
                    transformers
                }

            })

        pluginStates[pluginName] = {
            name: pluginName,
            version: pluginVersion,
            selectMetadata: selectMetadata,
            selections
        }

    })
    const cte: string[] = []
    const select: string[] = []
    const tables: { name: string, namespace: string | undefined, alias: string }[] = []
    Object.entries(relationsByFqn).forEach(([fqn, {name, namespace, selections, alias}]) => {
        cte.push(`${alias} as ( SELECT jsonb_agg(jsonb_build_array(${selections.join(',')})) data FROM ${fqn} as ${alias})`)
        select.push(`(SELECT data FROM ${alias}) as ${alias}`)
        tables.push({name, namespace, alias})
    })

    return {
        tables,
        pluginStates,
        query: 'WITH ' + cte.join(',') + ' SELECT ' + select.join(','),
        needsTypes: true
    }

}
