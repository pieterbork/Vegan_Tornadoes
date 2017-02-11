var Matchmaker = require('matchmaker');
matchQueue = new Matchmaker;
matchQueue.policy = function(a,b) {
    if (Math.abs(a.rank-b.rank) < 20)
        return 100
    else
        return 0
};
// TODO(alex): Check to see if users have left the game
matchQueue.on('match', function(result) {
    console.log(result.a); // match a
    console.log(result.b); // match b
});
matchQueue.start();

/*
How to add people to queue:
mymatch.push({name:'walter',rank:1450});
mymatch.push({name:'skyler',rank:1465});
etc.
*/
