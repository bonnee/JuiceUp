var express = require('express');
var router = express.Router();

const db = require(__basedir + '/controllers/db.js');

let checkExists = (req, res, next) => {
	if (db.getProfiles()[req.params.id])
		next();
	else {
		res.status(404).send();
	}
}

router.get('/', (req, res) => {
	res.send(db.getProfiles());
});

router.post('/', (req, res) => {
	let name = req.body.name || "Profile";
	let auth = req.body.auth || 0;
	let price = req.body.price || 0.5;

	db.addProfile(name, auth, price);

	res.status(200).send();
});

router.route('/:id').all(checkExists)
	.get((req, res) => {
		res.send((db.getProfiles(req.params.id)));
	}).put((req, res) => {
		let id = req.params.id;
		let name = req.body.name;
		let auth = req.body.auth;
		let price = req.body.price;

		db.setProfile(id, name, auth, price);

		res.status(204).send();
	}).delete((req, res) => {
		db.removeProfile(req.params.id);

		res.status(200).send();
	});

module.exports = router;