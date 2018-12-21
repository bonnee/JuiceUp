var Kecontact = require('../controllers/kecontact');

const ADDRESS = '192.168.1.211';
var serial = null;

afterAll(() => {
	Kecontact.close();
});

describe('add', () => {
	test('Adding a wrong address should timeout', () => {
		expect.assertions(1);

		return Kecontact.add('255.255.255.255').catch(err => {
			expect(err).toBeInstanceOf(Error);
		});
	});

	test('add with a wrong responding address should throw', () => {
		expect.assertions(1);

		return expect(Kecontact.add('localhost')).rejects.toThrow();
	});

	test('add a wallbox should return the wallbox info', () => {
		let expected = {
			ID: expect.any(String),
			Product: expect.any(String),
			Serial: expect.any(String),
			Firmware: expect.any(String),
			"COM-module": expect.any(Number),
			Sec: expect.any(Number)
		}

		expect.assertions(1);

		return Kecontact.add(ADDRESS).then(data => {
			expect(data).toMatchObject(expected);
			serial = data.Serial;
		});
	});

	test('add a duplicate address should throw', () => {
		expect.assertions(1);

		return expect(Kecontact.add(ADDRESS)).rejects.toThrow();
	});
});

describe('getAddress', () => {
	test('getAddress should return the right address', () => {
		expect.assertions(1);

		expect(Kecontact.getAddress(serial)).toBe(ADDRESS);
	});

	test('getAddress with wrong address should return undefined', () => {
		expect.assertions(1);

		expect(Kecontact.getAddress('255.255.255.255')).toBeUndefined();
	});
});

describe('getSerial', () => {
	test('getSerial should return the right SN', () => {
		expect.assertions(1);

		expect(Kecontact.getSerial(ADDRESS)).toBe(serial);
	});

	test('getSerial with wrong SN should return undefined', () => {
		expect.assertions(1);

		expect(Kecontact.getSerial('123456')).toBeUndefined();
	});
});

describe('getData', () => {
	test('getData should return an object', () => {
		expect.assertions(1);

		expect(Kecontact.getData(serial)).toBeInstanceOf(Object);
	});

	test('getData with wrong SN should return undefined', () => {
		expect.assertions(1);

		expect(Kecontact.getData('123456')).toBeUndefined();
	});
});

describe('getHistory', () => {
	test('getHistory should return an object', () => {
		expect.assertions(1);

		expect(Kecontact.getHistory(serial)).toBeInstanceOf(Object);
	});

	test('getHistory with wrong SN should return undefined', () => {
		expect.assertions(1);

		expect(Kecontact.getHistory('123456')).toBeUndefined();
	});
});

describe('delete', () => {
	test('delete should delete the wallbox', () => {
		expect.assertions(3);

		expect(Kecontact.delete(serial)).toBeTruthy();

		expect(Kecontact.getAddress(serial)).toBeUndefined();
		expect(Kecontact.getData(serial)).toBeUndefined();
	});

	test('delete with wrong serial should return false', () => {
		expect.assertions(1);

		expect(Kecontact.delete(serial)).toBeFalsy();
	});
});