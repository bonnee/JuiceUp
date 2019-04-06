const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const dataDir = '../data.json';

class DB {
	constructor() {
		this._adapter = new FileSync(dataDir);
		this._db = low(this._adapter);

		this._db.defaults({
			wallboxes: [],
			price: 0
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
			profile: 0,
			profiles: [{
				name: 'Default',
				auth: '0000000000000000'
			}],
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

	setPrice(newPrice) {
		this._db.set('price', parseFloat(newPrice)).write();
		return true;
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

	getPrice() {
		return this._db.get('price').value();
	}

	getProfiles(serial) {
		return this.retSerial(serial)
			.get('profiles').value();
	}

	addProfile(serial, name, auth) {
		let profiles = this.getProfiles(serial);

		profiles.push({
			name: name,
			auth: auth
		});

		this.retSerial(serial)
			.set('profiles', profiles).write();
	}

	setProfile(serial, id, name, auth) {
		this.retSerial(serial)
			.get('profiles')
			.nth(id)
			.assign({
				name: name,
				auth: auth
			}).write();
	}

	removeProfile(serial, id) {
		this.retSerial(serial)
			.get('profiles').pullAt(id).write();

		if (id == this.retSerial(serial).get('profile').value()) {
			this.setActiveProfile(serial, 0);
		}
	}

	setActiveProfile(serial, id) {
		this.retSerial(serial)
			.set('profile', id).write();
	}

	getActiveProfile(serial) {
		let id = this.retSerial(serial)
			.get('profile').value();

		return this.retSerial(serial)
			.get('profiles').nth(id).value();
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