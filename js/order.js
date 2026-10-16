/* ============================================================
   Saleh Premium — صفحة الطلب
   تعرض كل المنتجات مع أزرار الكمية، وتشارك نفس سلة
   localStorage مع باقي الموقع (sp_cart_v1)، وفي النهاية
   تُحوِّل الطلب إلى رسالة واتساب جاهزة للإرسال.
   ============================================================ */
(function () {
  'use strict';

  var CART_KEY = 'sp_cart_v1';
  var FIELDS_KEY = 'sp_cart_fields_v1';

  // رقم الواتساب: من إعدادات الموقع إن توفرت، وإلا القيمة الافتراضية
  var WA_NUMBER = '213669103856';
  try {
    if (typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.whatsapp) {
      var m = SITE_CONFIG.whatsapp.match(/wa\.me\/(\d+)/);
      if (m) WA_NUMBER = m[1];
    }
  } catch (e) {}

  /* ---------- كتالوج المنتجات (نفس معرفات السلة في بقية الصفحات) ---------- */
  var FAMILIES = [
    {
      title: 'معطرات الجو — Velvet',
      note: 'بخاخات انتعاش سريعة للمنزل والسيارة والمكتب.',
      items: [
        { id: 'af-lemon', name: 'معطر جو Velvet — ليمون منعش', en: 'LEMON FRESH', color: '#f7d21e', emoji: '🍋', desc: 'انتعاش حمضي يوقظ الحواس.' },
        { id: 'af-mango', name: 'معطر جو Velvet — مانجو استوائي', en: 'MANGO TROPICAL', color: '#f28c28', emoji: '🥭', desc: 'حلاوة المانجو الاستوائية الدافئة.' },
        { id: 'af-vanilla', name: 'معطر جو Velvet — فانيليا كلاسيكية', en: 'VANILLA CLASSIC', color: '#c8a06a', emoji: '🌼', desc: 'دفء الفانيليا الناعمة التي تدوم.' },
        { id: 'af-ocean', name: 'معطر جو Velvet — نسمة المحيط', en: 'OCEAN BREEZE', color: '#2f9de8', emoji: '🌊', desc: 'انتعاش بحري منعش يبعث الحياة.' }
      ]
    },
    {
      title: 'معطرات المنزل — Velvet',
      note: 'تشكيلة Parfum de Maison الفاخرة بروائح عميقة ثابتة.',
      items: [
        { id: 'hp-roselia', name: 'معطر منزل Velvet — روزيليا', en: 'ROSELIA', color: '#e0417f', emoji: '🌺', desc: 'زهري دافئ بعبق الأزهار الفاخرة.' },
        { id: 'hp-golden', name: 'معطر منزل Velvet — غولدن', en: 'GOLDEN', color: '#c9a227', emoji: '✨', desc: 'عطر ذهبي فخم بإحساس حيوي.' },
        { id: 'hp-azulina', name: 'معطر منزل Velvet — أزولينا', en: 'AZULINA', color: '#2f6fe0', emoji: '💠', desc: 'انتعاش أزرق عميق يبعث على الصفاء.' },
        { id: 'hp-velour', name: 'معطر منزل Velvet — فيلور', en: 'VELOUR', color: '#7a3fa0', emoji: '🪶', desc: 'لمسة مخملية ناعمة للأناقة الهادئة.' },
        { id: 'hp-mimosa', name: 'معطر منزل Velvet — ميموزا', en: 'MIMOSA', color: '#f2c94c', emoji: '🌼', desc: 'زهرة الميموزا المشرقة بلمسة صيفية.' },
        { id: 'hp-tobacco', name: 'معطر منزل Velvet — توباكو ستون', en: 'TOBACCO STONE', color: '#8a5a2b', emoji: '🍂', desc: 'تبغ دافئ كلاسيكي لجو راقٍ.' }
      ]
    },
    {
      title: 'كريم Bio Souna — مزيل الروائح',
      note: 'كريم عناية يومية طبيعي 100% بحماية تدوم 24 ساعة.',
      items: [
        { id: 'bs-jasmine', name: 'كريم Bio Souna — إصدار الياسمين', en: 'ÉDITION JASMINE', color: '#f3e3b0', emoji: '🤍', desc: 'بتغليف مزهر بزهور الياسمين البيضاء.' },
        { id: 'bs-hibiscus', name: 'كريم Bio Souna — إصدار الكركديه', en: 'ÉDITION HIBISCUS', color: '#f6c6d8', emoji: '🌸', desc: 'بتغليف مزهر بزهور الكركديه الوردية.' }
      ]
    },
    {
      title: 'الصناديق الجاهزة للجملة',
      note: 'تشكيلات مدروسة للمتاجر — جاهزة للعرض والبيع المباشر.',
      items: [
        { id: 'box-af', name: 'صندوق معطرات الجو — Velvet', en: 'AIR FRESHENER BOX', color: '#e9d6df', emoji: '📦', desc: 'تشكيلة بخاخات الجو الأكثر مبيعاً.' },
        { id: 'box-hp', name: 'صندوق معطرات المنزل — Velvet', en: 'MAISON BOX', color: '#d3aebf', emoji: '📦', desc: 'تشكيلة Parfum de Maison الفاخرة.' },
        { id: 'box-bs', name: 'صندوق كريم Bio Souna', en: 'BIO SOUNA BOX', color: '#f8e3ea', emoji: '📦', desc: 'كريم مزيل الروائح الطبيعي بإصداريه.' },
        { id: 'box-mix', name: 'الصندوق المختلط', en: 'MIXED BOX', color: '#f3e3b0', emoji: '🎁', desc: 'مزيج من عائلات المنتجات الثلاث — الأنسب لطلبك الأول.' }
      ]
    }
  ];

  /* ---------- الحالة (نفس سلة الموقع) ---------- */
  function load() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; }
    catch (e) { return {}; }
  }
  var cart = load();
  var fields = {};
  try { fields = JSON.parse(localStorage.getItem(FIELDS_KEY)) || {}; } catch (e) {}

  function save() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    localStorage.setItem(FIELDS_KEY, JSON.stringify(fields));
  }
  function totalCount() {
    var n = 0;
    Object.keys(cart).forEach(function (id) { n += cart[id].qty; });
    return n;
  }

  /* ---------- العرض ---------- */
  var root = document.getElementById('orderRoot');
  var itemsBox = document.getElementById('orderItems');
  var totalEl = document.getElementById('orderTotal');
  var checkoutBtn = document.getElementById('orderCheckout');
  var copyBtn = document.getElementById('orderCopy');
  var nameInput = document.getElementById('orderName');
  var wilayaSel = document.getElementById('orderWilaya');
  var notesInput = document.getElementById('orderNotes');

  function stepperHTML(id, qty) {
    if (!qty) {
      return '<button class="btn-cart" data-act="add" data-id="' + id + '">أضف إلى السلة</button>';
    }
    return '<div class="order-stepper" dir="ltr">' +
      '<button class="qty-btn" data-act="minus" data-id="' + id + '" aria-label="إنقاص">−</button>' +
      '<span class="qty-val">' + qty + '</span>' +
      '<button class="qty-btn" data-act="plus" data-id="' + id + '" aria-label="زيادة">+</button>' +
      '</div>';
  }

  function renderItems() {
    var html = FAMILIES.map(function (fam) {
      var cards = fam.items.map(function (it) {
        var qty = cart[it.id] ? cart[it.id].qty : 0;
        return '<div class="scent-card order-item">' +
          '<div class="scent-dot" style="background:' + it.color + '">' + it.emoji + '</div>' +
          '<div class="order-item-body">' +
            '<h3>' + it.name + ' <small>' + it.en + '</small></h3>' +
            '<p>' + it.desc + '</p>' +
          '</div>' +
          '<div class="order-item-ctrl">' + stepperHTML(it.id, qty) + '</div>' +
        '</div>';
      }).join('');
      return '<section class="order-family">' +
        '<h3 class="order-family-title">' + fam.title + '</h3>' +
        '<p class="order-family-note">' + fam.note + '</p>' +
        '<div class="order-grid">' + cards + '</div>' +
      '</section>';
    }).join('');
    itemsBox.innerHTML = html;
  }

  function renderSummary() {
    var n = totalCount();
    totalEl.textContent = n ? ('المجموع: ' + n + ' منتج في طلبك') : 'لم تختر أي منتج بعد — اضغط «أضف إلى السلة» بجانب ما تحتاجه';
    checkoutBtn.disabled = n === 0;
    checkoutBtn.classList.toggle('is-disabled', n === 0);
  }

  function render() { renderItems(); renderSummary(); }

  /* ---------- الطلب عبر واتساب ---------- */
  function buildMessage() {
    var lines = ['السلام عليكم، أريد طلب المنتجات التالية من صالح بريميوم:', ''];
    var i = 1;
    FAMILIES.forEach(function (fam) {
      fam.items.forEach(function (it) {
        if (cart[it.id]) {
          lines.push(i + '. ' + it.name + ' × ' + cart[it.id].qty);
          i++;
        }
      });
    });
    lines.push('—————————');
    lines.push('الاسم: ' + (nameInput.value.trim() || '—'));
    lines.push('الولاية: ' + (wilayaSel.value || '—'));
    if (notesInput.value.trim()) lines.push('ملاحظات: ' + notesInput.value.trim());
    return lines.join('\n');
  }

  function checkout() {
    if (totalCount() === 0) return;
    window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(buildMessage()), '_blank', 'noopener');
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
  itemsBox.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-act]');
    if (!btn) return;
    var id = btn.getAttribute('data-id');
    var act = btn.getAttribute('data-act');
    if (act === 'add' || act === 'plus') {
      if (cart[id]) cart[id].qty++;
      else cart[id] = {
        name: (function () {
          var found = null;
          FAMILIES.forEach(function (f) { f.items.forEach(function (it) { if (it.id === id) found = it.name; }); });
          return found;
        })(),
        qty: 1
      };
    } else if (act === 'minus') {
      cart[id].qty--;
      if (cart[id].qty <= 0) delete cart[id];
    } else return;
    save();
    render();
  });

  checkoutBtn.addEventListener('click', checkout);
  copyBtn.addEventListener('click', copyOrder);

  [nameInput, wilayaSel, notesInput].forEach(function (el) {
    el.addEventListener('input', function () {
      fields = { name: nameInput.value, wilaya: wilayaSel.value, notes: notesInput.value };
      save();
    });
  });

  nameInput.value = fields.name || '';
  wilayaSel.value = fields.wilaya || '';
  notesInput.value = fields.notes || '';

  render();
})();
