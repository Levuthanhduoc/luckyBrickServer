const fs = require("fs")
exports.createFolder = (filePath)=>{
    if(!filePath){
        return
    }
    const isExists = fs.existsSync(filePath)
    if(!isExists){
        fs.mkdirSync(filePath,{recursive:true})
    }
}