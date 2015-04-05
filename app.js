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

    users.push(user);
    socket.join('lobby');
    socket.emit('subscribe', 'lobby')
    socket.to('lobby').emit('user joined', name);
  });


  socket.on('subscribe', function(room) {
    socket.emit('subscribe', room);
    socket.join(room);
    socket.broadcast.to(room).emit('user joined', socket.rooms);
  });

  socket.on('change room', function(room) {
    io.emit('change room',room);
  })

  socket.on('message', function(data) {
    io.emit('message', {user: socket.username, msg: data.msg, room: data.room})
  })
})
