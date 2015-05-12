var mongoose = require('mongoose'),
	request = require('request'),
	uri = 'https://hooks.slack.com/services/'+process.env.INCOMING_WEBHOOK_PATH;

// bring in db
require('../db/config');

module.exports = function (app) {
  var Foodspot = mongoose.model('Foodspot');
  var User = mongoose.model('User');

  // set up the routes themselves
  app.get("/", function (req,res) {
  	res.status(200).send('NOMNOM');
  });

  app.post('/nomnom/', function(req,res){
  	var returnChannel, text;
  	returnChannel = req.body.channel_name;
  	text = req.body.text;

  	if(req.body.token == process.env.SLASHTOKEN){
  		// send back okay status
  		res.status(200).send();
  	}else{
  		res.status(400).send();
  	}

  	if(text.indexOf('all') > -1){
  		Foodspot.find({}, function(error,result){
  			if(error){
  				console.error('Error Getting All Foodspots: '+error);
  			}
  			var payload = {
  				attachments:[],
  				channel: '#'+returnChannel
  			};

  			if(result){
  				var temp = {};
  				temp.text = '*All Foodspots*\n';
  				for(var i = 0; i < result.length; i++){
  					temp.text += '*'+(i+1)+'.* '+result[i].name+' at '+result[i].locationString+'\n';
  				}
  				temp.unfurl_links = true;
				temp.mrkdwn_in = ['text'];
  				payload.attachments.push(temp);

				request({
				    uri: uri,
				    method: 'POST',
				    body: JSON.stringify(payload)
				  }, function (error, response, body) {
				    if (error) {
				      console.error(error);
				    }
		  		});
  			}
  		});
  	}else if(text.indexOf('ranked') > -1){
  		Foodspot.find({}).sort({ votes : 'desc' }).exec(function(error,result){
  			if(error){
  				console.error('Error Getting Ranked Foodspots: '+error);
  			}
  			var payload = {
  				attachments:[],
  				channel: '#'+returnChannel
  			};

  			if(result){
  				var temp = {};
  				temp.text = '*Top Ranked Foodspots*\n';
  				for(var i = 0; i < result.length; i++){
  					var vString = (result[i].votes > 1) ? result[i].votes+' votes' : result[i].votes+' vote';
  					temp.text += '*'+(i+1)+'.* '+result[i].name+' at '+result[i].locationString+' with '+vString+'\n';
  				}
  				temp.unfurl_links = true;
				temp.mrkdwn_in = ['text'];
  				payload.attachments.push(temp);

				request({
				    uri: uri,
				    method: 'POST',
				    body: JSON.stringify(payload)
				  }, function (error, response, body) {
				    if (error) {
				      console.error(error);
				    }
		  		});
  			}
  		});
  	}else{
  		User.findOne({ slack_userid: req.body.user_id }, function(error,data){
	  		if(error){
	  			console.error('Error Finding User: '+error);
	  		}
	  		var userData = data;
	  		//randomly pick out of available foodspots
			Foodspot.find(function(error,data){
				if(error){
					console.error('Error Find Foodspots: '+error);
				}

				if(data.length == 0){
					res.send('Sorry there are no Foodspots at this time! Try adding one using @nomnom: add');
					return;
				}
				// if user has recent selections then we remove those
				// from the foodspot data pool for better randomization and stuff
				if((userData.recentSelections.length > 1) && (userData.recentSelections.length < data.length/2)){
					for(var i = 0; i < userData.recentSelections.length; i++){
						for(var j = 0; j < data.length; j++){
							if(String(data[j]._id) == String(userData.recentSelections[i]._id)){
								// remove that from data
								data.splice(j, 1);
							}
						}
					}
				}

				var rando = Math.floor(Math.random()*(data.length-1));
				userData.recentSelections.push(data[rando]);
				
				User.update({ slack_userid: req.body.user_id }, { $set: {  updated: Date.now(), recentSelections: userData.recentSelections } }, function(error, result){
			  		if(error){
			  			console.error('Error Updating User: '+error);
			  		}
			  	});

			  	var payload = buildPayload(data[rando]);
					payload.channel = '#'+returnChannel;

				request({
				    uri: uri,
				    method: 'POST',
				    body: JSON.stringify(payload)
				  }, function (error, response, body) {
				    if (error) {
				      console.error(error);
				    }
		  		});
			});
	  	});
  	}

  	
  });

  app.get('/nomnom/admin', function(req,res){
  	res.render('index');
  });

  app.get('/nomnom/', function(req,res){
  	Foodspot.find({}, function(error,data){
  		if(error){
  			console.error(error);
  		}

  		res.status(200).send(data);
  	});
  });

  app.get('/nomnom/getusers', function(req,res){
	request({
		uri: 'https://slack.com/api/users.list?token='+process.env.SLACKTOKEN,
		method: 'GET'
	}, function (error, response, body) {
		if (error) {
			console.error(error);
			res.status(500).send(error);
		}
		var pBody = JSON.parse(body);
		for(var i = 0; i < pBody.members.length; i++){
			var user = new User({
				slack_username: pBody.members[i].name,
				slack_userid: pBody.members[i].id,
				recentSelections: []
			});
			User.remove({}, function(err){
				if(err){
					console.error('Error Removing All Users: '+err);
				}
			});
			user.save(function(err){
				if(err){
					console.error('Error Adding Users: '+err);
				}
			});
		}
		res.status(200).send({success:true});
	});
  });

  app.post('/nomnom/vote', function(req,res){
  	Foodspot.update({_id: req.body._id}, { $set: { votes: req.body.votes} }, function(error, result){
  		res.status(200).send({success:true});
  	});
  });

  app.post('/nomnom/add', function(req,res){
  	var data = {
  		creator: req.body.name,
  		name: req.body.fsname,
  		locationString: req.body.location,
  		locationCoords: req.body.latlng,
  		rating: req.body.rating,
  		price: req.body.price,
  		website: req.body.website,
  		phone: req.body.phone,
  		votes: req.body.votes
  	};

  	Foodspot.find({ 'name': data.name, 'locationString': data.locationString }, 'name creator', function(error, result){
  		if(error){
  			console.error('Foodspot Lookup Error: '+error);
  		}
  		// if we have a result then it already exists
  		if(result.length){
  			res.status(200).json({success: false, data: result});
  		}else{
  			var fs1 = new Foodspot(data);
		
			fs1.save(function(err){
				if(err){
					console.log("Save Error: " + err);
					res.status(400).json({success: false});
				}else{
					res.status(200).json({success: true});
				}
			});
  		}
  	});
  });
};

