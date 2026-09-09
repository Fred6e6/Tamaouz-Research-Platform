const form=document.getElementById('requestForm');
const panels=[...document.querySelectorAll('.step-panel')];
const fill=document.querySelector('.progress-fill');
const label=document.getElementById('stepLabel');
const review=document.getElementById('review');
let current=0;
const STORAGE_KEY='tamaouz_requests';
const API_URL='https://script.google.com/macros/s/AKfycbw4GeV2ZDrYcPq8fYSuHhWtold8OUseRLU_mXBOztprFH_L4Q63ZiDuQYOwtZ9GaEz2/exec';
let currentLanguage=localStorage.getItem('tamaouz_language')||'en';

const requestRequirements={
  'Research Paper':['Research question','Objectives','Methodology','Required academic level','Page count'],
  'Scientific Paper':['Research question','Study design','Population/sample','Methodology','Results/data availability','Journal requirements'],
  'Literature Review':['Review topic','Databases/sources','Publication date range','Number of studies','Review framework'],
  'Case Study':['Case title','Case background','Case objectives','Required analysis','Confidentiality requirements'],
  'Graduation Project':['Project title','Project objectives','Project stage','Supervisor instructions','Required deliverables'],
  'Research Proposal':['Proposed title','Research problem','Research question','Objectives','Methodology','Expected outcomes'],
  'Presentation':['Presentation title','Number of slides','Duration','Audience','Design preference','Speaker notes'],
  'Scientific Poster':['Poster title','Poster size','Conference requirements','Sections required','QR code requirement'],
  'Abstract':['Title','Word limit','Conference/journal requirements','Keywords'],
  'Other':['Description of requested work']
};

