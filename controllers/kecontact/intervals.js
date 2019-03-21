module.exports = class Intervals {
	constructor() {
		this._intervals = [];
	}

	add(fun, delay) {
		var newInterval = setInterval(fun, delay);

		return this._intervals.push(newInterval) - 1;
	}

	addOnce(fun, timeout) {
		var newTimeout = setTimeout(fun, timeout);

		return this._intervals.push(newTimeout) - 1;
	}

	clear(id) {
		if (id in this._intervals) {
			clearInterval(this._intervals[id]);
			delete this._intervals[id];

			return true;
		}
		return false;
	}

	clearAll() {
		for (let interval in this._intervals) {
			this.clear(interval);
		}
	}

	get() {
		return this._intervals;
	}
}