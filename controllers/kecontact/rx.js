const dgram = require('dgram');
const EventEmitter = require('events');

module.exports = class RX extends EventEmitter {
	constructor() {
		super();
		this._socket = dgram.createSocket('udp4');

		this._socket.on('error', (err) => {
			console.error(err);
			process.exit(1);
		});

		this._socket.on('message', (message, rinfo) => {
			this._parseMessage(message).then((parsedMessage) => {
				this.emit('message', {
					address: rinfo.address,
					data: parsedMessage
				});

				this.emit(rinfo.address, {
					data: parsedMessage
				});
			}).catch((err) => {
				this.emit('error', err);
			});
		});
	}

	init(port) {
		this._socket.bind(port);
	}

	close() {
		this._socket.close();
	}

	_parseMessage(message) {
		return new Promise((resolve, reject) => {
			try {
				let msg = message.toString().trim();

				if (msg.length == 0)
					return;

				if (msg.startsWith('TCH')) {
					msg = '{ "TCH-OK" }'
				}

				if (msg[0] == '"')
					msg = '{' + msg + '}';

				resolve(JSON.parse(msg));
			} catch (err) {
				console.error(err);
				reject('wrong data');
			}
		});
	}
}