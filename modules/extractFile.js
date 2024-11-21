const AdmZip = require("adm-zip");
const fs = require('fs')
exports.ExtracFile = (filePath,extracTo,option={delZip:false})=>{
    const isRequirementMeet = filePath && extracTo
    if(!isRequirementMeet){
        return
    }
    const zip = new AdmZip(filePath);
    zip.extractAllTo(extracTo, true);
    const isDeleteLeftoverFile = option && option.delZip
    if(isDeleteLeftoverFile){
        fs.unlinkSync(filePath)
    }
}