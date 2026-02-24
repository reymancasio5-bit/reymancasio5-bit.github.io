/* ═══════════════════════════════════════════════════════════════
   MAIN.JS — General logic, event handling, modal/lightbox engine,
             marquee engine, nav, scroll reveal, JSON download.
   All original functionality preserved from My_Web.html.
═══════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────
   MODAL ENGINE  (preserved exactly)
───────────────────────────────────────────────────────────── */
function openModal(id) {
    var overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.add('is-visible');
    document.body.classList.add('modal-open');
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            overlay.classList.add('is-open');
        });
    });
    overlay.addEventListener('click', function onBg(e) {
        if (e.target === overlay) {
            closeModal(id);
            overlay.removeEventListener('click', onBg);
        }
    });
    /* Animate workflow nodes when modal opens */
    if (typeof window.animateWorkflowNodes === 'function') {
        setTimeout(function () { window.animateWorkflowNodes(overlay); }, 200);
    }
}

function closeModal(id) {
    var overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.addEventListener('transitionend', function handler(e) {
        if (e.propertyName !== 'opacity') return;
        overlay.classList.remove('is-visible');
        document.body.classList.remove('modal-open');
        overlay.removeEventListener('transitionend', handler);
    });
}

/* ─────────────────────────────────────────────────────────────
   LIGHTBOX ENGINE  (preserved exactly)
───────────────────────────────────────────────────────────── */
function openLightbox(src, e) {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    var lb  = document.getElementById('imgLightbox');
    var img = document.getElementById('imgLightboxSrc');
    img.src = src;
    lb.classList.add('is-visible');
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            lb.classList.add('is-open');
        });
    });
    lb.onclick = function (ev) {
        if (ev.target === lb) closeLightbox();
    };
}

function closeLightbox() {
    var lb = document.getElementById('imgLightbox');
    lb.classList.remove('is-open');
    lb.addEventListener('transitionend', function handler(e) {
        if (e.propertyName !== 'opacity') return;
        lb.classList.remove('is-visible');
        document.getElementById('imgLightboxSrc').src = '';
        lb.removeEventListener('transitionend', handler);
    });
}

/* Global keyboard handler */
document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    ['modalReceipt', 'modalInvoice', 'modalResume'].forEach(closeModal);
    closeLightbox();
});

/* ─────────────────────────────────────────────────────────────
   MARQUEE ENGINE  (preserved exactly)
───────────────────────────────────────────────────────────── */
(function () {
    var HOVER_RATIO = 0.12;
    var LERP        = 0.055;

    document.querySelectorAll('.marquee-viewport').forEach(function (viewport) {
        var track     = viewport.querySelector('.marquee-track');
        var baseSpeed = parseFloat(viewport.dataset.speed)    || 0.55;
        var dir       = parseFloat(viewport.dataset.direction) || 1;

        Array.from(track.children).forEach(function (child) {
            track.appendChild(child.cloneNode(true));
        });

        var halfWidth    = track.scrollWidth / 2;
        var pos          = 0;
        var currentSpeed = baseSpeed;
        var targetSpeed  = baseSpeed;
        var isDragging   = false;
        var isHovered    = false;
        var dragStartX   = 0;
        var posAtDrag    = 0;
        var lastTs       = null;

        var resizeTimer;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () { halfWidth = track.scrollWidth / 2; }, 200);
        }, { passive: true });

        function setX(x) { track.style.transform = 'translateX(' + x + 'px)'; }

        function wrap(p) {
            if (!halfWidth) return p;
            p = p % halfWidth;
            if (p > 0) p -= halfWidth;
            return p;
        }

        (function tick(ts) {
            requestAnimationFrame(tick);
            var dt = lastTs === null ? 16.667 : Math.min(ts - lastTs, 50);
            lastTs = ts;
            if (!isDragging) {
                currentSpeed += (targetSpeed - currentSpeed) * LERP;
                pos = wrap(pos - dir * currentSpeed * (dt / 16.667));
                setX(pos);
            }
        })(performance.now());

        viewport.addEventListener('mouseenter', function () { isHovered = true;  targetSpeed = baseSpeed * HOVER_RATIO; });
        viewport.addEventListener('mouseleave', function () { isHovered = false; if (!isDragging) targetSpeed = baseSpeed; });

        function startDrag(clientX) { isDragging = true; dragStartX = clientX; posAtDrag = pos; currentSpeed = 0; targetSpeed = 0; viewport.style.cursor = 'grabbing'; }
        function moveDrag(clientX)  { if (!isDragging) return; pos = wrap(posAtDrag + (clientX - dragStartX)); setX(pos); }
        function endDrag()          { if (!isDragging) return; isDragging = false; viewport.style.cursor = ''; targetSpeed = isHovered ? baseSpeed * HOVER_RATIO : baseSpeed; }

        viewport.addEventListener('mousedown',  function (e) { e.preventDefault(); startDrag(e.clientX); });
        window.addEventListener('mousemove',    function (e) { moveDrag(e.clientX); });
        window.addEventListener('mouseup',      endDrag);
        viewport.addEventListener('touchstart', function (e) { startDrag(e.touches[0].clientX); }, { passive: true });
        viewport.addEventListener('touchmove',  function (e) { moveDrag(e.touches[0].clientX); }, { passive: true });
        viewport.addEventListener('touchend',   endDrag);
    });
})();

