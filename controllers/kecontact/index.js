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
				reject(new Error('Address is a duplicate'));
			}

			this._txSocket.send('report 1', address);
			let timeout;

			let recv = ({
				data
			}) => {
				if (data.ID == 1 && data.Serial && data.Product) {
					this._intervals.clear(timeout);

					let serial = data.Serial.toString();
					let newBox = {
						address: address,
						storage: new Storage()
					}

					this._boxes[serial] = newBox;

					this._txSocket.updateReports(address);
					this._txSocket.updateHistory(address);

					if (data.timeQ != 'X') {
						this._updateDateTime(serial);
					}

					this._resetTimer(serial);

					resolve(data);
				} else {
					connection.close();
					reject(new Error('Wallbox responded with invalid data'));
				}
			};

			let timeoutCount = 0;
			let timeoutFunction = () => {
				if (timeoutCount >= 3) {

					this._rxSocket.removeListener(address, recv);

					reject(new Error('timeout'));
				} else {
					console.warn('...');
					this._txSocket.send('report 1', address);
					timeout = this._intervals.addOnce(timeoutFunction, TIMEOUT);
					timeoutCount++;
				}
			}

			timeout = this._intervals.addOnce(timeoutFunction, TIMEOUT);

			this._rxSocket.once(address, recv);

			this._rxSocket.once('error', err => {
				done = true;
				reject(err);
			});
		});
	}

	_ping(serial) {
		console.log('ping', serial);
		this._txSocket.send('i', this.getAddress(serial));

		let interval = this._intervals.addOnce(() => {

			this._rxSocket.removeListener(this.getAddress(serial), checkmsg);
			this._boxes[serial].storage.setError(true);

		}, TIMEOUT + this._txSocket.getQueueLength() * 100) // TODO: Make all consts global

		let checkmsg = (msg) => {
			if ('Firmware' in msg.data && !('ID' in msg.data)) {
				this._intervals.clear(interval);
				this._rxSocket.removeListener(this.getAddress(serial), checkmsg);

				this._boxes[serial].storage.setError(false);
			}
		}

		this._rxSocket.on(this.getAddress(serial), checkmsg);
	}

	_resetTimer(serial) {
		this._intervals.clear(this._boxes[serial].timer);

		this._boxes[serial].timer = this._intervals.add(() => {
			console.log(serial + ': Update data');
			this._txSocket.updateReports(this.getAddress(serial));
			this._txSocket.updateHistory(this.getAddress(serial));
		}, POLL_FREQ);

		this._intervals.clear(this._boxes[serial].ping);

		this._intervals.addOnce(() => {
			this._boxes[serial].ping = this._intervals.add(() => {
				this._ping(serial);
			}, POLL_FREQ);
		}, POLL_FREQ / 2)
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