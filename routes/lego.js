var express = require('express');
var router = express.Router();
const {lego} = require('../controller/legoController')

router.get('/info',lego);

module.exports = router;
