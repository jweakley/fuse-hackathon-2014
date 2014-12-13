window.onload = function() {

  var messages = [];
  var usernames = [];
  var socket = io.connect(document.URL);
  var field = document.getElementById("field");
  var sendButton = document.getElementById("send");
  var chatTextWindow = document.getElementById("chatText");
  var usernameField = document.getElementById("usernameField");

  socket.on('message', function (data) {
    console.log(data)
    if(data.message) {
      messages.push(data.message);
      if(data.username === "") {
        usernames.push("Anon");
      } else {
        usernames.push(data.username);
      }
      var html = '';
      for(var i=0; i<messages.length; i++) {
          html += usernames[i] + ' said:' + messages[i] + '<br />';
      }
      chatTextWindow.innerHTML = html;
      chatTextWindow.scrollTop = chatTextWindow.scrollHeight;
    } else {
      console.log("There is a problem:", data);
    }
  });

  sendButton.onclick = function() {
    var text = field.value;
    var username = usernameField.value;
    if(username === "Server") {
      username = ""
    }
    socket.emit('send',
      {
        message: text,
        username: username
      }
    );
  };
}
