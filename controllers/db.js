const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const dataDir = __basedir + '/data.json';

class DB {
	constructor() {
		this._adapter = new FileSync(dataDir);
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

	editWallbox(serial, data) {
		this._db.get('wallboxes').find({
				serial: serial
			})
			.assign({
				name: data.name,
				address: data.address
			})
			.write();
	}

	setPrice(newPrice) {
		this._db.set('price', parseFloat(newPrice)).write();
		return true;
	}

	getPrice() {
		return this._db.get('price').value();
	}

	getWallboxes() {
		return this._db.get('wallboxes').value();
	}

	getWallbox(serial) {
		return this._db.get('wallboxes').find({
			serial: serial
		}).value()
	}

	removeWallbox(serial) {
		this._db.get('wallboxes').remove({
			serial: serial
		}).write();
	}
}

const instance = new DB();
Object.freeze(instance);

module.exports = instance;