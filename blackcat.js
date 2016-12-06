var io;
var gameSocket;
var catTurn;

// variables de controle pour le lancement de la partie
var serverReady;
var catReady;

// garde en mémoire la position du chat
var catPosition;

// variable qui stocke l'état de la grille de jeu
var grid;

exports.initGame = function(sio, socket) {
	debug_log('initGame');
    io = sio;
    catTurn = false;
    gameSocket = socket;
    gameSocket.emit('connected', { message: "You are connected!" });

    // Events
    gameSocket.on('hostCreateNewGame', hostCreateNewGame);
    gameSocket.on('hostRoomFull', hostRoomFull);
    gameSocket.on('hostTrapRequest', hostTrapRequest);
    gameSocket.on('hostInitTrap', hostInitTrap);
    gameSocket.on('clientJoinGame', clientJoinGame);
    gameSocket.on('clientMoveRequest', clientMoveRequest);

    // Initilisation des variables de controle
    serverReady = false;
    catReady = false;
    catPosition = {
        i : 5,
        j : 5
    };

    // Création de la grille
    grid = new Array(11);
    for (var i = 0; i < 11; i++) {
      grid[i] = new Array(11);
    }
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

// Le poseur de piège a cliqué sur une case pour poser un piège
function hostTrapRequest(position) {
    debug_log('[BLABLABLABLA : 2/?] - hostTrapRequest('+position.x+';'+position.y+')');

    if(catTurn){
    	io.sockets.emit('RequestFailed');
    	return;
    } 
    // mise à jour de la variable grille
	grid[position.x][position.y] = "trap";

    // mise à jour de la map sur l'IHM trap
	io.sockets.emit('trapPlaced', position);

    // Si le chat est à proximité : envoie d'un event à l'IHM cat (verrouillage d'une direction)
	var near = isCatNear(position);
	if (near != null) {
    	io.sockets.emit('directionForbidden', near);
	}
    	
    // Test de victoire du poseur de piège
	if (isCatTrapped()) {
    	debug_log("[trapWon]");
    	io.sockets.emit('trapWon');
	}

    // passe la main au joueur chat
    io.sockets.emit('MovedSuccess');
	catTurn = true;    
}

// pose d'un piège à l'initialisation
// TODO : améliorer tout ça (un seul event avec tout ?)
function hostInitTrap(position) {
    debug_log('[BLABLABLABLA : 2/?] - hostInitTrap('+position.x+';'+position.y+')');

    // mise à jour de la variable grille
    grid[position.x][position.y] = "trap";

    // TODO : patch à optimiser
    position.init = true;

    // Si le chat est à proximité : envoie d'un event à l'IHM cat (verrouillage d'une direction)
    var near = isCatNear(position);
    if (near != null) {
        debug_log('PIEGE ZAIHOJJEFA JEFZA JEFZAOJEFAJOIAEFOJADJIODZAJIODZAJIDZAZAJIDDZAIJDZAIJZDJKIDZKJDZKIDZ');
        io.sockets.emit('directionForbidden', near);
    }

    // mise à jour de la map sur l'IHM trap
    io.sockets.emit('trapPlaced', position);  
}

// détermine si le piège venant d'être posé et à côté du chat
function isCatNear(position) {
    debug_log('position = ['+position.x+';'+position.y+']');
    debug_log('catPosition = ['+catPosition.i+';'+catPosition.j+']');

    //piège posé en haut à gauche du chat
    if(position.x == catPosition.i-1 && position.y == catPosition.j - (catPosition.i+1)%2) {
        return "btn_topleft";
    }
    //piège posé en haut à droite du chat
    else if(position.x == catPosition.i-1 && position.y == catPosition.j + catPosition.i%2 ) {
        return "btn_topright";
    }
    //piège posé à gauche du chat
    else if(position.x == catPosition.i && position.y == catPosition.j-1) {
        return "btn_left";
    }
    //piège posé à droite du chat
    else if(position.x == catPosition.i && position.y == catPosition.j+1) {
        return "btn_right";
    }
    //piège posé en bas à gauche du chat
    else if(position.x == catPosition.i+1 && position.y == catPosition.j - (catPosition.i+1)%2) {
        return "btn_botleft";
    }
    //piège posé en bas à droite du chat
    else if(position.x == catPosition.i+1 && position.y == catPosition.j + catPosition.i%2) {
        return "btn_botright";
    }
}

// détermine si le chat a perdu ou non
function isCatTrapped() {
    debug_log('[isCatTrapped]');

    return ((catPosition.i != 0     &&      grid[catPosition.i-1][catPosition.j - (catPosition.i+1)%2]  == "trap") // top left
        &&  (catPosition.i != 0     &&      grid[catPosition.i-1][catPosition.j + catPosition.i%2]      == "trap") // top right
        &&  (catPosition.j != 0     &&      grid[catPosition.i][catPosition.j-1]                        == "trap") // left
        &&  (catPosition.j != 10    &&      grid[catPosition.i][catPosition.j+1]                        == "trap") // right
        &&  (catPosition.i != 10    &&      grid[catPosition.i+1][catPosition.j - (catPosition.i+1)%2]  == "trap") // bot left
        &&  (catPosition.i != 10    &&      grid[catPosition.i+1][catPosition.j + catPosition.i%2]      == "trap") // bot right
    );
}

/********************************
 *       FONCTIONS CLIENT       *
 *******************************/

// Un joueur a rejoint la file d'attente en tant que chat
// Si le poseur de piège est prêt, la partie est lancée.
function clientJoinGame() {
    debug_log('[JOIN GAME : 2/2] - clientJoinGame()');

    catReady = true;
    if (serverReady == true && catReady == true) {
        //la partie peut être lancée.
        hostRoomFull();
    }
}

// Le joueur chat a cliqué sur un bouton de déplacement
function clientMoveRequest(data) {
    debug_log('[Cat Mouvement] - Cat moved ' + data.direction);

    //ignorer l'évenement si ce n'est pas le tour du chat
    //TODO? : déplacer cette responsabilité côté client (si
    //ce n'est pas au chat de jouer, l'event n'est pas envoyé)
    if(!catTurn) {
    	io.sockets.emit('RequestFailed');
    	return;
    }
    
    //variable utilisée pour la mise à jour de la map
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
    //garde en mémoire l'ancienne position du chat pour mettre à jour la map du serveur
    pos.old.i = catPosition.i;
    pos.old.j = catPosition.j;
    //calcul de la nouvelle position du chat
    catPosition = nextCatPosition(catPosition, data.direction);
    //sauvegarde la position du chat
    pos.neww.i = catPosition.i;
    pos.neww.j = catPosition.j;

    // Test de victoire du chat
    if (isCatFree()) {
        debug_log("[catWon]");
        io.sockets.emit('catWon');
    } else {
        //reset des boutons précédemment vérouillé
        io.sockets.emit('resetCatButtons');
        //calcul des pièges voisins (= boutons à désactiver sur l'IHM cat)
        var nearTraps = getNearTraps(pos.neww);
        var data = {
            pos: pos,
            traps: nearTraps
        }
        io.sockets.emit('catMoved', data);
        io.sockets.emit('MovedSuccess', data);
    }

    // passe la main au joueur Trap
    catTurn = false;
};

// détermine si le chat a gagné ou non
function isCatFree() {
    debug_log('[isCatFree]');
    return (catPosition.i > 10 
         || catPosition.i < 0 
         || catPosition.j > 10 
         || catPosition.j < 0);
}

// Calcule la position demandée par le chat
// /!\ cette position est toujours valide, le chat n'a pas pu sélectionner une direction invalide
// car les boutons associés sont désactivés dans ce cas là.
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
    debug_log(direction + ' > ' + position.i + ' ' + position.j);
    return position;
}

// renvoie la liste de tous les pièges à proximité du chat
function getNearTraps(position) {
    debug_log("position.i="+position.i+" ; position.j="+position.j);
    var arrayTraps = [];
    
    if(position.i != 0 && grid[position.i-1][position.j-(1-position.i%2)] == "trap") {
        arrayTraps.push("btn_topleft");
    }
    if(position.i != 0 && grid[position.i-1][position.j+position.i%2] == "trap") {
        arrayTraps.push("btn_topright");
    }
    if(position.j != 0 && grid[position.i][position.j-1] == "trap") {
        arrayTraps.push("btn_left");
    }
    if(position.j != 10 && grid[position.i][position.j+1] == "trap") {
        arrayTraps.push("btn_right");
    }
    if(position.i != 10 && grid[position.i+1][position.j-(1-position.i%2)] == "trap") {
        arrayTraps.push("btn_botleft");
    }
    if(position.i != 10 && grid[position.i+1][position.j+position.i%2] == "trap") {
        arrayTraps.push("btn_botright");
    }
    return arrayTraps;
}

// Pour debug
var debugmode = true;
function debug_log(string) {
    if(debugmode == true) {
        console.log('    LOG  - [blackcat.js] '+string);
    }
}