function buildPayload(data){
	var payload = {
	    "attachments": [
	        /*{
	            "fallback": "Here is the list of results of top company food spots nearby.",

	            "color": "#36a64f",

	            "pretext": "Optional text that appears above the attachment block",

	            "author_name": "",
	            "author_link": "http://flickr.com/bobby/",
	            "author_icon": "http://flickr.com/icons/bobby.jpg",

	            "title": "NOMNOM Foodspots",
	            "title_link": "",

	            "text": "Optional text that appears within the attachment",

	            "fields": [
	                {
	                    "title": "Priority",
	                    "value": "High",
	                    "short": false
	                }
	            ],

	            "image_url": "http://my-website.com/path/to/image.jpg"
	        }*/
	    ]
	};

	var temp = {},price;
	
	temp.title = data.name;
	temp.text = '*Rating:* '+data.rating+'\n';
	if(data.price === '1'){
		price = 'Low';
	}else if(data.price === '2'){
		price = 'Medium';
	}else if(data.price === '3'){
		price = 'High';
	}else{
		price = 'Not Available';
	}
	temp.text += '*Price:* '+price+'\n';
	temp.text += '*Phone:* '+data.phone+'\n';
	temp.text += '*Website:* '+data.website+'\n';
	temp.text += '*Location:* '+data.locationString+'\n';
	temp.unfurl_links = true;
	temp.mrkdwn_in = ['text'];
	
	var rawLatLng = JSON.parse(data.locationCoords),
			center = rawLatLng.lat+','+rawLatLng.lng;
	temp.image_url = 'https://maps.googleapis.com/maps/api/staticmap?center='+center+'&zoom=16&size=600x300&maptype=roadmap&markers=color:red%7Clabel:S%7C'+center;
	temp.icon_emoji = ':fries:';
	temp.username = 'nomnom';
	payload.attachments.push(temp);
	return payload;
}





