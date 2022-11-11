import { makePlugin } from './makePlugin.js'

export interface PgNamespace {
  id:string
  oid:number
  name:string
  description:string
}

export interface PgDependency {
  depTypes:string[],
  // eslint-disable-next-line no-use-before-define
  obj:PgObjectNode
}

export interface PgClassRef {
  oid:number
  namespaceOid:number
  name:string
  namespace:PgNamespace
}

export interface PgObjectNode {
  id:string
  oid:number
  classRef:PgClassRef | undefined
  parents:Record<string, PgDependency>
  children:Record<string, PgDependency>
}

export interface PgExtension {
  id:string
  oid:number
  name:string
  namespaceOid:number
  namespace:PgNamespace
}

export interface PgClass {
  id:string
  oid:number
  typeOid:number
  // eslint-disable-next-line no-use-before-define
  type:PgType | undefined
  name:string
  namespaceOid:number
  namespace:PgNamespace
  kind:string
  description:string | undefined
  // eslint-disable-next-line no-use-before-define
  attributes:PgAttribute[]
  // eslint-disable-next-line no-use-before-define
}

export interface PgType {
  id:string
  oid:number
  name:string
  namespaceOid:number
  namespace:PgNamespace
  category:string
  type:string
  description: string | undefined
  extension: PgExtension | undefined
  isDefined:boolean
  relOid:number
  relation:PgClass | undefined
  notNull:boolean
  arrayTypeOid:number
  arrayType: PgType | undefined
  nDims:number
  elementTypeOid:number
  elementType:PgType | undefined
  delimiter:string
  baseTypeOid:number
  baseType:PgType | undefined
  baseTypeMod:number
}

export interface PgAttribute {
  id:string
  relOid:number
  relation:PgClass
  name: string
  typeOid: number,
  type: PgType,
  attNum:number
  nDims: number
  typeMod: number
  notNull:boolean
  hasDefinition: boolean
  hasMissing:boolean
  identity:string
  generated:string
  isLocal:boolean
  inheritCount:number
  isDropped:boolean
  description:string|undefined
}

