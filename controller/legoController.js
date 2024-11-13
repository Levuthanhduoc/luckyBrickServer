const asyncHandler = require("express-async-handler");
const { mydir } = require("../mydir");
const {pool, getDataType} = require('../modules/dataBase')

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
