window.onload = function() {

  var nickname;
  var chatMessages = [];
  var socket = io.connect(document.URL);

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
    $('#chatText').animate({scrollTop: $('#chatText').height});
  }

  var createClassBody = function(messageData) {
    var string = moment(messageData.when).format('MMMM Do YYYY, h:mm:ss a') + ' | ' + messageData.nickname + ': ' + messageData.message;
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

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
  }

  socket.on('newChatMessage', function (data) { newChatMessage(data) });
  socket.on('newServerMessage', function (data) { newServerMessage(data) });

  $('#chatForm').submit(function(ev) {
    ev.preventDefault();
    sendChatMessage();
  });
}
