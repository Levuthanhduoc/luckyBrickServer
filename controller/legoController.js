const asyncHandler = require("express-async-handler");
const { mydir } = require("../mydir");
const {pool, getDataType} = require('../modules/dataBase')
const { body, validationResult } = require('express-validator');
const fs =require('fs')

const allowTable = ["games","tutorials","legos"]
exports.lego = asyncHandler(async (req, res, next) => {
    try{
        const {name,id,section} = req.query
        if(!allowTable.includes(name)){
            throw new Error("err this section didnt exists or you dont have access");
        }
        const DB = await pool.connect()
        let result= ""
        if(id){
            result = await DB.query(`SELECT * FROM ${name} WHERE id = $1;`,[id]);
        }else if(section && name == "legos"){
            let querytail = ""
            switch (section) {
                case "popular":
                    querytail = "WHERE category IN ('icons','technic','Marvel','Ideas') LIMIT 10;"
                    break;
                case "500":
                    querytail = "WHERE price <= 500 LIMIT 10;"
                    break;
                default:
                    break;
            }
            result = await DB.query(`SELECT * FROM legos ` + querytail);
        }else{
            result = await DB.query(`SELECT * FROM ${name};`);
        }
        console.log("asdasd")
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
        console.log(err)
        res.json({status:false,data:{message:[err.mesage]}})
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

exports.review =[
    body("id").trim().not().isEmpty().withMessage("Comment must not be empty").isNumeric().withMessage("Type Error: rating must be a number").escape(),
    body("name").trim().not().isEmpty().withMessage("Name must not be empty").escape(),
    body("title").trim().not().isEmpty().withMessage("Title must not be empty").escape(),
    body("comment").trim().not().isEmpty().matches(/"text":/).withMessage("Comment must not be empty"),
    body("rating").trim().not().isEmpty().withMessage("Comment must not be empty").isNumeric().withMessage("Type Error: rating must be a number").escape(),
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);
        const DB = await pool.connect()
        let errorMessage = []
        if (!errors.isEmpty()) {
            errorMessage = [...errorMessage,...errors.array().map((err)=>err.msg)]
        }else{
            try{
                console.log(req.body)
                const query = await DB.query("INSERT INTO reviews (name,title,comment,rating,legos_id) VALUES ($1,$2,$3,$4,$5)",
                    [req.body.name,req.body.title,req.body.comment,req.body.rating,req.body.id])
                res.json({status:true,data:{message:["add new review to table"]}})
            }catch (err){
                errorMessage = [...errorMessage,err.message]
            }
        }
        if(req.body["awsUpload"]){
            for(let i of req.body["awsUpload"]){
                fs.unlinkSync(mydir()+"/uploads/"+ i )
            }
        }
        if(errorMessage.length > 0){
            res.json({status:false,data:{message:errorMessage}});
        }
        DB.release()
    }
)]

exports.reviewInfo = asyncHandler(async (req, res, next) => {
    try{
        const {id} = req.query
        const DB = await pool.connect()
        let result= await DB.query(`SELECT * FROM reviews WHERE legos_id = $1 LIMIT 10;`,[id]);
        DB.release()
        const allData = Array.from(result.rows)
        if(allData.length == 0){
            throw new Error("this content is not available")
        }
        const processData = []
        const reviewSumary = [0,0,0,0,0]
        for(let i of allData){
            const rating = Number(i.rating) - 1
            const dateString = new Date(i.create_at)
            reviewSumary[rating] = reviewSumary[rating] + 1  
            processData.push({
                name: i.name,
                title:i.title,
                comment:i.comment,
                rating:i.rating,
                time:dateString.toDateString(),
            })
        }
        res.json({
            status:true,
            data:{
                rows:[{
                    total:processData.length,
                    detail:reviewSumary,
                    review:processData
                }]
            }
        });
    }catch(err){
        res.json({status:false,data:{message:[err.message]}})
    }
});