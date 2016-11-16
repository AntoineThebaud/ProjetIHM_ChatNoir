;
jQuery(function($){    
    'use strict';

    /**
     * All the code relevant to Socket.IO is collected in the IO namespace.
     */
    var IO = {

        init: function() {
            IO.socket = io.connect();
            IO.socket.on('connect', function() {
                debug_log('[CONNECTION OK]');
            });
        }
    };

    var App = {

        init: function () {
            App.cacheElements();
            App.showInitScreen();
            App.bindEvents();
        },

        cacheElements: function() {
            App.$doc = $(document);
            App.$gameArea = $('#gameArea');
            App.$templateIntroScreen = $('#intro-screen-template').html();
        },

        showInitScreen: function() {
            App.$gameArea.html(App.$templateIntroScreen);
        },

        bindEvents: function() {
            // Host
            App.$doc.on('click', '#btnCreateGame', App.Host.onCreateClick);
        },

        Host : {
            onCreateClick: function() {
                debug_log('[CREATE NEW GAME] - Step 1 - button event handler');
                IO.socket.emit('hostCreateNewGame');
            }
        },

        Player : {
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
