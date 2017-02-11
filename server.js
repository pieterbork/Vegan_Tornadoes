// server.js
var appName = 'Vegan Tornadoes';
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 8083;
var path = require('path');

// stuff that came in handy before...
var logger = require('morgan');
var cookieParser = require('cookie-parser');


app.use(logger('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.get('/chat', function(req, res){
    res.sendFile(__dirname + '/chat.html');
});

// Chat Stuff
io.on('connection', function(socket){
    socket.on('chat message', function(msg){
        io.emit('chat message', msg);
    });
    socket.on('button press', function(msg){
        console.log('pressed');
    })
});

http.listen(port, function(){
    console.log(appName + 'is launched on port ' + port);
});
