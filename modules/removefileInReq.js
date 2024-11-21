const { mydir } = require("../mydir");
const fs = require('fs');

exports.removeFileInReq = (req,option = {aws:false})=>{
    try {
        for(let i in req.body){
            if(i && i != null){
                const matchFile = i.match(/_uploaded/gm)
                const matchOldFile = i.match(/uploaded.*old/gm)
                if(matchFile != null && matchOldFile == null){
                    const oldFile = req.body[i+"_old"]
                    if(req.body[i] != oldFile){
                        const fileName = req.body[i]
                        if(fileName != ""){
                            const fileNameArray = fileName.split("&&&")
                            for(let newFile of fileNameArray){
                                const matchFileType = i.match(/uploaded.*zip/gm)
                                const filePath = mydir()+"/uploads/"+newFile
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
            }
        }
    } catch (error) {
        console.log(error)
    }
}