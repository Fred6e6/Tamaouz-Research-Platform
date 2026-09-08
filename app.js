const form=document.getElementById('requestForm');
const panels=[...document.querySelectorAll('.step-panel')];
const fill=document.querySelector('.progress-fill');
const label=document.getElementById('stepLabel');
const review=document.getElementById('review');
let current=0;

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

function showStep(n){
  current=n;
  panels.forEach((p,i)=>p.classList.toggle('active',i===n));
  fill.style.width=((n+1)/panels.length*100)+'%';
  label.textContent=`Step ${n+1} of ${panels.length}`;
  if(n===2) renderDynamicRequirements();
  if(n===3) buildReview();
  document.getElementById('request').scrollIntoView({behavior:'smooth',block:'start'});
}

function englishOnly(e){
  const value=e.target.value;
  if(/[\u0600-\u06FF]/.test(value)){
    e.target.setCustomValidity('Please enter information in English only.');
    e.target.reportValidity();
  } else e.target.setCustomValidity('');
}
document.querySelectorAll('.english').forEach(i=>i.addEventListener('input',englishOnly));

function validatePanel(){
  const fields=[...panels[current].querySelectorAll('input,select,textarea')];
  for(const el of fields){
    if(el.type==='radio'||el.type==='file') continue;
    if(!el.checkValidity()){el.reportValidity();return false;}
  }
  if(current===0&&!document.querySelector('input[name="requestType"]:checked')){
    alert('Please select a request type.');return false;
  }
  return true;
}

document.querySelectorAll('.next').forEach(b=>b.addEventListener('click',()=>{
  if(validatePanel()&&current<panels.length-1)showStep(current+1);
}));
document.querySelectorAll('.back').forEach(b=>b.addEventListener('click',()=>{if(current>0)showStep(current-1);}));

document.querySelectorAll('input[name="requestType"]').forEach(r=>r.addEventListener('change',renderDynamicRequirements));

document.querySelectorAll('.service-card').forEach(card=>card.addEventListener('click',()=>{
  const radio=[...document.querySelectorAll('input[name="requestType"]')].find(r=>r.value===card.dataset.type);
  if(radio){radio.checked=true;showStep(1);}
}));

function renderDynamicRequirements(){
  const container=document.getElementById('dynamicRequirements');
  if(!container)return;
  const type=document.querySelector('input[name="requestType"]:checked')?.value||'';
  const items=requestRequirements[type]||[];
  container.innerHTML=`<div class="dynamic-title">Requirements for ${escapeHtml(type)}</div>`+
    items.map((item,i)=>`<label>${escapeHtml(item)}${item==='Number of slides'||item==='Duration'||item==='Page count'||item==='Number of studies'||item==='Word limit'?`<input class="dynamic-input" name="dynamic_${i}" placeholder="Enter ${escapeHtml(item).toLowerCase()}">`:`<textarea class="dynamic-input english" name="dynamic_${i}" rows="2" placeholder="Enter ${escapeHtml(item).toLowerCase()}"></textarea>`}</label>`).join('');
  container.querySelectorAll('.english').forEach(i=>i.addEventListener('input',englishOnly));
}

function buildReview(){
  const data=new FormData(form);
  const type=data.get('requestType')||'—';
  review.innerHTML=`<div><b>Request Type</b><span>${escapeHtml(type)}</span></div><div><b>Full Name</b><span>${escapeHtml(data.get('fullName')||'—')}</span></div><div><b>University / Workplace</b><span>${escapeHtml(data.get('workplace')||'—')}</span></div><div><b>Project Title</b><span>${escapeHtml(data.get('projectTitle')||'—')}</span></div><div><b>Deadline</b><span>${escapeHtml(data.get('deadline')||'—')}</span></div>`;
}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

form.addEventListener('submit',e=>{
  e.preventDefault();
  if(!validatePanel())return;
  const id='TM-'+new Date().getFullYear()+'-'+String(Math.floor(10000+Math.random()*90000));
  document.getElementById('requestId').textContent=id;
  form.hidden=true;
  document.querySelector('.request-intro').hidden=true;
  document.getElementById('success').hidden=false;
  window.scrollTo({top:document.getElementById('request').offsetTop-80,behavior:'smooth'});
});

document.getElementById('files').addEventListener('change',e=>{
  const box=e.target.closest('.upload');
  const files=[...e.target.files];
  box.querySelector('p').textContent=files.length?files.map(f=>f.name).join(', '):'Templates, instructions, previous work or other relevant files.';
});

showStep(0);