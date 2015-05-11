var express = require('express'),
  bodyParser = require('body-parser'),
  app = express(),
  request = require('request'),
  port = process.env.PORT || 3000,
  env = require('node-env-file');

// bring in environment variables 
try{
  env(__dirname + '/.env');
}catch(err){
  console.log('Error: '+err);
}

// bring in db config
require('./app/db/config');

// bring in models
require('./app/models/foodspots');

// body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// setup view engine for HAML
app.set('views', './app/views');
app.set('view engine', 'jade');

//static files
app.use(express.static('./public'));

// error handler
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(400).send(err.message);
});

// start listening
app.listen(port, function(){
  console.log('Up & Running!'); 
});

// run bot
require('./app/bots/runbot');

// routes
require('./app/routes/routes')(app);
