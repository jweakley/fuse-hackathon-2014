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
        html += "<div class='server'>" + createClassBody(chatMessages[i]) + '</div>';
      } else {
        if(chatMessages[i].nickname === nickname) {
          html += "<div class='self'>" + createClassBody(chatMessages[i]) + '</div>';
        } else {
          html += "<div class='user'>" + createClassBody(chatMessages[i]) + '</div>';
        }
      }
    }
    chatTextWindow.innerHTML = html;
    chatTextWindow.scrollTop = chatTextWindow.scrollHeight;
  }

  var createClassBody = function(messageData) {
    var string = moment(messageData.when).format('MMMM Do YYYY, h:mm:ss a') + ' | ' + messageData.nickname + ': ' + messageData.message;
    return string.charAt(0).toUpperCase() + string.slice(1);
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
