var express = require('express');
var shim = require('es6-shim');
var md5 = require("MD5");
var moment = require('moment');
var app = express();
var path = require('path');
var server = require('http').Server(app);
var io = require('socket.io')(server);


const MESSAGE_LENGTH_LIMIT = 140;
const USER_NAME_LENGTH_LIMIT = 19;

function filter(str) {
  if (str) {
    str = str.replace("<", "");
    str = str.replace(">", "");
    return str;
  }
}



function filter_msg(msg) {
  if (msg) {
    msg = msg.replace("<", "&lt;");
    msg = msg.replace(">", "&gt;");
    return msg;
  }
}

var users = new Map;
var messages = new Map;
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

  function get_users(room) {
    var u = [];
    for (var id in io.sockets.adapter.rooms[room]) {
      u.push(io.sockets.connected[id]);
    }
    return u;
  }

  //When the user first connects.
  //They will pick a name, then join lobby.
  //If their name doesn't meet criteria, then the user
  //will get asked to pick another name.

  socket.on('pick username', function(name) {
    name = filter(name);
    if (name === null || !name || name.length === 0) {
      return socket.emit('username error', 'Your username can not be blank. choose another username.');
    } else if (users.has(name)) {
      return socket.emit('username error', 'The name is already taken. choose another username.');
    } else if (name.length > USER_NAME_LENGTH_LIMIT) {
      return socket.emit('username error', 'name too long. choose another username.');
    }
    socket.nick = name;
    socket.emit('subscribe', 'lobby');
    if (users.get('lobby') === undefined) {
      users.set('lobby', []);
    }
    socket.join('lobby');
    users.get('lobby').push(socket.nick);
    socket.emit('join successful', socket.nick);
    var u = [];
      var clients = io.sockets.adapter.rooms['lobby'];
      for (var id in clients) {
        u.push(io.sockets.connected[id].nick);
      }

    io.to('lobby').emit('user joined room', {
      nick: socket.nick,
      room: 'lobby',
      users: u
    });

  });

  socket.on('change username', function(data) {
    if (data.nick === null || !data.nick || data.nick.length === 0) {
      return socket.emit('no username');
    } else if (users.get('name') === undefined) {
      socket.emit('username taken');
    }
    var oldname = socket.nick;
    socket.nick = filter(data.nick);

    users.get(data.room).pop(oldname);
    var u = [];
      var clients = io.sockets.adapter.rooms['lobby'];
      for (var id in clients) {
        u.push(io.sockets.connected[id].nick);
      }

    io.emit('user changed name', {
      old: oldname,
      current: socket.nick,
      users: u
    })


  })

  socket.on('disconnect', function() {

    socket.rooms.forEach(function(room) {
      var u = [];
      var clients = io.sockets.adapter.rooms['lobby'];
      for (var id in clients) {
        u.push(io.sockets.connected[id].nick);
      }
      users.get(room).pop(socket.nick);
      socket.leave(room);
      socket.to(room).emit('user left room', {
        nick: socket.nick,
        room: room
      })
    })
  });


  //When the user joins or leaves a room.
  //Also if the user switches rooms.
  socket.on('subscribe', function(room) {
    socket.emit('subscribe', room);
    if (socket.rooms.indexOf(room) < -1) {
      socket.join(room);
      io.to(room).emit('user joined room', {
        nick: socket.nick,
        room: filter(room)
      });
    }
  });

  socket.on('unsubscribe', function(room) {
    socket.emit('unsubscribe', room);
    socket.leave(room);
    io.to(room).emit('user left room', {
      nick: socket.nick,
      room: filter(room)
    });
  });

  socket.on('change room', function(room) {
    socket.emit('change room', {
      room: filter(room),
      msgs: messages.get(room),
      users: users.get(room)
    });
  });

  //When the user sends a message.
  socket.on('message', function(data) {
    if (!socket.nick) {
      socket.emit('no username');
    }
    if (socket.rooms.length === 0) {
      socket.emit('no rooms');
    }
    if (data.msg.length > MESSAGE_LENGTH_LIMIT) {
      socket.emit('message too long');
    }
    if (data.msg.substr(0, 1) === '/') {
      var cmd = data.msg.split('/')[1].split(' ')[0];

      switch (cmd) {
        case 'join':
          var room = data.msg.split('/join ')[1];
          socket.emit('subscribe', room);
          io.to(room).emit('user joined room', {
            nick: socket.nick,
            room: room
          });

          break;
        case 'part':
          var room = data.msg.split('/part ')[1];
          if (room != 'lobby') {
            socket.emit('unsubscribe', room);
          }
          break;
        case 'help':
          var msg = "Commands:<br />" +
            "/help - list commands<br />" +
            "/join [room] - join room<br />" +
            "/part [room] - leave room<br />";
          socket.emit('message', {
            nick: "HelpBot",
            msg: msg,
            room: data.room
          })
          break;
        default:
          socket.emit('message', {
            msg: "not a valid command",
            room: data.room
          })
      }
    } else {
      var colour = md5(socket.nick).substr(0, 6);
      var msg = '<p>[' + moment().format("H:mm:ss") + '] <span style="color:#' + colour + ';"><strong>' + socket.nick + '</strong></span>: ' + filter_msg(data.msg) + '</p>';
      if (messages.get(data.room) === undefined) {
        messages.set(data.room, []);
      }
      messages.get(data.room).push(msg);
      io.to('lobby').emit('message', msg);
    }
  });
});