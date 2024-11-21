const multer = require('multer');
const asyncHandler = require("express-async-handler");
const fs = require('fs')
const AdmZip = require("adm-zip");
const {mydir} = require('../mydir')
const uploadPath = 'uploads/'
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath); // Specify the directory to save uploaded files
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`); // Create a unique filename
    },
});
const upload = multer({ storage });
exports.formDataHandler = [upload.any(),asyncHandler(async (req, res, next) => {
    try{
        if(req.files){
            req.body["awsUpload"] = []
            req.files.forEach(file => {
                const matchFile = file.fieldname.match(/uploaded.*zip/gm)
                if(matchFile !=null ){
                    let fname = file.filename.replace(".zip","")
                    const exactedPath = mydir() +"/"+ uploadPath +"compress/"+ fname
                    const filePath = mydir() + "/" + uploadPath + file.filename
                    const zip = new AdmZip(filePath);
                    fs.existsSync(exactedPath)?fs.mkdirSync(exactedPath,{recursive:true}):""
                    zip.extractAllTo(exactedPath, true);
                    req.body[file.fieldname] = "compress/"+ fname
                }else if(!req.body[file.fieldname]){
                    req.body[file.fieldname] = file.filename
                }else{
                    req.body[file.fieldname] = req.body[file.fieldname] + "&&&" + file.filename
                }
                req.body["awsUpload"].push(file.filename)
            });
        }
        if(req.body){
            req.body["awsDeleted"] = []
            for(let i in req.body){
                if(i && i != null){
                    const matchOldFile = i.match(/uploaded.*old/gm)
                    if(matchOldFile){
                        const oldFileName = req.body[i]
                        const newFileCol = i.replace("_old","")
                        const newFileName = req.body[newFileCol]
                        if(oldFileName){
                            if(!newFileName){
                                req.body[newFileCol] = oldFileName
                            }else{
                                const oldFileNameArray = oldFileName.split("&&&")
                                for(let oldFile of oldFileNameArray){
                                    try {
                                        const removePath = mydir()+"/"+uploadPath+oldFile
                                        fs.unlinkSync(removePath);
                                        req.body["awsDeleted"].push(removePath)
                                        console.log('File removed successfully');
                                    } catch (err) {
                                        console.error('Error removing file:', err);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        next()
    }catch(err){
        console.log(err)
        res.json({status:false,data:{message:err}})
    }   
})]
