import { Errors } from './errors.js'
import { escapeIdentifier } from './types.js'
// see: https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
const semVerRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
const parseSemVer = (ver) => {

  if (ver) {
    semVerRegex.match()
  }

  const match = semVerRegex.exec(ver)

  if (!match) {
    //TODO Plugin error
    Errors.generic('INVALID_SEMVER','Version "' + ver + '" is not a valid sematic version' )
  }

  let [,major,minor,patch,preRelease,buildMetadata] = match

  major = Number.parseInt(major,10)
  minor = Number.parseInt(minor,10)
  patch = Number.parseInt(patch,10)

  preRelease = preRelease ? preRelease.split('.').map(x => {
    const n = Number.parseInt(x,10)
    return Number.isFinite(n) ? n : x
  }) : []

  return new SemVer(major,minor,patch,preRelease,buildMetadata)

}

//const pgVerRegex = /^(0|[1-9]\d*)(?:([a-zA-Z]+)([1-9]+)|\.(0|[1-9]\d*)(?:\.(0|[1-9]\d*)(?:-([a-zA-Z]+)([1-9]\d*))?)?)(?:\s+.*)?$/
const postTenPgVerRegex = /^([1-9]\d*)(?:([a-zA-Z]+)([1-9]+)|\.(0|[1-9]\d*))(?:\s+.*)?$/
const preTenPgVerRegex = /^([6-9])\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([a-zA-Z]+)([1-9]\d*))?(?:\s+.*)?$/
const parseServerVersion = (ver) => {
  let major,minor,patch,preReleaseType,preReleaseNum
  let match = postTenPgVerRegex.exec(ver)
  if (match) {
    major = match[1]
    preReleaseType = match[2]
    preReleaseNum = match[3]
    minor = match[4]
  } else {
    match = preTenPgVerRegex.exec(ver)
    if (!match) return;
    major = match[1]
    minor = match[2]
    patch = match[3]
    preReleaseType = match[4]
    preReleaseNum = match[5]
  }

  major = Number.parseInt(major,10)
  minor = minor && Number.parseInt(minor,10) || 0
  patch = patch && Number.parseInt(patch,10) || 0
  preReleaseNum = (preReleaseNum !== undefined) ? Number.parseInt(preReleaseNum,10) : undefined

  return {major,minor,patch,preReleaseType,preReleaseNum}

}

class SemVer {

  constructor(major,minor,patch,preRelease,buildMetadata) {
    this.major = major
    this.minor = minor
    this.patch = patch
    this.preRelease = preRelease
    this.buildMetadata = buildMetadata
  }
  cmp(x) {
    const c = [[this.major,x.major],[this.minor,x.minor],[this.patch,x.patch],[this.preRelease,x.preRelease]]
    let a,b
    for (let i = 0; i < c.length; i++) {
      if(length > 3) {
        a = c[i][0]
        b = c[i][1]
        if (a !== undefined && b !== undefined) {

        }
      }
    }
    return 0

  }
}





class PluginRef {
  constructor(name) {

  }
}

class HookDependency {

  constructor(config) {
    this.cfg = config
  }

  config() {
    return this.cfg
  }

  pluginExVer(version) {
    this.pgnExVer = version
    this.pgnMinVer = undefined
    this. pgnMaxVer = undefined
    return this
  }

  pluginMinVer(version) {
    this.pgnExVer = undefined
  }

  pluginMaxVer(version) {
    return this
  }
}

class PluginConfig {

}

class HookConfig {
  constructor(event,pluginName,options,plugins) {
    this.plugins = plugins
    this.event = event
  }

  onTable(table) {
  }

  onSerializer(typeRef,pluginRef) {
    return this
  }

  onFeatureEnabled(featureName,pluginRef) {
  }

  onParser(typeRef,pluginRef) {
    return this
  }

  onMetaSlice(sliceName,pluginRef) {
    return this
  }

  withPlugin(pluginRef) {
    return new WithPlugin(this,pluginRef)
  }


}

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


const corePlugin = (options) => {

  return {
    plugin: 'core',
    version: '1.0.0',
    description: 'Core Driver Metadata',
    conflicts: {
      warn: {},
      error: {}
    },
    hooks: {
      beforeConnect:{},
      afterConnect: {},
      beforeQueryInit: {},
      afterQueryInit: {},
      beforeQueryBuild: {},
      afterQueryBuild: {},
      beforeQueryExecute: {},
      afterQueryExecute: {},
      beforeBegin: {},
      afterBegin: {},
      beforeCommit: {},
      afterCommit: {},
      beforeSavePoint: {},
      afterSavePoint: {},
      beforeDestroy: {},
      afterDestroy: {},
      beforeInlineParameter: {},
      afterInlineParameter: {},
      beforeBindParameter: {},
      afterBindParameter: {},
      beforeRegisterSerializer: {},
      afterRegisterSerializer: {},
    },
    buildHooks: {
    },

    fragments: {
      types: {
        keyField: 'data',
        sql: typesPgFragment,
        configure: (config) => config,
        description: 'Postgres types from catalog.',
        dependsOn: [],
        tables: [
          {namespace: 'pg_catalog',name: 'pg_types'},
          {namespace: 'pg_catalog',name: 'pg_namespace'},
          {namespace: 'pg_catalog',name: 'pg_description'}
        ],
      }
    }
  }
}

export const plugins = {
  corePlugin
}
export const compileMetaSelectors = function(metadataSelectors, options) {

  const allTables = {}
  const allFragments = []

  Object.entries(metadataSelectors).forEach(([, selector]) => {
    const {
      plugin,
      fragments
    } = selector(options)

    Object.entries(fragments).forEach(([fName, { keyField, sql, description, dependsOn, tables, configure }]) => {
      const tbls = tables.map(({ namespace, name }) => {
        const fqn = escapeIdentifier(namespace) + '.' + escapeIdentifier(name)
        const tbl = {
          fqn,
          namespace,
          name
        }
        allTables[fqn] = tbl
        return tbl
      })

      allFragments.push({
        plugin,
        name: fName,
        fqn: plugin + '/metadata-subquery/' + fName,
        queryAlias: escapeIdentifier(plugin + '__' + fName + '__' + 'meta'),
        keyField,
        selectField: escapeIdentifier(fName),
        sql,
        dependsOn,
        description,
        configure,
        tables: tbls
      })
    })

  })

  allFragments.sort((a, b) => {
    if (b.dependsOn.contains(a.fqn)) {
      return -1
    }
    if (a.dependsOn.contains(b.fqn)) {
      return 1
    } else {
      return 0
    }
  })

  const query = 'WITH RECURSIVE '
    + allFragments.map(f => f.queryAlias + ' as ( ' + f.sql + ')').join(',')
    + ' SELECT ' + allFragments.map(f => '( SELECT ' + f.keyField + ' as ' + f.selectField + ' FROM ' + f.queryAlias + ')').join(',')


  return {
    tables: allTables,
    fragments: allFragments,
    query,
    needsTypes: true
  }


}