/* ─────────────────────────────────────────────────────────────
   DESKTOP NAV  (preserved exactly)
───────────────────────────────────────────────────────────── */
function scrollToSection(id) {
    var section = document.getElementById(id);
    if (!section) return;
    var nav  = document.getElementById('mainNav');
    var navH = nav ? nav.offsetHeight : 0;
    /* Scroll to section top, offset by nav height + small breathing room.
       We target the section element itself (not the h2) so the
       IntersectionObserver rootMargin aligns correctly. */
    var top = section.getBoundingClientRect().top + window.pageYOffset - navH - 20;
    window.scrollTo({ top: top, behavior: 'smooth' });
}

document.querySelectorAll('.nav-desktop a').forEach(function (link) {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        scrollToSection(this.getAttribute('href').replace('#', ''));
    });
});

/* ─────────────────────────────────────────────────────────────
   MOBILE NAV  (preserved exactly)
───────────────────────────────────────────────────────────── */
var sectionIds   = ['about','skills','experience','projects','education','resume','contact'];
var mobileItems  = document.querySelectorAll('.mobile-nav-item');
var navDots      = document.querySelectorAll('.nav-dot');
var mobileTrack  = document.getElementById('mobileNavTrack');
var mainNav      = document.getElementById('mainNav');
var scrollLocked = false;
var lockTimer;

function setActive(idx) {
    if (idx < 0 || idx >= sectionIds.length) return;
    mobileItems.forEach(function (item, i) { item.classList.toggle('active', i === idx); });
    navDots.forEach(function (dot, i)       { dot.classList.toggle('active',  i === idx); });
    var activeItem = mobileItems[idx];
    if (activeItem && mobileTrack) {
        var tr = mobileTrack.getBoundingClientRect();
        var ir = activeItem.getBoundingClientRect();
        mobileTrack.scrollTo({ left: mobileTrack.scrollLeft + ir.left - tr.left - tr.width / 2 + ir.width / 2, behavior: 'smooth' });
    }
}

mobileItems.forEach(function (item, idx) {
    item.addEventListener('click', function () {
        setActive(idx);
        scrollLocked = true;
        clearTimeout(lockTimer);
        lockTimer = setTimeout(function () { scrollLocked = false; }, 1400);
        scrollToSection(this.getAttribute('data-section'));
    });
});

function getActiveIdx() {
    var navH    = mainNav ? mainNav.offsetHeight : 60;
    var trigger = navH + 40;
    var best    = 0;
    sectionIds.forEach(function (id, i) {
        var el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= trigger) best = i;
    });
    return best;
}

window.addEventListener('scroll', function () { if (!scrollLocked) setActive(getActiveIdx()); }, { passive: true });
setActive(getActiveIdx());