const translations={
  en:{
    'nav.home':'Home','nav.services':'Services','nav.how':'How It Works','nav.about':'About','nav.request':'Create New Request',
    'hero.eyebrow':'ACADEMIC SUPPORT • RESEARCH • PRESENTATION','hero.title':'Turn your idea into <span>academic excellence.</span>','hero.text':'One place to organize your research paper, scientific paper, literature review, proposal, presentation and academic project.','hero.start':'Start a Request','hero.how':'How it works','hero.trust1':'✓ Bilingual interface','hero.trust2':'✓ Guided step-by-step process','hero.trust3':'✓ Track your request','hero.card':'Tamaouz Request Center',
    'steps.type':'Choose request type','steps.info':'Student information','steps.details':'Project details',
    'services.eyebrow':'OUR SERVICES','services.title':'Choose what you need','services.text':'The request form adapts to your selected service, so you only see the fields that matter.',
    'service.research':'Research Paper','service.researchText':'Structured academic research with clear sections and references.','service.scientific':'Scientific Paper','service.scientificText':'Academic paper structure, methodology, results and discussion.','service.literature':'Literature Review','service.literatureText':'Organize, compare and synthesize relevant academic literature.','service.case':'Case Study','service.caseText':'Professional case-study structure tailored to your topic.','service.graduation':'Graduation Project','service.proposal':'Research Proposal','service.proposalText':'Turn your research idea into a clear proposal framework.','service.presentation':'Presentation','service.presentationText':'Transform your academic content into a focused presentation.','service.poster':'Scientific Poster','service.abstract':'Abstract','service.other':'Other',
    'how.eyebrow':'SIMPLE PROCESS','how.title':'How Tamaouz works','how.select':'Select','how.selectText':'Choose the type of academic request.','how.tell':'Tell us','how.tellText':'Enter your information in English and describe your requirements.','how.details':'Details','how.detailsText':'Provide your topic, deadline and academic requirements.','how.track':'Track','how.trackText':'Receive a request ID and follow your request status.',
    'request.eyebrow':'NEW REQUEST','request.title':'Tell us what you need','request.text':'Complete the form step by step. The interface supports Arabic and English; academic data fields are entered in English.',
    'form.typeTitle':'01 — Request Type','form.typeHelp':'What would you like to prepare?','form.infoTitle':'02 — Student Information','form.infoHelp':'Please enter academic information in English only.','form.detailsTitle':'03 — Request Details','form.detailsHelp':'Give us enough information to understand the academic requirements.',
    'fields.fullName':'Full Name','fields.title':'Academic / Job Title','fields.workplace':'University / Workplace','fields.department':'College / Department','fields.level':'Academic Level','fields.city':'City','fields.country':'Country','fields.email':'Email Address','fields.mobile':'Mobile Number','fields.projectTitle':'Research / Project Title','fields.pages':'Number of Pages','fields.references':'Number of References','fields.citation':'Referencing Style','fields.deadline':'Deadline','fields.topic':'Research Question / Topic','fields.instructions':'Special Instructions',
    'level.select':'Select level','buttons.continue':'Continue','buttons.back':'Back','buttons.submit':'Submit Request','success.title':'Request submitted','success.text':'Your request ID is','success.keep':'Keep this ID to track your request.','success.new':'Create Another Request','alert.type':'Please select a request type.','alert.english':'Please enter information in English only.','alert.submit':'Unable to submit the request. Please try again.','status.submitting':'Submitting...','dashboard.open':'Open Student Dashboard',
    'place.fullName':'Your full name','place.title':'e.g. Nursing Student','place.workplace':'University or workplace','place.department':'College or department','place.city':'e.g. Riyadh','place.email':'name@example.com','place.projectTitle':'Enter the title in English','place.topic':'Describe your topic, research question or main requirements','place.instructions':'Add any instructions from your instructor or university',
    'dynamic.for':'Requirements for','dynamic.enter':'Enter'
  },
  ar:{
    'nav.home':'الرئيسية','nav.services':'الخدمات','nav.how':'كيف نعمل','nav.about':'من نحن','nav.request':'إنشاء طلب جديد',
    'hero.eyebrow':'دعم أكاديمي • أبحاث • عروض تقديمية','hero.title':'حوّل فكرتك إلى <span>تميز أكاديمي.</span>','hero.text':'مكان واحد لتنظيم البحث العلمي، الأوراق العلمية، المراجعات الأدبية، المقترحات، العروض التقديمية والمشاريع الأكاديمية.','hero.start':'ابدأ طلبًا','hero.how':'كيف نعمل؟','hero.trust1':'✓ واجهة عربية وإنجليزية','hero.trust2':'✓ خطوات واضحة ومنظمة','hero.trust3':'✓ متابعة حالة الطلب','hero.card':'مركز طلبات تميّز',
    'steps.type':'اختر نوع الطلب','steps.info':'بيانات الطالب','steps.details':'تفاصيل المشروع',
    'services.eyebrow':'خدماتنا','services.title':'اختر ما تحتاجه','services.text':'يتكيف نموذج الطلب مع الخدمة التي تختارها، لتظهر لك الحقول المناسبة فقط.',
    'service.research':'بحث علمي','service.researchText':'بحث أكاديمي منظم بأقسام واضحة ومراجع علمية.','service.scientific':'ورقة علمية','service.scientificText':'هيكلة الورقة العلمية والمنهجية والنتائج والمناقشة.','service.literature':'مراجعة أدبية','service.literatureText':'تنظيم ومقارنة وتركيب الأدبيات العلمية ذات الصلة.','service.case':'دراسة حالة','service.caseText':'إعداد دراسة حالة بهيكل احترافي يناسب موضوعك.','service.graduation':'مشروع تخرج','service.proposal':'مقترح بحثي','service.proposalText':'تحويل فكرة البحث إلى إطار واضح لمقترح بحثي.','service.presentation':'عرض تقديمي','service.presentationText':'تحويل المحتوى الأكاديمي إلى عرض تقديمي مركز.','service.poster':'ملصق علمي','service.abstract':'ملخص علمي','service.other':'أخرى',
    'how.eyebrow':'خطوات بسيطة','how.title':'كيف تعمل منصة تميّز؟','how.select':'اختر','how.selectText':'اختر نوع الطلب الأكاديمي.','how.tell':'أخبرنا','how.tellText':'أدخل بياناتك باللغة الإنجليزية واشرح متطلباتك.','how.details':'التفاصيل','how.detailsText':'أدخل الموضوع والموعد النهائي والمتطلبات الأكاديمية.','how.track':'تابع','how.trackText':'احصل على رقم طلب وتابع حالة طلبك.',
    'request.eyebrow':'طلب جديد','request.title':'أخبرنا بما تحتاجه','request.text':'أكمل النموذج خطوة بخطوة. الواجهة تدعم العربية والإنجليزية، بينما تُدخل البيانات الأكاديمية باللغة الإنجليزية.',
    'form.typeTitle':'01 — نوع الطلب','form.typeHelp':'ماذا ترغب في إعداد؟','form.infoTitle':'02 — بيانات الطالب','form.infoHelp':'يرجى إدخال البيانات الأكاديمية باللغة الإنجليزية فقط.','form.detailsTitle':'03 — تفاصيل الطلب','form.detailsHelp':'أدخل معلومات كافية لفهم المتطلبات الأكاديمية.',
    'fields.fullName':'الاسم الكامل','fields.title':'المسمى الأكاديمي / الوظيفي','fields.workplace':'الجامعة / جهة العمل','fields.department':'الكلية / القسم','fields.level':'المستوى الأكاديمي','fields.city':'المدينة','fields.country':'الدولة','fields.email':'البريد الإلكتروني','fields.mobile':'رقم الجوال','fields.projectTitle':'عنوان البحث / المشروع','fields.pages':'عدد الصفحات','fields.references':'عدد المراجع','fields.citation':'نمط التوثيق','fields.deadline':'الموعد النهائي','fields.topic':'سؤال البحث / الموضوع','fields.instructions':'تعليمات خاصة',
    'level.select':'اختر المستوى','buttons.continue':'متابعة','buttons.back':'رجوع','buttons.submit':'إرسال الطلب','success.title':'تم إرسال الطلب','success.text':'رقم طلبك هو','success.keep':'احتفظ بهذا الرقم لمتابعة حالة طلبك.','success.new':'إنشاء طلب آخر','alert.type':'يرجى اختيار نوع الطلب.','alert.english':'يرجى إدخال البيانات باللغة الإنجليزية فقط.','alert.submit':'تعذر إرسال الطلب. يرجى المحاولة مرة أخرى.','status.submitting':'جارٍ الإرسال...','dashboard.open':'فتح لوحة الطالب',
    'place.fullName':'اكتب اسمك الكامل','place.title':'مثال: طالب تمريض','place.workplace':'الجامعة أو جهة العمل','place.department':'الكلية أو القسم','place.city':'مثال: الرياض','place.email':'name@example.com','place.projectTitle':'أدخل العنوان باللغة الإنجليزية','place.topic':'اشرح موضوعك أو سؤال البحث أو المتطلبات الأساسية','place.instructions':'أضف أي تعليمات من المشرف أو الجامعة',
    'dynamic.for':'متطلبات','dynamic.enter':'أدخل'
  }
};

