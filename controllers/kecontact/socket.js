const dgram = require('dgram');
const Intervals = require('./intervals.js');
const EventEmitter = require('events');
class Emitter extends EventEmitter {}

const PORT = 7090;
const BRD_PORT = 7092;

const POLL_FREQ = 30000;
const REQ_FREQ = 10;

const TIMEOUT = 5000;

module.exports = class KC_Socket {
	constructor(address) {
		this._address = address;

		this._sendQueue = [];

		this._data = {};
		this._history = [];

		this._emitter = new Emitter();
		this._intervals = new Intervals();

		this._txSocket = dgram.createSocket('udp4');
		this._rxSocket = dgram.createSocket('udp4');
		this._brdSocket = dgram.createSocket('udp4');

		this._rxSocket.on('error', (err) => {
			console.error(this._address + ':' + err.stack);
			process.exit(1);
		});

		this._brdSocket.on('message', (message, remote) => {
			try {
				this._resetTimer();
				this._updateHistory();

				this._saveData(this._parseMessage(message));
			} catch (e) {
				console.log(this._address + ': Error handling message: ' + e.stack);
			}
		});

		this._brdSocket.on('listening', () => {
			console.log('Broadcast server listening');

			this._brdSocket.setBroadcast(true);
			this._brdSocket.setMulticastLoopback(true);
		});
	}

	init() {
		let err = false;
		let promise = new Promise((resolve, reject) => {

			this._rxSocket.once('listening', () => {
				this.send('report 1');
			});

			this._emitter.on('timeout', () => {
				err = true;
				reject('timeout');
			});

			this._emitter.once('queue', () => {
				if (!err) {
					if (this._data.Firmware) {
						this._updateReports();
						this._updateHistory();
						this._resetTimer();

						console.log(this._address + ': device is right')
						resolve(this._data.Serial);
					} else {
						reject('wrong data');
					}
				}
			});

			this._rxSocket.bind(PORT);
		});

		return promise;
	}

	send(sendMsg) {
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

	_parseMessage(message) {
		try {
			let msg = message.toString().trim();

			if (msg.length == 0)
				return;

			if (msg.startsWith('TCH')) {
				this._emitter.once('queue', () => { // UNTESTED: this was a timeout
					this._resetTimer();
					this._updateReports();
				});
				return;
			}

			if (msg[0] == '"')
				msg = '{' + msg + '}';

			return JSON.parse(msg);
		} catch (e) {
			console.error(this._address + ': Error checking message ' + message + ': ' + e);
			return;
		}
	}

	_resetTimer() {
		this._intervals.clear(this._timer);

		this._timer = this._intervals.add(() => {
			console.log(this._address + ': Update data');
			this._updateReports();
			this._updateHistory();
		}, POLL_FREQ);
	}

	_updateReports() {
		this.send('report 2');
		this.send('report 3');
	}

	_updateHistory(firstOnly = false) {
		if (firstOnly) {
			this.send('report 100');
		} else {
			for (let i = 100; i < 131; i++) {
				this.send('report ' + i)
			}
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

	getData() {
		return this._data;
	}

	getHistory() {
		return this._history;
	}

	close() {
		this._sendQueue = [];
		this._intervals.clearAll();
		this._txSocket.close();
		this._rxSocket.close();
		this._brdSocket.close();
	}
}