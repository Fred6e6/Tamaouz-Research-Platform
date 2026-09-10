const API_URL = 'https://script.google.com/macros/s/AKfycbw4GeV2ZDrYcPq8fYSuHhWtold8OUseRLU_mXBOztprFH_L4Q63ZiDuQYOwtZ9GaEz2/exec';

let lang = localStorage.getItem('tamaouz_language') || 'en';
let currentRequests = [];

const translations = {
  en: {
    newRequest: 'New Request', eyebrow: 'STUDENT DASHBOARD', title: 'My Requests',
    subtitle: 'Enter the email used when you submitted your requests to view your request history and status.',
    create: 'Create New Request', email: 'Email Address', track: 'View My Requests',
    loading: 'Checking your requests...', notFound: 'No requests were found for this email address.',
    network: 'Unable to connect to the request service. Please try again.',
    total: 'Total Requests', active: 'Active Requests', completed: 'Completed', request: 'Request',
    view: 'View Details', hide: 'Hide Details', student: 'Student', type: 'Request Type',
    workplace: 'University / Workplace', submitted: 'Submitted', deadline: 'Deadline',
    pages: 'Pages', references: 'References', citation: 'Referencing Style',
    topic: 'Research Question / Topic', instructions: 'Special Instructions', details: 'Request Details',
    statusHelp: 'Current status',
    status: { Submitted: 'Submitted', 'Under Review': 'Under Review', 'In Progress': 'In Progress', 'Ready for Review': 'Ready for Review', Completed: 'Completed' },
    steps: ['Submitted', 'Under Review', 'In Progress', 'Ready for Review', 'Completed']
  },
  ar: {
    newRequest: 'طلب جديد', eyebrow: 'لوحة الطالب', title: 'طلباتي',
    subtitle: 'أدخل البريد الإلكتروني المستخدم عند إرسال طلباتك لعرض سجل الطلبات وحالاتها.',
    create: 'إنشاء طلب جديد', email: 'البريد الإلكتروني', track: 'عرض طلباتي',
    loading: 'جارٍ البحث عن طلباتك...', notFound: 'لم يتم العثور على طلبات مرتبطة بهذا البريد الإلكتروني.',
    network: 'تعذر الاتصال بخدمة الطلبات. يرجى المحاولة مرة أخرى.',
    total: 'إجمالي الطلبات', active: 'الطلبات النشطة', completed: 'المكتملة', request: 'طلب',
    view: 'عرض التفاصيل', hide: 'إخفاء التفاصيل', student: 'الطالب', type: 'نوع الطلب',
    workplace: 'الجامعة / جهة العمل', submitted: 'تاريخ الإرسال', deadline: 'الموعد النهائي',
    pages: 'عدد الصفحات', references: 'عدد المراجع', citation: 'نمط التوثيق',
    topic: 'سؤال البحث / الموضوع', instructions: 'تعليمات خاصة', details: 'تفاصيل الطلب',
    statusHelp: 'الحالة الحالية',
    status: { Submitted: 'تم الإرسال', 'Under Review': 'قيد المراجعة', 'In Progress': 'قيد التنفيذ', 'Ready for Review': 'جاهز للمراجعة', Completed: 'مكتمل' },
    steps: ['تم الإرسال', 'قيد المراجعة', 'قيد التنفيذ', 'جاهز للمراجعة', 'مكتمل']
  }
};

const tr = key => translations[lang][key] ?? translations.en[key] ?? key;
const esc = value => String(value ?? '').replace(/[&<>\'\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));

function applyLanguage() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.dir = document.documentElement.dir;
  document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = tr(el.dataset.i18n));
  const button = document.getElementById('languageToggle');
  if (button) button.textContent = lang === 'ar' ? 'English' : 'العربية';
  if (currentRequests.length) renderDashboard(currentRequests);
}

function fmtDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return esc(value);
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

function statusIndex(status) {
  const index = translations.en.steps.indexOf(status);
  return index < 0 ? 0 : index;
}

function renderStatus(r) {
  const statuses = translations[lang].steps;
  const index = statusIndex(r.status);
  const statusText = translations[lang].status[r.status] || r.status || '—';
  return `<div class="status-block"><p>${esc(tr('statusHelp'))}: <strong>${esc(statusText)}</strong></p><div class="status-line">${statuses.map((step, i) => `<div class="status-step ${i <= index ? 'done' : ''} ${i === index ? 'current' : ''}"><span>${i + 1}</span><small>${esc(step)}</small></div>`).join('')}</div></div>`;
}