const corePlugin = makePlugin('core', '1.0.0', ({ relation, configure }) => {

  const types = relation('pg_type', 'pg_catalog', ({ addField, addIntField }) => {
    return {
      oid: addIntField('oid'),
      name: addField<string>('typname'),
      namespaceOid: addIntField('typnamespace'),
      category: addField<string>('typcategory'),
      type: addField<string>('typtype'),
      isDefined: addField<boolean>('typisdefined'),
      relOid: addIntField('typrelid'),
      arrayTypeOid: addIntField('typarray'),
      elementTypeOid: addIntField('typelem'),
      baseTypeOid: addIntField('typbasetype'),
      delimiter: addField<string>('typdelim'),
      notNull: addField<boolean>('typnotnull'),
      baseTypeMod: addIntField('typtypmod'),
      nDims: addIntField('typndims')
    }
  })

  const namespaces = relation('pg_namespace', 'pg_catalog', ({ addField, addIntField }) => {
    return {
      oid: addIntField('oid'),
      name: addField<string>('nspname')
    }
  })

  const descriptions = relation('pg_description', 'pg_catalog', ({ addField, addIntField }) => {
    return {
      objOid: addIntField('objoid'),
      objSubId: addIntField('objsubid'),
      description: addField<string>('description')
    }
  })

  const extensions = relation('pg_extension', 'pg_catalog', ({ addField, addIntField }) => {
    return {
      oid: addIntField('oid'),
      name: addField<string>('extname'),
      namespaceOid: addIntField('extnamespace')
    }
  })

  const classes = relation('pg_class', 'pg_catalog', ({ addField, addIntField }) => {
    return {
      oid: addIntField('oid'),
      name: addField<string>('relname'),
      namespaceOid: addIntField('relnamespace'),
      kind: addField<string>('relkind'),
      typeOid: addIntField('reltype')
    }
  })

  const attributes = relation('pg_attribute', 'pg_catalog', ({ addField, addIntField }) => {
    return {
      relOid: addIntField<number>('attrelid'),
      name: addField<string>('attname'),
      typeOid: addIntField('atttypid'),
      attNum: addIntField('attnum'),
      nDims: addIntField('attndims'),
      typeMod: addIntField('atttypmod'),
      notNull: addField<boolean>('attnotnull'),
      hasDefinition: addField<boolean>('atthasdef'),
      hasMissing: addField<boolean>('atthasmissing'),
      identity: addField<string>('attidentity'),
      generated: addField<string>('attgenerated'),
      isLocal: addField<boolean>('attislocal'),
      inheritCount: addIntField('attinhcount'),
      isDropped: addField<boolean>('attisdropped')
    }
  })

  const dependencies = relation('pg_depend', 'pg_catalog', ({ addField, addIntField }) => {
    return {
      depOid: addIntField('objid'),
      depAttrId: addIntField('objsubid'),
      depClassOid: addIntField('classid'),
      refOid: addIntField('refobjid'),
      refAttrId: addIntField('refobjsubid'),
      refClassOid: addIntField('refclassid'),
      depType: addField<string>('deptype')
    }
  })

  const tables = {
    types,
    namespaces,
    extensions,
    dependencies,
    classes,
    attributes,
    descriptions
  }


  return configure(tables,
      (config, {
        types,
        namespaces,
        extensions,
        dependencies,
        classes,
        descriptions,
        attributes
      }) => {

        const descriptionsById = Object.fromEntries(descriptions
        .map(({ objOid, objSubId, description }) => {
          return [objSubId > 0 ? `${objOid}|${objSubId}` : objOid.toString(), description]
        }))

        const namespacesById:Record<string, PgNamespace> = Object.fromEntries(namespaces.map(n =>
          [n.oid, { id: n.oid.toString(), description:descriptionsById[n.oid], ...n }]))

        const classesById:Record<string, PgClass> = Object.fromEntries(classes.map(
        ({
          oid,
          typeOid,
          name,
          namespaceOid,
          kind
        }) => {

          const pgClass = {
            id: oid + '',
            oid,
            typeOid,
            type: undefined,
            name,
            namespaceOid,
            namespace: namespacesById[namespaceOid],
            kind,
            description: descriptionsById[oid],
            attributes: []
          }

          return [oid, pgClass]
        }
        ))

        const extensionsByOid:Record<string, PgExtension> = Object.fromEntries(extensions.map(
        ({
          oid,
          namespaceOid,
          name
        }) => {

          const pgExtension = {
            id: oid.toString(),
            oid,
            namespaceOid,
            namespace: namespacesById[oid],
            name
          }

          return [oid, pgExtension]
        }))

        const typesByOid:Record<string, PgType> = Object.fromEntries(types.map(
        ({
          oid,
          namespaceOid,
          name,
          category,
          type,
          isDefined,
          notNull,
          relOid,
          arrayTypeOid,
          nDims,
          elementTypeOid,
          delimiter,
          baseTypeOid,
          baseTypeMod
        }) => {

          const relation = classesById[relOid]

          const pgType = {
            id: oid + '',
            oid,
            name,
            namespaceOid,
            namespace: namespacesById[namespaceOid],
            category,
            type,
            description: descriptionsById[oid],
            extension: undefined,
            isDefined,
            notNull,
            nDims,
            relOid,
            relation,
            arrayTypeOid,
            arrayType: undefined,
            elementTypeOid,
            elementType: undefined,
            delimiter,
            baseTypeOid,
            baseType: undefined,
            baseTypeMod
          }

          if (relation) relation.type = pgType
          return [oid, pgType]
        }))

        attributes.forEach(
            ({
              relOid,
              name,
              typeOid,
              attNum,
              nDims,
              typeMod,
              notNull,
              hasDefinition,
              hasMissing,
              identity,
              generated,
              isLocal,
              inheritCount,
              isDropped
            }) => {

              const id = relOid + '|' + attNum
              const relation = classesById[relOid]
              const type = typesByOid[typeOid]
              const description = descriptionsById[id]

              const pgAttribute = {
                id,
                relOid,
                relation,
                name,
                typeOid,
                type,
                attNum,
                nDims,
                typeMod,
                notNull,
                hasDefinition,
                hasMissing,
                identity,
                generated,
                isLocal,
                inheritCount,
                isDropped,
                description
              }
              relation.attributes.push(pgAttribute)
            })

        const objectNodes:Record<string, PgObjectNode> = {}
        dependencies.forEach(({
          depOid,
          depAttrId,
          depClassOid,
          refOid,
          refAttrId,
          refClassOid,
          depType }) => {
          const depId = depAttrId > 0 ? `${depOid}|${depAttrId}` : depOid.toString()
          const refId = refAttrId > 0 ? `${refOid}|${refAttrId}` : refOid.toString()

          let dep = objectNodes[depId]
          if (!dep) {
            const depClass = classesById[depClassOid]
            const depClassRef = depClass ? {
              oid: depClassOid,
              namespaceOid: depClass.namespaceOid,
              name: depClass.name,
              namespace: depClass.namespace
            } : undefined

            dep = {
              id: depId,
              oid: depOid,
              classRef: depClassRef,
              parents:{},
              children:{}
            }
            objectNodes[depId] = dep
          }

          let ref = objectNodes[refId]
          if (!ref) {
            const refClass = classesById[refClassOid]
            const refClassRef = refClass ? {
              oid: depClassOid,
              namespaceOid: refClass.namespaceOid,
              name: refClass.name,
              namespace: refClass.namespace
            } : undefined
            ref = {
              id: refId,
              oid: refOid,
              classRef: refClassRef,
              parents:{},
              children:{}
            }
            objectNodes[refId] = ref
          }

          const childDeps = ref.children[depId]
          if (childDeps) {
            childDeps.depTypes.push(depType)
          } else {
            ref.children[depId] = {
              depTypes:[depType],
              obj:dep
            }
          }

          const parentDeps = ref.parents[refId]
          if (parentDeps) {
            parentDeps.depTypes.push(depType)
          } else {
            ref.parents[refId] = {
              depTypes: [depType],
              obj: ref
            }
          }
        })

        const walkDependencyTree = (
          startNode:string|number|PgObjectNode,
          depSelector:(dep:PgDependency)=>boolean, up = false
        ): PgObjectNode[] => {

          const node = typeof startNode === 'string' || typeof startNode === 'number'
            ? objectNodes[startNode]
            : startNode
          const nodes = node
            ? ( up ? Object.values(node.parents) : Object.values(node.children))
            .filter(cNode => depSelector(cNode))
            .flatMap( ({ obj }) => walkDependencyTree(obj, depSelector, up))
            : []

          return node ? [node].concat(...nodes) : nodes

        }
        const implicitDeps = ['e', 'i']
        const implicitDependencies = (startNode:string|number|PgObjectNode) => {
          return walkDependencyTree(startNode, (({ depTypes }) => {
            return depTypes.findIndex(s => implicitDeps.includes(s)) > -1
          }))
        }

        Object.values(extensionsByOid).forEach(e => {
          implicitDependencies(e.oid)
          .filter(o => o.classRef?.name === 'pg_type')
          .forEach(({ oid }) => {
            const pgType = typesByOid[oid]
            if (pgType) pgType.extension = e
          })
        })

        Object.values(typesByOid).forEach(type => {
          type.elementType = typesByOid[type.elementTypeOid]
          type.arrayType = typesByOid[type.arrayTypeOid]
          type.baseType = typesByOid[type.baseTypeOid]
        })

        Object.values(classesById).forEach(relation => {
          relation.attributes.sort((a, b) => a.attNum - b.attNum)
        })

        return {
          types: Object.values(types)
        }
      })
})

export default corePlugin
