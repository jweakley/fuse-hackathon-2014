var express = require("express");
var app = express();
var port = (process.env.PORT || 5000);

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
  socket.emit('message',
    {
      username: 'Server',
      message: 'Welcome to the chat'
    }
  );
  socket.on('send', function (data) {
    //console.log(data.message);
    io.sockets.emit('message', data);
  });
});
