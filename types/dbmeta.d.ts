interface PostgresFieldSelector {
    pgVersion:string
    selector: (alias:string) => string
}


interface PostgresTable<T extends {[p:string]: PostgresFieldSelector}>{
    schema:string
    name:string
    fieldSelectors:T
}

/**
 * Configured Postgres Plugin
 */
interface PostgresPlugin<T extends {[p:string]: PostgresTable<any>}> {
    tables:T
    
}

interface PostgresPluginConfiguration {

}
