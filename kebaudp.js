const dgram = require('dgram');
const PORT = 7090;
const BRD_PORT = 7092;

const POLL_FREQ = 30000;
const REQ_FREQ = 10;

class KeContact {
	constructor(address) {
		this.txSocket = dgram.createSocket('udp4');
		this.rxSocket = dgram.createSocket('udp4');
		this.brdSocket = dgram.createSocket('udp4');

		this.address = address;

		this.sendQueue = [];

		this.data = {};
		this.history = [];

		this.timer;

		this.rxSocket.on('error', (err) => {
			console.error(err);
			process.exit(1);
		});

		this.brdSocket.on('message', (message, remote) => {
			try {
				this._resetTimer();
				this._updateHistory();

				this._saveData(this._parseMessage(message));
			} catch (e) {
				console.log('Error handling message: ' + e);
			}
		});

		this.brdSocket.on('listening', () => {
			console.log('Broadcast server listening');

			this.brdSocket.setBroadcast(true);
			this.brdSocket.setMulticastLoopback(true);
		});

		this.rxSocket.on('listening', () => {
			console.log('Server listening');

			this._send('report 1');
			this._updateReports();
			this._updateHistory();

			this._resetTimer();
		});

		this.rxSocket.bind(PORT);
		this.brdSocket.bind(BRD_PORT, '0.0.0.0');
	}

	_resetTimer() {
		if (this.timer)
			clearInterval(this.timer);

		this.timer = setInterval(() => {
			console.log('Update data');
			this._updateReports();
		}, POLL_FREQ);
	}

	_parseMessage(message) {
		try {
			let msg = message.toString().trim();

			if (msg.length == 0)
				return;

			if (msg.startsWith('TCH-OK')) {
				this._resetTimer();
				this._updateReports();
				return;
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
				this.data[key] = newData[key];
		}
	}
	_saveHistory(newHistory) {
		let id = newHistory.ID;

		this.history[id] = newHistory;
	}


	_send(sendMsg) {
		this.sendQueue.push(sendMsg);

		if (this.sendQueue.length == 1)
			this._handleQueue();
	}

	_handleQueue() {
		if (this.sendQueue.length == 0)
			return;

		let sendMsg = this.sendQueue[0];
		this.txSocket.send(Buffer.from(sendMsg), PORT, this.address, (err) => {
			if (err)
				console.error(err);

		});
		this.rxSocket.once('message', (message, rinfo) => {
			let parsedMessage = this._parseMessage(message);

			if (parsedMessage.ID >= 10)
				this._saveHistory(parsedMessage);
			else
				this._saveData(parsedMessage);

			this.sendQueue.shift();
			setTimeout(this._handleQueue.bind(this), REQ_FREQ);
		});
	}

	_updateReports() {
		this._send('report 2');
		this._send('report 3');
	}

	_updateHistory() {
		for (let i = 101; i < 131; i++) {
			this._send('report ' + i)
		}
	}

	getData() {
		return this.data;
	}

	getHistory() {
		return this.history;
	}
}

module.exports = KeContact;