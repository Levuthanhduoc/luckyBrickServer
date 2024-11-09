const  {Client,Pool} = require('pg')
require('dotenv').config()


exports.pool = new Pool({
    connectionString: process.env.DB_STRING,
    min: 0,
    max: 10,
    createTimeoutMillis: 8000,
    acquireTimeoutMillis: 8000,
    idleTimeoutMillis: 8000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
})

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

exports.getDataType = (text)=>{
    let result = undefined
    if(typeof(text) == "string"){
        const numberType = text.match(/smallint|int|bigint|decimal|numeric|real|double precision|serial|bigserial/)
        const stringType = text.match(/(character)|text/)
        const dateTimeType = text.match(/date|(time)|interval/)
        const booleanType = text.match(/boolean/)
        const customType = text.match(/enum/)
        if(numberType.length > 0){
            result ="number"
        }else if(stringType.length > 0){
            result = "string"
        }else if(dateTimeType.length > 0){
            result ="time"
        }else if(booleanType.length > 0){
            result = "boolean"
        }else if(customType.length > 0){
            result = "custom"
        }
    }
    return result
}