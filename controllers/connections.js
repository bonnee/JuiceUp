const Kecontact = require(__basedir + '/controllers/kecontact/index.js');

module.exports = class Connections {
	constructor() {
		this._conns = [];
	}

	add(address) {
		let promise = new Promise((resolve, reject) => {
			let newConn = new Kecontact(address);

			newConn.init().then((id) => {
				this._conns[id] = newConn;
				resolve('ok');
			}).catch((err) => {
				newConn.close();
				newConn = null;
				reject(err);
			});
		});

		return promise
	}

	get() {
		return this._conns;
	}
}