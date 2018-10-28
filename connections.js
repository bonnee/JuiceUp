module.exports = class Connections {
	constructor() {
		this._conns = [];
	}

	add(newConn, id) {
		if (id) {
			this._conns[id] = newConn;
			return id;
		}
		return this._conns.push(newConn) - 1;
	}

	get() {
		return this._conns;
	}
}