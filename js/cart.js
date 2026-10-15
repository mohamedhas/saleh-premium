/* ============================================================
   Saleh Premium — سلة الطلب + إتمام الطلب عبر واتساب
   يعمل بدون خادم: السلة محفوظة في localStorage،
   وعند الإتمام تُحوَّل الطلبية إلى رسالة واتساب جاهزة للإرسال.
   ============================================================ */
(function () {
  'use strict';

  var CART_KEY = 'sp_cart_v1';
  var FIELDS_KEY = 'sp_cart_fields_v1';
  var WA_NUMBER = '213669103856';

  /* ---------- الحالة ---------- */
  function load() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function save() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      localStorage.setItem(FIELDS_KEY, JSON.stringify(fields));
    } catch (e) { /* التخزين غير متاح — تبقى السلة في الذاكرة لهذه الصفحة */ }
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function sanitize(raw) {
    var out = {};
    if (!raw || typeof raw !== 'object') return out;
    Object.keys(raw).forEach(function (id) {
      var it = raw[id];
      var qty = it && Math.floor(Number(it.qty));
      if (it && typeof it.name === 'string' && qty > 0) out[id] = { name: it.name, qty: Math.min(qty, 999) };
    });
    return out;
  }
  var cart = sanitize(load());
  var fields = {};
  try { fields = JSON.parse(localStorage.getItem(FIELDS_KEY)) || {}; } catch (e) {}

  function totalCount() {
    var n = 0;
    Object.keys(cart).forEach(function (id) { n += cart[id].qty; });
    return n;
  }

  /* ---------- بناء واجهة السلة ---------- */
  var CART_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1.6"/><circle cx="18" cy="21" r="1.6"/><path d="M2.5 3h2l2.6 12.5a1.8 1.8 0 0 0 1.8 1.5h8.9a1.8 1.8 0 0 0 1.8-1.4L21.5 7H6"/></svg>';

  var wrap = document.createElement('div');
  wrap.innerHTML =
    '<button class="cart-fab" id="cartFab" aria-label="فتح سلة الطلب">' +
      CART_SVG +
      '<span class="cart-count" id="cartCount" hidden></span>' +
    '</button>' +
    '<div class="cart-backdrop" id="cartBackdrop" hidden></div>' +
    '<aside class="cart-drawer" id="cartDrawer" aria-label="سلة الطلب" hidden>' +
      '<div class="cart-head">' +
        '<strong>سلة الطلب <span class="cart-head-count" id="cartHeadCount"></span></strong>' +
        '<button class="cart-close" id="cartClose" aria-label="إغلاق السلة">×</button>' +
      '</div>' +
      '<div class="cart-items" id="cartItems"></div>' +
      '<div class="cart-fields">' +
        '<label>الاسم <input type="text" id="cartName" placeholder="اسمك أو اسم متجرك (اختياري)"></label>' +
        '<label>الولاية <select id="cartWilaya">' +
          '<option value="">اختر الولاية (اختياري)</option>' +
          '<option value="بسكرة">بسكرة</option>' +
          '<option value="تقرت">تقرت</option>' +
          '<option value="المغير">المغير</option>' +
          '<option value="أخرى">أخرى</option>' +
        '</select></label>' +
        '<label>ملاحظات <input type="text" id="cartNotes" placeholder="مثال: أنوّع لي في الروائح (اختياري)"></label>' +
      '</div>' +
      '<div class="cart-foot">' +
        '<button class="btn btn-wa" id="cartCheckout">إتمام الطلب عبر واتساب</button>' +
        '<button class="btn btn-outline-dark btn-copy" id="cartCopy">نسخ نص الطلب</button>' +
      '</div>' +
    '</aside>';
  document.body.appendChild(wrap);

  var fab = document.getElementById('cartFab');
  var countEl = document.getElementById('cartCount');
  var drawer = document.getElementById('cartDrawer');
  var backdrop = document.getElementById('cartBackdrop');
  var itemsEl = document.getElementById('cartItems');
  var headCount = document.getElementById('cartHeadCount');
  var checkoutBtn = document.getElementById('cartCheckout');
  var copyBtn = document.getElementById('cartCopy');

  var nameInput = document.getElementById('cartName');
  var wilayaSel = document.getElementById('cartWilaya');
  var notesInput = document.getElementById('cartNotes');
  nameInput.value = fields.name || '';
  wilayaSel.value = fields.wilaya || '';
  notesInput.value = fields.notes || '';

  /* ---------- العرض ---------- */
  function render() {
    var ids = Object.keys(cart);
    var total = totalCount();

    countEl.textContent = total;
    countEl.hidden = total === 0;
    headCount.textContent = total ? '(' + total + ' منتج)' : '';

    if (ids.length === 0) {
      itemsEl.innerHTML =
        '<div class="cart-empty">' +
          '<div class="cart-empty-icon">🛒</div>' +
          '<p>سلتك فارغة</p>' +
          '<small>أضف منتجات بالضغط على «أضف إلى السلة» في صفحات المنتجات والعروض.</small>' +
        '</div>';
    } else {
      itemsEl.innerHTML = ids.map(function (id) {
        var it = cart[id];
        return '<div class="cart-item" data-id="' + esc(id) + '">' +
          '<div class="cart-item-name">' + esc(it.name) + '</div>' +
          '<div class="cart-item-ctrl" dir="ltr">' +
            '<button class="qty-btn qty-minus" data-id="' + esc(id) + '" aria-label="إنقاص الكمية">−</button>' +
            '<span class="qty-val">' + it.qty + '</span>' +
            '<button class="qty-btn qty-plus" data-id="' + esc(id) + '" aria-label="زيادة الكمية">+</button>' +
          '</div>' +
          '<button class="cart-item-del" data-id="' + esc(id) + '" aria-label="حذف المنتج">×</button>' +
        '</div>';
      }).join('');
    }

    checkoutBtn.disabled = ids.length === 0;
    checkoutBtn.classList.toggle('is-disabled', ids.length === 0);
  }

  var lastFocus = null;
  function openDrawer() {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    backdrop.hidden = false;
    requestAnimationFrame(function () {
      drawer.classList.add('open');
      backdrop.classList.add('open');
      document.getElementById('cartClose').focus();
    });
  }
  function closeDrawer() {
    if (drawer.hidden) return;
    drawer.classList.remove('open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    backdrop.classList.remove('open');
    setTimeout(function () {
      drawer.hidden = true;
      backdrop.hidden = true;
    }, 280);
  }

  /* ---------- طلب واتساب ---------- */
  function buildMessage() {
    var lines = ['السلام عليكم، أريد طلب المنتجات التالية من صالح بريميوم:', ''];
    var i = 1;
    Object.keys(cart).forEach(function (id) {
      var it = cart[id];
      lines.push(i + '. ' + it.name + ' × ' + it.qty);
      i++;
    });
    lines.push('—————————');
    lines.push('الاسم: ' + (nameInput.value.trim() || '—'));
    lines.push('الولاية: ' + (wilayaSel.value || '—'));
    if (notesInput.value.trim()) lines.push('ملاحظات: ' + notesInput.value.trim());
    return lines.join('\n');
  }

  function checkout() {
    if (totalCount() === 0) return;
    var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(buildMessage());
    window.open(url, '_blank', 'noopener');
  }

  function copyOrder() {
    if (totalCount() === 0) return;
    var msg = buildMessage();
    function done() {
      var t = copyBtn.textContent;
      copyBtn.textContent = 'تم النسخ ✓';
      setTimeout(function () { copyBtn.textContent = t; }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg).then(done, function () { fallbackCopy(msg, done); });
    } else {
      fallbackCopy(msg, done);
    }
  }
  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* ---------- الأحداث ---------- */
  fab.addEventListener('click', openDrawer);
  document.getElementById('cartClose').addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDrawer();
  });

  checkoutBtn.addEventListener('click', checkout);
  copyBtn.addEventListener('click', copyOrder);

  [nameInput, wilayaSel, notesInput].forEach(function (el) {
    el.addEventListener('input', function () {
      fields = { name: nameInput.value, wilaya: wilayaSel.value, notes: notesInput.value };
      save();
    });
  });

  itemsEl.addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    var id = btn.getAttribute('data-id');
    if (!cart[id]) return;
    if (btn.classList.contains('qty-plus')) cart[id].qty = Math.min(cart[id].qty + 1, 999);
    else if (btn.classList.contains('qty-minus')) {
      cart[id].qty--;
      if (cart[id].qty <= 0) delete cart[id];
    }
    else if (btn.classList.contains('cart-item-del')) delete cart[id];
    else return;
    save();
    render();
  });

  // أزرار «أضف إلى السلة» في الصفحة (تفويض الأحداث)
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.btn-cart');
    if (!btn) return;
    var id = btn.getAttribute('data-cart-id');
    var name = btn.getAttribute('data-cart-name');
    if (!id || !name) return;
    if (cart[id]) cart[id].qty = Math.min(cart[id].qty + 1, 999);
    else cart[id] = { name: name, qty: 1 };
    save();
    render();

    // تأكيد بصري على الزر
    var old = btn.getAttribute('data-cart-label') || btn.textContent;
    btn.setAttribute('data-cart-label', old);
    btn.classList.add('ok');
    btn.textContent = 'أُضيف ✓';
    setTimeout(function () {
      btn.classList.remove('ok');
      btn.textContent = old;
    }, 1300);

    // نبضة على زر السلة
    fab.classList.add('pulse');
    setTimeout(function () { fab.classList.remove('pulse'); }, 700);
  });

  render();
})();
