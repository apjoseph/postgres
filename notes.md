# Changelog

### References
- [Graphile watch triggers](https://github.com/knqyf263/graphile-build/blob/master/packages/graphile-build-pg/res/watch-fixtures.sql)
- [Graphile introspection](https://github.com/knqyf263/graphile-build/blob/master/packages/graphile-build-pg/res/introspection-query.sql)

TODO: Switch column based selection to a union of jsons

define a uniqueId for caching
compare changes between objects create a function for onTableChange
uids will be automatically generated from existingKeys

need to think about what happens in transactions. dml statements can be revoked

simple implementation. notify channel: manually send an update when something has changed.
so what happens is that the channel will see something when it needs to update. or alternatively you can have the db update in transaction
this means that the db will slurp in metadata only for that connection, but other connections will be unnaffected.

when a transaction is ended, you grab the most recent version of the metadata. hooks must thus be transaction and
connection aware. which means no shared hooks across different connections. no shared state, everything must be functional

questions to resolve:

does SQL persist across different transactions? yes it does

therefore what must be passed to the functions is something like connection.getState
