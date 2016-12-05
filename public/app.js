jQuery(function($){    
    'use strict';

    // Variable utilisée comme namespace. Regroupe le code concernant Socket.IO
    var IO = {

        // Fonction appelée au premier chargement de la page.
        // - initialise le lien entre les sockets client et serveur.
        // - initialise les events
        init: function() {
            // lien serveur <-> client
            IO.socket = io.connect();
            
            // Events
            // conséquences sur les deux IHM
            IO.socket.on('beginNewGame', IO.beginNewGame );
            IO.socket.on('connected', IO.onConnected );
            IO.socket.on('trapWon', IO.trapWon );
            IO.socket.on('catWon', IO.catWon );
            // conséquences sur l'IHM trap
            IO.socket.on('newGameCreated', IO.onNewGameCreated );
            IO.socket.on('catMoved', IO.catMoved );
            IO.socket.on('trapPlaced', IO.trapPlaced );
            // conséquences sur l'IHM cat
            IO.socket.on('directionForbidden', IO.directionForbidden);
            IO.socket.on('resetCatButtons', IO.resetCatButtons );
            IO.socket.on('RequestFailed', IO.requestFailed );


            IO.socket.on('error', IO.error );
        },

        // Handler. Le chat a été déplacé (mise à jour des 2 IHM)
        catMoved : function(data) {
            App[App.myRole].catMoved(data);
        },

        // Handler. Connexion établie
        onConnected : function(data) {
            // Met en cache une copie du session ID du client
            App.mySocketId = IO.socket.socket.sessionid;
            debug_log('[CONNECTION] IO.onConnected OK : ' + data.message);
        },

        // Handler. Partie créée. Renvoit vers Trap.gameInit
        onNewGameCreated : function(data) {
            debug_log('[CREATE NEW GAME : 3/5] - IO.onNewGameCreated');
            App.Trap.displayWaitingScreen(data);
        },

        // Handler. lancement de la partie.
        beginNewGame : function(data) {
            debug_log('[BEGIN NEW GAME : 2/2] - IO.beginNewGame');
            // Il y a 2 versions pour cette fonction (Trap & Cat)
            // Chacun appelle la fonction qui correspond à son role
            App[App.myRole].gameCreateMap(data);
        },

        // Handler. Un piège a été posé (mise à jour de l'IHM trap)
        trapPlaced: function(data) {
            App.Trap.gameDisplayTrap(data);
            // TODO : patch à optimiser
            if (data.init != true) {
                var turnArea = document.getElementById('turnArea');
                turnArea.textContent = "It's your turn !";
            }            
        },

        // Handler. Un piège a été posé prêt du chat (mise à jour de l'IHM cat)
        directionForbidden: function(direction) {
            debug_log('directionForbidden ('+direction+')');
            App.Cat.gameLockButton(direction);
        },

        // Handler. Déclenche la réinitialisation les boutons de l'IHM chat
        resetCatButtons: function() {
            App.Cat.unlockButtons();
        },
        
        requestFailed: function(){
        var audio;
        audio = new Audio("/sound/error.wav");
 		audio.play();
        },

        // Handler : Trap a gagné la partie
        trapWon: function() {
            App[App.myRole].trapVictory();
        },

        catWon: function() {
            App[App.myRole].catVictory();
        },

        // Handler. Popup d'erreur
        error : function(data) {
            alert(data.message);
        }
    };

    // Variable utilisée comme namespace. Regroupe le code concernant les IHM (cat & trap)
    var App = {

        // Variable utilisée pour différencier les traitements sur les deux écrans.
        myRole: '', // aura comme valeur 'Trap' ou 'Cat'

        // L'identifiant de l'objet socket (de Socket.IO) est généré lorsque
        // la page est chargée pour la première fois
        mySocketId: '',

        // Fonction d'initialisation appelée au chargement de la page
        init: function () {
            // Création de variables 'alias' pour manipuler la page
            App.$doc = $(document);
            App.$gameArea = $('#gameArea');

            // Affichage de l'écran d'accueil
            App.$gameArea.load("/partials/home.htm");

            // Ajout d'events pour les boutons de l'écran d'accueil            
            App.$doc.on('click', '#btnCreateGame', App.Trap.onCreateClick);
            App.$doc.on('click', '#btnJoinGame', App.Cat.onJoinClick);
            App.$doc.on('click', '#btnRules', App.displayRules);
        },

        displayRules: function() {
            App.$gameArea.load("/partials/rules.htm");
        },

        // Variable utilisée comme namespace. Regroupe le code concernant le poseur de piège (trap)
        Trap : {

            // Référence vers le joueur chat
            cat: '',

            // Handler. Le bouton 'CREATE' sur l'écran d'accueil a été cliqué
            onCreateClick: function() {
                debug_log('[CREATE NEW GAME : 1/5] - Trap.onCreateClick (button event handler)');
                IO.socket.emit('hostCreateNewGame');
            },

            // Handler. L'écran d'attente du serveur est affiché.
            displayWaitingScreen: function (data) {
                debug_log('[CREATE NEW GAME : 4/5] - Trap.gameInit (initialize variables)');
                App.mySocketId = data.mySocketId;

                App.$gameArea.load("/partials/waiting-create-game.htm");

                // Définition du rôle adopté (Trap)
                App.myRole = 'Trap';
            },

            // Affichage de l'écran de jeu du poseur de piège
            gameCreateMap : function() {
                
                // Charge le fichier de template de l'écran de jeu principal
                // et génère la grille de jeu dynamiquement
                App.$gameArea.load("/partials/game-host-screen.htm", function() {
                    var btnArea = document.getElementById('btnArea');
                    var turnArea = document.getElementById('turnArea');
                    var btnRow;
                    var btn;

                    // Créé 11 div pour la grille de jeu
                    for(var i = 0; i < 11; i++) {  
                        btnRow = document.createElement('div');
                        btnRow.id = "btnRow_"+i;
                        if (i % 2 == 1) {
                            btnRow.className = 'line-offset';
                        }
                        // Créé 11 boutons pour la ligne de la grille courante
                        for(var j = 0; j < 11; j++) {
                            btn = document.createElement('button');
                            btn.id = "btn_"+i+'_'+j;
                            btn.className = "btn btn-success btngame-trapscreen";
                            // Closure pour ajouter un handler sur chaque bouton
                            // Un bouton cliqué est vérouillé
                            btn.onclick = (function(x, y) {
                                return function() {
                                    var data = {
                                        x: x,
                                        y: y
                                    }
                                    IO.socket.emit('hostTrapRequest', data);
                                };
                            })(i, j);
                            btnRow.appendChild(btn);
                        }
                        btnArea.appendChild(btnRow);
                        turnArea.textContent = "It's your turn !";              
                    }
                    // TODO : verrouiller un certain nombre de cases à l'initialisation
                    App.Trap.lockRandomButtons();

                    // Initialisation du chat (au milieu de la map)
                    $('#btn_5_5').attr('class', 'btn btn-cat btngame-trapscreen');
                });
            },

            gameDisplayTrap: function(data) {
                $('#btn_'+data.x+'_'+data.y).attr('class', 'btn btn-trapped btngame-trapscreen');
            },

            // réception du mouvement du chat coté trap
            catMoved: function(data) {
                // déplace le chat sur la map
                $('#btn_'+data.pos.old.i+'_'+data.pos.old.j).attr('class', 'btn btn-success btngame-trapscreen');
                $('#btn_'+data.pos.neww.i+'_'+data.pos.neww.j).attr('class', 'btn btn-cat btngame-trapscreen');

                var turnArea = document.getElementById('turnArea');
                turnArea.textContent = "It's your turn !"; 
            },

            lockRandomButtons: function() {
                var nbInitTraps = 10;
                var data = {
                    x: null,
                    y: null
                }
                for(var i = 0; i <= nbInitTraps; i++) {
                    data.x = Math.floor(Math.random() * 11),
                    data.y = Math.floor(Math.random() * 11)
                    //TODO : à optimiser : ne pas poser de piège sur la case du milieu (où le chat se trouve)
                    if (data.x == 5 && data.y == 5) {
                        i--;
                        continue;
                    }
                    IO.socket.emit('hostInitTrap', data);
                }                
            },

            // Trap a gagné. Affiche "vous avez gagné !"
            trapVictory: function() {
                App.$gameArea.load("/partials/end-win.htm");
            },

            // Cat a gagné. Affiche "vous avez perdu !"
            catVictory: function() {
                App.$gameArea.load("/partials/end-loose.htm");
            }
        },

        // Variable utilisée comme namespace. Regroupe le code concernant le chat (cat)
        Cat : {

            // Référence vers la socket ID du serveur
            hostSocketId: '',

            // Handler. Le bouton 'JOIN' a été cliqué, l'écran d'attente du chat est affiché.
            onJoinClick: function () {
                debug_log('[JOIN GAME : 1/2] - Cat.onJoinClick (button event handler)');

                // Display the Join Game HTML on the player's screen.    
                App.$gameArea.load("/partials/waiting-join-game.htm");

                // Send the gameId and playerName to the server
                IO.socket.emit('clientJoinGame');

                // Définition du rôle adopté (Chat)
                App.myRole = 'Cat';
            },

            // Affichage de l'écran de jeu du chat
            gameCreateMap: function(hostData) {
                App.Cat.hostSocketId = hostData.mySocketId;
                App.$gameArea.load("/partials/game-cat-screen.htm", function() {
                    // Ajout de handlers sur les boutons
                    App.$doc.on('click', '#btn_topleft', function(){
                        App.Cat.onMoveButton("topleft");
                    });
                    App.$doc.on('click', '#btn_topright', function(){
                        App.Cat.onMoveButton("topright");
                    });
                    App.$doc.on('click', '#btn_left', function(){
                        App.Cat.onMoveButton("left");
                    });
                    App.$doc.on('click', '#btn_right', function(){
                        App.Cat.onMoveButton("right");
                    });
                    App.$doc.on('click', '#btn_botleft', function(){
                        App.Cat.onMoveButton("botleft");
                    });
                    App.$doc.on('click', '#btn_botright', function(){
                        App.Cat.onMoveButton("botright");
                    });
                    document.getElementById('turnArea').textContent = "It's not your turn."; 
                });
            },

            onMoveButton: function(direction) {
                debug_log("Yolo swag : " + direction);
                IO.socket.emit('clientMoveRequest', {'direction': direction });
            },

            gameLockButton: function(direction) {
                debug_log('[BLABLABLABLA : 2/?] - gameLockButton('+direction+')');
                $('#'+direction).prop('disabled', true);
            },

            catMoved: function(data) {
                debug_log("data.traps = ")
                debug_log(data.traps);
                for (var elem in data.traps) {
                    App.Cat.gameLockButton(data.traps[elem]);
                }
                document.getElementById('turnArea').textContent = "It's not your turn."; 

                // Notification d'opération réusise : faire vibrer l'appareil (si la vibration est supportée)
                if ("vibrate" in navigator) {
                    navigator.vibrate(100);
                }
            },

            unlockButtons: function() {
                $('#btn_topleft').prop('disabled', false);
                $('#btn_topright').prop('disabled', false);
                $('#btn_left').prop('disabled', false);
                $('#btn_right').prop('disabled', false);
                $('#btn_botleft').prop('disabled', false);
                $('#btn_botright').prop('disabled', false);
            },

            // Trap a gagné. Affiche "vous avez perdu !"
            trapVictory: function() {
                App.$gameArea.load("/partials/end-loose.htm");
            },

            // Cat a gagné. Affiche "vous avez gagné !"
            catVictory: function() {
                App.$gameArea.load("/partials/end-win.htm");
            }
        }
    };

    // Appel des fonctions d'initialisation au chargement de la page
    IO.init();
    App.init();

}($));

// Pour debug
var debugmode = true;
function debug_log(string) {
    if(debugmode == true) {
        console.log(string);
    }
}
