
  (function ($) {
  
  "use strict";

    // MENU
    $('.navbar-collapse a').on('click',function(){
      $(".navbar-collapse").collapse('hide');
    });
    
    // CUSTOM LINK
    $('.smoothscroll').click(function(){
      var el = $(this).attr('href');
      var elWrapped = $(el);
      var header_height = $('.navbar').height();
  
      scrollToDiv(elWrapped,header_height);
      return false;
  
      function scrollToDiv(element,navheight){
        var offset = element.offset();
        var offsetTop = offset.top;
        var totalScroll = offsetTop-navheight;
  
        $('body,html').animate({
        scrollTop: totalScroll
        }, 300);
      }
    });

})(window.jQuery);

// פונקציה גלובלית לטעינת CSV
function loadCsvToTable(csvPath, targetId) {
    fetch(csvPath)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        })
        .then(text => {
            const rows = text.trim().split('\n');
            const table = document.createElement('table');
            table.className = 'table table-bordered table-sm';
            rows.forEach((row, i) => {
                const tr = document.createElement('tr');
                row.split(',').forEach(cell => {
                    const tag = i === 0 ? 'th' : 'td';
                    const td = document.createElement(tag);
                    td.textContent = cell;
                    tr.appendChild(td);
                });
                table.appendChild(tr);
            });
            const target = document.getElementById(targetId);
            if (target) {
                target.innerHTML = '';
                target.appendChild(table);
            }
        })
        .catch(err => {
            const target = document.getElementById(targetId);
            if (target) {
                target.innerHTML = '<div class="alert alert-danger">לא ניתן לטעון את קובץ הנתונים: ' + err.message + '</div>';
            }
        });
}

function loadCsvToCards(csvPath, containerId) {
    fetch(csvPath)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        })
        .then(text => {
            const rows = text.trim().split('\n');
            const headers = rows[0].split(',');
            const container = document.getElementById(containerId);
            container.innerHTML = '';
            for (let i = 1; i < rows.length; i++) {
                const cells = rows[i].split(',');
                const card = document.createElement('div');
                card.className = 'col-md-4 col-12';
                card.innerHTML = `
                  
                    <div class="custom-block-info small-card mt-2 mt-lg-0 p-2">
                        <a class="events-title mb-2" style="font-size:1.1em;">${cells[0]}</a>
                        <div class="d-flex flex-wrap border-top mt-2 pt-2"></div>
                        <p class="mb-1" style="font-size:0.95em;">${headers[1]}: ${cells[1]}</p>
                        <p class="mb-1" style="font-size:0.95em;">${headers[2]}: ${cells[2]}</p>
                        <p class="mb-1" style="font-size:0.95em;">${headers[3]}: ${cells[3]}</p>
                    </div>
                `;
                container.appendChild(card);
            }
        })
        .catch(err => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = '<div class="alert alert-danger">לא ניתן לטעון את קובץ הנתונים: ' + err.message + '</div>';
            }
        });
}

// Google Analytics
(function () {
  // ===== Helpers =====
  const MAX_TXT = 120;
  const maskPII = (txt) => {
    if (!txt) return null;
    const t = (txt + '').trim();
    // הסתרת אימיילים/רצפי ספרות ארוכים – לא שולחים PII
    if (/@/.test(t) || /\d{7,}/.test(t)) return '[redacted]';
    return t.slice(0, MAX_TXT);
  };
  const last4 = (phone) => {
    const d = (phone || '').replace(/\D/g, '');
    return d ? d.slice(-4) : null;
  };
  const getPageType = () => {
    // אפשר להגדיר <body data-page-type="drivers"> אם תרצה לשלוט ידנית
    const ds = (document.body && document.body.dataset && document.body.dataset.pageType) || '';
    if (ds) return ds;
    const p = (location.pathname || '').toLowerCase();
    if (p.includes('drivers')) return 'drivers';
    if (p.includes('hotels')) return 'hotels';
    if (p.includes('maps')) return 'maps';
    if (p.includes('services')) return 'services';
    if (p.includes('agents')) return 'agents';
    return 'other';
  };
  const getSectionName = (el) => {
    // מחפש את ה-H3/H2 האחרון לפני הכרטיס בתוך אותו קונטיינר
    let node = el.closest('.custom-block-info') || el.closest('.col-md-4') || el;
    while (node) {
      let prev = node.previousElementSibling;
      while (prev) {
        const tag = (prev.tagName || '').toUpperCase();
        if (tag === 'H2' || tag === 'H3' || tag === 'H4') {
          return (prev.textContent || '').trim();
        }
        prev = prev.previousElementSibling;
      }
      node = node.parentElement;
    }
    return null;
  };

  const page_type = getPageType();

  // ===== 1) קליקים על לינקים (WhatsApp / Phone / Email) בתוך כרטיסים =====
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a');
    if (!a) return;

    const href = a.getAttribute('href') || '';
    const text = (a.innerText || '').trim();
    let channel = 'other';
    if (/^tel:/i.test(href)) channel = 'phone';
    else if (/^mailto:/i.test(href)) channel = 'email';
    else if (/wa\.me\//i.test(href)) channel = 'whatsapp';
    else {
      // fallback: אם זה נראה כמו טלפון לפי הטקסט
      if (/\+?\d[\d\s\-()]{6,}/.test(text)) channel = 'phone';
    }
    if (channel === 'other') return; // לא שולחים אירוע על לינק שאינו יצירת קשר

    const card = a.closest('.custom-block-info');
    const title = (card && card.querySelector('h5')) ? (card.querySelector('h5').innerText || '').trim() : null;

    gtag('event', 'contact_click', {
      page_type,
      section_name: getSectionName(a),
      card_title: maskPII(title),
      channel,                              // whatsapp / phone / email
      phone_suffix: last4(text),
      link_url: href,
      link_target: a.target || null,
      card_text: maskPII(card ? card.innerText : null)
    });
  }, { passive: true });

  // ===== 3) קליקים על שורות טבלה (אם יהיו) – אופציונלי =====
  document.addEventListener('click', function (e) {
    const tr = e.target.closest('tr');
    const table = e.target.closest('table');
    if (!tr || !table || tr.closest('thead')) return;

    const body = table.tBodies && table.tBodies[0];
    const index = body ? Array.prototype.indexOf.call(body.rows, tr) : null;

    gtag('event', 'table_row_click', {
      page_type,
      table_name: table.dataset.tableName || table.id || '(unknown)',
      row_index: (typeof index === 'number') ? index : null,
      row_id: tr.dataset.rowId || null,
      row_text: maskPII(tr.innerText)
    });
  }, { passive: true });

  // ===== 4) (אופציונלי) אירוע כללי על כל קליק לניתוח UI =====
  document.addEventListener('click', function (e) {
    const clickable = e.target.closest('a,button,[role="button"],input[type="button"],input[type="submit"]');
    const target = clickable || e.target;
    gtag('event', 'ui_click', {
      page_type,
      element: (target.tagName || 'other').toLowerCase(),
      element_id: target.id || null,
      element_classes: target.className || null,
      element_role: target.getAttribute && target.getAttribute('role') || null,
      text: maskPII(target.innerText || target.value)
    });
  }, { passive: true });
})();



