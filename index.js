var express = require("express");
var app = express();
var port = (process.env.PORT || 5000);
if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var redis = require("redis").createClient(rtg.port, rtg.hostname);

  redis.auth(rtg.auth.split(":")[1]);
} else {
  var redis = require("redis").createClient();
}

app.set('views', __dirname + '/tpl');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);
app.get("/", function(req, res){
  res.render("page");
});

app.use(express.static(__dirname + '/public'));

app.get("/", function(req, res){
  res.send("It works!");
});
var io = require('socket.io').listen(app.listen(port));

console.log("Listening on port " + port);

io.sockets.on('connection', function (socket) {
  console.log('Connection');
  socket.on('join', function(nickname) {
    console.log('Joined ' + nickname);
    socket.nickname = nickname;
    io.sockets.emit('newServerMessage',{
      message: nickname + ' has joined.',
      nickname: 'server',
      when: new Date()
    });
  });
  socket.on('disconnect', function() {
    console.log('Disconnect ' + socket.nickname);
    io.sockets.emit('newServerMessage',{
      message: socket.nickname + ' has disconnected.',
      nickname: 'Server',
      when: new Date()
    });
  });

  socket.on('sendChatMessage', function (data) {
    console.log('message ' + data);
    io.sockets.emit('newChatMessage', data);
  });
});
