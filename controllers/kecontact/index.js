const Socket = require('./socket.js');
const Intervals = require('./intervals.js');
const EventEmitter = require('events');
class Emitter extends EventEmitter {};

class KeContact {
	constructor(address) {
		this._address = address;

		this._socket = new Socket(this._address);
		this._emitter = new Emitter();
		this._intervals = new Intervals();

		this._timer;
	}

	init() {
		return this._socket.init();
	}

	getData() {
		return this._socket.getData();
	}

	getHistory() {
		return this._socket.getHistory();
	}

	start(token) {
		this._socket.send('start ' + token);
	}

	stop(token) {
		this._socket.send('stop ' + token);
	}

	close() {
		this._intervals.clearAll();
		this._socket.close();
	}
}

module.exports = KeContact;