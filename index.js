var express = require('express'),
	bodyParser = require('body-parser'),
	app = express(),
	request = require('request'),
	port = process.env.PORT || 3000,
	env = require('node-env-file');

// bring in environment variables
env(__dirname + '/.env');

// bring in db config
require('./app/db/config');

// bring in models
require('./app/models/foodspots');

// body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

// error handler
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(400).send(err.message);
});

// start listening
app.listen(port, function(){
	console.log('Up & Running!');	
});

// routes
require('./app/routes/routes')(app);