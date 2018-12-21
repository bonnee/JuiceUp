const dgram = require('dgram');
const Intervals = require('./intervals.js');

const PORT = 7090;
const REQ_FREQ = 100;

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

	// TODO: figure out why loop is skipping items
	delete(address) {
		this._intervals.clearAll();

		for (let key in this._sendQueue) {
			if (this._sendQueue[key].address == address) {
				this._sendQueue.splice(key, 1);
			}
		}

		this._handleQueue();
	}

	close() {
		this._socket.close();
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