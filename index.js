// Import modules 
var express = require('express'); //Express module
var path = require('path'); //'path' module (packaged with Node.js)

// Create a new instance of Express
var app = express();

// Create a simple Express application
app.configure(function() {
    // Turn down the logging activity | TODO : uncomment
    // app.use(express.logger('dev'));
    // Serve static html, js, css, and image files from the 'public' directory
    app.use(express.static(path.join(__dirname,'public')));
});

// Create a Node.js based http server
var port = process.env.PORT || 8080;
var server = require('http').createServer(app).listen(port);

// Create a Socket.IO server and attach it to the http server
var io = require('socket.io').listen(server);