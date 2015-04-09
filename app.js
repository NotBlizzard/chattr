var express = require('express');
var md5 = require("MD5");
var app = express();
var path = require('path');
var server = require('http').Server(app);
var io = require('socket.io')(server);


const MESSAGE_LENGTH_LIMIT = 50;

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

    socket.nick = filter(name);
    users.push(socket.nick);
    if (!socket.rooms.indexOf('lobby') > -1) {
      socket.join('lobby');
    }
    socket.emit('subscribe', 'lobby');
    socket.emit('pick username', socket.nick);
    socket.to('lobby').emit('user joined room', {
      nick: socket.nick,
      room: 'lobby'
    });

  });

  socket.on('change username', function(name) {
    if (name === null || !name || name.length === 0) {
      return socket.emit('no username');
    } else if (users.indexOf(filter(name) > -1) {
      socket.emit('username taken');
    }
        socket.nick = filter(name);

    var oldname = socket.nick;
    users.push(filter(socket.nick);
    if (!socket.rooms.indexOf('lobby') > -1) {
      socket.join('lobby');
    }
    users.pop(socket.nick);
    io.emit('user changed name', {old: oldname, current: socket.nick})


  })

  socket.on('disconnect', function() {
    try {
      users.pop(socket.nick.toLowerCase());
    } catch (e) {
      //the user never picked a name, and disconnected.
    }
    for (var i = 0; i < socket.rooms.length; i++) {
      socket.to(room).emit('user left room', {
        nick: socket.nick,
        room: socket.rooms[i]
      })
    }
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
    socket.emit('change room', filter(room));
  });

  //When the user sends a message.
  socket.on('message', function(data) {
    if (!socket.nick) {
      socket.emit('no username');
    }
    if (socket.rooms.length == 0) {
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
      data.msg = filter_msg(data.msg);
      var colour = md5(socket.nick).substr(0, 6);
      io.emit('message', {
        nick: socket.nick,
        msg: data.msg,
        room: data.room,
        colour: colour,
        cmd: data.cmd
      });
    }
  });
});