const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const dataDir = '../data.json';

class DB {
	constructor() {
		this._adapter = new FileSync(dataDir);
		this._db = low(this._adapter);

		this._db.defaults({
			wallboxes: [],
			profiles: [{
				name: 'Default',
				auth: '0000000000000000',
				price: 0.3
			}]
		}).write();
	}

	retSerial(serial) {
		return this._db.get('wallboxes').find({
			serial: serial
		});
	}

	addWallbox(data) {
		this._db.get('wallboxes').push({
			serial: data.serial,
			name: data.name,
			address: data.address,
			product: data.product,
			error: false
		}).write();
	}

	editWallbox(serial, data) {
		this.retSerial(serial)
			.assign({
				name: data.name,
				address: data.address
			})
			.write();
	}

	setError(serial, err) {
		this.retSerial(serial)
			.assign({
				error: err
			}).write();
		return true;
	}

	getError(serial) {
		return this._db.get('wallboxes').find({
			serial: serial
		}).get('error').value()
	}

	getProfiles() {
		return this._db.get('profiles').value();
	}

	addProfile(name, auth, price) {
		let profiles = this.getProfiles();

		profiles.push({
			name: name,
			auth: auth,
			price: price
		});

		this._db.set('profiles', profiles).write();
		return profiles.length;
	}

	setProfile(id, name, auth, price) {
		this._db.get('profiles')
			.nth(id)
			.assign({
				name: name,
				auth: auth,
				price: price
			}).write();
	}

	removeProfile(id) {
		this._db.get('profiles').pullAt(id).write();
	}

	getActiveWallboxes() {
		return this._db.get('wallboxes').filter({
			error: false
		}).value();
	}

	getAllWallboxes() {
		return this._db.get('wallboxes').value();
	}

	getWallbox(serial) {
		return this.retSerial(serial)
			.value()
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