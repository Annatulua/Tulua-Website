/* Tulua Consent Manager
   GDPR / Swiss FADP compliant cookie consent.
   Loads Google Analytics, Google Ads and Vimeo only after explicit user consent.
   Stores decision in localStorage. Banner shown only on first visit. */

(function(){
  'use strict';

  var STORAGE_KEY = 'tulua_consent';
  var GA_ID  = 'G-VSCPVLNPTM';
  var ADS_ID = 'AW-993742689';

  // Set up gtag queue immediately (so other scripts can call gtag() without errors)
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ window.dataLayer.push(arguments); };

  function getConsent(){
    try { return localStorage.getItem(STORAGE_KEY); } catch(e){ return null; }
  }
  function setConsent(value){
    try { localStorage.setItem(STORAGE_KEY, value); } catch(e){}
  }

  function loadGtag(){
    if(window._tuluaGtagLoaded) return;
    window._tuluaGtagLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA_ID);
    gtag('config', ADS_ID);
  }

  function loadVimeo(){
    var iframes = document.querySelectorAll('iframe[data-vimeo-src]');
    for(var i=0;i<iframes.length;i++){
      var f = iframes[i];
      if(!f.getAttribute('src') || f.getAttribute('src') === 'about:blank'){
        f.setAttribute('src', f.getAttribute('data-vimeo-src'));
      }
    }
  }

  function enableTracking(){
    loadGtag();
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', loadVimeo);
    } else {
      loadVimeo();
    }
  }

  function buildBanner(){
    if(document.getElementById('tulua-cookie-banner')) return;

    // Styles
    var style = document.createElement('style');
    style.textContent =
      '#tulua-cookie-banner{position:fixed;left:0;right:0;bottom:0;z-index:9000;' +
      'background:rgba(250,247,242,.98);backdrop-filter:blur(18px);' +
      '-webkit-backdrop-filter:blur(18px);' +
      'border-top:1px solid rgba(154,122,69,.18);padding:18px 32px;' +
      'font-family:"Jost",sans-serif;color:#3a3028;' +
      'box-shadow:0 -8px 32px rgba(34,32,24,.06);' +
      'animation:tcb-up .45s cubic-bezier(.2,.7,.2,1)}' +
      '@keyframes tcb-up{from{transform:translateY(100%)}to{transform:translateY(0)}}' +
      '.tcb-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;' +
      'justify-content:space-between;gap:32px;flex-wrap:wrap}' +
      '.tcb-text{font-size:12px;line-height:1.75;margin:0;color:#6e6258;' +
      'max-width:720px;font-weight:300;letter-spacing:.02em}' +
      '.tcb-text a{color:#9a7a45;text-decoration:none;' +
      'border-bottom:1px solid rgba(154,122,69,.4);transition:color .3s,border-color .3s}' +
      '.tcb-text a:hover{color:#222018;border-color:#222018}' +
      '.tcb-actions{display:flex;gap:10px;align-items:center}' +
      '.tcb-btn{cursor:pointer;font-family:"Jost",sans-serif;font-size:10px;' +
      'letter-spacing:.18em;text-transform:uppercase;padding:12px 24px;' +
      'border:none;transition:all .3s;font-weight:400;line-height:1}' +
      '.tcb-btn-decline{background:transparent;color:#6e6258;' +
      'border:1px solid rgba(154,122,69,.3)}' +
      '.tcb-btn-decline:hover{border-color:#9a7a45;color:#9a7a45}' +
      '.tcb-btn-accept{background:#9a7a45;color:#fff}' +
      '.tcb-btn-accept:hover{background:#222018}' +
      '#tulua-cookie-banner.tcb-out{transform:translateY(100%);opacity:0;transition:all .35s}' +
      '@media(max-width:760px){#tulua-cookie-banner{padding:16px 20px}' +
      '.tcb-inner{flex-direction:column;align-items:stretch;gap:16px}' +
      '.tcb-actions{justify-content:flex-end}' +
      '.tcb-text{font-size:11.5px}}';
    document.head.appendChild(style);

    // Markup
    var banner = document.createElement('div');
    banner.id = 'tulua-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie preferences');
    banner.innerHTML =
      '<div class="tcb-inner">' +
        '<p class="tcb-text">' +
          'We use cookies to understand how this site is used, ' +
          'measure the effectiveness of our ads, and to play embedded videos. ' +
          'Read our <a href="privacy.html">Privacy Policy</a> for details.' +
        '</p>' +
        '<div class="tcb-actions">' +
          '<button class="tcb-btn tcb-btn-decline" type="button" id="tcb-decline">Decline</button>' +
          '<button class="tcb-btn tcb-btn-accept" type="button" id="tcb-accept">Accept</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(banner);

    function dismiss(){
      banner.classList.add('tcb-out');
      setTimeout(function(){
        if(banner.parentNode) banner.parentNode.removeChild(banner);
      }, 380);
    }

    document.getElementById('tcb-accept').addEventListener('click', function(){
      setConsent('accepted');
      enableTracking();
      dismiss();
    });
    document.getElementById('tcb-decline').addEventListener('click', function(){
      setConsent('declined');
      dismiss();
    });
  }

  // Public API — accessible from footer link and elsewhere
  window.TuluaConsent = {
    isAccepted: function(){ return getConsent() === 'accepted'; },
    isDecided:  function(){ return getConsent() !== null; },
    accept: function(){
      setConsent('accepted');
      enableTracking();
      var b = document.getElementById('tulua-cookie-banner');
      if(b){ b.classList.add('tcb-out'); setTimeout(function(){ if(b.parentNode) b.parentNode.removeChild(b); }, 380); }
    },
    decline: function(){
      setConsent('declined');
      var b = document.getElementById('tulua-cookie-banner');
      if(b){ b.classList.add('tcb-out'); setTimeout(function(){ if(b.parentNode) b.parentNode.removeChild(b); }, 380); }
    },
    showBanner: function(){
      // Re-open banner (for "Cookies" link in footer)
      try { localStorage.removeItem(STORAGE_KEY); } catch(e){}
      if(!document.getElementById('tulua-cookie-banner')){
        if(document.body){
          buildBanner();
        } else {
          document.addEventListener('DOMContentLoaded', buildBanner);
        }
      }
    }
  };

  // Initialise
  function init(){
    var consent = getConsent();
    if(consent === 'accepted'){
      enableTracking();
    }
    if(consent === null){
      buildBanner();
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
