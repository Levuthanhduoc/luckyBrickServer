const  {Client} = require('pg')
require('dotenv')

exports.init = async()=>{
    const client = new Client({
        connectionString: process.env.DB_STRING
    })
    try {
        await client.connect()
        await client.query( `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) NOT NULL,
            password VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
            status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suppress')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`)
    } catch (error) {
        console.error(error)
    }
    client.end()
}