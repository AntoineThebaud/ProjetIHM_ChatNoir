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
 *       FONCTIONS HOST        *
 *******************************/

// Un joueur a rejoint la file d'attente en tant que poseur de piège.
// Si le chat est prêt, la partie est lancée.
function hostCreateNewGame() {
	debug_log('[CREATE NEW GAME : 2/5] - hostCreateNewGame (processing event server side)');

    // Retourne l'id de la socket au côté client
    this.emit('newGameCreated', {mySocketId: this.id});

    serverReady = true;
    if (serverReady == true && catReady == true) {
        hostRoomFull();
    }
};

// Le serveur (Trap) et le client (Cat) sont prêts
// La partie peut être lancée
function hostRoomFull() {
    debug_log('[START GAME : 1/2] - hostRoomFull');

    var sock = this;
    var data = {
        mySocketId : sock.id
    };

    io.sockets.emit('beginNewGame', data);
}

/********************************
 *       FONCTIONS CLIENT       *
 *******************************/

// Un joueur a rejoint la file d'attente en tant que chat
// Si le poseur de piège est prêt, la partie est lancée.
function clientJoinGame() {
    debug_log('[JOIN GAME : 2/2] - playerJoinGame()');

    catReady = true;
    if (serverReady == true && catReady == true) {
        //la partie peut être lancée.
        console.log('ma grosse bite en platre');
        hostRoomFull();
    }
}

// Pour debug
var debugmode = true;
function debug_log(string) {
    if(debugmode == true) {
        console.log('    LOG  - [blackcat.js] '+string);
    }
}
