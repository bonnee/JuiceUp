const db = require(__basedir + '/controllers/db.js');
const Kecontact = require(__basedir + '/controllers/kecontact/index.js');

const express = require('express');
var router = express.Router();

router.get('/:serial/info', (req, res) => {
	let data = Kecontact.getData(req.params.serial);

	res.render('info', {
		page: 'info',
		data: data,
		profiles: db.getProfiles(),
		box: db.getWallbox(req.params.serial)
	})
});

router.get('/:serial/meter', (req, res) => {
	let data = Kecontact.getData(req.params.serial);

	res.render('meter', {
		page: 'meter',
		data: data,
		profiles: db.getProfiles(),
		box: db.getWallbox(req.params.serial),
		price: db.getActiveProfile(req.params.serial).price
	});
});

router.get('/:serial/history', (req, res) => {

	let data = Kecontact.getData(req.params.serial);
	let history = Kecontact.getHistory(req.params.serial);

	res.render('history', {
		page: 'history',
		data: data,
		box: db.getWallbox(req.params.serial),
		profiles: db.getProfiles(),
		history: history,
	});
});

router.get('/profiles', (req, res) => {
	res.render('profiles', {
		page: 'profiles',
		profiles: db.getProfiles()
	});
});

module.exports = router;