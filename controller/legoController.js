const asyncHandler = require("express-async-handler");
const { mydir } = require("../mydir");
const {pool, getDataType} = require('../modules/dataBase')
const { body, validationResult } = require('express-validator');

const allowTable = ["games","tutorials","legos"]
exports.lego = asyncHandler(async (req, res, next) => {
    try{
        const {name,id} = req.query
        if(!allowTable.includes(name)){
            throw new Error("err this section didnt exists or you dont have access");
        }
        const DB = await pool.connect()
        let result= ""
        if(id){
            result = await DB.query(`SELECT * FROM ${name} WHERE id = $1;`,[id]);
        }else{
            result = await DB.query(`SELECT * FROM ${name};`);
        }
        DB.release()
        const allData = Array.from(result.rows)
        if(allData.length == 0){
            throw new Error("this content is not available")
        }
        let processData = allData.map((data,index)=>{
            let newData = {...data}
            for(let i in data){
                const matchUpload = i.match(/_uploaded/)
                if(matchUpload != null){
                    const cutToArray = data[i].split("&&&")
                    newData[i] = cutToArray
                }
            }
            return newData
        })
        res.json({status:true,data:{rows:processData}});
    }catch(err){
        res.json({status:false,data:{message:err}})
    }
});

exports.search =asyncHandler(async (req, res, next) => {
    const DB = await pool.connect()
    const searchText = req.query.q
    let errorMessage = []
    try {
        const text = `%${searchText}%`
        const searchGames = await DB.query(`SELECT * FROM games WHERE gametitle ILIKE $1 LIMIT 5;`,[text]);
        const searchLegos = await DB.query(`SELECT * FROM legos WHERE name ILIKE $1 OR serial ILIKE $1 LIMIT 5;`,[text]);
        const searchTutorial = await DB.query(`SELECT * FROM tutorials WHERE name ILIKE $1 OR serial ILIKE $1 LIMIT 5;`,[text]);
        const gamesTable = Array.from(searchGames.rows)
        const legosTable = Array.from(searchLegos.rows)
        const tutorialsTable = Array.from(searchTutorial.rows)
        const searchResult = [...gamesTable,...legosTable,...tutorialsTable].sort((first,second)=>{
            const firstName = first.name?first.name:first.gametitle
            const secondName = second.name?second.name:second.gametitle
            return firstName.localeCompare(secondName)
        })
        searchResult.forEach((item,index)=>{
            for(let key in item ){
                const uploadedMacth = key.match("_uploaded")
                if(uploadedMacth != null){
                    searchResult[index][key] = item[key].split("&&&")
                }
            }
        })
        res.json({status:true,data:{rows:searchResult}})
    } catch (error) {
        errorMessage.push(error.message)
    }
    if(errorMessage.length > 0){
        res.json({status:false,data:{message:errorMessage}});
    }
    DB.release()
})
