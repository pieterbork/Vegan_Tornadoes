// server.js
var appName = 'Vegan Tornadoes';
var express  = require('express');
var app      = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Matchmaker = require('matchmaker');
var path = require('path');
var im = require('imagemagick');
var port = process.env.PORT || 8083;

// stuff that came in handy before...
var logger = require('morgan');
var cookieParser = require('cookie-parser');

function queueInit() {
    var mm = new Matchmaker;

    mm.prefs.checkinterval = 5000;
    mm.prefs.threshold = 100;
    mm.prefs.maxiters = 50;

    mm.policy = function(a,b) {
        if(Maths.abs(a.rank-b.rank) < 20) {
            return 100;
        }
        else {
            return 0;
        }
    }

  //@TODO(alex): Check to see if users have left disconnected
    mm.on('match', function(result) {
        console.log(result.a + " has been matched with " + result.b);
    });

    mm.start();
    return mm;
}

matchQueue = queueInit();
/*
 * How to add people to queue:
 * matchQueue.push({name: 'walter',rank:1450})
 * matchQueue.push({name: 'skyler',rank:1460})
*/

app.use(logger('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.get('/chat', function(req, res){
    res.sendFile(__dirname + '/chat.html');
});

// Chat Stuff
io.on('connection', function(socket) {
    socket.on('chat message', function(msg) {
        io.emit('chat message', msg);
    });
    socket.on('button press', function(msg) {
        console.log('pressed');
    });
});

http.listen(port, function() {
    console.log(appName + ' is launched on port ' + port);
});
