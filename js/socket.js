var socket = io();



$(document).ready(function() {


  $(document).on('click', '.room', function(event) {
    $('#room_tabs>li').removeClass('focus');
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
    var newname =  prompt("What is your new username?")
    socket.emit('change username', {nick: newname, room: $("#chat").data('room')})
  })

  $('#send').click(function() {
    var msg = $('#message').val();
    if (msg === '') return false;
    if ($("#chat").data('room') === '') {
      socket.emit('no rooms');
    }
    $('#message').val('');
    socket.emit('message', {
      msg: msg,
      room: $('#chat').data('room'),
      timestamp: moment().format("H:mm:ss")
    });
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

socket.on('join successful', function(nick) {
  $("#username").html("<b><p>" +nick + "</p></b>");
})

socket.on('username error', function(err) {
  socket.emit('pick username', prompt(err));
});

/* When the user changes rooms.
 */

socket.on('change room', function(data) {
  $('#messages').html('');
  $("#userlist").html('');
  $('#chat').data('room', data.room)
  $('#messages').append(data.msgs);
  $('#userlist').append(data.users.join('<br />'));
});

/* When the user either
 * joins a room or leaves a room
 */

socket.on('subscribe', function(room) {
  $('#chat').data('room', room);
  if (room === 'lobby') {
    $('#room_tabs').append('<li class="room focus" id= "lobby">lobby</li>');
  } else {
    $('#room_tabs').append('<li class="room" id= "' + room + '">' + room + '<i id="' + room + '" class="exit fa fa-times"></i></li>');
  }

});


socket.on('unsubscribe', function(room) {
  if ($("#chat").data('room') === room) {
    $('#chat').data('room', null);
  };
  $("#" + room).remove();
})


socket.on('user joined room', function(data) {
  var msg = "<p id='annoucement'>" + data.nick + " joined</p>";
  $('#messages').append(msg);
  $('#userlist').html('');
  $("#userlist").append("<p>"+data.users.join('<br />')+"</p>");

});

socket.on('user left room', function(data) {
  var msg = "<p id='annoucement'>" + data.nick + " left</p>";
  $('#messages').append(msg);
  $("#userlist").append("<p>"+data.users.join('<br />')+"</p>");
});

socket.on('user changed name', function(data) {
  var msg = "<p id='annoucement'>"+data.old+" is now "+data.current +"</p>";
  $('#messages').append(msg);
  $('#username').html('<p>'+data.current+'</p>');
  $('#userlist').html('');
  $("#userlist").append("<p>"+data.users.join("<br />")+"</p>");
})

/* When the user attempts to sends a message to a room.
 */

socket.on('message', function(data) {
  var m = '<p>[' + data.timestamp + '] <span style="color:#' + data.colour + ';"><strong>' + data.nick + '</strong></span>: ' + data.msg + '</p>';
  $('#messages').append(m);

});