function renderDetails(r) {
  const dynamic = Object.entries(r.dynamicRequirements || {}).filter(([, value]) => String(value || '').trim()).map(([key, value]) => `<div><small>${esc(key)}</small><strong>${esc(value)}</strong></div>`).join('');
  return `<div class="details-grid"><div><small>${esc(tr('student'))}</small><strong>${esc(r.fullName)}</strong></div><div><small>${esc(tr('type'))}</small><strong>${esc(r.requestType)}</strong></div><div><small>${esc(tr('workplace'))}</small><strong>${esc(r.workplace)}</strong></div><div><small>${esc(tr('submitted'))}</small><strong>${fmtDate(r.createdAt)}</strong></div><div><small>${esc(tr('deadline'))}</small><strong>${esc(r.deadline || '—')}</strong></div><div><small>${esc(tr('pages'))}</small><strong>${esc(r.pages || '—')}</strong></div><div><small>${esc(tr('references'))}</small><strong>${esc(r.references || '—')}</strong></div><div><small>${esc(tr('citation'))}</small><strong>${esc(r.citation || '—')}</strong></div></div><div class="text-block"><h3>${esc(tr('topic'))}</h3><p>${esc(r.topic || '—')}</p></div>${dynamic ? `<div class="dynamic-block"><h3>${esc(tr('details'))}</h3><div class="dynamic-grid">${dynamic}</div></div>` : ''}${r.instructions ? `<div class="text-block"><h3>${esc(tr('instructions'))}</h3><p>${esc(r.instructions)}</p></div>` : ''}`;
}

function renderRequestCard(r, index) {
  const statusText = translations[lang].status[r.status] || r.status || '—';
  const safeId = 'request-details-' + index;
  return `<article class="request-card compact-card"><div class="result-head"><div><span class="request-id">${esc(r.requestId)}</span><h2>${esc(r.projectTitle || r.requestType || tr('request'))}</h2><p class="request-meta">${esc(r.requestType || '')} · ${fmtDate(r.createdAt)}</p></div><span class="badge">${esc(statusText)}</span></div><div class="card-actions"><button type="button" class="details-toggle" data-target="${safeId}">${esc(tr('view'))}</button></div><div id="${safeId}" class="request-details" hidden>${renderStatus(r)}${renderDetails(r)}</div></article>`;
}

function renderDashboard(requests) {
  const summary = document.getElementById('dashboardSummary');
  const list = document.getElementById('requestsList');
  const completed = requests.filter(r => r.status === 'Completed').length;
  const active = requests.length - completed;
  summary.innerHTML = `<div class="summary-card"><small>${esc(tr('total'))}</small><strong>${requests.length}</strong></div><div class="summary-card"><small>${esc(tr('active'))}</small><strong>${active}</strong></div><div class="summary-card"><small>${esc(tr('completed'))}</small><strong>${completed}</strong></div>`;
  summary.hidden = false;
  list.innerHTML = requests.map(renderRequestCard).join('');
  list.hidden = false;
  list.querySelectorAll('.details-toggle').forEach(button => {
    button.addEventListener('click', () => {
      const details = document.getElementById(button.dataset.target);
      const open = details.hidden;
      details.hidden = !open;
      button.textContent = open ? tr('hide') : tr('view');
    });
  });
}

function lookupViaJsonp(action, email) {
  return new Promise((resolve, reject) => {
    const callback = 'tamaouzCallback_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    const script = document.createElement('script');
    let timer;
    const cleanup = () => { clearTimeout(timer); delete window[callback]; if (script.parentNode) script.parentNode.removeChild(script); };
    window[callback] = data => { cleanup(); resolve(data); };
    script.onerror = () => { cleanup(); reject(new Error('NETWORK')); };
    script.src = API_URL + '?action=' + encodeURIComponent(action) + '&email=' + encodeURIComponent(email) + '&callback=' + encodeURIComponent(callback) + '&_=' + Date.now();
    timer = setTimeout(() => { cleanup(); reject(new Error('NETWORK')); }, 15000);
    document.head.appendChild(script);
  });
}

async function lookup(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const email = document.getElementById('email').value.trim();
  const message = document.getElementById('message');
  if (!form.checkValidity()) { form.reportValidity(); return; }
  message.hidden = false;
  message.className = 'message loading';
  message.textContent = tr('loading');
  try {
    const data = await lookupViaJsonp('getRequests', email);
    if (!data.ok || !Array.isArray(data.requests) || data.requests.length === 0) {
      currentRequests = [];
      document.getElementById('dashboardSummary').hidden = true;
      document.getElementById('requestsList').hidden = true;
      message.className = 'message error-message';
      message.textContent = data.error || tr('notFound');
      return;
    }
    currentRequests = data.requests;
    message.hidden = true;
    renderDashboard(currentRequests);
  } catch (error) {
    message.className = 'message error-message';
    message.textContent = tr('network');
  }
}

document.getElementById('languageToggle').addEventListener('click', () => { lang = lang === 'en' ? 'ar' : 'en'; localStorage.setItem('tamaouz_language', lang); applyLanguage(); });
document.getElementById('lookupForm').addEventListener('submit', lookup);
applyLanguage();
const params = new URLSearchParams(location.search);
if (params.get('email')) document.getElementById('email').value = params.get('email');
