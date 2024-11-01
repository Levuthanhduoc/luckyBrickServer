const busboy = require("busboy");
const asyncHandler = require("express-async-handler");
const fs = require('fs');
const path = require('path');
const {mydir} = require('../mydir');

function randomNum (){
    const ran = Math.floor(Math.random() * 1000000);
    return ran;
}

exports.formHanler = asyncHandler(async (req,res,next)=>{
  try{
    let field = {}
    const bb = busboy({ headers: req.headers });
    bb.on('file', (name, file, info) => {
      const { filename, encoding, mimeType } = info;
      if(mimeType == "image/png" || mimeType == "type/jpeg"||mimeType == "image/jpeg"){
        let saveto = "";
        if(name == "addImg"){
            saveto = "webdata/";  
        }else if(name == "addContentImg"){
            saveto = "webdata/content_img/";
        }
        saveto = saveto +randomNum().toString()+ filename.replace(/\s/gm,"");
        const savePath =mydir() +"/"+ saveto;
        const ws = fs.createWriteStream(savePath);
        file.pipe(ws).on('close', () => {
            console.log(`File [${name}] done`);
        });
        if(!req.body[name]){
            req.body[name] = [];
        }
        req.body[name].push(saveto);
        }
    });
    bb.on('field', (name, val, info) => {
        if(name == "contentImg" || name == "removeContentImg" || name == "contentText"){
            if(!req.body[name]){
                req.body[name] = []
            }
            req.body[name].push(val);
        }else{
            req.body[name] = val;
        }
    });
    bb.on('finish', () => {
      console.log('Done parsing form!');
      next();
    });
    req.pipe(bb);
  }catch(err){
    console.log(err);
    res.json({data:"fail to send form",error:"fail to send form"});
  }  
})