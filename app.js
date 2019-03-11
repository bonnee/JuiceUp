global.__basedir = __dirname;

const path = require('path');
const Kecontact = require(__basedir + '/controllers/kecontact');
const db = require(__basedir + '/controllers/db.js');
var bodyParser = require('body-parser');
var express = require('express');

var app = express();

app.set('views', path.join(__basedir, '/views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__basedir, '/public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

var connect = (box, ttl) => {
	return new Promise((resolve, reject) => {
		Kecontact.add(box.address)
			.then(() => {
				resolve();
			}).catch(e => {
				if (Kecontact.getAddress(box.serial)) {
					resolve();
				} else {
					db.setError(box.serial, true);

					if (ttl === 1) return reject(e);
					setTimeout(() => {
						connect(box, ttl - 1).then(resolve).catch(reject);
					}, 10000);
				}
			});
	});
}

db.getAllWallboxes().forEach(box => {

	connect(box, 5).then(() => {
		console.log(box.serial, "added.");
		db.setError(box.serial, false);
	}).catch(e => {
		console.error(e);
	});
});


app.use('/', require(path.join(__basedir, '/routes/ui.js')));
app.use('/api', require(path.join(__basedir, '/routes/api/index.js')));

module.exports = app;