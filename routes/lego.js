var express = require('express');
var router = express.Router();
const {lego, search} = require('../controller/legoController')

router.get('/info',lego);
router.get('/search',search);

module.exports = router;
