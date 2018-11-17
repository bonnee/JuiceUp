const dgram = require('dgram');
const Intervals = require('./intervals.js');

const PORT = 7090;
const REQ_FREQ = 500;

module.exports = class RX {
	constructor() {
		this._sendQueue = [];
		this._running = false;

		this._intervals = new Intervals();
		this._socket = dgram.createSocket('udp4');
	}

	send(message, address, port) {
		this._sendQueue.push({
			message: message,
			address: address,
			port: port
		});

		if (!this._running) {
			this._running = true;
			this._handleQueue();
		}
	}

	updateReports(address) {
		this.send('report 2', address);
		this.send('report 3', address);
	}

	updateHistory(address, firstOnly = false) {
		if (firstOnly) {
			this.send('report 100', address);
		} else {
			for (let i = 100; i < 131; i++) {
				this.send('report ' + i, address)
			}
		}
	}

	delete(address) {
		for (let msg in this._sendQueue) {
			if (msg.address == address)
				msg.splice(this._sendQueue.indexOf(msg), 1);
		}

	}

	_handleQueue() {
		if (this._sendQueue.length == 0) {
			this._running = false;
			return;
		}

		let first = this._sendQueue[0]

		this._socket.send(Buffer.from(first.message), first.port || PORT, first.address, (err) => {
			if (err) {
				console.error(this._address, ': Error sending:', err);

			}
			this._sendQueue.shift();

			this._intervals.addOnce(this._handleQueue.bind(this), REQ_FREQ);
		});
	}
}