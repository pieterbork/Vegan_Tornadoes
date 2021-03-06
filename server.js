// server.js
var appName = 'Vegan Tornadoes';
var express = require('express');
var app = express();
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
        console.log(users[result.a.sessionID]);
        console.log(users[result.b.sessionID]);
        console.log("[" + result.a.name + ", " + result.a.sessionID + '] was matched with [' + result.b.name + ", " + result.b.sessionID + "]")
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
    console.log('sessionID: ' + sessionID)
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
        // oops
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

adjectives = ["Sexy", "Fuzzy", "Purple", "Deadly", "Sparkly", "Flatulent", "Hidden", "Crouching", "Dishonorable", "Tiny", "Chunky", "Bubbly", "Lame", "Dashing", "Creepy", "Beautiful", "Luxurious", "Fancy", "Cute", "Offended", "Psychadelic", "Ripped", "Goopy", "Wascilly"];
nouns = ["Josh", "Sidewalk", "Pizza", "Tiger", "Turtle", "Water", "Ninja", "Pirate", "DJ", "Spaceship", "Eagle", "Carlos", "Bottle", "Clock", "Eiffel Tower", "Sunglasses", "Wabbit", "Powerpoint", "Dragon"];

app.get('/', function(req, res){
  var sessionID = getSessionID(req, res);
  if (!users[sessionID]) {
    noun = nouns[Math.floor(Math.random() * (nouns.length))]
    adj = adjectives[Math.floor(Math.random() * (adjectives.length))]
    users[sessionID] = { name: adj + " " + noun, sessionID: sessionID };
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
    var result;
    if (m1 == 'rock')
        result = (m2 == 'rock') ? 'tied' : ((m2 == 'paper') ? 'lost' : 'won');
    else if (m1 == 'paper')
        result = (m2 == 'rock') ? 'won' : ((m2 == 'paper') ? 'tied' : 'lost');
    else
        result = (m2 == 'rock') ? 'lost' : ((m2 == 'paper') ? 'won' : 'tied');
    return result;
}



var connectCounter = 0;
var searchCounter = 0;
// Chat Stuff
io.on('connection', function(socket) {
    connectCounter++;
    io.emit('userCount', connectCounter);
    io.emit('searchCount', searchCounter);

    socket.on('disconnect', function() {
        connectCounter--;
        io.emit('userCount', connectCounter);
    });

    // users[sessionID].socket = socket;
    socket.on('chat message', function(user, msg){
        l = xss(msg);
        console.log(user +" said: "+ l);
        io.emit('chat message', user, l);
    });
    
    socket.on('new game', function(cookies){
        var sessionID = parseID(cookies);
        if (users[sessionID] && !callbacks[sessionID]) {
            matchQueue.push(users[sessionID]);
            searchCounter++;
            io.emit('searchCount', searchCounter);
            callbacks[sessionID] = function (opponentID, gameID) {
                users[sessionID].gameID = gameID;
                socket.emit('matched', opponentID);
                searchCounter--;
                io.emit('searchCount', searchCounter);
            };
        }
        else if (callbacks[sessionID]) {
            console.log("Somebody left the 'new game' button on the page after it's been pressed!")
        }
        else {
            console.log(users);
            console.log(sessionID);
            console.log(callbacks);
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
            s1_result = rps(game.m1, game.m2);
            s2_result = s1_result == 'tied' ? 'tied' : s1_result == 'won' ? 'lost' : 'won';
            console.log(game.p1.name + " " + s1_result);
            console.log(game.p2.name + " " + s1_result); 
            game.s1.emit('game over', s1_result);
            game.s2.emit('game over', s2_result);
            deleteGame(sessionID);
        }
    });
    socket.on('get name', function(cookies) {
        var id = parseID(cookies);
        if(users[id]) {
            socket.emit('name', users[id].name);
        }
    });
    socket.on('button press', function(msg) {
        console.log('pressed');
    });
});

http.listen(port, function() {
    console.log(appName + ' is launched on port ' + port);
});
