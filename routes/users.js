var express = require('express');
var router = express.Router();
const {AdminOnly ,login ,sign_up,check,check_res,userAll,update,del, logout} = require('../controller/userController')
const {formHanler} = require('../modules/updateFormHandler');

router.post('/login', login);

router.post('/signup',check,AdminOnly, sign_up);

router.get("/checking",check,check_res);

router.get("/all",userAll);

router.put("/update/:id",check,AdminOnly,formHanler,update);

router.delete("/delete/:id",check,AdminOnly,del);

router.post("/logout",check,logout)

module.exports = router;
