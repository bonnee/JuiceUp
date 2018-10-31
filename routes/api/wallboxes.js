const express = require('express');
var router = express.Router();

const db = require(__basedir + '/controllers/db.js');

router.get('/', (req, res) => {
	res.send(db.getWallboxes());
});

router.post('/', (req, res) => {
	const conns = req.app.get('connections');

	req.on('close', (err) => {
		console.log('Connection closed');
	});

	conns.add(req.body.address).then(() => {
		let data = tmpConn.getData();

		db.addWallbox({
			serial: data.Serial,
			name: req.body.name,
			address: req.body.address,
			product: data.Product
		});

		res.send('Ok');
	}).catch((err) => {
		console.log('Error adding wallbox: ' + err);
		res.send(err);
	});
});

router.get('/:serial', (req, res) => {
	res.send(db.getWallbox(req.params.serial));
});

router.delete('/:serial', (req, res) => {
	console.log('deleting wallbox...')

	res.send(db.removeWallbox(req.params.serial));
});

router.post('/:serial/start/:token', (req, res) => {
	const conns = req.app.get('connections');

	conns.get()[req.params.serial].start(req.params.token);
	res.send('Sent');
});

router.post('/:serial/stop/:token', (req, res) => {
	const conns = req.app.get('connections');

	conns.get()[req.params.serial].stop(req.params.token);
	res.send('Sent');
});

module.exports = router;