var PORT = 7090;
var HOST = '192.168.1.211';

/*let KeContact = require('./kebaudp.js');
let keba = new KeContact(HOST);

keba.getFirmware();*/

Client = require('./kebaudp.js')

const c = new Client(HOST, () => {

	console.log("Address:\t" + HOST);

	c.getModel((model) => {
		console.log("Model:\t\t" + model);
	})
	c.getSerial((sn) => {
		console.log("Serial:\t\t" + sn);
	})

	c.getFirmware((fw) => {
		console.log("Firmware:\t" + fw);
	})
});