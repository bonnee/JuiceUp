var express = require('express'),
	router = express.Router();
const db = require(__basedir + '/controllers/db.js');

router.get('/', (req, res) => {
	res.send(db.getWallboxes());
});

router.post('/', (req, res) => {
	const kc = req.app.get('kecontact');
	const db = req.app.get('database');
	const conns = req.app.get('connections');

	let tmpConn = new kc(req.body.address);

	let del = () => {
		if (tmpConn) {
			tmpConn.close();
			tmpConn = null;
			delete tmpConn;
		}
	}

	tmpConn.init((msg) => {
		let data = tmpConn.getData();

		if (msg == 'ok') {
			db.addWallbox({
				serial: data.Serial,
				name: req.body.name,
				address: req.body.address,
				product: data.Product
			});
			conns.add(tmpConn, data.Serial);
		} else {
			del();
		}
		res.send(msg);
	});

	req.on('close', (err) => {
		console.log('Connection closed');
		del();
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