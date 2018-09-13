const dgram = require('dgram');
const PORT = 7090;
const POLL_INTERVAL = 30000;

class KeContact {
	constructor(remoteIP) {
		this.socket = dgram.createSocket('udp4');
		this.server = dgram.createSocket('udp4');
		this.address = remoteIP;

		this.sendQueue = [];
		this.data = {};

		this.server.bind(PORT);

		this.server.on('error', (err) => {
			console.error(err);
			process.exit(1);
		});

		this.server.on('listening', () => {
			this.send('report 1');
			this.updateReports();
			setInterval(() => {
				console.log('Updating data...')
				this.updateReports();
			}, POLL_INTERVAL);
		});
	}

	parseMessage(message) {
		try {
			let msg = message.toString().trim();

			if (msg.length == 0)
				return;

			if (msg.startsWith('TCH-OK'))
				// TODO: Handle report update
				return;

			if (msg[0] == '"')
				msg = '{' + msg + '}';

			return JSON.parse(msg);
		} catch (e) {
			console.error('Error checking message: ' + e);
		}
	}

	updateCache(newData) {
		for (let key in newData) {
			if (key != 'ID')
				this.data[key] = newData[key];
		}
	}

	send(sendMsg) {
		this.sendQueue.push(sendMsg);

		if (this.sendQueue.length == 1)
			this.handleQueue();
	}

	handleQueue() {
		if (this.sendQueue.length == 0)
			return;

		let sendMsg = this.sendQueue[0];
		console.log('Sending: ' + sendMsg);
		this.socket.send(Buffer.from(sendMsg), PORT, this.address, (err) => {
			if (err)
				console.error(err);

		});
		this.server.once('message', (message, rinfo) => {
			console.log('Received response to ' + sendMsg);
			this.updateCache(this.parseMessage(message));

			this.sendQueue.shift();
			this.handleQueue();
		});
	}

	updateReports() {
		this.send('report 2');
		this.send('report 3');
	}

	getData() {
		return this.data;
	}
}

module.exports = KeContact;