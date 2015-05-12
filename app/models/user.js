var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
	slack_username: String,
	slack_userid: String,
	recentSelections: [],
	updated: { type : Date, default: Date.now }
});

mongoose.model('User', userSchema);