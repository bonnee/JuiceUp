var PORT = 7090;
var HOST = '192.168.1.211';

const Client = require('./kebaudp.js')
const express = require('express');

var app = express();

const c = new Client(HOST)

app.listen(3000, function () {
	console.log('JuiceUp 3000!');
});

app.get('/', function (req, res) {
	c.getDevice((dev) => {
		res.send(`Device data:<br>Model: ${dev.Product}<br>Serial #: ${dev.Serial}<br>FW Version: ${dev.Firmware}`);
	});
});

console.log("Address:\t" + HOST);