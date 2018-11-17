var express = require('express');
var router = express.Router();

const Kecontact = require(__basedir + '/controllers/kecontact/index.js');
const db = require(__basedir + '/controllers/db.js');

router.get('/', (req, res) => {
	res.send(db.getWallboxes());
});

// Add new
router.put('/', (req, res) => {
	console.log('Adding new wallbox...');
	let closed = false;

	Kecontact.add(req.body.address).then((data) => {
		if (!closed) {
			db.addWallbox({
				serial: data.Serial,
				name: req.body.name,
				address: Kecontact.getAddress(data.Serial),
				product: data.Product
			});

			res.status(201);
			res.send(data.Serial);
		} else {
			Kecontact.close(data.Serial);
		}
	}).catch((err) => {
		if (!closed) {
			console.error('Error adding wallbox: ' + err);
			res.status(400);
			res.send(err.toString());
		}
	});

	req.on('close', (data) => {
		closed = true;
	});
});

router.route('/:serial').post((req, res) => {
	let serial = req.params.serial;

	if (db.getWallbox(serial) == {}) {
		console.error('Wallbox doesn\'t exist');
	} else {
		if (db.getWallbox(serial).address != req.body.address) {
			checkBox(req.body.address).then(({
				id,
				connection
			}) => {
				if (serial == id) {
					closeConnection(conns.get()[id]);
					conns.add(connection, id);
					res.send(db.editWallbox(serial, req.body));
				} else {
					console.error(Error('Serial number mismatch'));
					res.status(400);
					res.send('Serial number mismatch');
				}
			}).catch((err) => {
				res.status(500);
				res.send();
			});
		} else {
			res.send(db.editWallbox(serial, req.body));
		}
	}
}).get((req, res) => {
	res.send(db.getWallbox(req.params.serial));
}).delete((req, res) => {
	Kecontact.close(req.params.serial);
	res.send(db.removeWallbox(req.params.serial));
});

// TODO: review protocol
router.post('/:serial/start/:token', (req, res) => {

	conns.get()[req.params.serial].start(req.params.token);
	res.status(200);
	res.send();
});

router.post('/:serial/stop/:token', (req, res) => {

	conns.get()[req.params.serial].stop(req.params.token);
	res.status(200);
	res.send();
});

let checkBox = (address) => {
	return new Promise((resolve, reject) => {
		let tmpConn = Kecontact.add(address).then((id) => {
			resolve({
				id: id,
				connection: tmpConn
			});
		}).catch((err) => {
			closeConnection(tmpConn);
			reject(err);
		});
	});
}

module.exports = router;