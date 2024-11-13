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
            username VARCHAR(50) NOT NULL UNIQUE,
            password VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
            status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suppress')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`)
        await client.query( `
            CREATE TABLE IF NOT EXISTS games (
                id SERIAL PRIMARY KEY,
                gameTitle VARCHAR(100) NOT NULL UNIQUE,
                description JSONB,
                image_uploaded_png TEXT,
                gameFile_uploaded_zip TEXT NOT NULL
            );`)
        await client.query( `
            CREATE TABLE IF NOT EXISTS tutorials (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                image_uploaded_png TEXT,
                description JSONB,
                serial VARCHAR(100),
                tutorialFile_uploaded_pdf TEXT 
            );`)
        await client.query( `
            CREATE TABLE IF NOT EXISTS legos (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                image_uploaded_png TEXT,
                price NUMERIC CHECK (price > 0),
                sale NUMERIC CHECK (sale > 0 and sale < 1),
                timeSale TIMESTAMPTZ CHECK (timeSale > NOW()),
                description JSONB,
                age NUMERIC CHECK (age> 0),
                pieces NUMERIC CHECK (pieces> 0),
                serial VARCHAR(100),
                category VARCHAR(100)
            );`)
    } catch (error) {
        console.error(error)
    }
    client.end()
}

exports.getDataType = (text)=>{
    let result = undefined
    if(typeof(text) == "string"){
        const numberType = text.match(/smallint|int|bigint|decimal|numeric|real|double precision|serial|bigserial/g)
        const stringType = text.match(/(character)|text/g)
        const dateTimeType = text.match(/date|(time)|interval/g)
        const booleanType = text.match(/boolean/g)
        const jsonType = text.match(/json|jsonb/g)
        const customType = text.match(/enum/g)
        if(numberType != null){
            result ="number"
        }else if(stringType != null){
            result = "string"
        }else if(dateTimeType != null){
            result ="time"
        }else if(booleanType != null){
            result = "boolean"
        }else if(jsonType != null){
            result = "json"
        }else if(customType != null){
            result = "custom"
        }else{
            result = text
        }
    }
    return result
}