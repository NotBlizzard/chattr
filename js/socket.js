var socket = io();

var roomMessages = new Object([]);

$(document).ready(function() {

  $(document).on('click', '.room', function(event) {
    socket.emit('change room', event.target.id);
  })

  $('#send').click(function() {
    var msg = $('#message').val();
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


socket.on('subscribe', function(room) {
  $('#room_tabs').data('currentroom', room);
  $('#room_tabs>div').removeClass('focus');
  $('#room_tabs').append('<div class="room focus" id= "' + room + '">' + room + '</div>');
});

socket.on('connect', function() {
  socket.emit('add user', prompt("What is your username"));
});

socket.on('change room', function(room) {
  $('#messages').html('');
  try {
    var msgs = roomMessages[room].join('');
  } catch (e) {
    var msgs = '';
  }

  $('#messages').append(msgs);

})

socket.on('user joined', function(name) {
  console.log(name);
  $('#messages').append('<p id="joinleave">' + name + ' joined</p>');
});

socket.on('message', function(data) {
  var room = $('#room_tabs').data('currentroom');
  var message = '<p>' + data.user + ': ' + data.msg + '</p>';
  if (roomMessages)
  roomMessages[room] = roomMessages[room] || [];
  roomMessages[room].push(message);// + '<br />';
  $('#messages').append(message);
});

socket.on('user left', function(name) {
  $('#messages').append('<p id="joinleave">'+ name +' left</p>');
})