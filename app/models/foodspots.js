var mongoose = require('mongoose');

var foodspotSchema = new mongoose.Schema({
	creator: String,
	name: String,
	locationString: String,
	locationCoords: String,
	website: String,
	rating: String,
	price: String,
	phone: String,
	votes: Number
});

mongoose.model('Foodspot', foodspotSchema);