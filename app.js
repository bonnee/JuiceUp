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

db.getWallboxes().forEach(box => {
	Kecontact.add(box.address);
});

app.use('/', require(path.join(__basedir, '/routes/ui.js')));
app.use('/api', require(path.join(__basedir, '/routes/api/index.js')));

module.exports = app;