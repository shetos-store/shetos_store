/* Shetos Store - effects layer. Standalone: does not touch script.js logic. */
(function () {
    'use strict';
    var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var FINE = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* 1) Ripple on every button / card */
    var RIPPLE = '.blue-btn,.confirm-btn,.profile-setup-enter-btn,.profile-save-btn,.feedback-submit-button,.auth-tab,.auth-method,.hub-box,.setting-big-rect-btn,.ff-type-rect,.currency-choice-btn,.language-choice-btn,.recharge-item,.game-card,.account-card,.profile-edit-toggle-btn,.profile-logout-btn,.support-phone-row,.top-settings-icon-btn,.theme-toggle-btn,.acc-phone-link,.acc-delete-btn';
    document.addEventListener('pointerdown', function (e) {
        if (RM) return;
        var el = e.target.closest && e.target.closest(RIPPLE);
        if (!el || el.disabled) return;
        if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
        el.style.overflow = 'hidden';
        var r = el.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2;
        var s = document.createElement('span');
        s.className = 'fx-ripple';
        s.style.cssText = 'width:' + d + 'px;height:' + d + 'px;left:' + (e.clientX - r.left - d / 2) + 'px;top:' + (e.clientY - r.top - d / 2) + 'px';
        el.appendChild(s);
        setTimeout(function () { s.remove(); }, 700);
    }, { passive: true });

    /* 2) 3D tilt + cursor glare on game cards, hub boxes, account cards */
    var TILT = '.game-card,.hub-box,.account-card', cur = null;
    function reset(el) {
        el.classList.remove('is-tilting');
        el.style.removeProperty('--rx'); el.style.removeProperty('--ry');
    }
    if (FINE && !RM) {
        document.addEventListener('pointermove', function (e) {
            if (e.pointerType !== 'mouse') return;
            var el = e.target.closest && e.target.closest(TILT);
            if (el !== cur) { if (cur) reset(cur); cur = el; if (el) el.classList.add('is-tilting'); }
            if (!el) return;
            var r = el.getBoundingClientRect();
            var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
            el.style.setProperty('--rx', ((0.5 - y) * 12).toFixed(2) + 'deg');
            el.style.setProperty('--ry', ((x - 0.5) * 14).toFixed(2) + 'deg');
            el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
            el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        }, { passive: true });
        document.documentElement.addEventListener('mouseleave', function () { if (cur) { reset(cur); cur = null; } });
    }


    /* 2b) Light that follows the cursor inside glass panels (position only; glass.css paints it) */
    var GLASS = '.top-bar,.modal-box,.profile-setup-box,.setting-big-rect-btn,.ff-type-rect,.currency-choice-btn,.language-choice-btn,.recharge-item,.top-search-wrap,.top-settings-icon-btn,.theme-toggle-btn,.scroll-arrow-btn,.auth-tab,.auth-method,.profile-display-view,.feedback-form-box', gcur = null, gq = 0, gev = null;
    if (FINE && !RM) {
        document.addEventListener('pointermove', function (e) {
            if (e.pointerType !== 'mouse') return;
            gev = e;
            if (gq) return;
            gq = requestAnimationFrame(function () {
                gq = 0;
                var el = gev.target.closest && gev.target.closest(GLASS);
                if (el !== gcur) { if (gcur) { gcur.style.removeProperty('--gx'); gcur.style.removeProperty('--gy'); } gcur = el; }
                if (!el) return;
                var r = el.getBoundingClientRect();
                el.style.setProperty('--gx', (gev.clientX - r.left).toFixed(0) + 'px');
                el.style.setProperty('--gy', (gev.clientY - r.top).toFixed(0) + 'px');
            });
        }, { passive: true });
    }

    /* 3) Stagger index for entrance animations (also for lists built later) */
    function stagger(box) {
        Array.prototype.forEach.call(box.children, function (c, i) { c.style.setProperty('--i', Math.min(i, 12)); });
    }
    function watch(sel) {
        var box = document.querySelector(sel);
        if (!box) return;
        stagger(box);
        new MutationObserver(function () { stagger(box); }).observe(box, { childList: true });
    }
    watch('#game-grid-scroll'); watch('.hub-grid'); watch('#accounts-grid'); watch('.recharge-list');

    /* 4) Soft light that follows the mouse (desktop only) */
    if (FINE && !RM) {
        var glow = document.createElement('div');
        glow.className = 'fx-cursor';
        document.body.appendChild(glow);
        var tx = innerWidth / 2, ty = innerHeight / 3, x = tx, y = ty;
        addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
        (function loop() {
            x += (tx - x) * 0.12; y += (ty - y) * 0.12;
            glow.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
            requestAnimationFrame(loop);
        })();
    }

    /* 5) Scroll progress bar */
    var bar = document.createElement('div');
    bar.className = 'fx-progress';
    document.body.appendChild(bar);
    function onScroll() {
        var se = document.scrollingElement || document.documentElement;
        var max = se.scrollHeight - se.clientHeight;
        bar.style.setProperty('--p', max > 0 ? (se.scrollTop / max).toFixed(3) : 0);
    }
    addEventListener('scroll', onScroll, { passive: true });

    /* 6) Smooth colour fade when switching light / dark */
    document.addEventListener('click', function (e) {
        if (!(e.target.closest && e.target.closest('#theme-toggle-btn'))) return;
        var h = document.documentElement;
        h.classList.add('fx-theme');
        setTimeout(function () { h.classList.remove('fx-theme'); }, 650);
    });
})();

