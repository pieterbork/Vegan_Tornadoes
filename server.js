// server.js
var appName = 'Vegan Tornadoes';
var express  = require('express');
var app      = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Matchmaker = require('matchmaker');
var path = require('path');
var port = process.env.PORT || 8083;

var xss = require('xss');
var logger = require('morgan');
var cookie = require('cookie');

callbacks = {};
matchQueue = queueInit();

users = {};
games = [];

function Game(p1, p2) {
  this.p1 = p1;
  this.p2 = p2;
}

function queueInit() {
  var mm = new Matchmaker;

  mm.prefs.checkinterval = 1000;
  mm.prefs.threshold = 100;
  mm.prefs.maxiters = 50;

  mm.policy = function(a,b) {
      return 100;
  }

  //@TODO(alex): Check to see if users have left disconnected
  mm.on('match', function(result) {
    gameID = games.push(new Game(result.a, result.b)) - 1;
    callbacks[result.a.sessionID](result.b.sessionID, gameID);
    callbacks[result.a.sessionID] = undefined;
    callbacks[result.b.sessionID](result.a.sessionID, gameID);
    callbacks[result.b.sessionID] = undefined;
  });

  mm.start();
  return mm;
}

function getSessionID(req, res) {
  var cookies = cookie.parse(req.headers.cookie || '');
  var sessionID = cookies.sessionID;
  if (!sessionID) {
    // random number
    sessionID = String(Math.random()).substring(2);
    // Redirect back after setting cookie
    // res.statusCode = 302;
    // res.setHeader('Location', req.headers.referer || '/');
  }
  res.setHeader('Set-Cookie', cookie.serialize('sessionID', sessionID, {
    httpOnly: false,
    maxAge: 60 * 60 // 1 hour
  }));

  return sessionID;
}

function getGame(sid) {
  if(users[sid]) {
    return games[users[sid].gameID];
  }
  else {

  }
}

function deleteGame(sid) {
    if(users[sid]) {
      games.splice(users[sid].gameID, 1);
    }
}

function getOpponent(sid) {
  var game = games[users[sid].gameID];
  if (sid == game.p1.sessionID) {
    return game.p2.sessionID;
  }
  else {
    return game.p1.sessionID;
  }
}

app.use(logger('dev')); // log every request to the console
app.use(express.static(path.join(__dirname, 'public')));


names = ["Josh", "Joe", "Foo", "Bar"];
app.get('/', function(req, res){
  var sessionID = getSessionID(req, res);
  if (!users[sessionID]) {
    users[sessionID] = { name: names[Math.floor(Math.random() * (names.length))], sessionID: sessionID };
  }
  res.sendFile(__dirname + '/index.html');
});

app.get('/chat', function(req, res){
    res.sendFile(__dirname + '/chat.html');
});

function parseID(cookies) {
  return cookie.parse(cookies || '').sessionID;
}

function rps(m1, m2) {
  if (m1 == 'rock') {
    if (m2 == 'rock') {
      return 0;
    } else if (m2 == 'paper') {
      return 2;
    } else {
      return 1;
    }
  } else if (m1 == 'paper') {
    if (m2 == 'rock') {
      return 1;
    } else if (m2 == 'paper') {
      return 0;
    } else {
      return 2;
    }
  } else {
    if (m2 == 'rock') {
      return 2;
    } else if (m2 == 'paper') {
      return 1;
    } else {
      return 0;
    }
  }
}

// Chat Stuff
io.on('connection', function(socket) {
    socket.on('chat message', function(msg){
        l = xss(msg);
        io.emit('chat message', l);
    });

    socket.on('new game', function(cookies){
      var sessionID = parseID(cookies);
      if (users[sessionID] && !callbacks[sessionID]) {
        matchQueue.push(users[sessionID]);
        callbacks[sessionID] = function (opponentID, gameID) {
          users[sessionID].gameID = gameID;
          socket.emit('matched', opponentID);
        };
      }
      else if (callbacks[sessionID]) {
        console.log("Somebody left the 'new game' button on the page after it's been pressed!")
      }
      else {
        socket.emit('invalid cookie');
      }
    });
    socket.on('play', function(data) {
      sessionID = parseID(data.cookies);
      game = getGame(sessionID);
      if (sessionID == game.p1.sessionID) {
        game.m1 = data.move;
        game.s1 = socket;
      } else {
        game.m2 = data.move;
        game.s2 = socket;
      }
      if (game.m1 && game.m2) {
        winner = rps(game.m1, game.m2);
        game.s1.emit('game over', winner == 0 ? 'tied': winner == 1 ? 'won': 'lost');
        game.s2.emit('game over', winner == 0 ? 'tied': winner == 2 ? 'won': 'lost');
        deleteGame(sessionID);
      }
    });
    socket.on('heartbeat', function(id) {
    });
    socket.on('button press', function(msg) {
    });
});

http.listen(port, function() {
    console.log(appName + ' is launched on port ' + port);
});
