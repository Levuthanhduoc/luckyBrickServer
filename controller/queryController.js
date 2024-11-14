const asyncHandler = require("express-async-handler");
const {pool, getDataType} = require('../modules/dataBase')
const { body, validationResult } = require('express-validator');
const { hashPassword } = require("../modules/hashPassword");
const { translateNameToType } = require("../modules/translateNameToType");
const { removeFileInReq } = require("../modules/removefileInReq");
const fs = require('fs')
const { mydir } = require("../mydir");

const blackList = ["id","created_at"]

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
            const dataArray = Array.from(result.rows)
            const cName = [],cType = []
            for(let i of dataArray){
                const {column_name,data_type} = i
                if(!blackList.includes(column_name)){
                    cName.push(column_name)
                    const checkType = translateNameToType(column_name,data_type)
                    cType.push(checkType)
                }
            }
            const dataType = cType.map((type)=>getDataType(type))
            res.json({status:true,data:{columnName:cName,columnType:dataType}});
        }else{
            res.json({status:false,data:{message:"table didnt exist"}})
        }
    }catch(err){
        res.json({status:false,data:{message:err}})
    }
});

exports.rowInfo = asyncHandler(async (req, res, next) => {
    const {tableName,id} = req.query
    try{
        if(!tableName&&!id){
            throw new Error("table name and id required");
        }
        const DB = await pool.connect()
        const allTableName = await DB.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public';");
        const collectName = allTableName.rows
        const matchName = collectName.reduce((total,current)=>{
            if(current["table_name"] === tableName){
                return current["table_name"] 
            }
            return total
        },"")
        if(matchName == ""){
            throw new Error("table didnt exist");
        }
        const result = await DB.query(`SELECT * FROM ${matchName} WHERE id = $1;`,[id])
        DB.release()
        if(result.rows.length > 0){
            const rowData = Array.from(result.rows)
            const newRowData = {...rowData[0]}
            for(let i in rowData[0]){
                const matchColumn = i.match(/_uploaded/gm)
                if(matchColumn != null){
                    const newData = rowData[0][i].split("&&&")
                    newRowData[i] = newData 
                }
            }
            res.json({status:true,data:{rows:newRowData}});
        }else{
            res.json({status:false,data:{message:"row didnt exist"}})
        }
    }catch(err){
        res.json({status:false,data:{message:[err.message]}})
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
                return `DELETE FROM ${current} WHERE id = $1 RETURNING *;`  
            }
            return total
        },"")
        if(tableQuery !=""){
            const result = await DB.query(tableQuery,[rowId]);
            if(result.rows.length > 0){
                const delRowData = Array.from(result.rows)
                for(let i in delRowData[0]){
                    const matchUploadedColumn = i.match(/_uploaded/)
                    if(matchUploadedColumn != null){
                        const fileNameArray = delRowData[0][i].split("&&&")
                        for(let delFile of fileNameArray){
                            const matchFileType = i.match(/uploaded.*zip/gm)
                            const filePath = mydir()+"/uploads/"+delFile
                            try {
                                if(matchFileType != null){
                                    fs.rmSync(filePath,{ recursive: true, force: true });
                                }else{
                                    fs.unlinkSync(filePath);
                                }
                                console.log('File removed successfully');
                            } catch (err) {
                                console.error('Error removing file:', err);
                            }
                        }
                    } 
                }
            }
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
    try{
        const DB = await pool.connect()
        const {tableName} = req.query
        const columnValidated = []
        let errorMessage = []
        const validationQuery = []
        if(tableName){
            const result = await DB.query(`SELECT 
                            column_name,
                            data_type
                        FROM 
                            information_schema.columns
                        WHERE 
                            table_name = $1;`,[tableName]);
            if(result.rows.length > 0){
                const cName = [],cType = []
                const dataArray = Array.from(result.rows)
                for(let i of dataArray){
                    const {column_name,data_type} = i
                    cName.push(column_name)
                    cType.push(data_type)
                }
                const dataType = cType.map((type)=>getDataType(type))
                let count = -1
                for(let i of cName){
                    count = count + 1
                    if(blackList.includes(i)){
                        continue;
                    }else{
                        columnValidated.push(i)
                    }
                    const typeOfColumn = dataType[count]
                    switch (i) {
                        case "password":
                            validationQuery.push(body("password").trim().not().isEmpty().withMessage(`field ${i} mustnt be empty`).matches(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/).withMessage("Password must have 8 to 16 character long, 1 number, 1 uppercase, 1 lowercase 1 pecial character, no space").run(req))
                            break;
                        case "username":
                            validationQuery.push(body("username").trim().not().isEmpty().withMessage(`field ${i} mustnt be empty`).isLength({min:3}).withMessage("Name must longer than 2 character").run(req))
                            break;
                        case "role":
                            validationQuery.push(body("role").trim().not().isEmpty().withMessage(`field ${i} mustnt be empty`).matches(/admin|user|/).withMessage("Role must be admin|user").run(req))
                            break;
                        case "status":
                            validationQuery.push(body("status").trim().not().isEmpty().withMessage(`field ${i} mustnt be empty`).matches(/active|inactive|pending|suppress/).withMessage("Role must be active|inactive|pending|suppress").run(req))
                            break;
                        case "email":
                            validationQuery.push(body("email").trim().not().isEmpty().withMessage(`field ${i} mustnt be empty`).isEmail().withMessage('Invalid email address.').normalizeEmail().run(req))
                            break;
                        default:
                            switch (typeOfColumn) {
                                case "string":
                                    validationQuery.push(body(i).trim().not().isEmpty().withMessage(`field ${i} mustnt be empty`).isString().withMessage("Type must be string").run(req))
                                    break;
                                case "number":
                                    validationQuery.push(body(i).trim().not().isEmpty().withMessage(`field ${i} mustnt be empty`).isNumeric().withMessage("Type must be number").run(req))
                                    break;
                                case "date":
                                    validationQuery.push(body(i).trim().not().isEmpty().withMessage(`field ${i} mustnt be empty`).isDate().withMessage("Type must be date time").run(req))
                                    break;
                                case "boolean":
                                    validationQuery.push(body(i).trim().not().isEmpty().withMessage(`field ${i} mustnt be empty`).isBoolean({ loose: true }).withMessage("Type must be string").run(req))
                                    break;
                                default:
                                    validationQuery.push(body(i).trim().not().isEmpty().withMessage(`field ${i} mustnt be empty`).run(req))
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
        if(validationQuery.length > 0){
            await Promise.all(validationQuery)
        }
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            errorMessage = [...errorMessage,...errors.array().map((err)=>err.msg)]
        }
        if(errorMessage.length > 0){
            removeFileInReq(req)
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
        const validatedColumns = req.body.validatedColumns
        const queryColumns = validatedColumns.reduce((total,current)=>{
            return (total==""?total:(total + ", ")) + current
        },"")
        const columnValue = []
        const queryRows = validatedColumns.reduce((total,current,index)=>{
            let rowValue = req.body[current]
            if(current == "password"){
                rowValue = hashPassword(rowValue)
                if(!rowValue){
                    throw new Error("error when hash password");
                }
            }
            columnValue.push(rowValue)
            return (total==""?total:(total + ", ")) + `$${index + 1}`
        },"")
        const tableQuery = `INSERT INTO ${tableName} (${queryColumns}) VALUES (${queryRows});`
        const result = await DB.query(tableQuery,columnValue);
        DB.release()
        if(result.rows){
            res.json({status:true,data:{message:[`Add new row to ${tableName}`]}});
        }
    }catch(err){
        console.log(err)
        removeFileInReq(req)
        res.json({status:false,data:{message:[err.message]}})
    }   
});

exports.updateDatabase = asyncHandler(async (req, res, next) => {
    try{
        const DB = await pool.connect()
        const {tableName,id} = req.query
        const validatedColumns = req.body.validatedColumns
        const queryColumns = validatedColumns.reduce((total,current)=>{
            return (total==""?total:(total + ", ")) + current
        },"")
        const columnValue = []
        let count = 0
        let updateQuery = ""
        for(let i of validatedColumns){
            count = count + 1
            updateQuery = (updateQuery!=""?updateQuery +", ":`UPDATE ${tableName} SET `) + `${i} = $${count}`
            columnValue.push(req.body[i])
            if(validatedColumns.length == count){
                updateQuery = updateQuery + ` WHERE id = $${count + 1}`
            }
        }
        const result = await DB.query(updateQuery,[...columnValue,id]);
        DB.release()
        if(result.rows){
            res.json({status:true,data:{message:[`Update id: ${id} of ${tableName}`]}});
        }
    }catch(err){
        console.log(err)
        removeFileInReq(req)
        res.json({status:false,data:{message:[err.message]}})
    }   
});