/* Safety: never leave the page locked when the sell page is closed */
(function () {
    function unlock() {
        var sp = document.getElementById('sell-page');
        var sellOpen = sp && getComputedStyle(sp).display !== 'none';
        var intro = document.getElementById('animation-container');
        if (!sellOpen && !intro) { document.body.style.overflow = ''; document.body.style.overflowY = 'auto'; document.body.style.overflowX = 'hidden'; }
    }
    document.addEventListener('click', function () { setTimeout(unlock, 50); });
    setInterval(unlock, 1500);
})();
/* Selling accounts: horizontal strip with drag, wheel and arrow buttons (same feel as the game cards) */
(function () {
    var grid = document.getElementById('accounts-grid');
    if (!grid) return;
    var wrap = document.createElement('div');
    wrap.className = 'game-grid-wrapper accounts-strip';
    grid.parentNode.insertBefore(wrap, grid);
    function arrow(dir) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'scroll-arrow-btn scroll-arrow-' + dir;
        b.setAttribute('aria-label', 'Scroll ' + dir);
        b.innerHTML = dir === 'left' ? '&#10094;' : '&#10095;';
        return b;
    }
    var L = arrow('left'), R = arrow('right');
    wrap.appendChild(L); wrap.appendChild(grid); wrap.appendChild(R);

    function step() {
        var c = grid.querySelector('.account-card');
        var w = c ? c.getBoundingClientRect().width : 200;
        return (w + (parseFloat(getComputedStyle(grid).columnGap) || 16)) * 2;
    }
    L.addEventListener('click', function () { grid.scrollBy({ left: -step(), behavior: 'smooth' }); });
    R.addEventListener('click', function () { grid.scrollBy({ left: step(), behavior: 'smooth' }); });

    /* mouse drag (touch uses native swipe) */
    var down = false, moved = false, sx = 0, sl = 0;
    grid.addEventListener('mousedown', function (e) { down = true; moved = false; sx = e.pageX; sl = grid.scrollLeft; grid.classList.add('is-dragging'); });
    window.addEventListener('mousemove', function (e) {
        if (!down) return;
        var d = e.pageX - sx;
        if (Math.abs(d) > 4) moved = true;
        grid.scrollLeft = sl - d;
    });
    window.addEventListener('mouseup', function () { down = false; grid.classList.remove('is-dragging'); });
    grid.addEventListener('click', function (e) { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);

    /* mouse wheel: vertical wheel moves the strip sideways, but only while it can still move */
    grid.addEventListener('wheel', function (e) {
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
        var max = grid.scrollWidth - grid.clientWidth;
        var can = (e.deltaY > 0 && grid.scrollLeft < max - 1) || (e.deltaY < 0 && grid.scrollLeft > 1);
        if (can) { e.preventDefault(); grid.scrollBy({ left: e.deltaY, behavior: 'auto' }); }
    }, { passive: false });
})();