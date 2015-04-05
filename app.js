var express = require('express');
var app = express();
var path = require('path');
var server = require('http').Server(app);
var io = require('socket.io')(server);

var users = [];
var usercount = 0;

app.use('/js', express.static(path.join(__dirname + '/js')));
app.use('/css', express.static(path.join(__dirname + '/css')));


app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html')
})

server.listen(4000, function() {
  console.log('listening on port 4000')
});

io.on('connection', function(socket) {

  socket.on('disconnect', function() {
    io.emit('user left', socket.username);
  })

  socket.on('add user', function(name) {
    socket.username = name;
    if (users.indexOf(name.toLowerCase()) > -1) {
      socket.emit('username taken');
    }
    users.push(name.toLowerCase());
    socket.join('lobby');
    socket.emit('add user');
    socket.to('lobby').emit('user joined', name);
  });


  socket.on('subscribe', function(room) {
    socket.emit('subscribe', room);
    if (socket.rooms.indexOf(room) > -1) {
      return false;
    }
    socket.join(room);
    socket.broadcast.to(room).emit('user joined', socket.username);
  });

  socket.on('change room', function(room) {
    socket.emit('change room',room);
  })

  socket.on('message', function(data) {
    data.msg = data.msg.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    io.emit('message', {user: socket.username, msg: data.msg, room: data.room, time: Date.now()})
  })
})
