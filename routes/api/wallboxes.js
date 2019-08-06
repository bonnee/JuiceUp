var express = require('express');
var router = express.Router();

const Kecontact = require(__basedir + '/controllers/kecontact/index.js');
const db = require(__basedir + '/controllers/db.js');

router.get('/', (req, res) => {
	res.send(db.getActiveWallboxes());
});

// Add new
router.put('/', (req, res) => {
	console.log('Adding new wallbox...');
	let closed = false;

	Kecontact.add(req.body.address).then((data) => {
		if (!closed) {
			if (data.Product) {
				db.addWallbox({
					serial: data.Serial,
					name: req.body.name,
					address: Kecontact.getAddress(data.Serial),
					product: data.Product,
					error: false
				});
				res.status(201);
				res.send(data.Serial);
			} else {
				res.status(500);
				res.send('No data');
			}


		} else {
			Kecontact.delete(data.Serial);
		}
	}).catch((err) => {
		if (!closed) {
			console.error('Error adding wallbox: ' + err);
			res.status(400).send(err.toString());
		}
	});

	req.on('close', (data) => {
		closed = true;
	});
});

let checkExists = (req, res, next) => {
	if (db.getWallbox(req.params.serial))
		next();
	else {
		res.status(404).send();
	}
}

router.route('/:serial').all(checkExists)
	.post((req, res) => {
		console.log(req.body)
		let serial = req.params.serial;
		let address = req.body.address;

		if (db.getWallbox(serial).address != address) { // If posted address has changed
			Kecontact.add(address).then(data => {
				db.editWallbox(serial, req.body); // TODO: Check body
				db.setError(serial, false);
				res.status(201).send(data);
			}).catch(err => {
				res.status(400).send(err.toString());
			});
		} else {
			db.editWallbox(serial, req.body); // TODO: Check body
			res.status(201).send();
		}

	}).get((req, res) => {
		res.send(db.getWallbox(req.params.serial));
	}).delete((req, res) => {
		console.log('Deleting wallbox');
		Kecontact.delete(req.params.serial);
		db.removeWallbox(req.params.serial);

		res.status(204);
		res.send();
	});


router.route('/:serial/enable').all(checkExists)
	.get((req, res) => {
		res.send((Kecontact.getData(req.params.serial)['Enable sys']));
	})
	.put((req, res) => {

		Kecontact.start(req.params.serial, req.body.token);
		res.status(204);
		res.send();
	})
	.delete((req, res) => {

		Kecontact.stop(req.params.serial, req.body.token);
		res.status(204);
		res.send();
	});

router.post('/:serial/profile', checkExists, (req, res) => {
	db.setActiveProfile(req.params.serial, req.body.id);

	res.status(200).send();
});

router.get('/:serial/plug', checkExists, (req, res) => {
	res.send(Kecontact.getData(req.params.serial).Plug);
});

module.exports = router;