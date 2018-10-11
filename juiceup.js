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

app.get('/addWallbox', (req, res) => {
	let tmp = new kecontact(req.query.address);

	tmp.init(() => {
		data = tmp.getData();
		if (data == {}) {
			res.send('Fail')
		} else
			dbase.addWallbox({
				serial: data.Serial,
				name: req.query.name,
				address: req.query.address,
				product: data.Product
			});
		conns[data.Serial] = tmp;
		res.send('Success');
	});
});

app.post('/price', (req, res) => {
	dbase.setPrice(req.body.price);
	res.send('Ok');
});

app.get('/:serial/start/:token', (req, res) => {
	conns[req.params.serial].start(req.params.token);
	res.send('Sent');
});

app.get('/:serial/stop/:token', (req, res) => {
	conns[req.params.serial].stop(req.params.token);
	res.send('Sent');
});