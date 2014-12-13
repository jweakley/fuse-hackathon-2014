window.onload = function() {

  var nickname;
  var chatMessages = [];
  var socket = io.connect(document.URL);
  var field = document.getElementById("field");
  var sendButton = document.getElementById("send");
  var chatTextWindow = document.getElementById("chatText");
  var usernameField = document.getElementById("usernameField");

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
        html += "<div class='server'>" + createClassBody(chatMessages[i]) + '</div><br />';
      } else {
        html += "<div class='user'>" + createClassBody(chatMessages[i]) + '</div><br />';
      }
    }
    chatTextWindow.innerHTML = html;
    chatTextWindow.scrollTop = chatTextWindow.scrollHeight;
  }

  var createClassBody = function(messageData) {
    return moment(messageData.when).startOf('minute').fromNow() + ' | ' + messageData.nickname + ': ' + messageData.message;
  }

  socket.on('newChatMessage', function (data) { newChatMessage(data) });
  socket.on('newServerMessage', function (data) { newServerMessage(data) });

  sendButton.onclick = function() {
    var text = field.value;
    socket.emit('sendChatMessage',
      {
        message: text,
        nickname: nickname,
        when: new Date()
      }
    );
  };
}
