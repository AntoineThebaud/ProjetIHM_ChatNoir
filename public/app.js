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
            IO.socket.on('beginNewGame', IO.beginNewGame );
            IO.socket.on('error', IO.error );
            IO.socket.on('catMoved', IO.catMoved );
        },

        catMoved : function(mouvement) {
          App[App.myRole].catMoved(mouvement);
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
            // Chaque appareil appelle la fonction qui correspond à son role
            App[App.myRole].gameCreateMap(data);
        },

        // Handler. Popup d'erreur
        error : function(data) {
            alert(data.message);
        }
    };

    // Variable utilisée comme namespace. Regroupe le code concernant les affichages côté client, serveur..
    var App = {

        // Variable utilisée pour différencier les traitements (affichages..) des deux écrans
        myRole: '', // aura comme valeur 'Trap' ou 'Cat'

        // L'identifiant de l'objet socket (de Socket.IO).
        // Est généré lorsque la page est chargée pour la première fois
        mySocketId: '',

        // Compteur pour les tours de jeu
        currentRound: 0,

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
        },

        // Variable utilisée comme namespace. Regroupe le code concernant le poseur de piège (serveur)
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
                            btn.className = "btn btn-success ctm-btn-circle";
                            // Closure pour ajouter un handler sur chaque bouton
                            // Un bouton cliqué est vérouillé
                            btn.onclick = (function(thisBtn) {
                                return function() {
                                    thisBtn.className = "btn ctm-btn-trap ctm-btn-circle";
                                    // TODO : emettre un event à blackcat.js
                                    // c'est blackcat.js qui se charge de gérer la partie,
                                    // de tester si le chat est bloqué etc..
                                };
                            })(btn);
                            btnRow.appendChild(btn);
                        }
                        btnArea.appendChild(btnRow);
                    }

                    // Initialisation du chat (au milieu de la map)
                    //$('#btn_5_5').attr('class', 'btn btn-danger ctm-btn-circle');
                    App.Trap.placerPiege(5,5);

                });
            },

            placerPiege: function(i,j) {
              $('#btn_'+i+'_'+j).attr('class', 'btn btn-danger ctm-btn-circle');
            },

            placerChat: function(i,j, i2, j2) {
              $('#btn_'+i+'_'+j).attr('class', 'btn btn-success ctm-btn-circle');
              $('#btn_'+i2+'_'+j2).attr('class', 'btn btn-danger ctm-btn-circle');
            },

            // réception du mouvement du chat coté trap
            catMoved : function(data) {
              App.Trap.placerChat(
                data.old.i,
                data.old.j,
                data.neww.i,
                data.neww.j
              );
            }
        },

        // Variable utilisée comme namespace. Regroupe le code concernant le chat (client)
        Cat : {

            // Référence vers la socket ID du serveur (Trap)
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
            gameCreateMap : function(hostData) {
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
                });                
            },

            onMoveButton: function(direction) {
                console.log("Yolo swag : " + direction);
                IO.socket.emit('catMoved', {'direction': direction});
                // TODO : emettre un event à blackcat.js
            },

            catMoved : function(data) {
              //console.log('   debug  - [app.js] Cat: Cat move ' + data.direction);
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
