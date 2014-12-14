var express = require("express");
var _ = require('lodash');
var app = express();
var votes = 0;
var players = [];
var totalPlayers = 0;
var currentGame = { name: 'Nothing' };
var allGames = [
  {
    name: 'Clicky'
  }
];

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

var startNewRandomGame = function() {
  var game = allGames[Math.floor(Math.random() * allGames.length)];
  io.sockets.emit('incommingGame', {
      messageData: {
        message: 'INCOMMING GAME!',
        nickname: 'Server',
        when: new Date()
      },
      game: game
  });
  //startGame
  numberOfBlocks = 10;
  blocks.push(generateBlock());
  currentGame = game;
};

// 600 x 300
var generateBlock = function() {
  var minBlockSize= 20;
  var screenHeight = 300;
  var screenWidth = 600;
  var maxHeight = (screenHeight * 0.40) - minBlockSize;
  var maxWidth = (screenWidth * 0.40) - minBlockSize;
  var height = Math.floor(Math.random() * maxHeight) + minBlockSize;
  var width = Math.floor(Math.random() * maxWidth) + minBlockSize;
  return {
    color: '#FF0000',
    x: Math.floor(Math.random() * (screenWidth - width)),
    y: Math.floor(Math.random() * (screenHeight - height)),
    height: height,
    width: width
  }
};
var blocks = [];
var numberOfBlocks = 10;

io.sockets.on('connection', function (socket) {
  console.log('New Connection');
  socket.on('join', function(nickname) {
    console.log('Joined ' + nickname);
    players.push({nickname: nickname});
    socket.nickname = nickname;
    io.sockets.emit('newServerMessage',{
      message: nickname + ' has joined.',
      nickname: 'Server',
      when: new Date()
    });
    socket.emit('incommingGame', {
        messageData: {
          message: 'INCOMMING GAME!',
          nickname: 'Server',
          when: new Date()
        },
        game: currentGame
    });
  });
  socket.on('disconnect', function() {
    var playerIndex = -1;
    for(var i = 0; i < players.length; i++) {
      if(players[i].nickname === socket.nickname) {
        playerIndex = i;
        break;
      }
    }
    if(playerIndex >= 0) {
      players.splice(playerIndex, 1);
    }
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
    votes += 1;
    socket.emit('newServerMessage',{
      message: 'Vote request received.',
      nickname: 'Server',
      when: new Date()
    });
    if(votes >= players.length/2) { // VOTE THRESHHOLD
      votes = 0;
      startNewRandomGame();
    }
  });

  socket.on('gameMove', function(data) {
    console.log(socket.nickname + ' moved the game forward');
    var x = data.x;
    var y = data.y;
    console.log('x: '+ x + ' y: '+y);
    var clickedblockIndex = -1;
    for(var i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      if (y >= block.y && y <= block.y + block.height
            && x >= block.x && x <= block.x + block.width) {
        console.log('CLICKED!');
        clickedblockIndex = i;
        break;
      }
    };
    if(clickedblockIndex >=0) {
      numberOfBlocks -= 1;
      blocks.splice(clickedblockIndex, 1);
      //Add point
      blocks.push(generateBlock());
    }
    if(currentGame.name === 'Nothing') {
      console.log('No Game');
    } else {
      var gameData = {
        blocks: blocks,
        scores: [],
        blocksLeft: numberOfBlocks
      };
      console.log(gameData);
      io.sockets.emit('gameData', gameData);
    }
  });
});
