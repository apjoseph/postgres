import { escapeIdentifier } from '../types.js'
import { PostgresFieldSelector, PostgresPlugin, PostgresRelationSelection, RelationLike } from './makePlugin.js'

type GenerifiedPlugin = PostgresPlugin<
    Record<string,
        PostgresRelationSelection<Record<string, PostgresFieldSelector<unknown>>>>, unknown>
export const registerPlugins = function(plugins: GenerifiedPlugin[], options: unknown) {

  const tblPrefix = 'porsager_postgres_'

  interface PluginMetadata {
    name:string
    version:string,
    selectMetadata: (config:unknown, data:Record<string, Record<string, unknown>[]>)=>unknown
    // eslint-disable-next-line no-use-before-define
    selections: PluginSelectionMetadata[]
  }

  interface FieldSelectionMetadata {
    name: string
    rowIdx: number
    fieldExpression: string
    transform: ((value:unknown) => unknown) | undefined
  }

  interface PluginSelectionMetadata {
    // eslint-disable-next-line no-use-before-define
    plugin:PluginMetadata
    name:string
    // eslint-disable-next-line no-use-before-define
    relation:RelationMetadata
    fields: FieldSelectionMetadata[]
  }

  interface RelationMetadata extends RelationLike {
    alias:string
    fqn:string
    fieldExpressions:string[]
    selections: PluginSelectionMetadata[]
  }






  const relationsByFqn: Record<string, RelationMetadata> = {}

  const pluginMetadatas = plugins.map(
      ({
        name: pluginName,
        version: pluginVersion,
        selections: relationSelections,
        selectMetadata
      }) => {

        const pluginSelectionConfig:PluginMetadata = {
          name: pluginName,
          version: pluginVersion,
          selectMetadata,
          selections: []
        }

        Object.entries(relationSelections)
            .forEach(([selectionName, { relation: { namespace: relNamespace, name: relName }, fields }]) => {
              const fqn = escapeIdentifier(relNamespace) as string + '.' + escapeIdentifier(relName) as string

              let relation = relationsByFqn[fqn]

              if (!relation) {
                relation = {
                  name: relName,
                  fqn: fqn,
                  namespace: relNamespace,
                  alias: escapeIdentifier(tblPrefix + relName) as string,
                  fieldExpressions:[],
                  selections:[]
                }
                relationsByFqn[fqn] = relation
              }
              const { alias, fieldExpressions: uniqueExpressions, selections } = relation
              const selectedFields:FieldSelectionMetadata[] = Object.entries(fields)
                  .map(([fieldName, { select, transform, cast }]) => {
                    let fieldExpression = typeof select === 'string'
                      ? alias + '.' + escapeIdentifier(select)
                      : select(alias)
                    if (cast) fieldExpression += '::' + cast

                    let rowIdx = uniqueExpressions.indexOf(fieldExpression)

                    if (rowIdx < 0) rowIdx = uniqueExpressions.push(fieldExpression) - 1

                    return {
                      name: fieldName,
                      rowIdx,
                      fieldExpression,
                      transform
                    }
                  })

              const selection:PluginSelectionMetadata = {
                name: selectionName,
                relation: relation,
                plugin: pluginSelectionConfig,
                fields: selectedFields
              }

              pluginSelectionConfig.selections.push(selection)
              selections.push(selection)

            })

        return pluginSelectionConfig


      })
  const cte: string[] = []
  const select: string[] = []
  const tables = Object.values(relationsByFqn).map(table => {
    const { alias, fieldExpressions, fqn } = table
    // eslint-disable-next-line max-len
    cte.push(`${alias} as ( SELECT jsonb_agg(jsonb_build_array(${fieldExpressions.join(',')})) data FROM ${fqn} as ${alias})`)
    select.push(`(SELECT data FROM ${alias}) as ${alias}`)
    return table
  })
  const query = 'WITH ' + cte.join(',') + ' SELECT ' + select.join(',')

  const selectPluginMetadata = (metaBuffs:Buffer[]) => {

    const state:Record<string, {
      selections:Record<string, Record<string, unknown>[]>,
      selectMetadata:(config:unknown, data:Record<string, Record<string, unknown>[]>)=>unknown
    }> = {}

    pluginMetadatas.forEach(plugin => {
      const selections:Record<string, Record<string, unknown>[]> = {}
      plugin.selections.forEach(selection => {
        selections[selection.name] = []
      })
      state[plugin.name] = { selections, selectMetadata: plugin.selectMetadata }
    })

    for (let i = 0; i < metaBuffs.length; i++) {

      const table = tables[i];
      (JSON.parse(metaBuffs[i].toString()) as Record<string, unknown>[]).forEach(row => {
        table.selections.forEach(({ name: selectionName, fields, plugin: { name: pluginName } }) => {
          const obj:Record<string, unknown> = {}
          fields.forEach(({ name, transform, rowIdx }) => {
            obj[name] = transform ? transform(row[rowIdx]) : row[rowIdx]
          })
          state[pluginName].selections[selectionName].push(obj)

        })
      })
    }

    return Object.fromEntries(
        Object.entries(state)
            .map(([pluginName, { selections, selectMetadata }]) => [pluginName, selectMetadata(undefined, selections)])
    )
  }

  return {
    selectPluginMetadata,
    query,
    needsTypes: true
  }

}
