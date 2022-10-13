import { Errors } from './errors.js'
import { escapeIdentifier, escapeStringLiteral } from './types.js'
// see: https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
const semVerRegex = /^([xX*]|0|[1-9]\d*)\.([xX*]|0|[1-9]\d*)\.([xX*]|0|[1-9]\d*)(?:-((?:[*]|0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:[*]|0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
const parseSemVer = (ver) => {

  const match = semVerRegex.exec(ver)

  if (!match) {
    throw Errors.generic('INVALID_SEMVER','Version "' + ver + '" is not a valid sematic version' )
  }

  let [,,,,preRelease,buildMetadata] = match
  let n
  const [major,minor,patch] = match.slice(1,4).map(x => {
    n = Number.parseInt(x,10)
    return Number.isFinite(n) ? n : 'x'
  })

  preRelease = preRelease
    ? preRelease.split('.').map(x => {
      n = Number.parseInt(x,10)
      return Number.isFinite(n) ? n : x
    })
    : []

  return {major,minor,patch,preRelease,buildMetadata}
}

const semverToString = (semver) =>  {
  const {major,minor,patch,preRelease,buildMetadata} = semver
  let out = major + '.' + minor + '.' + patch
  if (preRelease.length > 0) out += "-" + preRelease.join('.');
  if (buildMetadata !== null && buildMetadata !== undefined) out += '+' + buildMetadata;
  return out
}

//const pgVerRegex = /^(0|[1-9]\d*)(?:([a-zA-Z]+)([1-9]+)|\.(0|[1-9]\d*)(?:\.(0|[1-9]\d*)(?:-([a-zA-Z]+)([1-9]\d*))?)?)(?:\s+.*)?$/
const postTenPgVerRegex = /^([xX*]|[1-9]\d*)(?:([a-zA-Z]+)([*]|[1-9]+)|\.([xX*]|0|[1-9]\d*))(?:\s+.*)?$/
const preTenPgVerRegex = /^([xX*]|[6-9])\.([xX*]|0|[1-9]\d*)\.([xX*]|0|[1-9]\d*)(?:-([a-zA-Z]+)([*]|[1-9]\d*))?(?:\s+.*)?$/
const pgVersionToSemver = (ver) => {
  let preReleaseType,nums
  let match = postTenPgVerRegex.exec(ver)
  if (match) {
    nums = [match[1],match[4],null,match[3]]
    preReleaseType = match[2]
  } else {
    match = preTenPgVerRegex.exec(ver)
    if (!match) return;
    preReleaseType = match[4]
    nums = [match[1],match[2],match[3],match[5]]
  }

  let n
  const [major,minor,patch,preRelease] = nums.map((x,i) => {
    if (!x) return 0;
    n = Number.parseInt(x,10)
    return Number.isFinite(n) ? n : (i < 3) ? 'x' : '*'
  })
  return {major,minor,patch,preRelease: preReleaseType ? [preReleaseType,preRelease] : []}
}

const semverToPgString = (semver) => {
  const {major,minor,patch,preRelease} = semver

  if (major > 9) {
    if (preRelease.length > 0) {
      return major + preRelease.join('')
    }
    return major + '.' + minor
  }

  return (preRelease.length > 0)
    ? major + '.' + minor + '.' + patch + '-' + preRelease.join('')
    : major + '.' + minor + '.' + patch

}

const semverProps = ['major','minor','patch','preRelease']
const compareSemver = (sv,cmp) => {
  let prop, a, b ,dab, apLen, bpLen, i, api, bpi
  for (let propIdx = 0; propIdx < semverProps.length; propIdx++) {
    prop = semverProps[propIdx]
    a = sv[prop]
    b = cmp[prop]

    if (prop === 'preRelease') {
      if (a === b) return 0;
      apLen = a?.length ?? 0
      bpLen = b?.length ?? 0

      if (apLen === 0) {
        if (bpLen > 0) {
          return 1
        }
        else {
          return 0;
        }
      } else if (bpLen === 0) {
        return -1
      }

      for (i = 0; i < apLen ; i++) {
        if (i === bpLen) return 1;
        api = a[i]
        bpi = b[i]
        if (api === bpi || api === '*' || bpi === '*') continue;
        if (typeof api === 'number') {
          if (typeof bpi === 'number') {
            dab = api - bpi
            if (dab !== 0) return dab;
          } else {
            return -1
          }
        }
        return api.localeCompare(bpi)
      }
      return apLen - bpLen
    }


    if (a === 'x' || b === 'x') continue;
    dab = a - b
    if (dab !== 0) return dab;

  }
  return 0

}





// class PluginRef {
//   constructor(name) {
//
//   }
// }
//
// class HookDependency {
//
//   constructor(config) {
//     this.cfg = config
//   }
//
//   config() {
//     return this.cfg
//   }
//
//   pluginExVer(version) {
//     this.pgnExVer = version
//     this.pgnMinVer = undefined
//     this. pgnMaxVer = undefined
//     return this
//   }
//
//   pluginMinVer(version) {
//     this.pgnExVer = undefined
//   }
//
//   pluginMaxVer(version) {
//     return this
//   }
// }
//
// class PluginConfig {
//
// }
//
// class HookConfig {
//   constructor(event,pluginName,options,plugins) {
//     this.plugins = plugins
//     this.event = event
//   }
//
//   onTable(table) {
//   }
//
//   onSerializer(typeRef,pluginRef) {
//     return this
//   }
//
//   onFeatureEnabled(featureName,pluginRef) {
//   }
//
//   onParser(typeRef,pluginRef) {
//     return this
//   }
//
//   onMetaSlice(sliceName,pluginRef) {
//     return this
//   }
//
//   withPlugin(pluginRef) {
//     return new WithPlugin(this,pluginRef)
//   }
//
//
// }

const typesPgFragment = `
  SELECT
    jsonb_object_agg(
      t.oid,
      jsonb_build_object(
        'oid', t.oid,
        'serialName', a.serial_name,
        'namespace', n.nspname,
        'prettyName', j.pretty_name,
        'fqn', a.fqn,
        'pfqn', a.pfqn,
        'sqlStdAlias', a.sql_std_alias,
        'secAlias',a.sec_alias,
        'cat', t.typcategory,
        'type', t.typtype,
        'elemTypeOid', t.typelem,
        'arrayTypeOid', t.typarray,
        'delim', t.typdelim,
        'baseTypeOid', t.typbasetype,
        'baseTypeMod', t.typtypmod,
        'baseTypeModParts', a.mod_parts,
        'name', t.typname,
        'desc', d.description,
        'raw', to_jsonb(t)
       )
    ) data
    FROM
      pg_type t
      JOIN pg_namespace n ON t.typnamespace = n.oid
      JOIN LATERAL (
        SELECT
          n.oid::regnamespace regnsp,
          n.nspname = 'pg_catalog' builtin,
        case
          when t.typcategory = 'A' then regexp_replace(t.typname,'(?<=^"?)_','','g') || '[]'
          else t.typname
         end pretty_name,
        regexp_replace(t.oid::regtype::text,'^.*\.','') base_name,
        format_type(t.typbasetype,t.typtypmod) ftype
      ) j ON TRUE
      JOIN LATERAL (
        SELECT
          case
            when builtin then
              case
                when typname = 'bpchar' then 'char'
                when typname = '_bpchar' then 'char[]'
                when typname = 'int4' then 'int'
                when typname = '_int4' then 'int[]'
                when typname = 'numeric' then 'decimal'
                when typname = '_numeric' then 'decimal[]'
              end
          end sec_alias,

          case
            when builtin then
              case
                when typname = 'int2' then 'smallserial'
                when typname = 'int4' then 'serial'
                when typname = 'int8' then 'bigserial'
              end
          end serial_name,

          j.regnsp || '.' || t.typname fqn,
          j.regnsp || '.' || j.pretty_name pfqn,
          case when j.builtin then nullif(j.base_name,j.pretty_name) end sql_std_alias,

          case
            when t.typtype = 'd' then regexp_split_to_array(
              (regexp_match(j.ftype,'(?<=\().*(?=\))'))[1]
            ,',')
          end mod_parts
        ) a ON TRUE
        LEFT JOIN pg_description d ON (t.oid = d.objoid)
`


// const corePlugin = (options) => {
//
//   return {
//     plugin: 'core',
//     version: '1.0.0',
//     description: 'Core Driver Metadata',
//     conflicts: {
//       warn: {},
//       error: {}
//     },
//     hooks: {
//       beforeConnect: {},
//       afterConnect: {},
//       beforeQueryInit: {},
//       afterQueryInit: {},
//       beforeQueryBuild: {},
//       afterQueryBuild: {},
//       beforeQueryExecute: {},
//       afterQueryExecute: {},
//       beforeBegin: {},
//       afterBegin: {},
//       beforeCommit: {},
//       afterCommit: {},
//       beforeSavePoint: {},
//       afterSavePoint: {},
//       beforeDestroy: {},
//       afterDestroy: {},
//       beforeInlineParameter: {},
//       afterInlineParameter: {},
//       beforeBindParameter: {},
//       afterBindParameter: {},
//       beforeRegisterSerializer: {},
//       afterRegisterSerializer: {},
//     },
//     buildHooks: {},
//
//     fragments: {
//       types: {
//         keyField: 'data',
//         sql: typesPgFragment,
//         configure: (config) => config,
//         description: 'Postgres types from catalog.',
//         dependsOn: [],
//         tables: [
//           { namespace: 'pg_catalog', name: 'pg_types' },
//           { namespace: 'pg_catalog', name: 'pg_namespace' },
//           { namespace: 'pg_catalog', name: 'pg_description' }
//         ],
//       }
//     }
//   }
// }



const wrapWithFragment = (name,sql) => {
  return `${escapeIdentifier(name)} as (${sql})`
}

// function table(name,schema,fieldSelectors) {
//   return {
//     name,
//     schema,
//     fieldSelectors
//   }
// }

const addField = (select,options) => {
  const {required,pgVersion,transform} = {required:true, ...options}
  return {
    required,
    pgVersion,
    select,
    transform
  }
}

export function makePlugin(name,version,configure) {
  return configure({
    name,
    version,
    table(name,namespace,fieldSelectors) {
      return {
        relation: {name, namespace},
        fields: fieldSelectors({
          addField
        })
      }
    },
    configure(selections,metadata) {
      return {
        name,
        version,
        selections,
        metadata
      }
    }
  })
}

export const corePlugin = makePlugin('core','1.0.0',({table,configure}) => {
  const types = table('pg_type','pg_catalog',(({addField}) => {
    return {
      oid: addField(`oid`),
      name: addField(`typname`),
      category: addField(`typcategory`),
      arrayTypeOid: addField(`typarray`),
      elementTypeOid: addField(`typelem`),
      delimiter: addField(`typdelim`)
    }
  }))

  return configure({types},(config,{types}) => {
    return {
      types
    }
  })
})

export const registerPlugins = function(plugins, options) {

  const tblPrefix = 'porsager_postgres_'
  const relationsByFqn = {}
  const pluginStates = {}

  plugins.forEach(({name:pluginName,version:pluginVersion,selections:relationSelections,metadata}) => {
    const selections = Object.entries(relationSelections)
      .map(([objName,{relation: {namespace: relNamespace, name: relName}, fields}]) => {
        const fqn = escapeIdentifier(relNamespace) + '.' + escapeIdentifier(relName)

        let relation = relationsByFqn[fqn]

        if (!relation) {
          relation = {
            name: relName,
            namespace: relNamespace,
            alias: escapeIdentifier(tblPrefix + relName),
            selections: [],
          }
          relationsByFqn[fqn] = relation
        }
        const {alias, selections} = relation
        let rowIdx = selections.length -1
        const transformers = Object.entries(fields).map(([fieldName,{select,transform}]) => {
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
      selectMetadata: metadata,
      selections
    }

  })
  const cte =[]
  const select = []
  const tables = []
  Object.entries(relationsByFqn).forEach(([fqn,{name,namespace,selections,transformations,alias}]) => {
    cte.push(`${alias} as ( SELECT jsonb_agg(jsonb_build_array(${selections.join(',')})) data FROM ${fqn} as ${alias})`)
    select.push(`(SELECT data FROM ${alias}) as ${alias}`)
    tables.push({name,namespace,transformations,alias})
  })

  return {
    tables,
    pluginStates,
    query: 'WITH ' + cte.join(',') + ' SELECT ' + select.join(','),
    needsTypes: true
  }


  // Object.entries(fragments).forEach(([fName, { keyField, sql, description, dependsOn, tables, configure }]) => {
  //   const tbls = tables.map(({ namespace, name }) => {
  //     const fqn = escapeIdentifier(namespace) + '.' + escapeIdentifier(name)
  //     const tbl = {
  //       fqn,
  //       namespace,
  //       name
  //     }
  //     allTables[fqn] = tbl
  //     return tbl
  //   })
  //
  //   allFragments.push({
  //     plugin,
  //     name: fName,
  //     fqn: plugin + '/metadata-subquery/' + fName,
  //     queryAlias: escapeIdentifier(plugin + '__' + fName + '__' + 'meta'),
  //     keyField,
  //     selectField: escapeIdentifier(fName),
  //     sql,
  //     dependsOn,
  //     description,
  //     configure,
  //     tables: tbls
  //   })
  // })
  //
  // allFragments.sort((a, b) => {
  //   if (b.dependsOn.contains(a.fqn)) {
  //     return -1
  //   }
  //   if (a.dependsOn.contains(b.fqn)) {
  //     return 1
  //   } else {
  //     return 0
  //   }
  // })
  //
  // const query = 'WITH RECURSIVE '
  //   + allFragments.map(f => f.queryAlias + ' as ( ' + f.sql + ')').join(',')
  //   + ' SELECT ' + allFragments.map(f => '( SELECT ' + f.keyField + ' as ' + f.selectField + ' FROM ' + f.queryAlias + ')').join(',')
  //
  //
  // return {
  //   tables: allTables,
  //   fragments: allFragments,
  //   query,
  //   needsTypes: true
  // }
}


// class PgType {
//
//   constructor(oid,matchTypeRef,delimiter) {
//     this.oid = oid
//     this.matchTypeRef = matchTypeRef
//   }
//
//   initialize() {
//
//   }
// }

// initialize()
//
// class PgArrayType extends PgType {
//   constructor(oid,matchTypeRef,delimiter,size,elemOid,elemSerializer,elemParser) {
//     super(oid,matchTypeRef)
//     this.size = size
//     this.elemOid = elemOid
//     this.elemSerializer = elemSerializer
//     this.elemParser = elemParser
//     this.elements = []
//     this.finalize()
//   }
//
//   initialize() {
//
//   }
// }
//
// class PgObjectType extends PgType {
//
// }
//
// class PgRangeType extends PgType {
//
// }

//
// class Parser {
//
//   onStartObject()
// }
//
// class Serializer {
//
// }
//
// const exposeHooks = {
//   onStartObject:{},
//   onEndObject:{},
//   onStartProperty:{},
//   onEndProperty:{},
//   onEnterObject:{},
//   oExitObject:{},
//   o
//   onStartArray:{},
//   onStartObject:{},
//   onArray:{}
// }


// class PostgresPluginBuilder {
//
//   constructor(name,version) {
//     this.name = name
//     this.version = parseSemVer(version)
//   }
//
//   configure(reducer,config) {
//
//     const {selector,types,hooks,exposeHooks,wrapHooks} = config
//
//     return {
//       name,
//       version,
//       selector,
//       hooks,
//       exposeHooks
//       types
//     }
//   }
// }




// TODO: add the below as tests
// const pgSemvers = [
//   ["10beta1",{major}]
// ]
//
// const semvers = [
//   [
//     ['2.6.7','2.6.23'],
//     ['2.0.0-RC1','2.0.0'],
//     ['1.5.3-alpha.1','1.5.3-alpha.beta'],
//     ['11.3.55-alpha.3','11.3.55-alpha.3.1'],
//     ['2.5.3','2.5.4-beta'],
//     ['2.x.x','3.0.0-alpha.1'],
//     ['1.2.3-*','1.2.3'],
//     ['7.6.5-alpha','7.6.5-alpha.*']
//   ],
//   [
//     ['2.x.x','2.9.0'],
//     ['1.*.5','1.3.5'],
//     ['5.x.X-alpha','5.*.0-alpha']
//   ]
// ]
// semvers.forEach((x,i) => {
//   x.map(([a,b]) => (i < 2) ? [parseSemVer(a),parseSemVer(b)] : [pgVersionToSemver(a),pgVersionToSemver(b)])
//     .forEach(([a,b]) => {
//
//       const res = compareSemver(a,b)
//       const res2 = compareSemver(b,a)
//
//       if (Math.abs(res) !== res2) {
//         console.log({r1:res,r2:res2})
//       }
//
//       if (i%2 === 0) {
//         if (res >= 0) {
//           console.log({res,a,b})
//           return
//         }
//         if (res2 <= 0) {
//           console.log({b,a,res2})
//         }
//       } else {
//         if (res !== 0) {
//           console.log({res,a,b})
//           return
//         }
//         if (res2 !== 0) {
//           console.log({b,a,res2})
//         }
//       }
//
//     })
// })
