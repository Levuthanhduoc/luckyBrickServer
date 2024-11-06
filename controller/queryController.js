const asyncHandler = require("express-async-handler");

exports.call = asyncHandler(async (req, res, next) => {
    try{
        const DB = await req.DBPool.connect()
        const result = await DB.query(req.body.command);
        DB.release()
        res.json({status:true,data:{rows:result.rows}});
    }catch(err){
        console.log(JSON.stringify(err))
        res.json({status:false,data:{messsage:err}})
    }
});