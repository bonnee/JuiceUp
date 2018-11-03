var express = require('express')
var router = express.Router();

const db = require(__basedir + '/controllers/db.js');
const Kecontact = require(__basedir + '/controllers/kecontact');

router.use('/wallboxes', require('./wallboxes.js'));

router.get('/price', (req, res) => {
	res.send(db.getPrice().toString());
});

router.post('/price', (req, res) => {
	if (db.setPrice(req.body.price))
		res.send(req.body.price);
});

module.exports = router;