global.__basedir = __dirname;

const WEBPORT = 3000;

const Connections = require(__basedir + '/controllers/connections.js');
const Kecontact = require(__basedir + '/controllers/kecontact');
const db = require(__basedir + '/controllers/db.js');
const express = require('express');
var app = express();
var bodyParser = require('body-parser');
var connections = new Connections();

app.set('views', __basedir + '/views');
app.set('view engine', 'pug');
app.use(express.static(__basedir + '/public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.listen(WEBPORT, function () {
	console.log('JuiceUp online on port ' + WEBPORT);
});

db.getWallboxes().forEach(box => {
	let conn = new Kecontact(box.address);
	conn.init().then((id) => {
		connections.add(conn, id);
	}).catch((err) => {
		console.err(box.address + ': ' + err);
	});

});

app.set('connections', connections);

app.use('/', require(__basedir + '/routes/ui.js'));
app.use('/api', require(__basedir + '/routes/api/index.js'));