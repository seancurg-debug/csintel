/* CSINTEL — email-booking.js
   n8n email-booking pipeline visualisation · 6-agent state machine.
   Recreated from the design handoff, remapped to the CSIntel brand palette. */
(function () {
  'use strict';

  var root = document.querySelector('.eb-app');
  if (!root) return;

  var reduced = (window.CSI && window.CSI.reducedMotion) ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Agent data (verbatim from the handoff) ── */
  var AGENTS = [
    {
      ref: 'AGENT-01', name: 'MAILBOX WATCHER', status: 'SCANNING...',
      proc: 2400,
      desc: 'Continuously monitors the client inbox via Gmail API polling at 15-second intervals. Detects new emails and extracts the full message object — sender, subject, body, headers, timestamp — for downstream processing.',
      inputs: ['Gmail Inbox (Gmail API / IMAP)', 'Poll interval: 15s', 'Filter: unread, primary inbox'],
      outputs: ['sender_email', 'subject_line', 'body_text', 'timestamp', 'message_id'],
      tech: ['n8n Gmail Trigger Node', 'Gmail API v1', 'IMAP protocol'],
      branch: null,
      log: [
        '[12:47:01] Polling inbox · interval: 15s',
        '[12:47:02] New email detected — ID: msg_8c3f2a',
        '[12:47:02] From: j.smith@company.co.uk',
        '[12:47:03] Subject: "Booking request — Tuesday"',
        '[12:47:03] Extracting: headers · body · timestamp',
        '[12:47:04] Raw email object packaged → AGENT-02'
      ]
    },
    {
      ref: 'AGENT-02', name: 'BOOKING INTENT SCANNER', status: 'PROCESSING...',
      proc: 2900,
      desc: "Uses the Claude API to classify the email's intent. Determines if a booking is being requested and extracts structured data — date, time, service type — from unstructured email body text.",
      inputs: ['sender_email', 'subject_line', 'body_text', 'Anthropic API key'],
      outputs: ['intent_score (0.0–1.0)', 'extracted_date', 'extracted_time', 'service_type'],
      tech: ['n8n HTTP Request Node', 'Anthropic Claude API', 'claude-sonnet-4-6'],
      branch: '→ DISCARD IF SCORE < 0.7',
      log: [
        '[12:47:04] Email received · calling Claude API',
        '[12:47:04] Model: claude-sonnet-4-6 · classify',
        '[12:47:05] API response received · latency: 1.2s',
        '[12:47:05] intent_score: 0.94 · BOOKING CONFIRMED',
        '[12:47:06] date=24 Jun · time=14:00 · svc=consult',
        '[12:47:06] Intent object packaged → AGENT-03'
      ]
    },
    {
      ref: 'AGENT-03', name: 'DATA VALIDATOR', status: 'VALIDATING...',
      proc: 2100,
      desc: 'Validates and sanitises extracted booking data. Runs four checks: date is in the future, time falls within working hours (08:00–18:00), service type is in the recognised list, and the sender email is deliverable.',
      inputs: ['extracted_date', 'extracted_time', 'service_type', 'sender_email'],
      outputs: ['validated_booking_object', 'validation_status', 'validation_error (if fail)'],
      tech: ['n8n Code Node', 'date-fns library', 'Email deliverability check'],
      branch: '→ REJECT EMAIL IF FAIL',
      log: [
        '[12:47:07] Validating booking object · 4 checks',
        '[12:47:07] Date: 2025-06-24 · VALID (future date)',
        '[12:47:07] Time: 14:00 · VALID (working hours)',
        '[12:47:08] Service: "consultation" · RECOGNISED',
        '[12:47:08] Sender email · deliverable: TRUE',
        '[12:47:08] VALIDATION PASS → AGENT-04'
      ]
    },
    {
      ref: 'AGENT-04', name: 'CALENDAR WRITER', status: 'CREATING EVENT...',
      proc: 2000,
      desc: 'Writes the validated booking to Google Calendar via the Calendar API. Creates a full event with title, date/time, description from the email body, and adds the sender as an attendee with a calendar invite.',
      inputs: ['validated_booking_object', 'Google Calendar API token', 'Target calendar_id'],
      outputs: ['calendar_event_id', 'event_link', 'event_status: confirmed'],
      tech: ['n8n Google Calendar Node', 'Google Calendar API v3', 'OAuth 2.0'],
      branch: null,
      log: [
        '[12:47:09] Connecting to Calendar API · v3',
        '[12:47:09] Creating: "Consultation — J. Smith"',
        '[12:47:10] Date/time: Tue 24 Jun 2025 · 14:00–15:00',
        '[12:47:10] Attendee added: j.smith@company.co.uk',
        '[12:47:11] Event created · ID: gcal_9f3a2b1c',
        '[12:47:11] Calendar link generated → AGENT-05'
      ]
    },
    {
      ref: 'AGENT-05', name: 'TRADER CONFIRMATION', status: 'AWAITING REPLY...',
      proc: 2500,
      desc: 'Sends a booking summary email to the business owner (trader) with client details and the Google Calendar event link. Monitors the inbox for an approval reply before releasing to the final step.',
      inputs: ['validated_booking_object', 'calendar_event_id', 'event_link', 'trader_email'],
      outputs: ['trader_confirmed (bool)', 'reply_timestamp', 'escalation_flag (on timeout)'],
      tech: ['n8n Gmail Node', 'n8n Wait Node', 'Gmail reply signal parser'],
      branch: null,
      log: [
        '[12:47:12] Composing trader summary email',
        '[12:47:12] To: owner@csintel.co.uk',
        '[12:47:13] Attaching: booking summary · cal link',
        '[12:47:13] Email sent · awaiting approval signal',
        '[12:47:14] Reply detected · parsing confirmation',
        '[12:47:14] trader_confirmed: TRUE → AGENT-06'
      ]
    },
    {
      ref: 'AGENT-06', name: 'CLIENT CONFIRMATION', status: 'SENDING EMAIL...',
      proc: 2000,
      desc: 'Triggers only after trader_confirmed=true. Sends a polished HTML confirmation email to the original client with the confirmed booking date, time, service details, and Google Calendar invite link.',
      inputs: ['trader_confirmed=true', 'validated_booking_object', 'event_link', 'client_email'],
      outputs: ['client_email_sent (bool)', 'delivery_timestamp', 'pipeline_status: COMPLETE'],
      tech: ['n8n Gmail Node', 'HTML email template', 'n8n Set Node'],
      branch: null,
      log: [
        '[12:47:15] Trader approval verified · TRUE',
        '[12:47:15] Composing client confirmation email',
        '[12:47:16] To: j.smith@company.co.uk',
        '[12:47:16] Event: Tue 24 Jun · 14:00 · consultation',
        '[12:47:17] Email delivered · client_email_sent: TRUE',
        '[12:47:17] PIPELINE COMPLETE · 4.2s total'
      ]
    }
  ];

  /* ── DOM refs ── */
  var cards = Array.prototype.slice.call(root.querySelectorAll('.eb-card'));
  var conns = [0, 1, 2, 3, 4].map(function (i) { return root.querySelector('#eb-conn-' + i); });
  var pulseLayer = root.querySelector('#eb-pulse-layer');
  var banner = root.querySelector('.eb-banner');
  var speedBtns = Array.prototype.slice.call(root.querySelectorAll('[data-speed]'));
  var replayBtn = root.querySelector('#eb-replay');

  /* ── Timer bookkeeping ── */
  var timeouts = [];
  var logIntervals = [];
  var progIntervals = [];
  var connTimeouts = [];
  var speed = 1;
  var paused = false;

  function T(ms) { return Math.max(40, Math.round(ms / speed)); }

  function later(fn, ms) {
    var id = setTimeout(fn, ms);
    timeouts.push(id);
    return id;
  }

  function clearAll() {
    timeouts.forEach(clearTimeout);
    connTimeouts.forEach(clearTimeout);
    logIntervals.forEach(clearInterval);
    progIntervals.forEach(clearInterval);
    timeouts = [];
    connTimeouts = [];
    logIntervals = [];
    progIntervals = [];
  }

  /* ── Progress bar helper (pure Unicode) ── */
  function barStr(p) {
    var n = Math.round(p / 10);
    if (n < 0) n = 0; if (n > 10) n = 10;
    return '█'.repeat(n) + '░'.repeat(10 - n);
  }

  function setCardState(i, state) {
    var card = cards[i];
    card.dataset.state = state;
    var statusEl = card.querySelector('.eb-card-status');
    if (state === 'idle') {
      statusEl.textContent = '◌ IDLE';
    } else if (state === 'active') {
      statusEl.textContent = '● ' + AGENTS[i].status;
    } else {
      statusEl.textContent = '● COMPLETE';
    }
  }

  function setProgress(i, p) {
    cards[i].querySelector('.eb-card-bar').textContent = barStr(p);
  }

  function resetLog(i) {
    cards[i].querySelector('.eb-card-log').innerHTML = '';
  }

  function pushLog(i, text) {
    var box = cards[i].querySelector('.eb-card-log');
    var line = document.createElement('div');
    line.className = 'eb-log-line';
    line.textContent = text;
    box.appendChild(line);
  }

  /* ── Connection / pulse animation ── */
  var PULSE = [
    { x: 210, y: 125, kf: 'eb-pulse0' },
    { x: 460, y: 125, kf: 'eb-pulse1' },
    { x: 615, y: 230, kf: 'eb-pulse2' },
    { x: 520, y: 395, kf: 'eb-pulse3' },
    { x: 270, y: 395, kf: 'eb-pulse4' }
  ];

  function fireConn(idx) {
    var line = conns[idx];
    if (!line) return;
    line.classList.add('eb-conn-active');

    // travelling data-pulse circle
    if (pulseLayer) {
      var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      var p = PULSE[idx];
      c.setAttribute('cx', p.x);
      c.setAttribute('cy', p.y);
      c.setAttribute('r', 5);
      c.setAttribute('class', 'eb-pulse');
      c.style.animation = p.kf + ' ' + T(650) + 'ms ease-in forwards';
      pulseLayer.appendChild(c);
      var rm = setTimeout(function () {
        if (c.parentNode) c.parentNode.removeChild(c);
      }, T(720));
      connTimeouts.push(rm);
    }

    var off = setTimeout(function () {
      line.classList.remove('eb-conn-active');
    }, T(720));
    connTimeouts.push(off);
  }

  /* ── Activate / complete an agent ── */
  function activate(i) {
    var a = AGENTS[i];
    setCardState(i, 'active');
    resetLog(i);
    setProgress(i, 0);

    var li = 0;
    var logId = setInterval(function () {
      if (li < a.log.length) {
        pushLog(i, a.log[li]);
        li++;
      } else {
        clearInterval(logId);
      }
    }, T(370));
    logIntervals.push(logId);

    var prog = 0;
    var step = 100 / 24;
    var progId = setInterval(function () {
      prog += step;
      if (prog >= 100) { prog = 100; clearInterval(progId); }
      setProgress(i, prog);
    }, T(a.proc / 24));
    progIntervals.push(progId);
  }

  function complete(i) {
    setCardState(i, 'complete');
    setProgress(i, 100);
    // fill in any remaining log lines so the card reads complete
    var box = cards[i].querySelector('.eb-card-log');
    var have = box.children.length;
    for (var k = have; k < AGENTS[i].log.length; k++) pushLog(i, AGENTS[i].log[k]);
  }

  /* ── Reset everything to idle ── */
  function resetAll() {
    clearAll();
    if (pulseLayer) pulseLayer.innerHTML = '';
    conns.forEach(function (c) { if (c) c.classList.remove('eb-conn-active'); });
    cards.forEach(function (c, i) {
      setCardState(i, 'idle');
      setProgress(i, 0);
      resetLog(i);
    });
    if (banner) banner.classList.remove('show');
  }

  /* ── Main loop (setTimeout chain per handoff) ── */
  function runLoop() {
    resetAll();
    if (paused) return;

    var t = 0;
    function at(delay, fn) { t += T(delay); later(fn, t); }

    at(900, function () { activate(0); });
    at(2400, function () { complete(0); fireConn(0); });
    at(300, function () { activate(1); });
    at(2900, function () { complete(1); fireConn(1); });
    at(300, function () { activate(2); });
    at(2100, function () { complete(2); fireConn(2); });
    at(300, function () { activate(3); });
    at(2000, function () { complete(3); fireConn(3); });
    at(300, function () { activate(4); });
    at(2500, function () { complete(4); fireConn(4); });
    at(300, function () { activate(5); });
    at(2000, function () { complete(5); });
    at(80, function () { if (banner) banner.classList.add('show'); });
    at(3600, function () {
      if (banner) banner.classList.remove('show');
      at(400, function () { runLoop(); });
    });
  }

  /* ── Static completed state (reduced motion) ── */
  function renderComplete() {
    clearAll();
    cards.forEach(function (c, i) {
      setCardState(i, 'complete');
      setProgress(i, 100);
      resetLog(i);
      AGENTS[i].log.forEach(function (l) { pushLog(i, l); });
    });
    conns.forEach(function (c) { if (c) c.classList.add('eb-conn-active'); });
    if (banner) banner.classList.add('show');
  }

  function restart() { clearAll(); runLoop(); }

  /* ── Speed toggles ── */
  speedBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      speed = parseInt(btn.dataset.speed, 10);
      speedBtns.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (!reduced) restart();
    });
  });

  /* ── Replay ── */
  if (replayBtn) {
    replayBtn.addEventListener('click', function () {
      if (!reduced) restart();
    });
  }

  /* ── Counters (cubic ease-out, ~2.6s) ── */
  function animateCounters() {
    var els = root.querySelectorAll('[data-count]');
    var dur = 2600;
    var start = null;
    function ease(t) { return 1 - Math.pow(1 - t, 3); }
    function fmt(el, v) {
      var dp = el.dataset.dp ? parseInt(el.dataset.dp, 10) : 0;
      var suf = el.dataset.suffix || '';
      var s;
      if (dp > 0) {
        s = v.toFixed(dp);
      } else {
        s = Math.round(v).toLocaleString('en-GB');
      }
      el.textContent = s + suf;
    }
    function frame(ts) {
      if (start === null) start = ts;
      var t = Math.min((ts - start) / dur, 1);
      var e = ease(t);
      els.forEach(function (el) {
        fmt(el, parseFloat(el.dataset.count) * e);
      });
      if (t < 1) requestAnimationFrame(frame);
      else els.forEach(function (el) { fmt(el, parseFloat(el.dataset.count)); });
    }
    requestAnimationFrame(frame);
  }
  function setCountersFinal() {
    root.querySelectorAll('[data-count]').forEach(function (el) {
      var dp = el.dataset.dp ? parseInt(el.dataset.dp, 10) : 0;
      var suf = el.dataset.suffix || '';
      var v = parseFloat(el.dataset.count);
      el.textContent = (dp > 0 ? v.toFixed(dp) : Math.round(v).toLocaleString('en-GB')) + suf;
    });
  }

  /* ── Inspect modal ── */
  var modal = root.querySelector('.eb-modal');
  var modalPanel = modal ? modal.querySelector('.eb-modal-panel') : null;
  var lastFocused = null;

  function openModal(i) {
    if (!modal) return;
    var a = AGENTS[i];
    lastFocused = document.activeElement;
    paused = true;
    clearAll();

    modal.querySelector('.eb-modal-ref').textContent = a.ref;
    modal.querySelector('.eb-modal-name').textContent = a.name;
    modal.querySelector('.eb-modal-desc').textContent = a.desc;

    var inBox = modal.querySelector('.eb-modal-inputs');
    inBox.innerHTML = '';
    a.inputs.forEach(function (x) {
      var d = document.createElement('div');
      d.className = 'eb-io-row';
      d.textContent = '→ ' + x;
      inBox.appendChild(d);
    });

    var outBox = modal.querySelector('.eb-modal-outputs');
    outBox.innerHTML = '';
    a.outputs.forEach(function (x) {
      var d = document.createElement('div');
      d.className = 'eb-io-row eb-io-out';
      d.textContent = '← ' + x;
      outBox.appendChild(d);
    });

    var techBox = modal.querySelector('.eb-modal-tech');
    techBox.innerHTML = '';
    a.tech.forEach(function (x) {
      var s = document.createElement('span');
      s.textContent = x;
      techBox.appendChild(s);
    });

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    var closeBtn = modal.querySelector('.eb-modal-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    paused = false;
    if (lastFocused && lastFocused.focus) lastFocused.focus();
    if (!reduced) later(function () { runLoop(); }, T(400));
  }

  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
    var closeBtn = modal.querySelector('.eb-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // focus trap + Esc
    modal.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key !== 'Tab') return;
      var focusable = modalPanel.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });
  }

  cards.forEach(function (card, i) {
    function trigger() { openModal(i); }
    card.addEventListener('click', trigger);
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trigger(); }
    });
  });

  /* ── Inspect build panel toggle ── */
  var inspectHead = root.querySelector('.eb-inspect-head');
  if (inspectHead) {
    inspectHead.addEventListener('click', function () {
      var panel = root.querySelector('.eb-inspect');
      var open = panel.classList.toggle('open');
      inspectHead.setAttribute('aria-expanded', open ? 'true' : 'false');
      var sign = inspectHead.querySelector('.eb-inspect-sign');
      if (sign) sign.textContent = open ? '[-]' : '[+]';
    });
  }

  /* ── Boot ── */
  if (reduced) {
    setCountersFinal();
    renderComplete();
  } else {
    animateCounters();
    runLoop();
  }
})();
