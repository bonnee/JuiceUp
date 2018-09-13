const HOST = '192.168.1.211';
const WEBPORT = 3000;
const Client = require('./kebaudp.js')
const express = require('express');
const moment = require('moment');

var app = express();

const c = new Client(HOST)

app.listen(WEBPORT, function () {
	console.log('JuiceUp online on port ' + WEBPORT);
});

app.get('/', (req, res) => {
	let data = c.getData();

	let start = moment.duration(data.Sec, 'seconds');

	let ret = `Device data:<br>Model: ${data.Product}<br>Serial No: ${data.Serial}<br>FW Version: ${data.Firmware}<br>Uptime: ${start.humanize()}<br><br>`;
	ret += `Charge data:<br>State: ${data.State}<br>Plug status: ${data.Plug}<br>HW Current: ${data["Curr HW"]}<br>Max Current: ${data["Max curr"]}<br><br>`
	ret += `Charge stats:<br>Session energy ${data['E pres']} Wh<br>Total Energy ${data['E total']/10000}kWh<br>`
	res.send(ret);
});

app.get('/history', (req, res) => {
	let history = c.getHistory();
	let ret = '';

	for (var session in history) {
		ret += '<div><h1>Session ' + parseInt(session - 100) + '</h1>' + parseInt(history[session]['E pres'] / 10000) + ' kWh</div>';
	}
	res.send(ret);
});