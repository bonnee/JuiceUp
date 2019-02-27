const db = require(__basedir + '/controllers/db.js');
const Kecontact = require(__basedir + '/controllers/kecontact/index.js');

const express = require('express');
var router = express.Router();

router.get('/', (req, res) => {

	res.render('index', {
		page: 'index',
		boxes: db.getWallboxes(),
		price: db.getPrice()
	});
});

router.use('/', require('./charger'));

module.exports = router;