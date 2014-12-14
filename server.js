var express = require("express");
var _ = require('lodash');
var app = express();
var votes = 0;
var players = [];
var totalPlayers = 0;
var gameData = {};
var defaultGame = {
    name: 'Nothing'
  };
var allGames = [
  {
    name: 'Clicky'
  }
];
var currentGame = defaultGame;

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
  var game = allGames[Math.floor(Math.random() * allGames.length - 1)+ 1];
  io.sockets.emit('incomingGame', {
      messageData: {
        message: 'INCOMING GAME!',
        nickname: 'Server',
        when: new Date()
      },
      game: game
  });
  currentGame = game;
  startClicky();
  sendGameData();
};

var startClicky = function() {
  numberOfBlocks = 10;
  blocks = [];
  blocks.push(generateBlock());
  _(players).forEach(function(player) {
    player.score = 0;
  })
};

var sendGameData = function() {
  var scores = [];
  _(players).forEach(function(player) {
    scores.push({
      nickname: player.nickname,
      score: player.score
    });
  });
  gameData = {
    blocks: blocks,
    scores: scores,
    blocksLeft: numberOfBlocks
  };
  console.log(gameData);
  io.sockets.emit('gameData', gameData);
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
  var minArea = minBlockSize * minBlockSize;
  var maxArea = maxHeight * maxWidth;
  var area = height * width;
  return {
    color: '#'+Math.floor(Math.random()*16777215).toString(16),
    x: Math.floor(Math.random() * (screenWidth - width)),
    y: Math.floor(Math.random() * (screenHeight - height)),
    height: height,
    width: width,
    points: maxArea - area
  }
};
var blocks = [];
var numberOfBlocks = 10;

io.sockets.on('connection', function (socket) {
  socket.on('join', function(nickname) {
    console.log('Joined ' + nickname);
    players.push({
      nickname: nickname,
      score: 0
    });
    socket.nickname = nickname;
    io.sockets.emit('newServerMessage',{
      message: nickname + ' has joined.',
      nickname: 'Server',
      when: new Date()
    });
    socket.emit('gameData', gameData);
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
    if(currentGame.name === 'Nothing') {
    } else {
      var x = data.x;
      var y = data.y;
      var clickedblockIndex = -1;
      for(var i = 0; i < blocks.length; i++) {
        var block = blocks[i];
        if (y >= block.y && y <= block.y + block.height
              && x >= block.x && x <= block.x + block.width) {
          clickedblockIndex = i;
          break;
        }
      };
      if(clickedblockIndex >=0) {
        numberOfBlocks -= 1;
        _(players).forEach(function(player) {
          if(player.nickname === socket.nickname) {
            player.score += blocks[clickedblockIndex].points;
          }
        });
        blocks.splice(clickedblockIndex, 1);
        blocks.push(generateBlock());
      }
      if(numberOfBlocks <= 0) {
        var winner = players[0]; // Fix
        _(players).forEach(function(player) {
          if(winner.score < player.score) {
            winner = player;
          }
        });
        io.sockets.emit('endGame', {
          messageData: {
            message: winner.nickname + ' wins with ' + winner.score + ' points!',
            nickname: 'Server',
            when: new Date()
          }
        });
        currentGame = defaultGame;
      }
    }
    sendGameData();
  });
});
