const asyncHandler = require("express-async-handler");
const {pool, getDataType} = require('../modules/dataBase')
const { body, validationResult } = require('express-validator');

exports.call = asyncHandler(async (req, res, next) => {
    try{
        const DB = await pool.connect()
        const result = await DB.query(req.body.command);
        DB.release()
        res.json({status:true,data:{rows:result.rows}});
    }catch(err){
        res.json({status:false,data:{message:err}})
    }
});

exports.dataTable = asyncHandler(async (req, res, next) => {
    try{
        const DB = await pool.connect()
        const result = await DB.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public';");
        DB.release()
        const allTable = result.rows.map((table)=>table["table_name"])
        res.json({status:true,data:{rows:allTable}});
    }catch(err){
        res.json({status:false,data:{message:err}})
    }
    
});

exports.tableInfo = asyncHandler(async (req, res, next) => {
    const {tableName} = req.query
    try{
        const DB = await pool.connect()
        const result = await DB.query(`SELECT 
            column_name,
            data_type
        FROM 
            information_schema.columns
        WHERE 
            table_name = $1;`,[tableName]);
        DB.release()
        if(result.rows.length > 0){
            const column_name = [],data_type = []
            for(let i of result.rows){
                const [cName,cType] = i
                column_name.push(cName)
                dataType.push(cType)
            }
            const dataType = data_type.map((type)=>getDataType(type))
            res.json({status:true,data:{columnName:column_name,columnType:dataType}});
        }else{
            res.json({status:false,data:{message:"table didnt exist"}})
        }
    }catch(err){
        res.json({status:false,data:{message:err}})
    }
});

exports.dataTableDetail = asyncHandler(async (req, res, next) => {
    try{
        const DB = await pool.connect()
        const tableName = req.params.tableName
        const table = await DB.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public';");
        const collectName = table.rows.map((table)=>table["table_name"])
        const tableQuery = collectName.reduce((total,current)=>{
            if(current === tableName){
                return `SELECT * FROM ${current};`  
            }
            return total
        },"")
        if(tableQuery !=""){
            const result = await DB.query(tableQuery);
            DB.release()
            res.json({status:true,data:{rows:result.rows}});
        }else{
            res.json({status:false,data:{message:"Table didnt exist"}});
        }
    }catch(err){
        console.log(err)
        res.json({status:false,data:{message:err}})
    }
});

exports.removeRow = asyncHandler(async (req, res, next) => {
    try{
        const DB = await pool.connect()
        const {tableName,rowId} = req.query
        const table = await DB.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public';");
        const collectName = table.rows.map((table)=>table["table_name"])
        const tableQuery = collectName.reduce((total,current)=>{
            if(current === tableName){
                return `DELETE FROM ${current} WHERE id = $1;`  
            }
            return total
        },"")
        if(tableQuery !=""){
            const result = await DB.query(tableQuery,[rowId]);
            DB.release()
            res.json({status:true,data:{message:`Deleted id:${rowId} from ${tableName}`}});
        }else{
            res.json({status:false,data:{message:"Table didnt exist"}});
        }
    }catch(err){
        console.log(err)
        res.json({status:false,data:{message:err}})
    }
    
});

exports.formValidate = asyncHandler(async (req, res, next) => {
    const blackList = ["id","created_at"]
    try{
        const DB = await pool.connect()
        const {tableName} = req.query
        const columnValidated = []
        let errorMessage = []
        if(tableName){
            const result = await DB.query(`SELECT 
                            column_name,
                            data_type
                        FROM 
                            information_schema.columns
                        WHERE 
                            table_name = $1;`,[tableName]);
            if(result.rows.length > 0){
                const column_name = [],data_type = []
                for(let i of result.rows){
                    const [cName,cType] = i
                    column_name.push(cName)
                    dataType.push(cType)
                }
                const dataType = data_type.map((type)=>getDataType(type))
                let count = -1
                for(let i of column_name){
                    count = count + 1
                    if(blackList.includes(i)){
                        continue;
                    }else{
                        columnValidated.push(i)
                    }
                    const typeOfColumn = dataType[count]
                    switch (i) {
                        case "password":
                            body("password").trim().matches(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/)
                            break;
                        case "username":
                            body("name").trim().isLength({min:3}).withMessage("Name must longer than 2 character").escape()
                            break;
                        case "role":
                            body("role").trim().matches(/admin|user|/).withMessage("Role must be admin|user").escape()
                            break;
                        case "status":
                            body("status").trim().matches(/active|inactive|pending|suppress/).withMessage("Role must be active|inactive|pending|suppress")
                            break;
                        case "email":
                            body("email").isEmail().withMessage('Invalid email address.').normalizeEmail()
                            break;
                        default:
                            switch (typeOfColumn) {
                                case "string":
                                    body(i).trim().isString().withMessage("Type must be string").escape()
                                    break;
                                case "number":
                                    body(i).trim().isNumeric.withMessage("Type must be number").escape()
                                    break;
                                case "date":
                                    body(i).trim().isDate.withMessage("Type must be date time").escape()
                                    break;
                                case "boolean":
                                    body(i).trim().isBoolean.withMessage("Type must be string").escape()
                                    break;
                                default:
                                    body(i).trim().escape()
                                    break;
                            }
                            break;
                    }
                }  
            }else{
                errorMessage.push("table didnt exist")
            }
        }else{
            errorMessage.push("table didnt exist")
        }
        DB.release()
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            errorMessage = [...errorMessage,...errors.array()]
        }
        if(errorMessage.length > 0){
            res.json({status:false,data:{message:errorMessage}});
        }else{
            req.body.validatedColumns = columnValidated
            next()
        }
    }catch(err){
        console.log(err)
        res.json({status:false,data:{message:err}})
    } 
});

exports.addToDatabase = asyncHandler(async (req, res, next) => {
    try{
        const DB = await pool.connect()
        const {tableName} = req.query
        const validatedColumns = req.query.validatedColumns
        let queryRows = ""
        const queryColumns = validatedColumns.reduce((total,current)=>{
            queryRows = queryRows==""?queryRows:(queryRows + ", ") + `'${req.body[current]}'`
            return (total==""?total:(total + ", ")) + current
        },"")
        const tableQuery = `INSERT INTO ${tableName} (${validatedColumns}) VALUES (${queryRows});` 
        const result = await DB.query(tableQuery);
        if(result.rows){
            res.json({status:true,data:{message:`Add new row to ${tableName}`}});
        }
    }catch(err){
        console.log(err)
        res.json({status:false,data:{message:err}})
    }   
});