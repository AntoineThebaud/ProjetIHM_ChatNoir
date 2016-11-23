var io;
var gameSocket;

// variables de controle pour le lancement de la partie
var serverReady;
var catReady;

// garde en mémoire la position du chat
var catPosition = {
	i : 5,
	j : 5
};

exports.initGame = function(sio, socket) {
	debug_log('initGame');
    io = sio;
    gameSocket = socket;
    gameSocket.emit('connected', { message: "You are connected!" });

    // Events
    gameSocket.on('hostCreateNewGame', hostCreateNewGame);
    gameSocket.on('hostRoomFull', hostRoomFull);
    gameSocket.on('clientJoinGame', clientJoinGame);
		gameSocket.on('catMoved', catMoved);

    // Initilisation des variables de controle
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

var pos = {
	old : {
		i : '',
		j : ''
	},
	neww : {
		i : '',
		j : ''
	}
}
// Move cat left
function catMoved(data) {
	pos.old.i = catPosition.i;
	pos.old.j = catPosition.j;
	debug_log('[Cat Mouvement] - Cat moved ' + data.direction);
	catPosition = nextCatPosition(catPosition,data.direction);
	pos.neww.i = catPosition.i;
	pos.neww.j = catPosition.j;
	io.sockets.emit('catMoved', pos)	;
};

function nextCatPosition(position, direction) {
	if (direction == 'left') {
		position.j--;
	} else if (direction == 'right') {
		position.j++;
	} else if (direction == 'topleft') {
		position.j = position.j - 1 + position.i%2;
		position.i--;
	} else if (direction == 'topright') {
		position.j = position.j + position.i%2;
		position.i--;
	} else if (direction == 'botleft') {
		position.j = position.j - 1 + position.i%2;
		position.i++;
	} else if (direction == 'botright') {
		position.j = position.j + position.i%2;
		position.i++;
	}
	console.log(direction + ' > ' + position.i + ' ' + position.j);
	return position;
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
