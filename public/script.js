var name, id;

function getDateTime() {
    var date = new Date();
    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;
    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;
    return hour+":"+min;
}

var socket = io();
$('form').submit(function(){
    socket.emit('chat message', name, $('#m').val());
    $('#m').val('');
    return false;
});

socket.on('chat message', function(user, msg){
	$('#chat').append('<li class=\"left clearfix\"><div class=\"chat-body clearfix\"><div class=\"header\"><strong class=\"primary-font\">'+user+'</strong><small class=\"pull-right text-muted\"><span class=\"glyphicon glyphicon-time\"></span>'+ getDateTime() +'</small></div><p>'+ "&nbsp&nbsp" + (msg) + '</p></div></li>');
	updateScroll();
});

function updateScroll(){
	var element = document.getElementById("chatbox");
	element.scrollTop = element.scrollHeight;
}

socket.on('chat message', function(msg){
    $('#messages').append($('<li>').text(msg));
});

socket.on('matched', function(opponentID){
  $('#no_game').css('display', 'none');
  $('#in_game').css('display', '');
  $('#waiting').css('display', 'none');
});

socket.on('invalid cookie', function() {
    alert("Invalid cookie!");
});

socket.on('button press', function(){
    $('messages').append('Button Pressed');
});

socket.on('draw', function(imagedata){
    console.log(imagedata);
    var canvas = document.getElementById('board');
    var ctx = canvas.getContext('2d');
    var img = new Image();
    var src = 'data:image/svg+xml;base64,'+window.btoa(imagedata);
    img.onload = function() {
        ctx.drawImage(img, 0, 0);
    }
    img.src = src;
});

socket.on('game over', function(win) {
  $('#no_game').css('display', '');
  $('#in_game').css('display', 'none');
  $('#waiting').css('display', 'none');
  $('#outcome').css('display', '');
  $('#outcome').text("You " + win + "!");
});


function new_game() {
  socket.emit('new game', document.cookie);
  $('#outcome').css('display', 'none');
  $('#no_game').css('display', 'none');
  $('#in_game').css('display', 'none');
  $('#waiting').css('display', '');
  $('#rock').css('display', '');
  $('#paper').css('display', '');
  $('#scissors').css('display', '');
}

function play(m) {
  if (m != 'rock') {
    $('#rock').css('display', 'none');
  }
  if (m != 'paper') {
    $('#paper').css('display', 'none');
  }
  if (m != 'scissors') {
    $('#scissors').css('display', 'none');
  }
  socket.emit('play', {move:m, cookies:document.cookie});
}

socket.on('name', function(n) {
  name = n;
});

socket.emit('get name', document.cookie);
