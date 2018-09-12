let dgram = require('dgram');
const PORT = 7090;

var data = {}

class KeContact {
	constructor(remoteIP) {
		this.txSock = dgram.createSocket('udp4');
		this.rxSock = dgram.createSocket('udp4');
		this.address = remoteIP;

		this.sendQueue = [];

		this.rxSock.bind(PORT);

		this.rxSock.on('message', (message, rinfo) => {
			console.log(rinfo.address + " returned");

			let msg = message.toString().trim();

			if (msg.length == 0)
				return;

			if (msg.startsWith('TCH-OK'))
				return;

			if (msg[0] == '"') {
				msg = '{' + msg + '}';
			}

			this.decode(JSON.parse(msg));
		});

		this.send('report 1');
		this.send('report 2');
	}

	send(message) {
		this.sendQueue.push(message);

		if (!this.sendDelay) {
			this.sendNext();
			this.sendDelay = setInterval(this.sendNext.bind(this), 100);
		}
	}

	sendNext() {
		if (this.sendQueue.length == 0) {
			clearInterval(this.sendDelay);
			return;
		} else {
			let message = this.sendQueue.shift();
			this.txSock.send(Buffer.from(message), PORT, this.address, (err) => {
				if (err) {
					console.error(err);
					return;
				}
				console.log('Sent "' + message + '"');
			});
		}
	}

	decode(msg) {
		for (let key in msg) {
			data[key] = msg[key];
		}
	}

	getFirmware() {
		if (typeof data['Firmware'] == undefined) {
			this.send('report 1');
			return '';
		}

		return data["Firmware"];
	}
}

module.exports = KeContact;