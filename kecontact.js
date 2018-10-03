const dgram = require('dgram');
const PORT = 7090;
const BRD_PORT = 7092;

const POLL_FREQ = 30000;
const REQ_FREQ = 10;
const TIMEOUT = 5000;

class KeContact {
	constructor(address) {
		this._txSocket = dgram.createSocket('udp4');
		this._rxSocket = dgram.createSocket('udp4');
		this._brdSocket = dgram.createSocket('udp4');

		this._address = address;

		this._sendQueue = [];

		this._data = {};
		this._history = [];

		this._timer;

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

		this._rxSocket.on('listening', () => {
			console.log('Server listening');

			this._send('report 1');
			this._updateReports();
			this._updateHistory();

			this._resetTimer();
		});

		this._rxSocket.bind(PORT);
		this._brdSocket.bind(BRD_PORT, '0.0.0.0');
	}

	_resetTimer() {
		if (this._timer)
			clearInterval(this._timer);

		this._timer = setInterval(() => {
			console.log('Update data');
			this._updateReports();
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
				console.log(msg)
				setTimeout(() => { // Give time to values to update
					this._resetTimer();
					this._updateReports();
				}, 1000);
				return false;
			}

			if (msg[0] == '"')
				msg = '{' + msg + '}';

			return JSON.parse(msg);
		} catch (e) {
			console.error('Error checking message: ' + e);
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

		if (this._sendQueue.length == 1)
			this._handleQueue();
	}

	_handleQueue() {
		if (this._sendQueue.length == 0)
			return;

		this._txSocket.send(Buffer.from(this._sendQueue[0]), PORT, this._address, (err) => {
			if (err)
				console.error(err);
		});

		let timeout = setTimeout(() => {
			console.error('Wallbox not responding. Retrying...');
			this._handleQueue();
		}, TIMEOUT);

		this._rxSocket.once('message', (message, rinfo) => {
			clearTimeout(timeout);
			let parsedMessage = this._parseMessage(message);

			if (parsedMessage) {
				if (parsedMessage.ID >= 10)
					this._saveHistory(parsedMessage);
				else
					this._saveData(parsedMessage);
			}

			this._sendQueue.shift();
			setTimeout(this._handleQueue.bind(this), REQ_FREQ);
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
}

module.exports = KeContact;