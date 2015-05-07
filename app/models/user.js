var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
	slack_username: String,
	slack_userid: String,
	recentSelections: []
});

mongoose.model('User', userSchema);