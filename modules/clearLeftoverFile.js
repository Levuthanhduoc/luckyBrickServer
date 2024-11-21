const fs = require('fs');
exports.clearLeftoverFile = (folderPath)=>{
    try {
        const files = fs.readdirSync(folderPath);
        files.forEach(file => {
            const matchTrash = file.match(".zip")
            if(matchTrash != null){
                fs.unlinkSync(folderPath + "/"+file)
            }
        });
    } catch (err) {
        console.error(err);
    }
}