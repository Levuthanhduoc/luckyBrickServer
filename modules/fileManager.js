const { mydir } = require("../mydir")
const fs = require('fs')
const { downloadFile} = require("./aws")
const { ExtracFile } = require("./extractFile")
const { createFolder } = require("./createFolder")

exports.fileManager = async (req,res,next)=>{
    try {
        const filePath = mydir() + "/uploads" + req.url
        const isExists = fs.existsSync(filePath)
        if(!isExists){
            const downloadPath = await downloadFile(filePath)
            if(downloadPath){
                const isZip = downloadPath.match(".zip")
                if(isZip !=null){
                    const extractPath = downloadPath.replace(".zip","")
                    createFolder(extractPath)
                    ExtracFile(downloadPath,extractPath,{delZip:true})
                }
            }
        }
    } catch (error) {
        console.log(error)
    }
    next()
}