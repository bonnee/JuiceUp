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
			let parsedMessage = this._parseMessage(message);

			this.emit('message', {
				address: rinfo.address,
				data: parsedMessage
			})

			this.emit(rinfo.address, {
				data: parsedMessage
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
		try {
			let msg = message.toString().trim();

			if (msg.length == 0)
				return;

			if (msg.startsWith('TCH')) {
				msg = '{ "TCH-OK" }'
			}

			if (msg[0] == '"')
				msg = '{' + msg + '}';

			return JSON.parse(msg);
		} catch (err) {
			console.error('Error checking message "' + message + '": ' + err);
			return;
		}
	}
}