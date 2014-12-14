var express = require("express");
var app = express();
var votes = 0;
var totalPlayers = 0;
var currentGame = 'Nothing';

var port = (process.env.PORT || 5000);
// if (process.env.REDISTOGO_URL) {
//   var rtg   = require("url").parse(process.env.REDISTOGO_URL);
//   var redis = require("redis").createClient(rtg.port, rtg.hostname);

//   redis.auth(rtg.auth.split(":")[1]);
// } else {
//   var redis = require("redis").createClient();
// }

app.set('views', __dirname + '/tpl');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);
app.get("/", function(req, res){
  res.render("lobby");
});

app.use(express.static(__dirname + '/public'));

app.get("/", function(req, res){
  res.send("It works!");
});
var io = require('socket.io').listen(app.listen(port));

console.log("Listening on port " + port);

io.sockets.on('connection', function (socket) {
  console.log('Connection');
  socket.on('join', function(nickname) {
    totalPlayers += 1;
    console.log('Joined ' + nickname);
    socket.nickname = nickname;
    io.sockets.emit('newServerMessage',{
      message: nickname + ' has joined.',
      nickname: 'Server',
      when: new Date()
    });
    if(currentGame == 'Nothing') {

    } else {

    }
  });
  socket.on('disconnect', function() {
    totalPlayers -= 1;
    console.log('Disconnect ' + socket.nickname);
    io.sockets.emit('newServerMessage',{
      message: socket.nickname + ' has disconnected.',
      nickname: 'Server',
      when: new Date()
    });
  });

  socket.on('sendChatMessage', function (data) {
    io.sockets.emit('newChatMessage', data);
  });

  socket.on('newGameVote', function(data) {
    console.log('Got it!');
    votes += 1;
    io.sockets.emit('newServerMessage',{
      message: socket.nickname + ' has voted to start a new game.',
      nickname: 'Server',
      when: new Date()
    });
    if(votes >= totalPlayers/2) { // VOTE THRESHHOLD
      votes = 0;
      io.sockets.emit('incommingGame', {
          messageData: {
            message: 'INCOMMING GAME!',
            nickname: 'Server',
            when: new Date()
          }
      });
    }
  });
});
