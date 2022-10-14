import {makePlugin} from "./makePlugin.js";

const corePlugin = makePlugin('core', '1.0.0', ({table, configure}) => {
    const types = table('pg_type', 'pg_catalog', (({addField}) => {
        return {
            oid: addField<number>(`oid`),
            name: addField<string>(`typname`),
            category: addField<string>(`typcategory`),
            arrayTypeOid: addField<number>(`typarray`),
            elementTypeOid: addField<number>(`typelem`),
            delimiter: addField<string>(`typdelim`)
        }
    }))

    return configure({types}, (config, {types}) => {
        // const lol = types.forEach(x => {
        //   const lol = x.oid
        //   const lol2 = x.category
        // })

        return {
            types
        }
    })
})

export default corePlugin
