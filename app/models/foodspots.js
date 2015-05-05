var mongoose = require('mongoose');

var foodspotSchema = new mongoose.Schema({
	name: String,
	location: String,
	menuLink: String,
	votes: Number
});

mongoose.model('Foodspot', foodspotSchema);