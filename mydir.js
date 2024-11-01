exports.mydir = ()=>{
    let dir = __dirname.replace(/\\/gm,"/");
    return dir;
}