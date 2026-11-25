/* Xmas Lights - native app bridge (store builds only; not part of the web game).
 * - AdMob: consent (UMP), iOS tracking prompt, one rewarded video on the fail card
 *   when the player has no Hot Cocoa left: "Watch a video: +3 cords".
 * - Android back button walks back through the game's screens.
 * - Pause/resume: suspends audio when the app goes to the background.
 * Runs as plain JS (no bundler). Does nothing in a normal browser.
 */
(function () {
  'use strict';

  /* ===== CONFIG: put the real AdMob IDs here before the store release =====
   * Until then these are Google's official TEST ad units (safe to tap).
   * Never tap your own real ads; Google can close the AdMob account for it. */
  var CONFIG = {
    rewardedAndroid: 'ca-app-pub-3940256099942544/5224354917', // TEST id
    rewardedIOS: 'ca-app-pub-3940256099942544/1712485313',     // TEST id
    testing: true,          // set false for the store release (after the real ids are in)
    cordsPerVideo: 3        // same as one Hot Cocoa
  };

  var Cap = window.Capacitor;
  if (!Cap || !Cap.isNativePlatform || !Cap.isNativePlatform()) return;

  var platform = Cap.getPlatform();
  var AdMob = Cap.registerPlugin('AdMob');
  var App = Cap.registerPlugin('App');
  var adId = platform === 'ios' ? CONFIG.rewardedIOS : CONFIG.rewardedAndroid;

  var ads = { ready: false, loading: false, showing: false, rewarded: false, ok: false };

  function log() { try { console.log.apply(console, ['[xl-app]'].concat([].slice.call(arguments))); } catch (e) {} }

  function loadAd() {
    if (!ads.ok || ads.ready || ads.loading) return;
    ads.loading = true;
    AdMob.prepareRewardVideoAd({ adId: adId, isTesting: CONFIG.testing })
      .then(function () { ads.ready = true; ads.loading = false; refreshButton(); })
      .catch(function (e) { ads.loading = false; log('load failed', e && e.message); setTimeout(loadAd, 30000); });
  }

  async function startAds() {
    try {
      await AdMob.initialize({ initializeForTesting: CONFIG.testing });
      try {
        var info = await AdMob.requestConsentInfo();
        if (info && info.isConsentFormAvailable && info.status === 'REQUIRED') info = await AdMob.showConsentForm();
        if (info && info.privacyOptionsRequirementStatus === 'REQUIRED') addPrivacyButton();
      } catch (e) { log('consent', e && e.message); }
      if (platform === 'ios') {
        try {
          var t = await AdMob.trackingAuthorizationStatus();
          if (t && t.status === 'notDetermined') await AdMob.requestTrackingAuthorization();
        } catch (e) { log('att', e && e.message); }
      }
      ads.ok = true;
      AdMob.addListener('onRewardedVideoAdReward', function () { ads.rewarded = true; });
      loadAd();
    } catch (e) { log('admob init failed', e && e.message); }
  }

  /* ---------- "Privacy choices" button (Google requires a way to change ad consent, EEA/UK) ---------- */
  function addPrivacyButton() {
    var row = document.querySelector('.title-more .more-card .more-row:last-of-type') || document.querySelector('.title-more .more-card');
    if (!row || document.getElementById('xlPrivacy')) return;
    var b = document.createElement('button');
    b.id = 'xlPrivacy'; b.className = 'nl-btn sm cream'; b.textContent = 'Privacy choices';
    b.onclick = function () { AdMob.showPrivacyOptionsForm().catch(function (e) { log('privacy form', e && e.message); }); };
    row.appendChild(b);
  }

  /* ---------- rewarded video on the fail card ---------- */
  var BTN_ID = 'xlAdBtn';
  function refreshButton() {
    var b = document.getElementById(BTN_ID);
    if (!b) return;
    b.disabled = !ads.ready || ads.showing;
    b.querySelector('.xl-ad-label').textContent = ads.ready ? 'Video: +' + CONFIG.cordsPerVideo + ' cords' : 'Loading video...';
  }

  function decorateFailCard() {
    var hooks = window.__xlApp;
    var cocoaBtn = document.getElementById('jrCocoa');
    if (!hooks || !cocoaBtn || document.getElementById(BTN_ID)) return;
    if (hooks.getCocoa() > 0) return; // they still have cocoa: no ad offered
    var b = document.createElement('button');
    b.id = BTN_ID;
    b.className = 'nl-btn green wide shine xl-ad-btn';
    b.innerHTML = '<span class="xl-ad-play" aria-hidden="true"></span><span class="xl-ad-label"></span>';
    cocoaBtn.parentNode.insertBefore(b, cocoaBtn);
    cocoaBtn.classList.add('xl-cocoa-empty');
    refreshButton();
    loadAd();
    b.onclick = async function () {
      if (!ads.ready || ads.showing) return;
      ads.showing = true; ads.rewarded = false; refreshButton();
      try { await AdMob.showRewardVideoAd(); } catch (e) { log('show failed', e && e.message); }
      ads.showing = false; ads.ready = false;
      if (ads.rewarded) {
        ads.rewarded = false;
        // one cocoa in, one cocoa used: +3 cords, same path as the Hot Cocoa button
        hooks.addCocoa(1);
        hooks.useCocoa();
      } else refreshButton();
      loadAd();
    };
  }

  function watchFailCard() {
    var card = document.getElementById('jrCard');
    if (!card) return setTimeout(watchFailCard, 300);
    new MutationObserver(decorateFailCard).observe(card, { childList: true, subtree: true });
  }

  /* ---------- Android back button ---------- */
  function visible(el) { return !!el && !el.hidden && el.offsetParent !== null; }
  function q(id) { return document.getElementById(id); }
  function onBack() {
    var more = document.querySelector('details.title-more[open]');
    if (more) { more.open = false; return; }
    if (visible(q('giftOv'))) return; // let the gift finish
    var closes = document.querySelectorAll('.nl-close');
    for (var i = 0; i < closes.length; i++) if (visible(closes[i])) { closes[i].click(); return; }
    var order = [['jhud', 'jMenu'], ['bar', 'bMenu'], ['sMap', 'mBack'], ['sLevels', 'bBack'], ['sIntro', 'iBack']];
    for (var j = 0; j < order.length; j++) {
      if (visible(q(order[j][0])) && q(order[j][1])) { q(order[j][1]).click(); return; }
    }
    App.minimizeApp();
  }

  /* ---------- background / foreground audio ---------- */
  function audio(on) {
    try { var ac = window.__nl && window.__nl.getAC && window.__nl.getAC(); if (ac) on ? ac.resume() : ac.suspend(); } catch (e) {}
  }

  App.addListener('backButton', onBack);
  App.addListener('pause', function () { audio(false); });
  App.addListener('resume', function () { audio(true); });
  watchFailCard();
  // give the title screen a moment before the consent form appears
  setTimeout(startAds, 1200);
})();
