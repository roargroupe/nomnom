var mongoose = require('mongoose');

// bring in db

require('../db/config');

module.exports = function (app) {
	var Foodspot = mongoose.model('Foodspot');

  // set up the routes themselves
  app.get("/", function (req,res) {
    res.send('NOMNOMNOM');
  });

  app.post('/nomnom/', function(req,res,err){
  	if(err){
			res.status(400).json({success: false});
		}else{
			res.status(200).json(req.body);
		}
  });

  /*app.post('/foodspot/add/', function(req,res){
  	console.log(req.body);
  	res.status(200).json({success: true});
  	var fs1 = new Foodspot({
  		name: 'Jacis Food Spots',
  		location: 'Hamilton, NJ',
  		menuLink: 'http://dominos.com/menu',
  		votes: 2
  	});
		
		fs1.save(function(err){
			if(err){
				//log it to console
				console.log("Save Error: " + err);
				//send error message
				res.status(400).json({success: false});
			}else{
				res.status(200).json({success: true});
			}
		});
  });*/
};