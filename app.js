var express = require('express');
var moment = require('moment');
var shim = require('es6-shim');
var path = require('path');
var md5 = require("MD5");
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var marked = require('marked');

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
    msg = msg.replace("<script>", "&lt;script&gt;");
    msg = msg.replace("</script>", "&lt;/script&gt;");
    return msg;
  }
}

var users = new Map;
var messages = new Map;
var port = process.env.PORT || 8080;

app.use('/build', express.static(path.join(__dirname + '/js')));
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
    if (messages.get('lobby') === undefined) {
      messages.set('lobby', []);
    }
    messages.get('lobby').push('<p id="annoucement">' + socket.nick + ' joined.</p>');

    io.to('lobby').emit('user joined room', {
      nick: socket.nick,
      room: 'lobby',
      users: u
    });

  });

  socket.on('change username', function(data) {
    var name = filter(data.nick);
    if (name === null || !name || name.length === 0) {
      return socket.emit('username error', 'Your username can not be blank. choose another username.');
    } else if (users.has(name)) {
      return socket.emit('username error', 'The name is already taken. choose another username.');
    } else if (name.length > USER_NAME_LENGTH_LIMIT) {
      return socket.emit('username error', 'name too long. choose another username.');
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
      io.to(room).emit('user left room', {
        nick: socket.nick,
        room: room
      })
    })
  });


  //When the user joins or leaves a room.
  //Also if the user switches rooms.
  socket.on('subscribe', function(room) {
    room = room.toLowerCase();
    socket.join(room);
    socket.emit('subscribe', room);
    /*if (socket.rooms.indexOf(room) > -1) {
      return false;
    } */
    var u = [];
    var clients = io.sockets.adapter.rooms[room];
    for (var id in clients) {
      u.push(io.sockets.connected[id].nick);
    }
    if (messages.get(room) === undefined) {
      messages.set(room, []);
    }
    messages.get(room).push('<p id="annoucement">' + socket.nick + ' joined.</p>');
    io.to(room).emit('user joined room', {
      nick: socket.nick,
      users: u,
      room: filter(room)
    });

  });

  socket.on('unsubscribe', function(room) {
    room = room.toLowerCase();
    socket.emit('unsubscribe', room);
    socket.leave(room);
    var u = [];
    var clients = io.sockets.adapter.rooms[room];
    for (var id in clients) {
      u.push(io.sockets.connected[id].nick);
    }
    io.to(room).emit('user left room', {
      users: u,
      room: filter(room)
    });
  });

  socket.on('change room', function(room) {
    room = room.toLowerCase();
    var u = [];
    var clients = io.sockets.adapter.rooms[room];
    for (var id in clients) {
      u.push(io.sockets.connected[id].nick);
    }
    socket.emit('change room', {
      room: filter(room),
      msgs: messages.get(room),
      users: u
    });
  });

  //When the user sends a message.
  socket.on('message', function(data) {
    if (!socket.nick) {
      return socket.emit('no username');
    }
    if (socket.rooms.length === 0) {
      return socket.emit('message error', 'no rooms');
    }
    if (data.msg.length > MESSAGE_LENGTH_LIMIT) {
      return socket.emit('message error', 'message too long');
    }
    if (data.msg.substr(0, 1) === '/') {
      var cmd = data.msg.split('/')[1].split(' ')[0];

      switch (cmd) {
        case 'join':
          var room = data.msg.split('/join ')[1].toLowerCase();
          socket.join(room);
          var u = [];
          var clients = io.sockets.adapter.rooms[room];
          for (var id in clients) {
            u.push(io.sockets.connected[id].nick);
          }
          if (messages.get(room) === undefined) {
            messages.set(room, []);
          }
          messages.get(room).push('<p id="annoucement">' + socket.nick + ' joined.</p>');
          socket.emit('subscribe', room);
          io.to(room).emit('user joined room', {
            nick: socket.nick,
            room: room,
            users: u
          });

          break;
        case 'part':
          var room = data.msg.split('/part ')[1];
          if (room != 'lobby') {
            if (messages.get(room) === undefined) {
              messages.set(room, []);
            }
            messages.get(room).push('<p id="annoucement">' + socket.nick + ' left.</p>');
            socket.leave(room);
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
      if (messages.get(data.room) === undefined) {
        messages.set(data.room, []);
      }
      data.room = data.room.toLowerCase();
      data.msg = marked(data.msg).replace('<p>', '');
      var m = '<p>[' + data.timestamp + '] <span style="color:#' + colour + ';"><strong>' + socket.nick + '</strong></span>: ' + data.msg + '</p>';
      messages.get(data.room).push(m);

      io.to('lobby').emit('message', {
        colour: colour,
        nick: socket.nick,
        msg: filter_msg(data.msg),
        timestamp: data.timestamp
      });
    }
  });
});