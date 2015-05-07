var mongoose = require('mongoose'),
	request = require('request'),
	uri = 'https://hooks.slack.com/services/'+process.env.INCOMING_WEBHOOK_PATH;

// bring in db

require('../db/config');

module.exports = function (app) {
	var Foodspot = mongoose.model('Foodspot');

  // set up the routes themselves
  app.get("/", function (req,res) {
    res.send('NOMNOMNOM');
  });

  app.post('/nomnom/', function(req,res){
  	Foodspot.find(function(err, data){
			if (err) {
				console.log("Uh Oh: " + err);
			} else {
				res.status(200);
				var payload = buildPayload(data);
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
  });

  app.get('/nomnom/add', function(req,res){
  	res.render('index');
  });

  app.post('/nomnom/add', function(req,res){
  	var fs1 = new Foodspot({
  		creator: req.body.name,
  		creator_email: req.body.email,
  		name: req.body.fsname,
  		locationString: req.body.location,
  		locationCoords: req.body.latlng,
  		rating: req.body.rating,
  		price: req.body.price,
  		website: req.body.website,
  		phone: req.body.phone,
  		votes: req.body.votes
  	});
		
		fs1.save(function(err){
			if(err){
				console.log("Save Error: " + err);
				res.status(400).json({success: false});
			}else{
				res.status(200).json({success: true});
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

	var rando = Math.floor(Math.random() * data.length);
	var temp = {},price;
	console.log(rando); 
	temp.title = data[rando].name;
	temp.text = '*Rating:* '+data[rando].rating+'\n';
	if(data[rando].price === '1'){
		price = 'Low';
	}else if(data[rando].price === '2'){
		price = 'Medium';
	}else if(data[rando].price === '3'){
		price = 'High';
	}
	temp.text += '*Price:* '+price+'\n';
	temp.text += '*Phone:* '+data[rando].phone+'\n';
	temp.text += '*Website:* '+data[rando].website+'\n';
	temp.unfurl_links = true;
	temp.mrkdwn_in = ['text'];
	
	var rawLatLng = JSON.parse(data[rando].locationCoords),
			center = rawLatLng.lat+','+rawLatLng.lng;
	temp.image_url = 'https://maps.googleapis.com/maps/api/staticmap?center='+center+'&zoom=16&size=600x300&maptype=roadmap&markers=color:red%7Clabel:S%7C'+center;
	payload.attachments.push(temp);
	return payload;
}





