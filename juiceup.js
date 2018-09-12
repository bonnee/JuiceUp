const HOST = '192.168.1.211';

Keba = require('./kebaudp.js')

const c = new Keba(HOST);

setInterval(() => {
	console.log(c.data)
}, 1000);