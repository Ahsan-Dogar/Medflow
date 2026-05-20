const BASE = (function() {
  const origin = window.location.origin;
  // Agar localhost/file ho ya production mein koi aur domain ho, to hamesha API ka domain use karo
  if (
    origin === 'null' ||
    origin === 'file://' ||
    location.protocol === 'file:' ||
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1' ||
    !origin.includes('medster.vercel.app')   // ✅ agar origin API domain nahi hai to bhi API use karo
  ) {
    return 'https://medster.vercel.app';
  }
  // Agar app khud medster.vercel.app par hosted hai to origin hi use karo (waise bhi same rahega)
  return origin;
})();

const THEMES = [
  { key: 'frost',     label: 'Frost'     },
  { key: 'dark',      label: 'Void'      },
  { key: 'midnight',  label: 'Midnight'  },
  { key: 'luxe',      label: 'Luxe'      },
  { key: 'forest',    label: 'Forest'    },
  { key: 'rose',      label: 'Rose'      },
];
let themeIdx = 0;

function cycleTheme() {
  themeIdx = (themeIdx + 1) % THEMES.length;
  const t = THEMES[themeIdx];
  document.body.setAttribute('data-theme', t.key);
  document.getElementById('theme-label').textContent = t.label;
  try { localStorage.setItem('medster-theme', themeIdx); } catch(e){}
}

(function initTheme() {
  try {
    const saved = parseInt(localStorage.getItem('medster-theme'));
    if (!isNaN(saved) && saved >= 0 && saved < THEMES.length) {
      themeIdx = saved;
      const t = THEMES[themeIdx];
      document.body.setAttribute('data-theme', t.key);
      document.getElementById('theme-label').textContent = t.label;
    }
  } catch(e){}
})();

const sectionIcons = {
  description:'📋', ingredients:'🧪', drug_class:'🏷️', dosage_form:'💊',
  uses:'✅', dose:'📏', over_dose:'⚠️', missed_dose:'⏰',
  how_to_use:'📖', when_not_use:'🚫', side_effects:'⚡',
  precautions:'🛡️', drug_interactions:'🔗', storage:'📦',
  control_drug:'🔒', quick_tips:'💡'
};

const views = ['idle','loading','empty','results','detail-loading','detail'];
function showView(name) {
  views.forEach(v => document.getElementById('view-'+v).style.display='none');
  document.getElementById('view-'+name).style.display='block';
}

document.getElementById('search-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') doSearch();
});

async function doSearch() {
  const q = document.getElementById('search-input').value.trim();
  if (!q) return;
  const btn = document.getElementById('search-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff"></span>';
  showView('loading');
  try {
    const res = await fetch(BASE+'/api/search?q='+encodeURIComponent(q));
    const data = await res.json();
    if (!data.success || !data.results || !data.results.length) {
      document.getElementById('empty-msg').textContent='No results found for "'+q+'".';
      showView('empty'); return;
    }
    renderResults(data.results);
  } catch(e) {
    document.getElementById('empty-msg').textContent='Network error. Please try again.';
    showView('empty');
  } finally {
    btn.disabled=false;
    btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span>Search</span>';
  }
}

function renderResults(results) {
  document.getElementById('results-count').textContent=results.length+' found';
  document.getElementById('results-list').innerHTML=results.map(r=>
    '<div class="result-card" onclick="loadDetail(\''+escAttr(r.id)+'\')">'+
      '<div class="result-info">'+
        '<div class="result-name">'+escHtml(r.name)+'</div>'+
        '<div class="result-price">'+escHtml(r.price)+'</div>'+
      '</div>'+
      '<span class="result-arrow">→</span>'+
    '</div>'
  ).join('');
  showView('results');
}

function showResults() { showView('results'); }

async function loadDetail(id) {
  showView('detail-loading');
  try {
    const res = await fetch(BASE+'/api/details?id='+encodeURIComponent(id));
    const data = await res.json();
    if (!data.success || !data.medicine) {
      document.getElementById('empty-msg').textContent='Could not load details.';
      showView('empty'); return;
    }
    renderDetail(data.medicine);
  } catch(e) {
    document.getElementById('empty-msg').textContent='Network error loading details.';
    showView('empty');
  }
}

function renderDetail(med) {
  document.getElementById('detail-name').textContent=med.name;
  document.getElementById('detail-price').textContent=med.price;
  const d=document.getElementById('detail-discount');
  if (med.discount){d.textContent=med.discount;d.style.display='inline';}
  else d.style.display='none';
  document.getElementById('detail-sections').innerHTML=(med.details||[]).map((s,i)=>
    '<div class="detail-section'+(i===0?' open':'')+'" onclick="toggleSection(this)">'+
      '<div class="detail-section-header">'+
        '<div class="detail-section-title">'+
          '<span class="section-icon">'+(sectionIcons[s.section]||'📄')+'</span>'+
          escHtml(s.title)+
        '</div>'+
        '<span class="detail-chevron">▼</span>'+
      '</div>'+
      '<div class="detail-section-body">'+escHtml(s.content)+'</div>'+
    '</div>'
  ).join('');
  showView('detail');
}

function toggleSection(el){el.classList.toggle('open');}

function openDocs(){
  document.getElementById('doc-base-url-text').textContent=BASE;
  document.getElementById('doc-search-example').textContent='GET '+BASE+'/api/search?q=panadol';
  document.getElementById('doc-details-example').textContent='GET '+BASE+'/api/details?id=panadol-500mg-tab-200-s';
  document.getElementById('docs-modal').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeDocs(){
  document.getElementById('docs-modal').classList.remove('open');
  document.body.style.overflow='';
}
function copyBaseUrl(btn){
  navigator.clipboard.writeText(BASE).then(()=>{
    btn.textContent='Copied!';setTimeout(()=>btn.textContent='Copy',1500);
  });
}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDocs();});

function escHtml(s){return String(s).replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"');}
function escAttr(s){return String(s).replace(/'/g,"\\'");}