function t(key){return translations[currentLanguage][key]||translations.en[key]||key;}

function applyLanguage(){
  document.documentElement.lang=currentLanguage;
  document.documentElement.dir=currentLanguage==='ar'?'rtl':'ltr';
  document.body.dir=document.documentElement.dir;
  document.querySelectorAll('[data-i18n]').forEach(el=>{el.innerHTML=t(el.dataset.i18n);});
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{el.placeholder=t(el.dataset.i18nPlaceholder);});
  const toggle=document.getElementById('languageToggle');
  if(toggle)toggle.textContent=currentLanguage==='ar'?'English':'العربية';
  updateStepLabel();
  renderDynamicRequirements();
  if(current===2)buildReview();
}

document.getElementById('languageToggle')?.addEventListener('click',()=>{
  currentLanguage=currentLanguage==='en'?'ar':'en';
  localStorage.setItem('tamaouz_language',currentLanguage);
  applyLanguage();
});

function updateStepLabel(){label.textContent=currentLanguage==='ar'?`الخطوة ${current+1} من ${panels.length}`:`Step ${current+1} of ${panels.length}`;}

function showStep(n){
  current=n;
  panels.forEach((p,i)=>p.classList.toggle('active',i===n));
  fill.style.width=((n+1)/panels.length*100)+'%';
  updateStepLabel();
  if(n===2)renderDynamicRequirements();
  if(n===2)buildReview();
  document.getElementById('request').scrollIntoView({behavior:'smooth',block:'start'});
}

