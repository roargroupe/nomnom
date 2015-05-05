var mongoose = require('mongoose');

// bring in env variables
// connect mongoose
mongoose.connect('mongodb://nomnom:'+process.env.MONGOPASS+'@ds031952.mongolab.com:31952/nomnom');