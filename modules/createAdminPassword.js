const bcrypt = require('bcrypt');
const  {Client} = require('pg')
require('dotenv')
const saltRound = 10;
exports.create = async(name,password,email,role,DBstring)=>{
    const client = new Client({
        connectionString: DBstring
    })
    try {
        await client.connect()
        bcrypt.genSalt(saltRound,(err,salt)=>{
            bcrypt.hash(password,salt,async (err,hash)=>{
                await client.query("INSERT INTO users (username,password,email,role) VALUES ($1,$2,$3,$4);",[name,hash,email,role]);
                client.end()
            })
        })
    } catch (error) {
        console.error(error)
        client.end()
    }

}