function englishOnly(e){
  const value=e.target.value;
  if(/[\u0600-\u06FF]/.test(value)){
    e.target.setCustomValidity(t('alert.english'));
    e.target.reportValidity();
  } else e.target.setCustomValidity('');
}

document.querySelectorAll('input[type="text"],input[type="email"],input[type="tel"],textarea,.english').forEach(i=>i.addEventListener('input',englishOnly));

function validatePanel(){
  const fields=[...panels[current].querySelectorAll('input,select,textarea')];
  for(const el of fields){
    if(el.type==='radio')continue;
    if(!el.checkValidity()){el.reportValidity();return false;}
  }
  if(current===0&&!document.querySelector('input[name="requestType"]:checked')){alert(t('alert.type'));return false;}
  return true;
}

document.querySelectorAll('.next').forEach(b=>b.addEventListener('click',()=>{if(validatePanel()&&current<panels.length-1)showStep(current+1);}));
document.querySelectorAll('.back').forEach(b=>b.addEventListener('click',()=>{if(current>0)showStep(current-1);}));
document.querySelectorAll('input[name="requestType"]').forEach(r=>r.addEventListener('change',renderDynamicRequirements));
document.querySelectorAll('.service-card').forEach(card=>card.addEventListener('click',()=>{const radio=[...document.querySelectorAll('input[name="requestType"]')].find(r=>r.value===card.dataset.type);if(radio){radio.checked=true;showStep(1);}}));

function renderDynamicRequirements(){
  const container=document.getElementById('dynamicRequirements');
  if(!container)return;
  const type=document.querySelector('input[name="requestType"]:checked')?.value||'';
  const items=requestRequirements[type]||[];
  if(!type){container.innerHTML='';return;}
  container.innerHTML=`<div class="dynamic-title">${escapeHtml(t('dynamic.for'))}: ${escapeHtml(type)}</div>`+
    items.map((item,i)=>`<label>${escapeHtml(item)}<${['Number of slides','Duration','Page count','Number of studies','Word limit'].includes(item)?'input':'textarea'} class="dynamic-input english" name="dynamic_${i}" ${['Number of slides','Duration','Page count','Number of studies','Word limit'].includes(item)?'':'rows="2"'} placeholder="${escapeHtml(t('dynamic.enter'))} ${escapeHtml(item.toLowerCase())}"></${['Number of slides','Duration','Page count','Number of studies','Word limit'].includes(item)?'input':'textarea'}></label>`).join('');
  container.querySelectorAll('input,textarea').forEach(i=>i.addEventListener('input',englishOnly));
}

