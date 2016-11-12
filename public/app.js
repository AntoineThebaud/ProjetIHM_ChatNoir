;
jQuery(function($){    
    'use strict';

    /**
     * All the code relevant to Socket.IO is collected in the IO namespace.
     */
    var IO = {

        init: function() {
            IO.socket = io.connect();
        }
    };

    var App = {

        init: function () {
            App.cacheElements();
            App.showInitScreen();
        },

        cacheElements: function () {
            App.$doc = $(document);
            App.$gameArea = $('#gameArea');
            App.$templateIntroScreen = $('#intro-screen-template').html();
        },

        showInitScreen: function() {
            App.$gameArea.html(App.$templateIntroScreen);
        },

        Host : {
        },

        Player : {
        }
    };

    IO.init();
    App.init();

}($));
