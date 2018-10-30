global.__basedir = __dirname;

const WEBPORT = 3000;

const express = require('express');

const kecontact = require(__basedir + '/controllers/kecontact.js');
const Connections = require(__basedir + '/controllers/connections.js');

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

dbase.getWallboxes().forEach(box => {
	conns.add(new kecontact(box.address), box.serial);
	conns.get()[box.serial].init();
});

app.set('kecontact', kecontact);
app.set('database', dbase);
app.set('connections', conns);

app.use('/', require(__basedir + '/routes/ui.js'));
app.use('/api', require(__basedir + '/routes/api/index.js'));