global.__basedir = __dirname;

const WEBPORT = 3000;

const Connections = require(__basedir + '/controllers/connections.js');
const db = require(__basedir + '/controllers/db.js')
const express = require('express');
var bodyParser = require('body-parser');

var app = express();
var conns = new Connections();

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
	conns.add(box.serial, box.address);
});

app.set('connections', conns);

app.use('/', require(__basedir + '/routes/ui.js'));
app.use('/api', require(__basedir + '/routes/api/index.js'));