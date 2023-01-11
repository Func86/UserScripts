// ==UserScript==
// @name         Moegirl Comments
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Func
// @match        https://zh.moegirl.org.cn/*
// @icon         https://zh.moegirl.org.cn/favicon.ico
// @grant        none
// ==/UserScript==
/* global $, mw */
'use strict';

(function() {
    function kbdInput(dom, value) {
        var evt = document.createEvent('HTMLEvents');
        evt.initEvent('input', true, true);
        dom.value = value;
        dom.dispatchEvent(evt);
    }

    function addUserInfo( ele ) {
        var user = mw.config.get( 'wgUserName' );
        if ( user ) {
            kbdInput( ele.querySelector( '#wl-nick' ), user );
            kbdInput( ele.querySelector( '#wl-link' ), 'https://zh.moegirl.org.cn/User:' + user );
            var fn = async function (event) {
                event.stopImmediatePropagation();
                this.removeEventListener( 'click', fn, true );
                var api = new mw.Api;
                var info = await api.get( {
                    "action": "query",
                    "format": "json",
                    "meta": "userinfo",
                    "formatversion": "2",
                    "uiprop": "email"
                } );
                kbdInput( ele.querySelector( '#wl-mail' ), info.query.userinfo.email );
                setTimeout( () => { $( this ).click() }, 0 );
                return false;
            }
            ele.querySelector( '.wl-info button[type="submit"]' ).addEventListener( 'click', fn, true );
        }
    }

    function changeUserAvatar( parent ) {
        $( parent ).find( '.wl-card-item' ).andSelf().each( ( idx, ele ) => {
            var userNick = ele.querySelector( '.wl-nick[href^="https://zh.moegirl.org.cn/User:"]' ),
                img = ele.querySelector( '.wl-user img' );
            if ( userNick && userNick.href.endsWith( '/User:' + userNick.text ) ) {
                img.src = 'https://commons.moegirl.org.cn/extensions/Avatar/avatar.php?user=' + userNick.text;
            } else {
                userNick.outerHTML = `<span class="wl-nick">${userNick.text}</span>` // Spoofing!
                img.src = 'https://img.moegirl.org.cn/moehime.jpg';
            }
        } );
    }

    function observerCallBack( mutations ) {
        mutations.forEach( ( mutation ) => {
            console.log(mutation);
            if ( mutation.target.id === 'moegirl-comments' && mutation.addedNodes.length === 1 && mutation.addedNodes[0].nodeName === 'DIV' ) {
                addUserInfo( mutation.addedNodes[0] );
            } else if ( mutation.addedNodes.length === 1 && ( mutation.addedNodes[0].className === 'wl-card-item' || mutation.addedNodes[0].className === 'wl-quote' ) ) {
                changeUserAvatar( mutation.addedNodes[0] );
            }
        } );
    }

    function main() {
        import( 'https://unpkg.com/@waline/client@v2/dist/waline.mjs' ).then( function (t) {
            var observer = new MutationObserver( observerCallBack );
            observer.observe( document.querySelector( '#moegirl-comments' ), { childList: true, subtree: true } );
            var param = {
                el: '#moegirl-comments',
                serverURL: 'https://c.moegirl.icu',
                path: mw.config.get( 'wgArticleId' ),
            };
            var user = mw.config.get( 'wgUserName' );
            if ( !user ) {
                param.meta = ['nick', 'mail'];
            }
            t.init( param );
        } );
    }

    ( window.RLQ = window.RLQ || [] ).push( () => {
        var selectList = [ '.ns-0:not(.page-Mainpage)', '.ns-2', '.ns-4', '.ns-12.action-view #bodyContent' ];
        var classes = selectList.join( '.action-view #bodyContent, ' ) + ', ' + selectList.join( '.skin-moeskin.action-view #mw-body-container, ' );
        var body = $( classes );
        if ( body.length ) {
            $( 'head' ).append( `<link rel="stylesheet" href="https://unpkg.com/@waline/client@v2/dist/waline.css" />
<style>
  .ns-0.action-view:not(.page-Mainpage) #bodyContent::after, .ns-2.action-view #bodyContent::after, .ns-4.action-view #bodyContent::after, .ns-12.action-view #bodyContent::after {
    content: unset !important;
  }
  .user-loggedin .wl-header {
    display: none;
  }
  /*.user-loggedin .wl-info button[type="button"] {
    display: none;
  }*/
</style>` );
            body.append( '<div id="moegirl-comments"></div>' );
            main();
            //mw.loader.load( 'https://cusdis.com/js/cusdis.es.js' );
        }
    } );
})();
