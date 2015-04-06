var socket = io();
var roomMessages = {};

$(document).ready(function() {
  $(document).on('click', '.room', function(event) {
    $('#room_tabs>div').removeClass('focus');
    $('#'+event.target.id).addClass('focus');
    socket.emit('change room', event.target.id);
  });

  $('#message').keypress(function(e) {
    if (e.which === 13) {
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
  var new_room = $('#room_tabs').data('currentroom');
  socket.emit('message', {
    msg: msg,
    room: new_room
  });
}
});
});

socket.on('add user', function(name) {
  $("#room_tabs").data('currentroom', 'lobby');
  $('#room_tabs').append('<div class="room focus" id="lobby">lobby</div>');
  $('#username').val(name);
});

socket.on('subscribe', function(room) {
  $('#room_tabs').data('currentroom', room);
  $('#room_tabs').append('<div class="room" id= "' + room + '">' + room + '</div>');
});

socket.on('connect', function() {
  socket.emit('add user', prompt("What is your username?"));
});

socket.on('username taken', function() {
  socket.emit('add user', prompt('The name is already taken. choose another username.'));
});

socket.on('no username', function() {
  socket.emit('add user', prompt('Your username can not be blank. choose another username.'))
});

socket.on('change room', function(room) {
  $('#messages').html('');
  var msgs;
  try {
    msgs = roomMessages[room].join('');
  } catch (e) {
    msgs = '';
  }
  $('#messages').append(msgs);
});

socket.on('user joined', function(name) {
  var msg = "<p id='joinleave'>" + name + " joined</p>";
  $('#messages').append(msg);
  roomMessages[room] = roomMessages[room] || [];
  roomMessages[room].push(msg);
});

socket.on('user left', function(name) {
      var msg = "<p id='joinleave'>" + name + " left</p>";
      $('#messages').append(msg);
      roomMessages[room] = roomMessages[room] || [];
      roomMessages[room].push(msg);
});

socket.on('message', function(data) {
  var room = $('#room_tabs').data('currentroom');
  var message = '<p>['+data.timestamp+'] <span style="color:#'+data.colour+';"><strong>' +data.user + '</strong></span>: ' + data.msg + '</p>';
  roomMessages[room] = roomMessages[room] || [];
  roomMessages[room].push(message);
  $('#messages').append(message);
});

