var gm = require('googlemaps'),
  util = require('util'),
  mongoose = require('mongoose'),
  request = require('request');

var Nomnom = (function(gm,util,mongoose,request){
  
  function Nomnom(){
    this.slackName = null;
    this.slackTeamname = null;
    this.voteSession = false;
    this.addSession = false;
    this.voteStep = 1;
    this.addStep = 1;
    this.placesData = [];
  }

  Nomnom.prototype.talkingToMe = function(message){
    var rex;
    rex = new RegExp('<@U04NCQSC8>', 'i');
    if(rex.test(message)){
      return true;
    }
    return false;
  };

  Nomnom.prototype.commandType = function(message){
    var add,vote;

    add = new RegExp('add', 'i'),
    vote = new RegExp('vote', 'i');

    if(add.test(message)){
      return 'add';
    }
    if(vote.test(message)){
      return 'vote';
    }
  };

  Nomnom.prototype.respond = function(command,data){
    var response;
    response = {};

    if(command === 'add'){
      switch(this.addStep){
        case 1:
          this.addStep++;
          return 'Got a name for this place?';
        break;
        case 2:
          if(data.length){
            var length = data.length < 10 ? data.length : 10;
            response.text = 'Any of these right?\n\n';
            for(var i = 0; i < length; i++){
              response.text += '*'+(i+1)+'.* '+data[i].name+' at '+data[i].vicinity+'\n';
            }
            this.addStep++;
          }else{
            response.text = 'No results found. Let\'s try this again. \n Got a name for this place?';
          }
          return response.text;
        break;
        case 3:
          var price, rating;
          response.text = 'Got it. Here is what I saved...\n';
          response.text += '*Name:* '+data.fsname+'\n';
          if(data.rating == undefined){
            rating = 'Not Available';
          }else{
            rating = data.rating;
          }
          response.text += '*Rating:* '+rating+'\n';
          if(data.price === '1'){
            price = 'Low';
          }else if(data.price === '2'){
            price = 'Medium';
          }else if(data.price === '3'){
            price = 'High';
          }else{
            price = 'Not Available';
          }
          response.text += '*Price:* '+price+'\n';
          response.text += '*Phone:* '+data.phone+'\n';
          response.text += '*Website:* '+data.website+'\n';
          response.text += '*Location:* '+data.location;

          this.addSession = false;
          this.addStep = 1;
          return response.text;
        break;
      }
    }else if(command === 'vote'){
      switch(this.voteStep){
        case 1:
          response.text = 'Get to voting! Make your pick below.\n\n';
          // set places data
          this.placesData = data;
          // Which spot would you like to vote for?
          for(var i = 0; i < data.length; i++){
            response.text += '*'+(i+1)+'.* '+data[i].name+' at '+data[i].locationString+'\n';
          }
          this.voteStep++;
          return response.text;
        break;
        case 2:
          response.text = 'You\'re vote has successfully been added. Thanks!';
          this.voteStep = 1;
          this.voteSession = false;
          return response.text;
          break;
      }
    }
  };

  Nomnom.prototype.process = function(message,channel,user){
    var command, response, root, endWords;
    console.log('IN PROCESS');
    root = this;

    // check for user trying to cancel
    endWords = ['cancel','end','done','quit','close','nope','nah'];
    for(var i = 0; i < endWords.length; i++){
      if(root.addSession || root.voteSession){
        if(message.indexOf(endWords[i]) > -1){
          channel.send('Nomnom talk sesh over! Talk to you later!');
          root.addSession = false;
          root.addStep = 1;
          root.voteSession = false;
          root.voteStep = 1;
          return;
        }
      }
    }

    console.log(message);

    if((!root.addSession) && (!root.voteSession)){
      if(root.talkingToMe(message)){
        command = root.commandType(message);
        if(command === 'add'){
          root.addSession = true;
          response = root.respond(command);
          console.log('HERE: '+response);
          channel.send(response);
        }else if(command === 'vote'){
          root.voteSession = true;
          this.apiRequest(null,'GET','/nomnom/', function(data){
            channel.send(root.respond('vote',data));
          });
        }
      }
    }else{
      if(root.addSession){
        if(root.addStep === 2){
          // find the spots
          root.findPlaces(message, function(error, results){
            if(error){
              console.error('Google Places Error: '+error);
            }else{
              //set placesData so we have it for current session
              root.placesData = results.results;
              // pass back response
              channel.send(root.respond('add', results.results));
            }
          });
        }else if(root.addStep === 3){
          var selection = parseInt(message)-1;
          if(!isNaN(selection)){
            root.getPlaceDetails(root.placesData[selection].place_id, function(error,results){
              if(error){
                console.error('Google Places Details Error: '+error);
              }else{
                var data = {};
                data.creator = '';
                data.fsname = results.result.name;
                data.location = results.result.formatted_address;
                data.latlng = JSON.stringify(results.result.geometry.location);
                data.rating = results.result.rating;
                data.price = results.result.price;
                data.website = results.result.website;
                data.phone = results.result.formatted_phone_number;
                data.votes = 1;
                
                // respond with data
                root.apiRequest(data,'POST','/nomnom/add/',function(body){
                  if(body.success){
                    channel.send(root.respond('add', data));
                  }else{
                    if(body.data){
                      channel.send('Sorry that spot already exists! Try again!');
                    }else{
                      console.error('Save Error!');
                    }
                  }
                });
              }
            });
          }else{
            channel.send('Sorry about that. Try adding again.');
            root.addSession = false;
            root.addStep = 1;
          }
        }
      }else if(root.voteSession){
        if(root.voteStep == 2){
          var selection = parseInt(message)-1;
          if(!isNaN(selection)){
            // increase vote
            root.placesData[selection].votes++;
            // make call to api
            root.apiRequest(root.placesData[selection], 'POST', '/nomnom/vote', function(data){
              if(data.success){
                channel.send(root.respond('vote'));
              }else{
                console.error('Something went wrong in adding your vote!');
              }
            });
          }
        }
      }
    }
  };

  Nomnom.prototype.apiRequest = function(data,type,path,callback){
    var options = {
      headers: {
        'Content-Type':'application/json'
      },
      uri: process.env.HOST+path,
      method: type
    };

    if(data !== null){
      options.body = JSON.stringify(data);
    }

    // make request to our api to save data
    request(options, function (error, response, body) {
      if (error) {
        console.error(error);
      }
      callback(JSON.parse(body));
    });
  };

  Nomnom.prototype.getPlaceDetails = function(placeId,callback){
    var key = process.env.GOOGAPIKEY;
    // get place details
    gm.placeDetails(placeId, key, callback, null, null);
  };

  Nomnom.prototype.findPlaces = function(fsName,callback){
    var latlng, radius, key;
      latlng = '40.7285513,-74.0074282',
      radius = '500',
      key = process.env.GOOGAPIKEY;
    // make call to places api
    gm.places(latlng, radius, key, callback, null, 'food|restaurant|cafe|bakery|establishment', null, fsName, 'distance', null);
  };

  Nomnom.prototype.setSlackName = function(slackName){
    this.slackName = slackName;
  };

  Nomnom.prototype.setSlackTeamname = function(slackTeamname){
    this.slackTeamname = slackTeamname;
  };

  return Nomnom;
}(gm,util,mongoose,request));

module.exports = Nomnom;

