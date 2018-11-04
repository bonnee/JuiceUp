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

	add(address) {
		return new Promise((resolve, reject) => {

			dns.lookup(address, (err, host) => {
				if (err) {
					console.error("Error resolving hostname: " + err);
					reject(err);
				}

				console.log("Address is: " + host);

				if (this._boxes[host]) {
					let err = Error("Connection already existing");
					console.error(err);
					reject(err);
				} else {
					let connection = new TX(host, PORT);
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

					this._rxSocket.once(host, ({
						data
					}) => {
						console.log('received');
						done = true; // WORKAROUND: code below should work but it doesn't
						//this._intervals.clear(timeout);

						if (data && data.Firmware) {
							this._boxes[host] = {};
							this._boxes[host].socket = connection;
							this._boxes[host].storage = new Storage();

							this._boxes[host].socket.updateReports();
							this._boxes[host].socket.updateHistory();
							this._resetTimer(host);

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

	_getAddress(serOrAddress) {
		if (this._boxes[address]) {
			return address;
		} else {
			for (let addr in this._boxes) {
				if (this._boxes[addr].storage.getData().Serial == address) {
					return addr;
				}
			}
		}
		return;
	}

	getData(address) {
		address = this._getAddress();

		if (address)
			return this._boxes[address].storage.getData();

		console.error('Not found ' + address);
		return;
	}

	getHistory(address) {
		address = this._getAddress();

		if (address)
			return this._boxes[address].storage.getHistory();

		console.error('Not found ' + address);
		return;
	}

	start(address, token) {
		address = this._getAddress();

		if (address) {
			this._boxes[address].socket.send('start ' + token);
			return true;
		}

		return false;
	}

	stop(address, token) {
		address = this._getAddress();

		if (address) {
			this._boxes[address].socket.send('stop ' + token);
			return true;
		}

		return false;
	}

	close(address) {
		address = this._getAddress(address);

		if (address) {
			this._boxes[address].socket.close();
			this._intervals.clear(this._boxes[address].timer);
			delete this._boxes[address];
			return true;
		}
		return false;
	}

	closeAll() {
		this._intervals.clearAll();

		for (box in this._boxes)
			box.socket.close();
	}
}

const instance = new KeContact();
Object.freeze(instance);

module.exports = instance;