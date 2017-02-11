// server.js
var appName = 'Vegan Tornadoes';
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Matchmaker = require('matchmaker');
var path = require('path');
var port = process.env.PORT || 8087;

// stuff that came in handy before...
var logger = require('morgan');
var cookie = require('cookie');

var callbacks = {};
function queueInit() {
  var mm = new Matchmaker;

  mm.prefs.checkinterval = 1000;
  mm.prefs.threshold = 100;
  mm.prefs.maxiters = 50;

  mm.policy = function(a,b) {
      if(Math.abs(a.rank-b.rank) < 20)
          return 100;
      else
          return 0;
  }

  //@TODO(alex): Check to see if users have left disconnected
  mm.on('match', function(result) {
    callbacks[result.a.sessionID](result.b.sessionID);
    callbacks[result.b.sessionID](result.a.sessionID);
    // console.log(result.a.sessionID + " has been matched with " + result.b.sessionID);
  });

  mm.start();
  return mm;
}

function getSessionID(req, res) {
  var cookies = cookie.parse(req.headers.cookie || '');
  var name = cookies.sessionID;
  if (!name) {
    // random number
    name = String(Math.random()).substring(2);

    res.setHeader('Set-Cookie', cookie.serialize('sessionID', name, {
      httpOnly: true,
      maxAge: 60 * 60 // 1 hour
    }));

    // Redirect back after setting cookie
    res.statusCode = 302;
    res.setHeader('Location', req.headers.referer || '/');
  }
  return name;
}

matchQueue = queueInit();
users = {};

app.use(logger('dev')); // log every request to the console

app.get('/', function(req, res){
  var sessionID = getSessionID(req, res);
  if (!users[sessionID]) {
    users[sessionID] = { name: "No name", rank: 100, sessionID: sessionID };
  }
  res.sendFile(__dirname + '/index.html');
});

app.get('/chat', function(req, res){
    res.sendFile(__dirname + '/chat.html');
});

// Chat Stuff
io.on('connection', function(socket) {
    socket.on('chat message', function(msg){
        io.emit('chat message', msg);
    });
    socket.on('new game', function(sessionID){
      matchQueue.push(users[sessionID]);
      callbacks[sessionID] = (opponentID) => { io.emit('matched', opponentID); }
    });
    socket.on('button press', function(msg){
        console.log('pressed');
    })
});

http.listen(port, function(){
    console.log(appName + ' is launched on port ' + port);
});
