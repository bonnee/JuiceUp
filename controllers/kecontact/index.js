const RX = require('./rx.js');
const TX = require('./tx.js');
const Intervals = require('./intervals.js');
const Storage = require('./storage.js');

const PORT = 7090;
const BRD_PORT = 7092;

const POLL_FREQ = 30000;
const TIMEOUT = 1000;

class KeContact {
	constructor() {
		// { <serial>: { address: <address>, port: <port>, <timer>, <storage> } }
		this._boxes = {};

		this._txSocket = new TX();
		this._rxSocket = new RX();
		this._intervals = new Intervals();

		this._rxSocket.on('message', ({
			address,
			data
		}) => {
			let serial = this.getSerial(address);

			if (this._boxes[serial]) {
				if (data.ID >= 10)
					this._boxes[serial].storage.saveHistory(data);
				else
					this._boxes[serial].storage.saveData(data);
			}
		});
		this._rxSocket.init(PORT);
	}

	add(address) {
		return new Promise((resolve, reject) => {
			if (this.getSerial(address)) {
				let err = new Error('Address is a duplicate');
				reject(err);
			}

			let done = false;
			this._txSocket.send('report 1', address);

			let timeoutCount = 0;
			let timeoutFunction = () => {
				if (!done) {
					if (timeoutCount >= 3) {
						let err = new Error('Error adding wallbox: timeout');
						reject(err);
					} else {
						console.warn('...');
						this._txSocket.send('report 1', address);
						timeout = this._intervals.addOnce(timeoutFunction, TIMEOUT);
						timeoutCount++;
					}
				}
			}
			let timeout = this._intervals.addOnce(timeoutFunction, TIMEOUT);

			this._rxSocket.once(address, ({
				data
			}) => {
				done = true; // WORKAROUND: code below should work but it doesn't
				//this._intervals.clear(timeout);

				if (data.ID == 1 && data.Serial && data.Product) {
					let serial = data.Serial.toString();
					let newBox = {
						address: address,
						storage: new Storage()
					}

					this._boxes[serial] = newBox;

					this._txSocket.updateReports(address);
					this._txSocket.updateHistory(address);

					this._resetTimer(serial);
					this._updateDateTime(serial);

					resolve(data);
				} else {
					connection.close();
					reject(new Error('Wallbox responded with invalid data'));
				}
			});

			this._rxSocket.once('error', err => {
				done = true;
				reject(err);
			});
		});
	}

	_resetTimer(serial) {
		this._intervals.clear(this._boxes[serial].timer);

		this._boxes[serial].timer = this._intervals.add(() => {
			console.log(serial + ': Update data');
			this._txSocket.updateReports(this.getAddress(serial));
			this._txSocket.updateHistory(this.getAddress(serial));
		}, POLL_FREQ);
	}

	_updateDateTime(serial) {
		let epoch = parseInt(new Date() / 1000);

		console.log("Updating DateTime", epoch, '(' + new Date() + ')');
		this._txSocket.send("setdatetime " + epoch, this.getAddress(serial));
	}

	getAddress(serial) {
		if (this._boxes[serial]) {
			return this._boxes[serial].address;
		}
	}

	getSerial(address) {
		for (let box in this._boxes) {
			if (this._boxes[box].address == address) {
				return box;
			}
		};
	}

	getData(serial) {
		if (this._boxes[serial])
			return this._boxes[serial].storage.getData();
	}

	getHistory(serial) {
		if (this._boxes[serial])
			return this._boxes[serial].storage.getHistory();
	}

	start(serial, token) {
		if (this._boxes[serial]) {
			this._txSocket.send('start ' + token, this.getAddress(serial));
			return true;
		}

		return false;
	}

	stop(serial, token) {
		if (this._boxes[serial]) {
			this._txSocket.send('stop ' + token, this.getAddress(serial));
			return true;
		}

		return false;
	}

	delete(serial) {
		if (this._boxes[serial]) {
			this._txSocket.delete(this.getAddress(serial));
			this._intervals.clear(this._boxes[serial].timer);
			delete this._boxes[serial];
			return true;
		}
		return false;
	}

	deleteAll() {
		this._intervals.clearAll();

		for (let box in this._boxes)
			this.close(box.constructor.name);
	}

	close() {
		this.deleteAll();

		this._txSocket.close();
		this._rxSocket.close();
	}
}

const instance = new KeContact();
Object.freeze(instance);

module.exports = instance;