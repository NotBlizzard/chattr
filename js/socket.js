var socket = io();
var roomMessages = {};


$(document).ready(function() {
  setInterval(function() {
    var w = document.getElementById("room");
    w.scrollTop = w.scrollHeight;
  }, 100);



  $(document).on('click', '.room', function(event) {
    $('#room_tabs>div').removeClass('focus');
    $('#' + event.target.id).addClass('focus');
    socket.emit('change room', event.target.id);
  });

  $('#message').keypress(function(e) {
    if (e.which === 13) {
      $('#send').click();
    }
  });
  $(document).on('click', '.exit', function(event) {
    $("#" + event.target.id).remove();
    socket.emit('unsubscribe', event.target.id);
  });
  $('#change_username').click(function() {
    socket.emit('change username', prompt("What is your new username?"))
  })

  $('#send').click(function() {
    var msg = $('#message').val();
    if (msg === '') return false;
    if ($("#room_tabs").data('currentroom') === '') {
      socket.emit('no rooms');
    }
    if (msg.substr(0, 1) === '/') {
      var cmd = msg.split('/')[1].split(' ')[0];
      //TODO: put commands in seperate file.
      /*switch (cmd) {
        case 'join':
          var room = msg.split('/join ')[1];
          $("#message").val();
          socket.emit('subscribe', room);
          break;
        case 'part':
          var room = msg.split('/part ')[1];
          $("#message").val();
          if (room != 'lobby') {
            socket.emit('unsubscribe', room);
          }
          break;
        case 'help':
          var msg = "Commands<br />" +
            "/help - list commands<br />" +
            "/join [room] - join room<br />" +
            "/part [room] - leave room<br />";
          socket.emit('message', {
            msg: msg,
            room: $('#room_tabs').data('currentroom')
          })
          break;
        default:
          socket.emit('message', {
            msg: "not a valid command",
            room: $('#room_tabs').data('currentroom')
          })
      }*/
      socket.emit('message', {
        msg: msg,
        room: $('#room_tabs').data('currentroom')
      });
      $('#message').val('');
    } else {
      $('#message').val('');
      socket.emit('message', {
        msg: msg,
        room: $('#room_tabs').data('currentroom')
      });
    }
  });
});

/* When the user connects and disconnects.
 */
socket.on('connect', function() {
  socket.emit('pick username', prompt("What is your username?"));
});

/* When the user makes their name, check to see if
 * the name is taken or blank. If not, join lobby.
 */

socket.on('pick username', function(name) {
  $("#username").html("<p>" + name + "</p>");
})

socket.on('username taken', function() {
  socket.emit('pick username', prompt('The name is already taken. choose another username.'));
});

socket.on('no username', function() {
  socket.emit('pick username', prompt('Your username can not be blank. choose another username.'));
});

socket.on('bad username', function() {
  socket.emit('pick username', prompt("That name contains a bad word. pick another username."));
});

/* When the user changes rooms.
 */

socket.on('change room', function(room) {
  $('#messages').html('');
  var msgs;
  try {
    msgs = roomMessages[room].join('');
  } catch (e) {
    msgs = '';
  }
  $('#room_tabs').data('currentroom', room)
  $('#messages').append(msgs);
});

/* When the user either
 * joins a room or leaves a room
 */

socket.on('subscribe', function(room) {
  $('#room_tabs').data('currentroom', room);
  if (room === 'lobby') {
    $('#room_tabs').append('<div class="room focus" id= "' + room + '">' + room + '</div>');
  } else {
    $('#room_tabs').append('<br /><div class="room" id= "' + room + '">' + room + '<i id="' + room + '" class="exit fa fa-times"></i></div>');
  }
});

socket.on('unsubscribe', function(room) {
  if ($("#room_tabs").data('currentroom') === room) {
    $('#room_tabs').data('currentroom', null);
  };
  $("#" + room).remove();
})

socket.on('user joined room', function(data) {
  var msg = "<p id='annoucement'>" + data.nick + " joined</p>";
  $('#messages').append(msg);
  roomMessages[data.room] = roomMessages[data.room] || [];
  roomMessages[data.room].push(msg);
});

socket.on('user left room', function(data) {
  var msg = "<p id='annoucement'>" + data.nick + " left</p>";
  $('#messages').append(msg);
  roomMessages[data.room] = roomMessages[dataroom] || [];
  roomMessages[data.room].push(msg);
});

socket.on('user changed name', function(data) {
  var msg = "<p id='annoucement'>"+data.old+" is now "+data.current +"</p>";
  $('#messages').append(msg);
  $('#username').html('<p>'+data.current+'</p>');
  roomMessages[data.room] = roomMessages[dataroom] || [];
  roomMessages[data.room].push(msg);
})

/* When the user attempts to sends a message to a room.
 */

socket.on('message', function(data) {
  var message = '<p>[' + moment().format("H:mm:ss") + '] <span style="color:#' + data.colour + ';"><strong>' + data.nick + '</strong></span>: ' + data.msg + '</p>';
  roomMessages[data.room] = roomMessages[data.room] || [];
  roomMessages[data.room].push(message);
  $('#messages').append(message);

});