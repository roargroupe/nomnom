var express = require('express'),
	bodyParser = require('body-parser'),
	app = express(),
	request = require('request'),
	env = require('node-env-file');

// body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

// error handler
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(400).send(err.message);
});

// start listening
app.listen(3000, function(){
	console.log('Up & Running!');	
});

// routes
var routes = require('./app/routes/routes')(app);