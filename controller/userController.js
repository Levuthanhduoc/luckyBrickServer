const asyncHandler = require("express-async-handler");
const {validationResult, body } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
require('dotenv').config();

const saltRound = 10;

// login page
exports.login_page = asyncHandler(async (req, res, next) => {
    res.render("login",{data:""});
});
// login handler
exports.login = [
    body("name").trim().isLength({min:3}).withMessage("Name must longer than 2 character").escape(),
    body("password").trim().matches(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/)
    .withMessage("Password must have 8 to 16 character long, 1 number, 1 uppercase, 1 lowercase 1 special character, no space").escape(),
    asyncHandler(async (req, res, next) => {
        const DB = await req.DBPool.connect()
        let result = await DB.query(`SELECT * FROM users WHERE username = $1;`,[req.body.name]);
        result = result.rows
        let message = [];
        const err = validationResult(req);
        if(!err.isEmpty()){
            err.array().forEach((e)=>{
                message.push(e.msg)
            })
        }else if(result.length !== 1){
            message.push("username not exist");
        }else{
            const rep = bcrypt.compareSync(req.body.password,result[0].password)
            if(rep){
                const token = jwt.sign({
                    name:result[0].username,
                    id:result[0].id,
                },process.env.KEY_PRIVATE,{ 
                    algorithm: 'RS256',
                    expiresIn:"24h",
                    audience:`${process.env.FRONTEND_HOST}`,
                    issuer: `${process.env.BACKEND_HOST}`,
                })
                try {
                    await DB.query("UPDATE users SET status = 'active' WHERE id = $1;",[result[0].id])
                    res.cookie('auth', token, { httpOnly: true, expires: new Date(Date.now() +23* 60 * 60 * 1000) });
                    res.json({status:true,token:token,data:{
                        name:result[0].username,
                        role:result[0].role,
                    }});
                } catch (error) {
                    console.log(error)
                    message.push("Oop some error just happen please try again")
                }
            }else{        
                message.push('wrong password');
            } 
        }
        DB.release()
        if(message.length != 0){
            res.json({
                status:false,
                data:{
                    name:req.body.name,
                    password:req.body.password,
                    message:message
                }})
        }
    })
];
//Logout
exports.logout = asyncHandler(async (req, res, next) => {
    let message = [];
    const DB = await req.DBPool.connect()
    const standanrdErr = "Oop some error just happen please try again"
    if(req.jwtToken){
        try {
            await DB.query("UPDATE users SET status = 'inactive' WHERE username= $1;",[req.jwtToken.name])
            res.json({data:{status:true}});
        } catch (error) {
            message.push(standanrdErr)
        }
    }else{
        message.push(standanrdErr)
    }
    DB.release()
    if(message.length != 0){
        res.json({data:{
            status:false,
            name:req.body.name,
            password:req.body.password,
            message:message
        }})
    }
});
// sign up page
exports.sign_up_page = asyncHandler(async (req, res, next) => {
    res.render("signup",{data:""});
});
// sign up 
exports.sign_up =[body("name").trim().isLength({min:3}).withMessage("Name must longer than 2 character").escape(),
    body("password").trim().matches(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/)
    .withMessage("Password must have 8 to 16 character long, 1 number, 1 uppercase, 1 lowercase 1 pecial character, no space").escape(),
    body("email").trim().matches(/\S+@\S+\.\S+/).withMessage("Invalid email address").escape(),
    asyncHandler(async (req, res, next) => {
        const DB = await req.DBPool.connect()
        
        const err = validationResult(req);
        let message = [];
        if(!err.isEmpty()){
            err.array().forEach((e)=>{
                message.push(e.msg)
            })
        }else{
            try {
                let result = await DB.query(`SELECT * FROM users WHERE username = $1;`, [req.body.name]);
                let checkEmail = await DB.query(`SELECT * FROM users WHERE email = $1;`, [req.body.email]);
                result = result.rows;
                checkEmail = checkEmail.rows
                if(result.length !== 0){
                    message.push("username already exist");
                }else if(checkEmail.length !== 0){
                    message.push("email already exist");
                }else{
                    bcrypt.genSalt(saltRound,(err,salt)=>{
                        bcrypt.hash(req.body.password,salt,async (err,hash)=>{
                            if(err){
                                message.push(err.message)
                            }else{
                                await DB.query("INSERT INTO users (username,password,email,role) VALUES ($1,$2,$3,$4);",
                                    [req.body.name,hash,req.body.email,"user"]);
                                res.json({status:true,
                                    Data:{
                                        message:"Please Sign In"
                                    }
                                })
                            }
                        })
                    })
                }
            } catch (error) {
                message.push("Oops something happen please try again");
            }
        }
        DB.release()
        if(message.length != 0){
            res.json({
                status:false,
                data:{
                    name:req.body.name,
                    password:req.body.password,
                    message:message
                }
            })
        }
    })
]
//check response
exports.check_res = asyncHandler(async (req, res, next) => {
    let result = {status:false};
    if(req.jwtToken){
        if(req.jwtToken.status && req.jwtToken.accStatus == "active"){
            result ={status:true}
        } 
    } 
    res.json({result})
});

