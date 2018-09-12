let dgram = require('dgram');
let defaultSize = 16;
let port = 7090;

class KeContact {
	constructor(remoteIP, callback) {
		this.socket = dgram.createSocket('udp4');
		this.server = dgram.createSocket('udp4');
		this.address = remoteIP

		this.server.bind(port);

		this.server.on('listening', () => {
			callback();
		});
	}

	send(msg) {
		this.socket.send(Buffer.from(msg), port, this.address, (err) => {
			if (err) {
				console.error(err);
				socket.close();
			}
		});

		return new Promise((resolve, reject) => {
			this.server.on('message', (msg, rinfo) => {
				resolve(msg.toString())
			});
		});

	}

	getFirmware(callback) {
		this.send('report 1').then((result) => {
			callback(JSON.parse(result).Firmware);
		});
	}

	getModel(callback) {
		this.send('report 1').then((result) => {
			callback(JSON.parse(result).Product);
		});
	}

	getSerial(callback) {
		this.send('report 1').then((result) => {
			callback(JSON.parse(result).Serial);
		});
	}
}



module.exports = KeContact;