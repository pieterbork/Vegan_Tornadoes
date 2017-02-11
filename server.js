// server.js
var appName = 'Vegan Tornadoes';
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 8083;
var path = require('path');
var Matchmaker = require('matchmaker');

// stuff that came in handy before...
var logger = require('morgan');
var cookieParser = require('cookie-parser');
matchQueue = new Matchmaker;

matchQueue.policy = function(a,b) {
    if(Maths.abs(a.rank-b.rank) < 20)
        return 100
    else
        return 0
}

//@TODO : Check to see if users have left disconnected
matchQueue.on('match', function(result) {
    console.log(result.a + " has been matched with " + result.b)
});

matchQueue.start();

/*
 * How to add people to queue:
 * matchQueue.push({name: 'walter',rank:1450})
 * matchQueue.push({name: 'skyler',rank:1460})
*/

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
    console.log(appName + ' is launched on port ' + port);
});
