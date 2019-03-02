const db = require(__basedir + '/controllers/db.js');
const Kecontact = require(__basedir + '/controllers/kecontact/index.js');

const express = require('express');
var router = express.Router();

router.get('/:serial/info', (req, res) => {
	let data = Kecontact.getData(req.params.serial);

	console.log(data);

	res.render('info', {
		page: 'info',
		data: data,
		box: db.getWallbox(req.params.serial)
	})
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

	//console.log(history);

	res.render('history', {
		page: 'history',
		data: data,
		box: db.getWallbox(req.params.serial),
		history: history,
		price: db.getPrice()
	});
});

module.exports = router;