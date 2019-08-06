var express = require('express')
var router = express.Router();

const db = require(__basedir + '/controllers/db.js');
const Kecontact = require(__basedir + '/controllers/kecontact');

router.use('/wallboxes', require('./wallboxes.js'));
router.use('/profiles', require('./profiles.js'));

module.exports = router;