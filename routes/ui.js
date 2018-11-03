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

router.get('/:serial/meter', (req, res) => {
	let data = Kecontact.getData(req.params.serial);

	res.render('meter', {
		page: 'meter',
		data: data,
		box: db.getWallbox(req.params.serial),
		price: db.getPrice()
	});
});

router.get('/:serial/history', (req, res) => {

	let data = Kecontact.getData(req.params.serial);
	let history = Kecontact.getHistory(req.params.serial);

	res.render('history', {
		page: 'history',
		data: data,
		box: db.getWallbox(req.params.serial),
		history: history,
		price: db.getPrice()
	});
});

module.exports = router;