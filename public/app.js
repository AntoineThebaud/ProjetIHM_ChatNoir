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
            
            // events
            IO.socket.on('connected', IO.onConnected );
            IO.socket.on('newGameCreated', IO.onNewGameCreated );
            IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom );
            IO.socket.on('beginNewGame', IO.beginNewGame );
            IO.socket.on('error', IO.error );
        },

        // handler. Connexion établie
        onConnected : function(data) {
            // Cache a copy of the client's socket.IO session ID on the App
            App.mySocketId = IO.socket.socket.sessionid;
            debug_log('[CONNECTION] IO.onConnected OK : ' + data.message);
        },

        // handler. Partie créée. Renvoit vers Trap.gameInit
        onNewGameCreated : function(data) {
            debug_log('[CREATE NEW GAME : 3/5] - IO.onNewGameCreated (handle event = call Trap.gameInit)');
            App.Trap.gameInit(data);
        },

        //handler. Connexion du joueur chat
        playerJoinedRoom : function() {
            // When a player joins a room, do the updateWaitingScreen function.
            // Il y a 2 versions pour cette fonction (trap & cat)
            // Respectivement App.Trap.updateWaitingScreen & App.Cat.updateWaitingScreen
            App[App.myRole].updateWaitingScreen();
        },

        // handler. lancement de la partie.
        beginNewGame : function(data) {
            App[App.myRole].gameCreateMap(data);
        },

        // handler. Popup d'erreur
        error : function(data) {
            alert(data.message);
        }
    };

    // Variable utilisée comme namespace. Regroupe le code concernant les affichages côté client, serveur..
    var App = {

        /**
         * Keep track of the gameId, which is identical to the ID
         * of the Socket.IO Room used for the players and host to communicate
         *
         */
        gameId: 0,

        /**
         * This is used to differentiate between 'Trap' and 'Cat' browsers.
         */
        myRole: '',   // 'Trap' or 'Cat'

        /**
         * The Socket.IO socket object identifier. This is unique for
         * each player and host. It is generated when the browser initially
         * connects to the server when the page loads for the first time.
         */
        mySocketId: '',

        /**
         * Identifies the current round. Starts at 0 because it corresponds
         * to the array of word data stored on the server.
         */
        currentRound: 0,

        /* *************************************
         *                Setup                *
         * *********************************** */

        // fonction d'initialisation appelée au chargement de la page
        init: function () {
            App.cacheElements();
            App.showInitScreen();
            App.bindEvents();
        },

        // Création de variables 'alias' pour manipuler la page
        cacheElements: function() {
            App.$doc = $(document);
            App.$gameArea = $('#gameArea');
        },


        // Ajout d'events pour les boutons de l'écran d'accueil
        bindEvents: function() {
            // Trap
            App.$doc.on('click', '#btnCreateGame', App.Trap.onCreateClick);
            // Cat
            App.$doc.on('click', '#btnJoinGame', App.Cat.onJoinClick);
        },

        /* *************************************
         *             Game Logic              *
         * *********************************** */

        // Ecran d'accueil
        showInitScreen: function() {
            App.$gameArea.load("/partials/intro-screen.htm");
        },

        Trap : {

            // Référence vers le joueur chat
            cat: '',

            // Handler. Le bouton 'START' sur l'écran d'accueil a été cliqué
            onCreateClick: function() {
                debug_log('[CREATE NEW GAME : 1/5] - Trap.onCreateClick (button event handler)');
                IO.socket.emit('hostCreateNewGame');
            },

            // Handler. L'écran du serveur (Trap) est affiché pour la première fois.
            gameInit: function (data) {
                debug_log('[CREATE NEW GAME : 4/5] - Trap.gameInit (initialize variables)');
                App.mySocketId = data.mySocketId;
                App.myRole = 'Trap';

                App.Trap.displayNewGameScreen();
            },

            // Affichage de l'écran d'attente côté serveur
            displayNewGameScreen : function() {
                debug_log('[CREATE NEW GAME : 5/5] - Trap.displayNewGameScreen (change HTML body)');
       
                App.$gameArea.load("/partials/create-game.htm");
            },

            // TODO : a virer ?
            updateWaitingScreen: function() {
                debug_log('[START GAME : 1/?] - Trap.updateWaitingScreen (trigger event emission)');

                // TODO : commentaire pertinent
                IO.socket.emit('hostRoomFull');
            },

            // Affichage de l'écran de jeu du poseur de piège
            gameCreateMap : function() {
        
                // Prepare the game screen with new HTML
                App.$gameArea.load("/partials/host-game.htm", function() {
                    var btnArea = document.getElementById('btnArea');
                    var btnRow;
                    var btn;

                    //Create 11 div
                    for(var i = 0; i < 11; i++) {  
                        btnRow = document.createElement('div');
                        btnRow.id = "btnRow_"+i;
                        if (i % 2 == 0) {
                            btnRow.className = 'line-offset';
                        }
                        //Create 11 button for current div
                        for(var j = 0; j < 11; j++) {
                            btn = document.createElement('button');
                            btn.id = "btn_"+i+'_'+j;
                            btn.className = "btn btn-success ctm-btn-circle";
                            //closure pour ajouter event sur chaque bouton
                            btn.onclick = (function(thisBtn) {
                                return function() {
                                    thisBtn.className = "btn ctm-btn-trap ctm-btn-circle";
                                };
                            })(btn);
                            btnRow.appendChild(btn);
                        }
                        btnArea.appendChild(btnRow);
                    }
                });
            }
        },

        Cat : {

            // Référence vers la socket ID du serveur (Trap)
            hostSocketId: '',

            // Handler. Le bouton 'JOIN' a été cliqué
            onJoinClick: function () {
                debug_log('[JOIN NEW GAME : 1/2] - Cat.onJoinClick (button event handler)');

                // Display the Join Game HTML on the player's screen.    
                App.$gameArea.load("/partials/join-game.htm");

                // Send the gameId and playerName to the server
                IO.socket.emit('playerJoinGame');

                // Set the appropriate properties for the current player.
                App.myRole = 'Cat';
            },

            // TODO : il faut virer ce truc
            updateWaitingScreen : function() {
                App.myRole = 'Cat';
            },

            // Affichage de l'écran de jeu du chat
            gameCreateMap : function(hostData) {
                App.Cat.hostSocketId = hostData.mySocketId;
                App.$gameArea.load("/partials/cat-screen.htm");
            }
        }
    };

    IO.init();
    App.init();

}($));

// For debug
var debugmode = true;
function debug_log(string) {
    if(debugmode == true) {
        console.log(string);
    }
}
