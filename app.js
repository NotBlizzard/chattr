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

  //When the user first connects.
  //They will pick a name, then join lobby.
  //If their name doesn't meet criteria, then the user
  //will get asked to pick another name.

  socket.on('pick username', function(name) {
    if (name === null || !name || name.length === 0) {
      return socket.emit('no username');
    } else if (users.indexOf(name.toLowerCase()) > -1) {
      socket.emit('username taken');
    }
    users.push(name.toLowerCase());
    if (!socket.rooms.indexOf('lobby') > -1) {
      socket.join('lobby');
    }
    socket.username = name;
    socket.emit('subscribe', 'lobby');
    socket.emit('pick username', name);
    socket.broadcast.to('lobby').emit('user joined room', {
      name: socket.username,
      room: 'lobby'
    });

  });

  socket.on('disconnect', function() {
    try {
      users.pop(socket.username.toLowerCase());
    } catch (e) {
      //the user never picked a name, and disconnected.
    }
    for (var room in socket.rooms) {
      socket.broadcast.to(room).emit('user left room', {
        user: socket.username,
        room: room
      })
    }
  });


  //When the user joins or leaves a room.
  //Also if the user switches rooms.
  socket.on('subscribe', function(room) {
    socket.emit('subscribe', room);
    if (socket.rooms.indexOf(room) < -1) {
      socket.join(room);
      socket.broadcast.to(room).emit('user joined room', {
        user: socket.username,
        room: room
      });
    }
  });

  socket.on('unsubscribe', function(room) {
    socket.leave(room);
    socket.broadcast.to(room).emit('user left room', {
      user: socket.username,
      room: room
    });
  });

  socket.on('change room', function(room) {
    socket.emit('change room', room);
  });

  //When the user sends a message.
  socket.on('message', function(data) {
    if (!socket.username) {
      socket.emit('no username');
    }
    data.msg = data.msg.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    var timestamp = strftime("%H:%M:%S", data.timestamp);
    if (socket.rooms.length == 0) {
      socket.emit('no rooms');
    }
    var colour = md5(socket.username).substr(0, 6);
    io.emit('message', {
      user: socket.username,
      msg: data.msg,
      room: data.room,
      colour: colour,
      timestamp: timestamp
    });
  });
});