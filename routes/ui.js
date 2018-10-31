const db = require(__basedir + '/controllers/db.js');

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
	let data = conns.get()[req.params.serial].getData();

	res.render('meter', {
		page: 'meter',
		data: data,
		box: db.getWallbox(req.params.serial),
		price: db.getPrice()
	});
});

router.get('/:serial/history', (req, res) => {
	const conns = req.app.get('connections');

	let data = conns.get()[req.params.serial].getData();
	let history = conns.get()[req.params.serial].getHistory();

	res.render('history', {
		page: 'history',
		data: data,
		box: db.getWallbox(req.params.serial),
		history: history,
		price: db.getPrice()
	});
});

module.exports = router;