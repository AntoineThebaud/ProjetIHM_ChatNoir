var io;
var gameSocket;
var serverReady;
var catReady;

exports.initGame = function(sio, socket) {
	debug_log('initGame');
    io = sio;
    gameSocket = socket;
    gameSocket.emit('connected', { message: "You are connected!" });

    // Events
    gameSocket.on('hostCreateNewGame', hostCreateNewGame);
    gameSocket.on('hostRoomFull', hostRoomFull);
    gameSocket.on('playerJoinGame', playerJoinGame);

    // Initilisation des variables de controle pour le lancement de la partie
    serverReady = false;
    catReady = false;
}

/*******************************
 *       HOST FUNCTIONS        *
 *******************************/

function hostCreateNewGame() {

	debug_log('[CREATE NEW GAME : 2/5] - hostCreateNewGame (processing event server side)');

    // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
    this.emit('newGameCreated', {mySocketId: this.id});

    serverReady = true;
    if (serverReady == true && catReady == true) {
        //la partie peut être lancée.
        console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
        hostRoomFull();
    }
};

/*
 * Two players have joined. Alert the host!
 * @param gameId The game ID / room ID
 */
function hostRoomFull() {
    debug_log('[START GAME : 1/2] - hostRoomFull');

    var sock = this;
    var data = {
        mySocketId : sock.id
    };

    io.sockets.emit('beginNewGame', data);
}

/********************************
 *       PLAYER FUNCTIONS       *
 *******************************/

/**
 * A player clicked the 'START GAME' button.
 * Attempt to connect them to the room that matches
 * the gameId entered by the player.
 * @param data Contains data entered via player's input - playerName and gameId.
 */

 //TODO : à virer ?
function playerJoinGame() {
    debug_log('[JOIN GAME : 2/2] - playerJoinGame()');

    catReady = true;
    if (serverReady == true && catReady == true) {
        //la partie peut être lancée.
        console.log('ma grosse bite en platre');
        hostRoomFull();
    }
}

// For debug
var debugmode = true;
function debug_log(string) {
    if(debugmode == true) {
        console.log('    LOG  - [blackcat.js] '+string);
    }
}
