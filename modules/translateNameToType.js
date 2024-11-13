exports.translateNameToType = (text,originalType)=>{
    if(text){
        const newText = text.split("_")
        if(newText[1] == "uploaded"){
            return newText[2]
        }
        return originalType
    }else{
        throw new Error("Empty Name");
    }
}