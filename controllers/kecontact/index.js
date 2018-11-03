const RX = require('./rx.js');
const TX = require('./tx.js');
const Intervals = require('./intervals.js');
const Storage = require('./storage.js');
const dns = require('dns');

const PORT = 7090;
const BRD_PORT = 7092;

const POLL_FREQ = 30000;
const TIMEOUT = 5000;

class KeContact {
	constructor() {
		// [ <address>: { <socket>, <timer>, <storage> } ]
		this._boxes = [];

		this._rxSocket = new RX();
		this._intervals = new Intervals();

		this._rxSocket.on('message', ({
			address,
			data
		}) => {
			if (this._boxes[address]) {
				if (data["TCH-OK"]) {
					this._resetTimer(address);
					this._boxes[address].socket._updateReports();
					return;
				}

				if (data.ID >= 10)
					this._boxes[address].storage.saveHistory(data);
				else
					this._boxes[address].storage.saveData(data);
			}
		});
		this._rxSocket.init(PORT);
	}

	add(host) {
		return new Promise((resolve, reject) => {

			dns.lookup(host, (err, address, family) => {
				if (this._boxes[address]) {
					let err = Error("Connection already existing")
					console.error(err);
					reject(err);
				} else {
					let connection = new TX(address, PORT);
					connection.init();
					let done = false;

					let timeoutCount = 0;
					let timeoutFunction = () => {
						if (!done) {
							if (timeoutCount >= 3) {
								console.error('Error adding wallbox: timeout');
								reject('timeout');
							} else {
								console.warn('Not responding. Retrying...');
								timeout = this._intervals.addOnce(timeoutFunction, TIMEOUT);
								timeoutCount++;
							}
						}
					}
					let timeout = this._intervals.addOnce(timeoutFunction, TIMEOUT);

					this._rxSocket.once(address, ({
						data
					}) => {
						console.log('received');
						done = true; // WORKAROUND: code below should work but it doesn't
						//this._intervals.clear(timeout);

						if (data && data.Firmware) {
							this._boxes[address] = {};
							this._boxes[address].socket = connection;
							this._boxes[address].storage = new Storage();

							this._boxes[address].socket.updateReports();
							this._boxes[address].socket.updateHistory();
							this._resetTimer(address);

							resolve(data.serial);
						} else {
							reject('wrong data');
						}
					});
				}
			});
		});
	}

	_resetTimer(address) {
		this._intervals.clear(this._boxes[address].timer);

		this._boxes[address].timer = this._intervals.add(() => {
			console.log(address + ': Update data');
			this._boxes[address].socket.updateReports();
			this._boxes[address].socket.updateHistory();
		}, POLL_FREQ);
	}

	getData(address) {
		if (this._boxes[address]) {
			return this._boxes[address].storage.getData();
		} else {
			let box;
			for (let b in this._boxes) {
				if (this._boxes[b].storage.getData().Serial == address) {
					box = this._boxes[b];
				}
			}

			if (box)
				return box.storage.getData();
		}
		console.error('Not found ' + address);
		return false;
	}

	getHistory(address) {
		if (this._boxes[address]) {
			return this._boxes[address].storage.getHistory();
		} else {
			let box;
			for (let b in this._boxes) {
				if (this._boxes[b].storage.getData().Serial == address) {
					box = this._boxes[b];
				}
			}

			if (box)
				return box.storage.getHistory();
		}
		console.error('Not found ' + address);
		return false;
	}

	start(address, token) {
		this._boxes[address].socket.send('start ' + token);
	}

	stop(address, token) {
		this._boxes[address].socket.send('stop ' + token);
	}

	close() {
		this._intervals.clearAll();
		for (box in this._boxes)
			box.socket.close();
	}
}

const instance = new KeContact();
Object.freeze(instance);

module.exports = instance;