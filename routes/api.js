var express = require('express'),
	router = express.Router();

router.post('/wallbox', (req, res) => {
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

router.delete('/wallbox/:serial', (req, res) => {
	console.log('deleting wallbox...')
	const db = req.app.get('database');

	res.send(db.removeWallbox(req.params.serial));
});

router.get('/wallboxes', (req, res) => {
	const db = req.app.get('database');

	res.send(db.getWallboxes());
});

router.get('/wallbox/:serial', (req, res) => {
	const db = req.app.get('database');

	res.send(db.getWallbox(req.params.serial));
});

router.post('/wallbox/:serial/start/:token', (req, res) => {
	const conns = req.app.get('connections');

	conns.get()[req.params.serial].start(req.params.token);
	res.send('Sent');
});

router.post('/wallbox/:serial/stop/:token', (req, res) => {
	const conns = req.app.get('connections');

	conns.get()[req.params.serial].stop(req.params.token);
	res.send('Sent');
});

router.get('/price', (req, res) => {
	res.send(req.app.get('database').getPrice().toString());
});

router.post('/price', (req, res) => {
	const db = req.app.get('database');

	if (db.setPrice(req.body.price))
		res.send(req.body.price);
});

module.exports = router;