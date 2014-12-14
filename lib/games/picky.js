var _ = require('lodash');
var sizeOf = require('image-size');
function Picky() {
  this.name = 'Picky'
  this.numberOfBlocks = 10;
  this.blocks = [];
  this.players = [];
  this.gameData = {};
  var files = [];
  var dimensions;
  require('fs').readdirSync('./public/games/picky/').forEach(function(file) {
    files.push({
      name: file,
      size: sizeOf('./public/games/picky/' + file)
    });
  });
  this.pictures = files;
}

Picky.prototype.startGame = function(opts) {
  this.players = opts.currentPlayers;
  this.numberOfBlocks = this.pictures.length;
  this.blocks = [];
  this.blocks.push(this.generateBlock());
  _(this.players).forEach(function(player) {
    player.score = 0;
  })
};

Picky.prototype.fetchGameData = function() {
  var scores = [];
  _(this.players).forEach(function(player) {
    scores.push({
      nickname: player.nickname,
      score: player.score
    });
  });
  return {
    elements: this.blocks,
    scores: scores
  };
};

Picky.prototype.updatePlayers = function(players) {
  this.players = players;
};

Picky.prototype.playerMove = function(data, endGameCallback) {
  var x = data.x;
  var y = data.y;
  var clickedblockIndex = -1;
  var currentPlayer;
  var selectedBlock
  for(var i = 0; i < this.blocks.length; i++) {
    var block = this.blocks[i];
    if (y >= block.y && y <= block.y + block.height
          && x >= block.x && x <= block.x + block.width) {
      clickedblockIndex = i;
      break;
    }
  };
  selectedBlock = this.blocks[clickedblockIndex];
  _(this.players).forEach(function(player) {
    if(player.nickname === data.nickname) {
      currentPlayer = player;
    }
  });
  if(currentPlayer) {
    if(clickedblockIndex >=0) {
      this.numberOfBlocks -= 1;
      currentPlayer.score += selectedBlock.points;
      this.blocks.splice(clickedblockIndex, 1);
      this.blocks.push(this.generateBlock());
    } else {
      currentPlayer.score = Math.round(currentPlayer.score / 2);
    }
  }
  if(this.numberOfBlocks <= 0) {
    var winner = this.players[0]; // Fix
    _(this.players).forEach(function(player) {
      if(winner.score < player.score) {
        winner = player;
      }
    });
    endGameCallback(winner);
  }
};

// 600 x 300
Picky.prototype.generateBlock = function() {
  var randomPicture = this.pictures[Math.floor(Math.random() * this.pictures.length)]
  var screenHeight = 300;
  var screenWidth = 600;
  var height = randomPicture.size.height;
  var width = randomPicture.size.height;
  return {
    name: randomPicture.name,
    src: 'games/picky/' + randomPicture.name,
    type: 'picture',
    x: Math.floor(Math.random() * (screenWidth - width)),
    y: Math.floor(Math.random() * (screenHeight - height)),
    height: height,
    width: width,
    points: 1
  }
};

module.exports = Picky;
