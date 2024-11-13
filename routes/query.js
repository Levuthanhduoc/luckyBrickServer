var express = require('express');
var router = express.Router();
const {call,dataTable, dataTableDetail,removeRow,addToDatabase,formValidate,tableInfo,rowInfo, updateDatabase} = require("../controller/queryController");
const { formDataHandler } = require('../modules/formDataHandler');

router.get('/dataTable',dataTable);
router.get('/dataTable/:tableName',dataTableDetail);
router.post('/',call);
router.delete('/delete',removeRow);
router.post('/add',formDataHandler,formValidate,addToDatabase);
router.put('/update',formDataHandler,formValidate,updateDatabase);
router.get('/tableInfo',tableInfo);
router.get('/rowInfo',rowInfo);

module.exports = router;