exports.AdminOnly = asyncHandler(async (req, res, next) => {
    let result = {status:false,data:{message:["you are not authorize to do this"]}};
    if(req.jwtToken){
        const status = req.jwtToken.accStatus;
        const role = req.jwtToken.role;
        if(status == "active" && role == "ADMIN"){
            next();
            return;
        } 
    }
    res.json(result)
});

exports.UserAccess = asyncHandler(async (req, res, next) => {
    let result = {status:false,data:{message:["you are not authorize to do this"]}};
    if(req.jwtToken){
        const status = req.jwtToken.accStatus;
        const role = req.jwtToken.role;
        if(status == "active"){
            next();
            return;
        } 
    }
    res.json(result)
});

//check cookie
exports.check = asyncHandler(async (req, res, next) => {
    const token = req.cookies.auth;
    let decode = undefined;
    let data = {
        status:false,
    }
    if(token){
        try{
            decode = jwt.verify(token,process.env.KEY_PUBLIC,{audience:`${process.env.FRONTEND_HOST}`,issuer:`${process.env.BACKEND_HOST}`})
        }catch(err){
            data = {
                status:false,
                ...err,
            }
        }
    }
    if(decode){
        const result = await DB.query("SELECT * FROM users WHERE id = $1;",[decode.id]);
        if(result.length == 1){
            data = {
                status:true,
                name:result[0].name,
                accStatus: result[0].status,
                role:result[0].role,   
            }
        }
    }
    req.jwtToken = data;
    next()
});

exports.userAll = asyncHandler(async (req, res, next) => {
    const DB = await req.DBPool.connect()
    const result = await DB.query("SELECT * FROM users;");
    DB.release()
    res.json({users:result})
});

exports.del = asyncHandler(async (req, res, next) => {
    const DB = await req.DBPool.connect()
    const id  = req.params.id
    try{
        const result = await DB.query("DELETE FROM users WHERE id = $1;",[id]);
        res.json({users:"done"})
    }catch(err){
        console.log(err);
        res.json({users:{meassage:["fail to delete"]}})
    }
    DB.release()
});

exports.update = [
    body("name").trim().isLength({min:3}).withMessage("Name must longer than 2 character").escape(),
    body("password").trim().escape(),
    body("id").trim().escape(),
    body("role").trim().escape(),
    body("status").trim().escape(),
    body("mode").trim().escape(),
    asyncHandler(async (req, res, next) => {
        const DB = await req.DBPool.connect()
        let result = "";
        const err = validationResult(req);
        let message = [];
        let userPassword = req.body.password;
        let salt = ""
        try{
            
            if(!err.isEmpty()){
                err.array().forEach((e)=>{
                    message.push(e.msg)
                })
            }else {
                if(req.body.id != "new"){
                    result = await DB.query(`SELECT * FROM users WHERE id = $1;`, [req.body.id]);
                    if(result.length != 0){
                        if(result[0].password == req.body.password){
                            userPassword = false;
                            salt = result[0].salt
                        }
                    }else{
                        message.push("user didnt exists");
                    }
                }else{
                    result = await DB.query(`SELECT * FROM users WHERE username = $1;`, [req.body.name]);
                    if(result.length != 0){
                        message.push("user already exists");
                    }
                }
                if(userPassword && message.length == 0){
                    let checkPass = userPassword.match(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/);
                    if(checkPass != null){
                        salt = bcrypt.genSaltSync(saltRound);
                        userPassword = bcrypt.hashSync(req.body.password, salt);
                    }else{
                        message.push("Password must have 8 to 16 character long, 1 number, 1 uppercase, 1 lowercase 1 pecial character, no space")
                    }
                }
            }
        }catch(err){
            console.log(err)
        }
        if(message.length != 0){
            res.json({users:{
                message:message
            }})
        }else{
            let mode = req.body.mode;
            try{
                if(mode=="update"){
                    await DB.query("UPDATE users SET username = $1 ,password = $2 ,salt = $3, role = $4,status = $5 WHERE id = $6;",
                        [req.body.name,userPassword?userPassword:req.body.password,salt,req.body.role,req.body.status,req.body.id]);
                }else if(mode == "add"){
                    await DB.query("INSERT INTO users (name,password,salt,role,status) VALUES ($1,$2,$3,$4,$5);",
                        [req.body.name,userPassword,salt,req.body.role,req.body.status]);
                }
                res.json({users:"done"});
            }catch(err){
                console.log(err)
                res.json({users:{message:["fail to save"]}})
            }
            
        }
        DB.release()
})]

