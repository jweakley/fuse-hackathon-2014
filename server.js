var express = require("express");
var _ = require('lodash');
var app = express();
var players = [];
var totalPlayers = 0;
var allGames = [];
var votes = [];

require('fs').readdirSync('./lib/games/').forEach(function(file) {
  var fileData = require('./lib/games/' + file);
  var game = {
    dataClass: new fileData()
  };
  game.name = game.dataClass.name;
  allGames.push(game);
});
var defaultGame = {
    name: 'Nothing'
  };

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
  votes = [];
  sendVoteCounts();
  var game = allGames[Math.floor(Math.random() * allGames.length - 1)+ 1];
  io.sockets.emit('incomingGame', {
      messageData: {
        message: 'INCOMING GAME!',
        nickname: 'Server',
        when: new Date()
      },
      game: game.name
  });
  currentGame = game;
  currentGame.dataClass.startGame({ currentPlayers: players });
  sendGameData();
};

var sendGameData = function() {
  if(currentGame.name === 'Nothing') { // TODO
  } else {
    var gameData = currentGame.dataClass.fetchGameData();
    io.sockets.emit('gameData', gameData);
  }
};
var updatePlayers = function() {
  if(currentGame.name === 'Nothing') { // TODO
  } else {
    currentGame.dataClass.updatePlayers(players);
  }
};

var sendVoteCounts = function() {
  io.sockets.emit('newVoteCount', {
    voteCount: votes.length,
    threshold: Math.floor(players.length/2) + 1
  });
}

var updateGameKing = function(nickname) {
  _(players).forEach(function(player) {
    if(player.nickname === nickname) {
      player.gamesWon += 1;
    }
  });
  io.sockets.emit('newGameKing', players);
}

var endGame = function(winner) {
  io.sockets.emit('endGame', {
    messageData: {
      message: winner.nickname + ' wins with ' + winner.score + ' points!',
      nickname: 'Server',
      when: new Date()
    }
  });
  updateGameKing(winner.nickname);
  currentGame = defaultGame;
}

io.sockets.on('connection', function (socket) {
  socket.on('join', function(nickname) {
    console.log('Joined ' + nickname);
    players.push({
      nickname: nickname,
      score: 0,
      gamesWon: 0
    });
    socket.nickname = nickname;
    io.sockets.emit('newServerMessage',{
      message: nickname + ' has joined.',
      nickname: 'Server',
      when: new Date()
    });
    socket.emit('incomingGame', {
        messageData: {
          message: 'INCOMING GAME!',
          nickname: 'Server',
          when: new Date()
        },
        game: currentGame.name
    });
    sendVoteCounts();
    updateGameKing('');
    updatePlayers();
    sendGameData();
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
    sendVoteCounts();
    updatePlayers();
    console.log('Disconnect ' + socket.nickname);
    io.sockets.emit('newServerMessage',{
      message: socket.nickname + ' has disconnected.',
      nickname: 'Server',
      when: new Date()
    });
    sendGameData();
  });

  socket.on('sendChatMessage', function (data) {
    io.sockets.emit('newChatMessage', data);
  });

  socket.on('newGameVote', function(data) {
    var alreadyVoted = false;
    _(votes).forEach(function(vote) {
      if(vote.nickname === socket.nickname) {
        alreadyVoted = true;
        return false;
      }
    });
    if(!alreadyVoted) {
      votes.push({ nickname: socket.nickname });
      socket.emit('newServerMessage',{
        message: 'Vote request received.',
        nickname: 'Server',
        when: new Date()
      });
      sendVoteCounts();
    } else {
      socket.emit('newServerMessage',{
        message: 'You have already voted.',
        nickname: 'Server',
        when: new Date()
      });
    }
    if(votes.length > players.length/2) { // VOTE THRESHHOLD
      startNewRandomGame();
    }
  });

  socket.on('gameMove', function(data) {
    //console.log(socket.nickname + ' moved the game forward');
    data.nickname = socket.nickname;
    if(currentGame.name === 'Nothing') { // TODO
    } else {
      currentGame.dataClass.playerMove(data, endGame);
      sendGameData();
    }
  });
});
