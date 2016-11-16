var io;
var gameSocket;

exports.initGame = function(sio, socket){
	debug_log('initGame');
    io = sio;
    gameSocket = socket;
    gameSocket.emit('connected', { message: "You are connected!" });

    // Host Events
    gameSocket.on('hostCreateNewGame', hostCreateNewGame);
}

/*******************************
 *       HOST FUNCTIONS        *
 *******************************/

function hostCreateNewGame() {

	debug_log('[CREATE NEW GAME] - Step 2 - processing event (server side)');
    // Create a unique Socket.IO Room
    var thisGameId = ( Math.random() * 100000 ) | 0;

    // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
    this.emit('newGameCreated', {gameId: thisGameId, mySocketId: this.id});

    // Join the Room and wait for the players
    //this.join(thisGameId.toString());
};

// For debug
var debugmode = true;
function debug_log(string) {
    if(debugmode == true) {
        console.log('    LOG  - [blackcat.js] '+string);
    }
}