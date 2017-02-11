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
    socket.emit('chat message', $('#m').val());
    $('#m').val('');
    return false;
});

socket.on('chat message', function(msg){
    $('#messages').append($('<li>').text(msg));
});

socket.on('matched', function(opponentID){
    alert("Matched with: " + opponentID);
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
    alert("You " + win + " !");
});

function new_game() {
    socket.emit('new game', document.cookie);
    $('#no_game').css('display', 'none');
    $('#in_game').css('display', '');
}

function play(m) {
    socket.emit('play', {move:m, cookies:document.cookie});
}
