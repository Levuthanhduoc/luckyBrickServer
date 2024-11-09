var express = require('express');
var router = express.Router();
const {call,dataTable, dataTableDetail,removeRow,addToDatabase,formValidate,tableInfo} = require("../controller/queryController");
const {AdminOnly,check} = require('../controller/userController')

router.get('/dataTable',check,AdminOnly,dataTable);
router.get('/dataTable/:tableName',check,AdminOnly,dataTableDetail);
router.post('/',check,AdminOnly,call);
router.delete('/delete',check,AdminOnly,removeRow);
router.post('/add',check,AdminOnly,formValidate,addToDatabase)
router.get('/tableInfo',check,AdminOnly,tableInfo)

module.exports = router;