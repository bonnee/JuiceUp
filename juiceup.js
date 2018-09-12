const PORT = 7090;
const HOST = '192.168.1.211';

const Client = require('./kebaudp.js')
const express = require('express');

var app = express();

const c = new Client(HOST)

app.listen(3000, function () {
	console.log('JuiceUp 3000!');
});

app.get('/', function (req, res) {
	c.getDevice((dev) => {
		c.getChgSettings((chg) => {
			let ret = `Device data:<br>Model: ${dev.Product}<br>Serial No: ${dev.Serial}<br>FW Version: ${dev.Firmware}<br><br>`;
			ret += `Charge data:<br>State: ${chg.State}<br>Plug status: ${chg.Plug}<br>HW Current: ${chg["Curr HW"]}<br>Max Current: ${chg["Max curr"]}`

			res.send(ret);
		});
	});


});

console.log("Address:\t" + HOST);