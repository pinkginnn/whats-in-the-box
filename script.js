document.addEventListener('DOMContentLoaded', function () {
  // ---------- Simple JSON + localStorage helpers ----------
  var STORAGE_KEYS = {
    user: 'witb_user',
    stock: 'witb_stock',
    transactions: 'witb_transactions',
    reportPrefs: 'witb_report_prefs'
  };

  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error('Error saving to localStorage:', key, err);
    }
  }

  function loadJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      console.error('Error reading from localStorage:', key, err);
      return fallback;
    }
  }

  // ---------- NAV / SCROLL SPY ----------
  var hamburger = document.querySelector('.hamburger');
  var links = document.querySelector('.nav-links');

  if (hamburger && links) {
    hamburger.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', String(open));
    });
  }

  var sections = Array.prototype.slice.call(document.querySelectorAll('section'));
  var navAnchors = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));

  function spy() {
    var y = window.scrollY + 120;
    var current = sections.length > 0 ? sections[0].id : '';
    sections.forEach(function (s) {
      if (y >= s.offsetTop) current = s.id;
    });
    navAnchors.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  }

  window.addEventListener('scroll', spy);
  spy();

  // ---------- Gate logic ----------
  function applyUserGate(user) {
    if (!user) return;

    var nav = document.querySelector('nav');
    if (nav) nav.classList.remove('hidden');

    var gated = document.querySelectorAll('.gated');
    Array.prototype.forEach.call(gated, function (el) {
      el.classList.remove('hidden');
    });

    var heroCta = document.querySelector('.hero .cta');
    if (heroCta) heroCta.classList.remove('hidden');

    var signupCard = document.getElementById('signup');
    if (signupCard) signupCard.style.display = 'none';

    var logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.style.display = 'inline-block';

    spy();
  }

  function resetGate() {
    var nav = document.querySelector('nav');
    if (nav) nav.classList.add('hidden');

    var gated = document.querySelectorAll('.gated');
    Array.prototype.forEach.call(gated, function (el) {
      el.classList.add('hidden');
    });

    var heroCta = document.querySelector('.hero .cta');
    if (heroCta) heroCta.classList.add('hidden');

    var signupCard = document.getElementById('signup');
    if (signupCard) signupCard.style.display = 'block';

    var logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.style.display = 'none';

    spy();
  }

  // ---------- Logout ----------
  var logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      localStorage.removeItem(STORAGE_KEYS.user);
      resetGate();
    });
  }

  // ---------- SIGNUP ----------
  var signupForm = document.getElementById('signup-form');
  var signupMsg = document.getElementById('signup-msg');

  if (signupForm) {
    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var usernameInput = document.getElementById('username');
      var emailInput = document.getElementById('email');
      var passwordInput = document.getElementById('password');

      var username = usernameInput ? usernameInput.value.trim() : '';
      var email = emailInput ? emailInput.value.trim() : '';
      var password = passwordInput ? passwordInput.value : '';

      if (!username || !email || !password) {
        alert('Please fill in username, email, and password before creating an account.');
        return;
      }

      var user = {
        username: username,
        email: email,
        createdAt: new Date().toISOString()
      };

      saveJSON(STORAGE_KEYS.user, user);
      if (signupMsg) signupMsg.hidden = false;
      applyUserGate(user);
    });
  }

  // ---------- STOCK MONITORING ----------
  var stockTbody = document.getElementById('stock-tbody');

  var defaultStock = [
    { name: 'Product A', stock: 80, reorder: 30, status: 'In Stock' },
    { name: 'Product B', stock: 60, reorder: 40, status: 'Watch' },
    { name: 'Product C', stock: 90, reorder: 50, status: 'In Stock' },
    { name: 'Product D', stock: 25, reorder: 30, status: 'Low' },
    { name: 'Product E', stock: 10, reorder: 20, status: 'Out-of-stock soon' },
    { name: 'Product F', stock: 55, reorder: 35, status: 'In Stock' }
  ];

  var stockData = loadJSON(STORAGE_KEYS.stock, null) || defaultStock.slice();

  function renderStockTable() {
    if (!stockTbody) return;

    var rows = stockData.map(function (item, index) {
      return (
        '<tr>' +
          '<td>' + item.name + '</td>' +
          '<td>' + item.stock + '</td>' +
          '<td>' + item.reorder + '</td>' +
          '<td>' + item.status + '</td>' +
          '<td>' +
            '<div class="stock-level" role="progressbar" ' +
                 'aria-valuemin="0" aria-valuemax="100" ' +
                 'aria-valuenow="' + item.stock + '" ' +
                 'aria-label="' + item.name + ' stock at ' + item.stock + '%">' +
              '<div class="stock-fill" style="width:' + item.stock + '%"></div>' +
            '</div>' +
          '</td>' +
          '<td>' +
            '<button class="btn btn-danger btn-sm remove-stock" data-index="' + index + '">' +
              'Remove' +
            '</button>' +
          '</td>' +
        '</tr>'
      );
    }).join('');

    stockTbody.innerHTML = rows;
  }

  renderStockTable();

  // Event delegation for stock remove buttons
  if (stockTbody) {
    stockTbody.addEventListener('click', function (e) {
      var target = e.target;
      while (target && target !== stockTbody && !target.classList.contains('remove-stock')) {
        target = target.parentNode;
      }
      if (!target || target === stockTbody) return;

      var index = target.getAttribute('data-index');
      if (index === null) return;

      if (!confirm('Remove this stock item?')) return;

      stockData.splice(Number(index), 1);
      saveJSON(STORAGE_KEYS.stock, stockData);
      renderStockTable();
    });
  }

  var addProductForm = document.getElementById('add-product-form');
  var apMsg = document.getElementById('ap-msg');

  if (addProductForm) {
    addProductForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameInput = document.getElementById('ap-name');
      var stockInput = document.getElementById('ap-stock');
      var reorderInput = document.getElementById('ap-reorder');

      var name = nameInput ? nameInput.value.trim() : '';
      var stockVal = stockInput ? Number(stockInput.value) || 0 : 0;
      var reorderVal = reorderInput ? Number(reorderInput.value) || 0 : 0;

      if (!name) {
        alert('Please enter product name.');
        return;
      }

      var status = 'In Stock';
      if (stockVal <= reorderVal && stockVal > 0) status = 'Low';
      if (stockVal === 0) status = 'Out of Stock';

      stockData.push({
        name: name,
        stock: stockVal,
        reorder: reorderVal,
        status: status
      });

      saveJSON(STORAGE_KEYS.stock, stockData);
      renderStockTable();

      if (apMsg) apMsg.hidden = false;
      addProductForm.reset();
    });
  }

  // ---------- TRANSACTIONS ----------
  var transactions = loadJSON(STORAGE_KEYS.transactions, []) || [];
  var txForm = document.getElementById('tx-form');
  var txMsg = document.getElementById('tx-msg');
  var txList = document.getElementById('tx-list');

  function renderTransactions() {
    if (!txList) return;

    if (!transactions.length) {
      txList.innerHTML = '<p>No transactions yet.</p>';
      return;
    }

    var rows = transactions.map(function (t, index) {
      return (
        '<tr>' +
          '<td>' + (index + 1) + '</td>' +
          '<td>' + t.empid + '</td>' +
          '<td>' + t.product + '</td>' +
          '<td>' + t.type + '</td>' +
          '<td>' + t.date + '</td>' +
          '<td>' +
            '<button class="btn btn-danger btn-sm remove-tx" data-index="' + index + '">' +
              'Remove' +
            '</button>' +
          '</td>' +
        '</tr>'
      );
    }).join('');

    txList.innerHTML =
      '<h3>Saved Transactions</h3>' +
      '<table class="mt-4">' +
        '<thead>' +
          '<tr>' +
            '<th>#</th>' +
            '<th>Employee ID</th>' +
            '<th>Product</th>' +
            '<th>Type</th>' +
            '<th>Date</th>' +
            '<th>Action</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>';
  }

  renderTransactions();

  if (txList) {
    txList.addEventListener('click', function (e) {
      var target = e.target;
      while (target && target !== txList && !target.classList.contains('remove-tx')) {
        target = target.parentNode;
      }
      if (!target || target === txList) return;

      var index = target.getAttribute('data-index');
      if (index === null) return;

      if (!confirm('Delete this transaction?')) return;

      transactions.splice(Number(index), 1);
      saveJSON(STORAGE_KEYS.transactions, transactions);
      renderTransactions();
    });
  }

  if (txForm) {
    txForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var emp = document.getElementById('empid');
      var prod = document.getElementById('product');
      var typeSel = document.getElementById('type');
      var dateInput = document.getElementById('date');

      var record = {
        empid: emp ? emp.value.trim() : '',
        product: prod ? prod.value.trim() : '',
        type: typeSel ? typeSel.value : '',
        date: dateInput ? dateInput.value : '',
        createdAt: new Date().toISOString()
      };

      if (!record.empid || !record.product || !record.type || !record.date) {
        alert('Please fill all transaction fields.');
        return;
      }

      transactions.push(record);
      saveJSON(STORAGE_KEYS.transactions, transactions);
      renderTransactions();

      if (txMsg) txMsg.hidden = false;
      txForm.reset();
    });
  }

  // ---------- REPORTS ----------
  var reportPrefs = loadJSON(STORAGE_KEYS.reportPrefs, {
    type: '',
    range: '30'
  });

  var reportItemsSelect = document.getElementById('report-items');
  var rangeSelect = document.getElementById('range');
  var reportsForm = document.getElementById('reports-form');
  var reportResults = document.getElementById('report-results');
  var reportMsg = document.getElementById('report-msg');

  if (reportItemsSelect && reportPrefs.type) {
    reportItemsSelect.value = reportPrefs.type;
  }
  if (rangeSelect && reportPrefs.range) {
    rangeSelect.value = reportPrefs.range;
  }

  if (reportsForm) {
    reportsForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var type = reportItemsSelect ? reportItemsSelect.value : '';
      var range = rangeSelect ? rangeSelect.value : '';

      reportPrefs = { type: type, range: range };
      saveJSON(STORAGE_KEYS.reportPrefs, reportPrefs);

      var samplesMap = {
        topsellers: [
          { name: 'SKU-014', qty: 120 },
          { name: 'SKU-022', qty: 95 },
          { name: 'SKU-031', qty: 84 }
        ],
        lows: [
          { name: 'SKU-005', qty: 8 },
          { name: 'SKU-027', qty: 12 },
          { name: 'SKU-019', qty: 5 }
        ],
        recent: [
          { name: 'SKU-101', qty: 40 },
          { name: 'SKU-102', qty: 12 },
          { name: 'SKU-103', qty: 9 }
        ]
      };

      var samples = samplesMap[type] || [];

      var cards = samples.map(function (s) {
        return (
          '<div class="card">' +
            '<strong>' + s.name + '</strong>' +
            '<p class="mt-4">Qty: ' + s.qty + ' (last ' + range + ' days)</p>' +
          '</div>'
        );
      }).join('');

      if (reportResults) {
        reportResults.innerHTML = '<div class="grid-3">' + cards + '</div>';
      }
      if (reportMsg) reportMsg.hidden = false;
    });
  }

  // ---------- MANAGE ALERTS ----------
  var alertsOutput = document.getElementById('alerts-output');
  var alertsForm = document.getElementById('alerts-form');
  var alertsMsg = document.getElementById('alerts-msg');
  var lastSelection = {};

  function setAlertsOutput(html) {
    if (alertsOutput) alertsOutput.innerHTML = html;
  }

  Array.prototype.forEach.call(
    document.querySelectorAll('[data-filter]'),
    function (btn) {
      btn.addEventListener('click', function () {
        lastSelection.filter = btn.getAttribute('data-filter');
        setAlertsOutput(
          "<p class='mt-4'><strong>Filter applied:</strong> " +
          lastSelection.filter +
          '</p>'
        );
      });
    }
  );

  Array.prototype.forEach.call(
    document.querySelectorAll('[data-action]'),
    function (btn) {
      btn.addEventListener('click', function () {
        lastSelection.action = btn.getAttribute('data-action');
        setAlertsOutput(
          "<p class='mt-4'>Action: " + lastSelection.action + ' initiated.</p>'
        );
      });
    }
  );

  Array.prototype.forEach.call(
    document.querySelectorAll('[data-sales]'),
    function (btn) {
      btn.addEventListener('click', function () {
        lastSelection.sales = btn.getAttribute('data-sales');
        setAlertsOutput(
          "<p class='mt-4'>Sales window: " + lastSelection.sales + '</p>'
        );
      });
    }
  );

  Array.prototype.forEach.call(
    document.querySelectorAll('[data-tx]'),
    function (btn) {
      btn.addEventListener('click', function () {
        lastSelection.tx = btn.getAttribute('data-tx');
        setAlertsOutput(
          "<p class='mt-4'>Transaction type: " + lastSelection.tx + '</p>'
        );
      });
    }
  );

  Array.prototype.forEach.call(
    document.querySelectorAll('[data-alert]'),
    function (btn) {
      btn.addEventListener('click', function () {
        lastSelection.alert = btn.getAttribute('data-alert');
        setAlertsOutput(
          "<p class='mt-4'>Alert focus: " + lastSelection.alert + '</p>'
        );
      });
    }
  );

  if (alertsForm) {
    alertsForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new Date();
      var pad = function (n) { return String(n).padStart(2, '0'); };
      var ref =
        'REF-' +
        d.getFullYear() +
        pad(d.getMonth() + 1) +
        pad(d.getDate()) +
        '-' +
        pad(d.getHours()) +
        pad(d.getMinutes()) +
        pad(d.getSeconds()) +
        '-' +
        Math.floor(10000 + Math.random() * 90000);

      var parts = Object.keys(lastSelection).map(function (k) {
        return k + '=' + lastSelection[k];
      });

      var summary =
        'Generated result' + (parts.length ? ' for: ' + parts.join(', ') : '') + '.';

      setAlertsOutput(
        '<div class="card">' +
          '<strong>' + d.toLocaleString() + '</strong>' +
          '<p class="mt-4">' + summary + '</p>' +
          '<p class="mt-4"><strong>Reference #:</strong> ' + ref + '</p>' +
        '</div>'
      );

      var genCard = document.getElementById('generated-card');
      if (genCard) genCard.style.display = 'flex';
      if (alertsMsg) alertsMsg.hidden = false;
    });
  }

  // ---------- Footer year ----------
  var yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});
