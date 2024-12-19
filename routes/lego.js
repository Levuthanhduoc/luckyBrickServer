var express = require('express');
var router = express.Router();
const {lego, search, review,reviewInfo} = require('../controller/legoController');
const { formDataHandler } = require('../modules/formDataHandler');

router.get('/info',lego);
router.get('/search',search);
router.get('/review',reviewInfo);
router.post('/review',formDataHandler,review)

module.exports = router;
