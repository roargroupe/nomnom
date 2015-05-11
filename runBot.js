var Slack, autoMark, autoReconnect, slack, token, Nomnom, nomnom;

Slack = require('node-slack-client');

Nomnom = require('./app/bots/nomnombot');

token = process.env.SLACKTOKEN;

autoReconnect = true;

autoMark = true;

slack = new Slack(token, autoReconnect, autoMark);

nomnom = new Nomnom();

slack.on('open', function() {
  var channel, channels, group, groups, id, messages, unreads;
  channels = [];
  groups = [];
  unreads = slack.getUnreadCount();
  channels = (function() {
    var ref, results;
    ref = slack.channels;
    results = [];
    for (id in ref) {
      channel = ref[id];
      if (channel.is_member) {
        results.push("#" + channel.name);
      }
    }
    return results;
  })();
  groups = (function() {
    var ref, results;
    ref = slack.groups;
    results = [];
    for (id in ref) {
      group = ref[id];
      if (group.is_open && !group.is_archived) {
        results.push(group.name);
      }
    }
    return results;
  })();
  console.log("Welcome to Slack. You are @" + slack.self.name + " of " + slack.team.name);
  console.log('You are in: ' + channels.join(', '));
  console.log('As well as: ' + groups.join(', '));

  // set nomnom vars
  nomnom.setSlackName(slack.self.name);
  nomnom.setSlackTeamname(slack.team.name);

  messages = unreads === 1 ? 'message' : 'messages';
  return console.log("You have " + unreads + " unread " + messages);
});

slack.on('message', function(message){
  var channel, channelError, channelName, errors, response, text, textError, timeStamp, type, typeError, user, userName;
  // grab channel
  channel = slack.getChannelGroupOrDMByID(message.channel);
  // grab user
  user = slack.getUserByID(message.user);
  response = '';
  type = message.type; 
  timeStamp = message.ts; 
  text = message.text;

  channelName = (channel != null ? channel.is_channel : void 0) ? '#' : '';
  channelName = channelName + (channel ? channel.name : 'UNKNOWN_CHANNEL');
  userName = (user != null ? user.name : void 0) != null ? "@" + user.name : "UNKNOWN_USER";
  
  if (type === 'message' && (text != null) && (channel != null)) {
    // send back response from nomnom
    nomnom.process(text,channel,user);
    // return log
    return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
  } else {
    typeError = type !== 'message' ? "unexpected type " + type + "." : null;
    textError = text == null ? 'text was undefined.' : null;
    channelError = channel == null ? 'channel was undefined.' : null;
    errors = [typeError, textError, channelError].filter(function(element) {
      return element !== null;
    }).join(' ');
    return console.log("@" + slack.self.name + " could not respond. " + errors);
  }
});

slack.on('error', function(error) {
  return console.error("Error: " + error.msg);
});

slack.login();