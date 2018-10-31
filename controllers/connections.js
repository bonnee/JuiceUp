module.exports = class Connections {
	constructor() {
		this._conns = [];
	}

	add(connection, id) {
		this._conns[id] = connection;
	}

	get() {
		return this._conns;
	}
}