/* ─────────────────────────────────────────────────────────────
   DOWNLOAD JSON  (preserved exactly)
───────────────────────────────────────────────────────────── */
function downloadJSON(project) {
    var filename, data;

    if (project === 'receipt') {
        filename = 'Receipt_stored_via_Telegram.json';
        data = {"name":"Receipt stored via Telegram","nodes":[{"parameters":{"updates":["message"],"additionalFields":{}},"type":"n8n-nodes-base.telegramTrigger","typeVersion":1.2,"position":[-1136,352],"id":"66796944-a1fc-4107-ac82-eb488ab7950c","name":"Telegram Trigger","webhookId":"29e6e3d8-efbd-4752-8144-453a7bf73d70","credentials":{"telegramApi":{"id":"aX7fnszZlx0mtNHF","name":"Telegram account"}}},{"parameters":{"resource":"file","fileId":"={{ $json.message.photo[0].file_id }}","additionalFields":{}},"type":"n8n-nodes-base.telegram","typeVersion":1.2,"position":[-928,352],"id":"2c7ed3ba-6cce-46ee-a7fd-5e0d74b7ab37","name":"Get a file","webhookId":"3f576baf-872b-4db9-90e4-680a9ae8f9a1","credentials":{"telegramApi":{"id":"aX7fnszZlx0mtNHF","name":"Telegram account"}}},{"parameters":{"name":"={{ $now.format('yyyy-MM-dd HH:MM:ss') }}.{{ $('Get a file').item.binary.data.fileExtension }}","driveId":{"__rl":true,"mode":"list","value":"My Drive"},"folderId":{"__rl":true,"value":"https://drive.google.com/drive/folders/1FsInKctP_SmmJCR964e3wa809htXUo_Y","mode":"url"},"options":{}},"type":"n8n-nodes-base.googleDrive","typeVersion":3,"position":[-720,352],"id":"a80a1eae-8730-4a40-9284-19520c8b5a97","name":"Upload file","credentials":{"googleDriveOAuth2Api":{"id":"5xh2cnfKhCDUHAyg","name":"Google Drive account"}}},{"parameters":{"operation":"share","fileId":{"__rl":true,"value":"={{ $json.id }}","mode":"id"},"permissionsUi":{"permissionsValues":{"role":"reader","type":"anyone"}},"options":{}},"type":"n8n-nodes-base.googleDrive","typeVersion":3,"position":[-512,352],"id":"5ac6e36a-18bc-4051-94ad-c3362d5d6a0a","name":"Share file","credentials":{"googleDriveOAuth2Api":{"id":"5xh2cnfKhCDUHAyg","name":"Google Drive account"}}}],"pinData":{},"connections":{"Telegram Trigger":{"main":[[{"node":"Get a file","type":"main","index":0}]]},"Get a file":{"main":[[{"node":"Upload file","type":"main","index":0}]]},"Upload file":{"main":[[{"node":"Share file","type":"main","index":0}]]}},"active":false,"settings":{"executionOrder":"v1","binaryMode":"separate","availableInMCP":false},"versionId":"934964f6-793d-4c0d-a415-a71bb1c56cb9","meta":{"templateCredsSetupCompleted":true,"instanceId":"993638efe77790a0a62276f882d672c9832d331dc8e9dcc7fe03bcb05ecf1885"},"id":"bORoNMHojGJaHq5d","tags":[]};
    } else if (project === 'invoice') {
        filename = 'Overdue_Invoice_Reminder_System.json';
        data = {"name":"Overdue Invoice Reminder System","nodes":[{"parameters":{"documentId":{"__rl":true,"mode":"id","value":"1hpJrE9KnbarMnl8jKcgMT7wGBtEkIIPaefFe-S-xEgA"},"sheetName":{"__rl":true,"value":"gid=0","mode":"list","cachedResultName":"Sheet1","cachedResultUrl":"https://docs.google.com/spreadsheets/d/1hpJrE9KnbarMnl8jKcgMT7wGBtEkIIPaefFe-S-xEgA/edit#gid=0"},"filtersUI":{"values":[{"lookupColumn":"Status","lookupValue":"Unpaid"}]},"options":{"returnAllMatches":"returnAllMatches"}},"id":"0316685f-62e0-4a72-9d4c-1c885047e95f","name":"Read Invoice Sheet","type":"n8n-nodes-base.googleSheets","typeVersion":4.4,"position":[-1344,48],"credentials":{"googleSheetsOAuth2Api":{"id":"Z9MORW9Kn53Jyu8J","name":"Google Sheets account"}}},{"parameters":{"fieldToSplitOut":"Status","options":{}},"type":"n8n-nodes-base.splitOut","typeVersion":1,"position":[-1168,48],"id":"74523f76-b514-403f-bd2c-87c33975e5d4","name":"Split Out"},{"parameters":{"sendTo":"={{ $('Read Invoice Sheet').item.json['Customer Email'] }}","subject":"=Payment Reminder – Invoice  {{ $('Read Invoice Sheet').item.json['Invoice Number'] }}","emailType":"text","message":"=Dear {{ $('Read Invoice Sheet').item.json['Customer Name'] }},  \n\nI hope this message finds you well.  This is a friendly reminder that Invoice {{ $('Read Invoice Sheet').item.json['Invoice Number'] }} in the amount of {{ $('Read Invoice Sheet').item.json['Invoice Amount'] }} was due on {{ $('Read Invoice Sheet').item.json['Due Date'] }} and is currently outstanding. According to our records, we have not yet received payment.  If payment has already been made, please disregard this message. Otherwise, we would appreciate your prompt attention to this matter.  \n\nShould you have any questions or require any documentation, feel free to let us know.  \n\nThank you for your cooperation.  \n\nBest regards, \nReyman Casio\nBilling Department","options":{"appendAttribution":false}},"type":"n8n-nodes-base.gmail","typeVersion":2.2,"position":[-656,32],"id":"a9bf4856-b952-426d-9d1e-be20a38e6be0","name":"Send a message","webhookId":"83d62123-2a96-4735-b49e-bf306c98a16b","credentials":{"gmailOAuth2":{"id":"EndAtCz1OUUtOAB6","name":"Gmail account"}}}],"pinData":{},"connections":{},"active":false,"settings":{"executionOrder":"v1","binaryMode":"separate","availableInMCP":false},"versionId":"92b3e992-3b3b-4138-850a-3182797fd997","meta":{"templateCredsSetupCompleted":true,"instanceId":"993638efe77790a0a62276f882d672c9832d331dc8e9dcc7fe03bcb05ecf1885"},"id":"XXTpsqUGO1PgIZZr","tags":[]};
    }

    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href   = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/* ─────────────────────────────────────────────────────────────
   THREE.JS DEFERRED LOAD
   Load Three.js only after page is interactive; then init scene.
───────────────────────────────────────────────────────────── */
(function () {
    function loadThree() {
        var script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.async = true;
        script.onload = function () {
            if (typeof window.initThreeScene === 'function') {
                window.initThreeScene();
            }
        };
        document.head.appendChild(script);
    }

    if (document.readyState === 'complete') {
        setTimeout(loadThree, 300);
    } else {
        window.addEventListener('load', function () {
            setTimeout(loadThree, 300);
        });
    }
})();