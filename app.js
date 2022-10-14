global.__basedir = __dirname;

const path = require('path');
const Kecontact = require(__basedir + '/controllers/kecontact');
const db = require(__basedir + '/controllers/db.js');
const bodyParser = require('body-parser');
const express = require('express');
const i18n = require('i18n');
const cookieParser = require('cookie-parser');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


i18n.configure({
	locales:['en', 'de'],
	directory: __dirname + '/locales',
	defaultLocale: 'en',
	queryParameter: 'lang',
	register: global,
	cookie: 'language',
    objectNotation: true,
});

app.set('views', path.join(__basedir, '/views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__basedir, '/public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(cookieParser());
app.use(i18n.init);
app.locals.moment = require('moment');

io.on('connection', socket => {
	console.log('a user connected');

	socket.on('meter', serial => {
		let data = Kecontact.getData(serial);
		socket.emit('meter', data);
	});
});

Kecontact.on('message', data => {
	io.emit(data.serial, data.data);
});

var connect = (box) => {
	return new Promise((resolve, reject) => {
		Kecontact.add(box.address, 0)
			.then(() => {
				resolve();
			})
			.catch(e => {
				if (Kecontact.getAddress(box.serial)) {
					resolve();
				} else {
					db.setError(box.serial, true);
				}
			});
	});
}

db.getAllWallboxes().forEach(box => {

	connect(box).then(() => {
		console.log(box.serial, "added.");
		db.setError(box.serial, false);
	}).catch(e => {
		console.error(e);
	});
});

app.use(function(req, res, next) {
	// express helper for natively supported engines
	res.locals.__ = res.__ = function() {
		return i18n.__.apply(req, arguments);
	};
	next();
});
app.use('/', require(path.join(__basedir, '/routes/ui.js')));
app.use('/api', require(path.join(__basedir, '/routes/api/index.js')));

http.listen(process.env.PORT || 3000, () => {
	console.log('JuiceUp Started!');
});
