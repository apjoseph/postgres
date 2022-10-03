const typesPg = (options) => {

  const query =
`
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

  return {
    plugin: 'core',
    configure: (config) => config,
    fragments: {
      types_pg: {
        keyField: 'data',
        fragment: query,
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

export const metadataSelectors = {
  typesPg
}
