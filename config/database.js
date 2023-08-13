const { Pool } = require('pg')

const pool = new Pool({
    user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_DATABASE,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT,
	ssl: false
})

module.exports = pool;

// const Pool = require("pg").Pool

// const pool = new Pool({
//     user: 'postgres',
//     host: 'localhost',
//     database: 'gohappy',
//     password: 'password',
//     port: 5432,
//     idleTimeoutMillis: 30000,
//     connectionTimeoutMillis: 0,
//     acquireTimeoutMillis: 0,
//     statement_timeout: 0
// })

// //poolPromise.connectionTimeout = 60000
// //poolPromise.acquireTimeoutMillis = 60000

// module.exports = {
//     pool
// }