function buildReview(){
  const data=new FormData(form);
  const rows=[['Request Type',data.get('requestType')||'—'],['Full Name',data.get('fullName')||'—'],['University / Workplace',data.get('workplace')||'—'],['Project Title',data.get('projectTitle')||'—'],['Deadline',data.get('deadline')||'—']];
  const labelsAr={'Request Type':'نوع الطلب','Full Name':'الاسم الكامل','University / Workplace':'الجامعة / جهة العمل','Project Title':'عنوان المشروع','Deadline':'الموعد النهائي'};
  review.innerHTML=rows.map(([k,v])=>`<div><b>${currentLanguage==='ar'?labelsAr[k]:k}</b><span>${escapeHtml(v)}</span></div>`).join('');
}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function loadRequests(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]')}catch{return[]}}
function saveRequest(request){const items=loadRequests();items.unshift(request);localStorage.setItem(STORAGE_KEY,JSON.stringify(items));}
function generateRequestId(){return 'TM-'+new Date().getFullYear()+'-'+String(Math.floor(10000+Math.random()*90000));}

function submitThroughForm(payload){
  return new Promise((resolve,reject)=>{
    const iframe=document.createElement('iframe');
    iframe.name='tamaouz-submit-frame-'+Date.now();
    iframe.style.display='none';
    document.body.appendChild(iframe);
    const postForm=document.createElement('form');
    postForm.method='POST';postForm.action=API_URL;postForm.target=iframe.name;postForm.style.display='none';
    const field=document.createElement('textarea');field.name='payload';field.value=JSON.stringify(payload);postForm.appendChild(field);document.body.appendChild(postForm);
    let finished=false;
    const cleanup=()=>{setTimeout(()=>{postForm.remove();iframe.remove();},1500);};
    iframe.onload=()=>{if(finished)return;finished=true;cleanup();resolve(true);};
    iframe.onerror=()=>{if(finished)return;finished=true;cleanup();reject(new Error(t('alert.submit')));};
    try{postForm.submit();}catch(err){finished=true;cleanup();reject(err);return;}
    setTimeout(()=>{if(finished)return;finished=true;cleanup();resolve(true);},10000);
  });
}

form.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!validatePanel())return;
  const submitButton=form.querySelector('button[type="submit"]');
  const originalText=submitButton?.textContent||t('buttons.submit');
  if(submitButton){submitButton.disabled=true;submitButton.textContent=t('status.submitting');}
  try{
    const data=new FormData(form);
    const dynamicRequirements={};
    [...form.querySelectorAll('.dynamic-input')].forEach(input=>{dynamicRequirements[input.name]=input.value||'';});
    const id=generateRequestId();
    const payload={action:'submitRequest',requestId:id,requestType:data.get('requestType')||'',fullName:data.get('fullName')||'',title:data.get('title')||'',workplace:data.get('workplace')||'',department:data.get('department')||'',level:data.get('level')||'',city:data.get('city')||'',country:data.get('country')||'',email:data.get('email')||'',mobile:data.get('mobile')||'',projectTitle:data.get('projectTitle')||'',pages:data.get('pages')||'',references:data.get('references')||'',citation:data.get('citation')||'',deadline:data.get('deadline')||'',topic:data.get('topic')||'',instructions:data.get('instructions')||'',dynamicRequirements,files:[]};
    await submitThroughForm(payload);
    const request={...payload,status:'Submitted',createdAt:new Date().toLocaleString('en-GB')};
    delete request.action;delete request.files;delete request.dynamicRequirements;
    saveRequest(request);
    document.getElementById('requestId').textContent=id;
    form.hidden=true;
    document.querySelector('.request-intro').hidden=true;
    document.getElementById('success').hidden=false;
    const success=document.getElementById('success');
    const btn=document.createElement('a');btn.className='btn btn-ghost';btn.href='dashboard.html';btn.textContent=t('dashboard.open');success.appendChild(btn);
    window.scrollTo({top:document.getElementById('request').offsetTop-80,behavior:'smooth'});
  }catch(err){alert(err.message||t('alert.submit'));}
  finally{if(submitButton){submitButton.disabled=false;submitButton.textContent=originalText;}}
});

applyLanguage();
showStep(0);