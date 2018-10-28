const WEBPORT = 3000;


const kecontact = require('./kecontact.js');
const db = require('./db.js');
const express = require('express');
const Connections = require('../connections.js');
var bodyParser = require('body-parser');

var dbase = new db('data.json');
var app = express();
var conns = new Connections();

app.set('view engine', 'pug');
app.use(express.static('public'));

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({
	extended: true
})); // support encoded bodies

app.listen(WEBPORT, function () {
	console.log('JuiceUp online on port ' + WEBPORT);
});

boxes = dbase.getWallboxes().forEach(box => {
	conns.add(new kecontact(box.address), box.serial);
	conns.get()[box.serial].init();
});

app.set('kecontact', kecontact);
app.set('database', dbase);
app.set('connections', conns);

app.use('/', require('../routes/ui.js'));
app.use('/api', require('../routes/api.js'));