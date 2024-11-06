var express = require('express');
var router = express.Router();
const {call} = require("../controller/queryController");
const {AdminOnly,check} = require('../controller/userController')

router.post('/',check,AdminOnly,call);

module.exports = router;