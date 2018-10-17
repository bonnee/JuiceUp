const dgram = require('dgram');
const EventEmitter = require('events');
class Emitter extends EventEmitter {}

const PORT = 7090;
const BRD_PORT = 7092;

const POLL_FREQ = 30000;
const REQ_FREQ = 10;
const TIMEOUT = 5000;

class Intervals {
	constructor() {
		this._intervals = [];
	}

	add(fun, delay) {
		var newInterval = setInterval(fun, delay);

		return this._intervals.push(newInterval) - 1;
	}

	addOnce(fun, timeout) {
		var newTimeout = setTimeout(fun, timeout);

		return this._intervals.push(newTimeout) - 1;
	}

	clear(id) {
		if (id && this._intervals[id]) {
			clearInterval(this._intervals[id]);
			delete this._intervals[id];
			return true;
		}
		console.log('id doesn\'t exist');
		return false;
	}

	clearAll() {
		for (let interval in this._intervals) {
			this.clear(interval);
		}
		console.log(this._intervals);
	}
}

class KeContact {
	constructor(address) {
		this._txSocket = dgram.createSocket('udp4');
		this._rxSocket = dgram.createSocket('udp4');
		this._brdSocket = dgram.createSocket('udp4');

		this._emitter = new Emitter();
		this._intervals = new Intervals();

		this._address = address;

		this._sendQueue = [];

		this._data = {};
		this._history = [];

		this._timer;

		console.log('Address: ' + address);

		this._rxSocket.on('error', (err) => {
			console.error(err);
			process.exit(1);
		});

		this._brdSocket.on('message', (message, remote) => {
			try {
				this._resetTimer();
				this._updateHistory();

				this._saveData(this._parseMessage(message));
			} catch (e) {
				console.log('Error handling message: ' + e);
			}
		});

		this._brdSocket.on('listening', () => {
			console.log('Broadcast server listening');

			this._brdSocket.setBroadcast(true);
			this._brdSocket.setMulticastLoopback(true);
		});
	}

	init(callback = () => {}) {
		let err = false;

		this._rxSocket.on('listening', () => {
			console.log('Server listening');

			this._send('report 1');
			this._updateReports();
			this._updateHistory();

			this._resetTimer();
		});

		this._emitter.once('queue', () => {
			if (!err) {
				callback();
			}
		});

		this._emitter.once('timeout', () => {
			err = true;
			callback('timeout');
		});

		this._rxSocket.bind(PORT);
		//this._brdSocket.bind(BRD_PORT, '0.0.0.0');
	}

	_resetTimer() {
		this._intervals.clear(this._timer);

		this._timer = this._intervals.add(() => {
			console.log('Update data');
			this._updateReports();
			this._updateHistory();
		}, POLL_FREQ);
	}

	_parseMessage(message) {
		try {
			/*let str = '';
			for (let i in message) {
				str += String.fromCharCode(message[i])
			}
			console.log(String(str));*/

			let msg = message.toString().trim();

			if (msg.length == 0)
				return false;

			if (msg.startsWith('TCH')) {
				this._emitter.once('queue', () => { // UNTESTED: this was a timeout
					this._resetTimer();
					this._updateReports();
				});
				return false;
			}

			if (msg[0] == '"')
				msg = '{' + msg + '}';

			return JSON.parse(msg);
		} catch (e) {
			console.error(this._address + ': Error checking message ' + message + ': ' + e);
		}
	}

	_saveData(newData) {
		for (let key in newData) {
			if (key != 'ID')
				this._data[key] = newData[key];
		}
	}
	_saveHistory(newHistory) {
		let id = newHistory.ID;

		this._history[id] = newHistory;
	}


	_send(sendMsg) {
		this._sendQueue.push(sendMsg);

		if (this._sendQueue.length == 1) {
			this._handleQueue();
		}
	}

	_handleQueue(timeout_count = 0) {
		if (this._sendQueue.length == 0) {
			this._emitter.emit('queue');
			return;
		}

		let timeout = this._intervals.addOnce(() => {
			if (timeout_count >= 3) {
				this._emitter.emit('timeout');
				console.error(this._address + ': Giving up.');

				this._sendQueue.shift();
				this._handleQueue(timeout_count + 1);
			} else {
				console.error(this._address + ': Wallbox not responding. Retrying...');
				this._handleQueue(timeout_count + 1);
				this._resetTimer();
			}
		}, TIMEOUT);

		this._txSocket.send(Buffer.from(this._sendQueue[0]), PORT, this._address, (err) => {
			if (err)
				console.error(this._address + ': ' + err);
		});

		this._rxSocket.once('message', (message, rinfo) => {
			this._intervals.clear(timeout);

			let parsedMessage = this._parseMessage(message);

			if (parsedMessage) {
				if (parsedMessage.ID >= 10)
					this._saveHistory(parsedMessage);
				else
					this._saveData(parsedMessage);
			}

			this._sendQueue.shift();
			this._intervals.addOnce(this._handleQueue.bind(this), REQ_FREQ);
		});
	}

	_updateReports() {
		this._send('report 2');
		this._send('report 3');
	}

	_updateHistory(firstOnly = false) {
		if (firstOnly) {
			this._send('report 100');
		} else {
			for (let i = 100; i < 131; i++) {
				this._send('report ' + i)
			}
		}
	}

	getData() {
		return this._data;
	}

	getHistory() {
		return this._history;
	}

	start(token) {
		this._send('start ' + token);
		this._updateHistory(true);
	}

	stop(token) {
		this._send('stop ' + token);
		this._updateHistory(true);
	}

	close() {
		this._sendQueue = [];
		this._intervals.clearAll();
		this._txSocket.close();
		this._rxSocket.close();
		this._brdSocket.close();
	}
}

module.exports = KeContact;