const express = require('express')
var router = express.Router();

const db = require(__basedir + '/controllers/db.js');

router.use('/wallboxes', require('./wallboxes.js'));

router.get('/price', (req, res) => {
	res.send(req.app.get('database').getPrice().toString());
});

router.post('/price', (req, res) => {
	if (db.setPrice(req.body.price))
		res.send(req.body.price);
});

module.exports = router;