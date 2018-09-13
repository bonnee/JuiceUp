const HOST = '192.168.1.211';
const WEBPORT = 3000;
const Client = require('./kebaudp.js')
const express = require('express');

var app = express();

const c = new Client(HOST)

app.listen(WEBPORT, function () {
	console.log('JuiceUp online on port ' + WEBPORT);
});

app.get('/', function (req, res) {
	let data = c.getData();
	let ret = `Device data:<br>Model: ${data.Product}<br>Serial No: ${data.Serial}<br>FW Version: ${data.Firmware}<br>Seconds: ${data.Sec}<br><br>`;
	ret += `Charge data:<br>State: ${data.State}<br>Plug status: ${data.Plug}<br>HW Current: ${data["Curr HW"]}<br>Max Current: ${data["Max curr"]}<br><br>`
	ret += `Charge stats:<br>Session energy ${data['E pres']} Wh<br>Total Energy ${data['E total']} Wh<br>`
	res.send(ret);
});