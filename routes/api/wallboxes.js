const express = require('express');
var router = express.Router();
const Kecontact = require(__basedir + '/controllers/kecontact/index.js');

const db = require(__basedir + '/controllers/db.js');

router.get('/', (req, res) => {
	res.send(db.getWallboxes());
});

router.post('/', (req, res) => {
	console.log('Adding new wallbox...');
	const conns = req.app.get('connections');
	let success = false;

	closeConn = () => {
		if (!success && tmpConn) {
			tmpConn.close();
			tmpConn = null;
			delete tmpConn
		}
	}

	let tmpConn = new Kecontact(req.body.address);

	tmpConn.init().then((id) => {
		success = true
		let data = tmpConn.getData();

		conns.add(tmpConn, id);
		db.addWallbox({
			serial: data.Serial,
			name: req.body.name,
			address: req.body.address,
			product: data.Product
		});

		res.status(201);
		res.send();
	}).catch((err) => {
		console.log('Error adding wallbox: ' + err);
		closeConn();
		res.status(400);
		res.send(err);
	});

	req.on('close', (data) => {
		closeConn();
	});
});

router.get('/:serial', (req, res) => {
	res.send(db.getWallbox(req.params.serial));
});

router.delete('/:serial', (req, res) => {
	res.send(db.removeWallbox(req.params.serial));
});

// TODO: review protocol
router.post('/:serial/start/:token', (req, res) => {
	const conns = req.app.get('connections');

	conns.get()[req.params.serial].start(req.params.token);
	res.status(200);
	res.send();
});

router.post('/:serial/stop/:token', (req, res) => {
	const conns = req.app.get('connections');

	conns.get()[req.params.serial].stop(req.params.token);
	res.status(200);
	res.send();
});

module.exports = router;