const dgram = require('dgram');
const Intervals = require('./intervals.js');

const REQ_FREQ = 10;

module.exports = class RX {
	constructor(address, port) {
		this._address = address;
		this._port = port;
		this._sendQueue = [];

		this._intervals = new Intervals();
		this._socket = dgram.createSocket('udp4');
	}

	init() {
		this.send('report 1');
	}

	send(message) {
		this._sendQueue.push(message);

		if (this._sendQueue.length == 1) {
			this._handleQueue();
		}
	}

	updateReports() {
		this.send('report 2');
		this.send('report 3');
	}

	updateHistory(firstOnly = false) {
		if (firstOnly) {
			this.send('report 100');
		} else {
			for (let i = 100; i < 131; i++) {
				this.send('report ' + i)
			}
		}
	}

	close() {
		this._sendQueue = [];
		this._intervals.clearAll();
		this._socket.close();
	}

	_handleQueue() {
		if (this._sendQueue.length == 0) {
			return;
		}

		this._socket.send(Buffer.from(this._sendQueue[0]), this._port, this._address, (err) => {
			if (err)
				console.error(this._address + ': ' + err);
			else
				this._sendQueue.shift();

			this._intervals.addOnce(this._handleQueue.bind(this), REQ_FREQ);
		});
	}
}