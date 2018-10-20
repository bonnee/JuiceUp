const kecontact = require('./kecontact.js');
const db = require('./db.js');

const express = require('express');
var bodyParser = require('body-parser');

const WEBPORT = 3000;

var conns = [];
var dbase = new db('data.json')

var app = express();
app.set('view engine', 'pug');
app.use(express.static('public'));

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({
	extended: true
})); // support encoded bodies

app.listen(WEBPORT, function () {
	console.log('JuiceUp online on port ' + WEBPORT);
});

boxes = dbase.getWallboxes().forEach(box => {
	conns[box.serial] = new kecontact(box.address);
	conns[box.serial].init();
});

app.get('/', (req, res) => {
	res.render('index', {
		page: 'index',
		boxes: dbase.getWallboxes(),
		price: dbase.getPrice()
	});
});

app.get('/:serial/meter', (req, res) => {
	let data = conns[req.params.serial].getData();

	res.render('meter', {
		page: 'meter',
		data: data,
		price: dbase.getPrice()
	});
});

app.get('/:serial/history', (req, res) => {
	let data = conns[req.params.serial].getData();
	let history = conns[req.params.serial].getHistory();

	res.render('history', {
		page: 'history',
		data: data,
		history: history,
		price: dbase.getPrice()
	});
});

app.post('/addWallbox', (req, res) => {
	let tmpConn = new kecontact(req.body.address);

	let del = () => {
		tmpConn.close();
		delete tmpConn;
	}

	tmpConn.init((msg) => {
		let data = tmpConn.getData();

		if (msg == 'ok') {
			dbase.addWallbox({
				serial: data.Serial,
				name: req.body.name,
				address: req.body.address,
				product: data.Product
			});
			conns[data.Serial] = tmpConn;
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

app.post('/price', (req, res) => {
	if (dbase.setPrice(req.body.price))
		res.send(req.body.price);
});

app.get('/:serial/start/:token', (req, res) => {
	conns[req.params.serial].start(req.params.token);
	res.send('Sent');
});

app.get('/:serial/stop/:token', (req, res) => {
	conns[req.params.serial].stop(req.params.token);
	res.send('Sent');
});