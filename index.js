// Import des modules 
var express = require('express'); //Express module
var path = require('path'); //'path' module (packaged with Node.js)

// Creation d'une application Express basique
var app = express();
app.configure(function() {
    app.use(express.static(path.join(__dirname,'public')));
});

// Creation du serveur Node.js
var port = process.env.PORT || 8080;
var server = require('http').createServer(app).listen(port);

// Creation de la socket à attacher au serveur
var io = require('socket.io').listen(server);

// Gestion des connexions
var game = require('./blackcat');
io.sockets.on('connection', function (socket) {
    console.log('    LOG  - [index.js] client connected');
    game.initGame(io, socket);
});

console.log('   DEBUG   - [index.js] Server start on port: ' + port);
