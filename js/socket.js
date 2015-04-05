var socket = io();

var roomMessages = {};

$(document).ready(function() {

  $(document).on('click', '.room', function(event) {
    $('#room_tabs>div').removeClass('focus');
    $('#'+event.target.id).addClass('focus');
    socket.emit('change room', event.target.id);
  })

  $('#message').keypress(function(e) {
    if (e.which == 13) {
      $('#send').click();
    }
  });

  $('#send').click(function() {
    var msg = $('#message').val();
    if (msg === '') return false;
    if (msg.substr(0, 5) === '/join') {
      var room = msg.split('/join ')[1];
      $('#message').val('');
      socket.emit('subscribe', room);
    } else {
      $('#message').val('');
      var room = $('#room_tabs').data('currentroom');
      socket.emit('message', {msg: msg, room: room});
    }
  })
})

socket.on('add user', function() {
  $("#room_tabs").data('currentroom', 'lobby');
  $('#room_tabs').append('<div class="room focus" id="lobby">lobby</div>')
})


socket.on('subscribe', function(room) {
  $('#room_tabs').data('currentroom', room);
  $('#room_tabs').append('<div class="room" id= "' + room + '">' + room + '</div>');
});

socket.on('connect', function() {
  socket.emit('add user', prompt("What is your username?"));
});

socket.on('username taken', function() {
  socket.emit('add user', prompt('The name is already taken. choose another username.'))
})

socket.on('change room', function(room) {
  $('#messages').html('');
  try {
    var msgs = roomMessages[room].join('');
  } catch (e) {
    var msgs = '';
  }
  $('#messages').append(msgs);

});

socket.on('user joined', function(name) {
  $('#messages').append('<p id="joinleave">' + name + ' joined</p>');
});

socket.on('user left', function(name) {
  $('#messages').append('<p id="joinleave">'+ name +' left</p>');
});

socket.on('message', function(data) {
  var room = $('#room_tabs').data('currentroom');
  var message = '<p>'+data.user + ': ' + data.msg + '</p>';
  roomMessages[room] = roomMessages[room] || [];
  roomMessages[room].push(message);
  $('#messages').append(message);
});

