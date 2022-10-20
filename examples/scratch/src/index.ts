import postgres from 'postgres'
const sql = postgres({
  onparameter(k, v) {
    console.log({ k, v })
  },
  types: {
    box: {
      to: 603,
      from: [603],
      serialize: ([a, b]) => '(' + (a[0] > b[0] ? [a, b] : [b, a])
          .map(([x, y]) => '(' + x + ',' + y + ')' ).join(',') + ')',
      parse: (x:string) => x.slice(1, -1).split('),(').map(x => x.split(',').map(x => +x))
    }
  }
})

const run = async() => {
  try {

    await sql.begin(async(tx) => {

      const tb = sql.typed.box([[1, 2], [1, 3]])

      const out = await tx`SELECT ${tb} a`

      // console.log(out)


      // const arr = [null,null,null]
      // const type = 'text[]'
      //
      //
      // const res = await tx`SELECT ${tx.array(arr)}::${sql.unsafe(type)} v`.inline()
      // console.log(res)
      // // console.log(res.statement.string)
      // // console.log(res[0])
      // // console.log(JSON.stringify(arr) === JSON.stringify(res[0].v))
      // //
      // const res2 = await tx`SELECT array[array[box(point(1,2),point(3,4))],array[box(point(1,2),point(3,4))]] x`
      // console.log(res2[0].x)
      //
      // console.log(await tx`SELECT 'box'::regtype::oid, 1009::oid::regtype`)



      // const res = await tx`SELECT 1::pg_catalog.varchar(1), array[pg_type] FROM pg_type`
      // console.log(res.statement);
      // console.log(res[0])

      // console.log(JSON.stringify(sql.options.shared.metadata,null,2))

      // console.log(await sql`select ${ sql.array([[1, 2], [3, 4]]) } as x`)



      // await tx`DROP TABLE IF EXISTS test;`
      // await tx`CREATE TABLE test(id bigint PRIMARY KEY, tcol text NOT NULL);`
      //
      // const arr = tx.array([1,2,3])
      // console.log(tx.valueToStringLiteral(arr))
      //
      // const columns = ["id","tcol"]
      // const desc = tx`COPY ${tx('test')} ${tx(columns)} FROM STDIN WITH (FORMAT CSV, DELIMITER ${','})`.simple()
      //
      // console.log(await desc.describe())
      //
      // const writable = await tx`COPY test ${tx(columns)} FROM STDIN WITH (FORMAT CSV, HEADER $tag$false$tag$, DELIMITER $tag$,$tag$)`.writable();
      //
      // writable.write('1,lol2\n')
      // writable.write('2,lol3\n')
      // writable.end()
      //
      // await new Promise(r => writable.on('finish', r));
      // console.log(await tx`SELECT * FROM test;`)
      //
      // const qOut = () => tx`COPY (${sql`SELECT * FROM test`}) TO STDOUT WITH (FORMAT ${sql`CSV`}, HEADER ${true} ,DELIMITER ${','})`.simple();
      //
      // console.log(await qOut().describe())
      //
      // const readable = await qOut().readable();
      //
      // console.log(await new Promise((resolve, reject) => {
      //   const chunks = [];
      //   readable.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      //   readable.on("error", (err) => reject(err));
      //   readable.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      // }));

      await tx`ROLLBACK AND CHAIN;`
    })

  } finally {
    await sql.end()
  }
}

run()




