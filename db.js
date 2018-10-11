const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

class db {
	constructor(fileName) {
		this._adapter = new FileSync(fileName);
		this._db = low(this._adapter);

		this._db.defaults({
			wallboxes: [],
			price: 0
		}).write();
	}

	addWallbox(data) {
		this._db.get('wallboxes').push({
			serial: data.serial,
			name: data.name,
			address: data.address,
			product: data.product
		}).write();
	}

	setPrice(newPrice) {
		this._db.set('price', parseFloat(newPrice)).write();
	}

	getPrice() {
		return this._db.get('price').value();
	}

	getWallboxes() {
		return this._db.get('wallboxes').value();
	}

	removeWallbox(serial) {
		this._db.get('wallboxes').remove({
			serial: serial
		}).write();
	}
}

module.exports = db;