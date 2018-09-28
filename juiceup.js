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
			m: start.minutes(),
			s: start.seconds()
		}
	});
});

app.get('/meter/:session', (req, res) => {
	session = req.params.session;
	let data = c.getData();
	let hist = c.getHistory();
	console.log(data);

	res.render('meter', {
		data: data,
		hist: hist[session],
		price: PRICE_KWH
	});
});

app.get('/history', (req, res) => {
	let history = c.getHistory();
	let ret = '';

	for (var session in history) {
		ret += '<div><h1>Session ' + parseInt(session - 100) + '</h1>' + parseInt(history[session]['E pres'] / 10000) + ' kWh<br/>';
		ret += 'Sec: ' + history[session]['started[s]'] + '</div>';
	}
	res.send(ret);
});