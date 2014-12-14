window.onload = function() {

  var nickname;
  var chatMessages = [];
  var socket = io.connect(document.URL);
  var maxNumberOfMessages = 50;
  var allGames = [{
    name: 'Clicky'
  }];

  var isGameRunning = false;

  nickname = prompt('Please enter your nickname');
  // Send message to server that user has joined
  socket.emit('join', nickname);

  // Function to add a message to the page
  var newChatMessage = function(data) {
    data['isServer'] = false;
    chatMessages.push(data);
    renderChat();
  };

  var newServerMessage = function(data) {
    data['isServer'] = true;
    chatMessages.push(data);
    renderChat();
  };

  var renderChat = function() {
    if(chatMessages.length > maxNumberOfMessages) {
      chatMessages.splice(0, chatMessages.length - maxNumberOfMessages);
    }
    var html = '';
    for(var i=0; i<chatMessages.length; i++) {
      if(chatMessages[i].isServer) {
        html += "<div class='server'>" + createClassBody(chatMessages[i]) + '</div>';
      } else {
        if(chatMessages[i].nickname === nickname) {
          html += "<div class='self'>" + createClassBody(chatMessages[i]) + '</div>';
        } else {
          html += "<div class='user'>" + createClassBody(chatMessages[i]) + '</div>';
        }
      }
    }
    $('#chatText').html(html);
    $('#chatText').animate({scrollTop: $('#chatText').prop('scrollHeight')});
  };

  var createClassBody = function(messageData) {
    var string = moment(messageData.when).format('MMMM Do YYYY, h:mm:ss a') + ' | ' + messageData.nickname + ': ' + messageData.message;
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  var sendChatMessage = function() {
    var text = $('#chatControls input.message').val();
    $('#chatControls input.message').val('');
    socket.emit('sendChatMessage',
      {
        message: text,
        nickname: nickname,
        when: new Date()
      }
    );
  };

  var voteForNewGame = function() {
    socket.emit('newGameVote', {});
  };

  var startNewGame = function(game) {
    console.log(game.name);
    isGameRunning = true;
    $('#currentGameName').html(game.name);
  };

  var endCurrentGame = function(game) {
    isGameRunning = false;
    $('#currentGameName').html('');
    clearBoard();
  };

  var updateGame = function(data) {
    if(isGameRunning) {
      var blocks = data.blocks;
      var scores = data.scores;
      var blocksLeft = data.blocksLeft;
      var context = $('#gameBoard')[0].getContext('2d');
      clearBoard();
      _(blocks).forEach(function(block) {
        context.fillStyle = block.color;
        context.fillRect(block.x, block.y, block.width, block.height);
      });
      context.fillStyle = '#000';
      context.font = "bold 12px sans-serif";
      var startY = 0;
      _(scores).forEach(function(player) {
        startY += 20;
        context.fillText(player.nickname + ": " + player.score, 10, startY);
      });
    }
  };
  var clearBoard = function() {
    var context = $('#gameBoard')[0].getContext('2d');
    context.clearRect ( 0 , 0 , $('#gameBoard').width(), $('#gameBoard').height() );
  };

  socket.on('newChatMessage', function (data) { newChatMessage(data) });
  socket.on('newServerMessage', function (data) { newServerMessage(data) });
  socket.on('incomingGame', function(data) {
    newServerMessage(data.messageData);
    startNewGame(data.game);
  });
  socket.on('endGame', function(data) {
    newServerMessage(data.messageData);
    endCurrentGame();
  });
  socket.on('gameData', function(data) { updateGame(data) });

  $('#chatForm').submit(function(ev) {
    ev.preventDefault();
    sendChatMessage();
  });

  $('#voteForm').submit(function(ev) {
    ev.preventDefault();
    voteForNewGame();
  });

  $('#gameBoard').click(function(event) {
    var x = Math.round(event.pageX - $('#gameBoard').offset().left),
        y = Math.round(event.pageY - $('#gameBoard').offset().top);
    socket.emit('gameMove', { x: x, y: y});
  });
}
