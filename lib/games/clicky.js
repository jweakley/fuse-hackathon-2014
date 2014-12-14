var _ = require('lodash');
function Clicky() {
  this.name = 'Clicky'
  this.numberOfBlocks = 10;
  this.blocks = [];
  this.players = [];
  this.gameData = {};
}

Clicky.prototype.startGame = function(opts) {
  this.players = opts.currentPlayers;
  this.numberOfBlocks = 10;
  this.blocks = [];
  this.blocks.push(this.generateBlock());
  _(this.players).forEach(function(player) {
    player.score = 0;
  })
};

Clicky.prototype.fetchGameData = function() {
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

Clicky.prototype.updatePlayers = function(players) {
  this.players = players;
};

Clicky.prototype.playerMove = function(data, endGameCallback) {
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
  if(clickedblockIndex >=0) {
    this.numberOfBlocks -= 1;
    currentPlayer.score += selectedBlock.points;
    this.blocks.splice(clickedblockIndex, 1);
    this.blocks.push(this.generateBlock());
  } else {
    currentPlayer.score = Math.round(currentPlayer.score / 2);
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
Clicky.prototype.generateBlock = function() {
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
    type: 'rectangle',
    x: Math.floor(Math.random() * (screenWidth - width)),
    y: Math.floor(Math.random() * (screenHeight - height)),
    height: height,
    width: width,
    points: maxArea - area
  }
};

module.exports = Clicky;
