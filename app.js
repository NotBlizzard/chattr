var express = require('express');
var ColorHash = require('color-hash');
var md5 = require("MD5");
var app = express();
var path = require('path');
var server = require('http').Server(app);
var io = require('socket.io')(server);
var strftime = require('strftime');

var users = [];
var port = process.env.PORT || 8080;

app.use('/js', express.static(path.join(__dirname + '/js')));
app.use('/css', express.static(path.join(__dirname + '/css')));


app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

server.listen(port, function() {
  console.log('listening on port ' + port);
});

io.on('connection', function(socket) {

  socket.on('disconnect', function() {
    users.pop(socket.username.toLowerCase());
    io.emit('user left', socket.username);
  });

  socket.on('add user', function(name) {
    socket.username = name;
    if (users.indexOf(name.toLowerCase()) > -1) {
      socket.emit('username taken');
    }
    users.push(name.toLowerCase());
    if (!socket.rooms.indexOf('lobby') > -1) {
      socket.join('lobby');
    }
    socket.emit('add user', name);
    socket.to('lobby').emit('user joined', name);

  });


  socket.on('subscribe', function(room) {
    socket.emit('subscribe', room);
    if (socket.rooms.indexOf(room) < -1) {
      socket.join(room);
      socket.broadcast.to(room).emit('user joined', socket.username);
    }
  });

  socket.on('change room', function(room) {
    socket.emit('change room', room);
  });

  socket.on('message', function(data) {
    data.msg = data.msg.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    var timestamp = strftime("%H:%M:%S");
    var colour = md5(socket.username).substr(0,6);
    io.emit('message', {
      user: socket.username,
      msg: data.msg,
      room: data.room,
      colour: colour,
      timestamp: timestamp
    });
  });
});