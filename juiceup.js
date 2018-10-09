const client = require('./kecontact.js')
const express = require('express');
const moment = require('moment');

const HOST = '192.168.1.211';
const WEBPORT = 3000;

const PRICE_KWH = 0.2;

var app = express();
app.set('view engine', 'pug');
app.use(express.static('public'));

const c = new client(HOST);

app.listen(WEBPORT, function () {
	console.log('JuiceUp online on port ' + WEBPORT);
});

app.get('/', (req, res) => {
	let data = c.getData();
	let start = moment.duration(data.Sec, 'seconds');

	res.render('index', {
		data: data,
		uptime: {
			d: start.days(),
			h: start.hours(),
			m: start.minutes(),
			s: start.seconds()
		}
	});
});

app.get('/meter', (req, res) => {
	let data = c.getData();

	res.render('meter', {
		data: data,
		price: PRICE_KWH
	});
});

app.get('/history', (req, res) => {
	let history = c.getHistory();

	res.render('history', {
		history: history,
		price: PRICE_KWH
	});
});

app.get('/start/:token', (req, res) => {
	c.start(req.params.token);
	res.send('Sent');
});
app.get('/stop/:token', (req, res) => {
	c.stop(req.params.token);
	res.send('Sent');
});