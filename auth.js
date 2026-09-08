const cfg=window.TAMAOUZ_SUPABASE;
const message=document.getElementById('message');
if(!cfg||cfg.url.includes('YOUR-PROJECT')||cfg.publishableKey.includes('YOUR-')){
  message.textContent='Supabase is not configured yet. Add supabase/config.js from the example file.';
  message.className='muted';
}
const client=(cfg&&!cfg.url.includes('YOUR-PROJECT')&&!cfg.publishableKey.includes('YOUR-'))?supabase.createClient(cfg.url,cfg.publishableKey):null;
const form=document.getElementById('loginForm');
form?.addEventListener('submit',async e=>{e.preventDefault();if(!client)return;message.textContent='Signing in...';const {data,error}=await client.auth.signInWithPassword({email:document.getElementById('email').value.trim(),password:document.getElementById('password').value});if(error){message.textContent=error.message;return}const role=data.user?.app_metadata?.role==='admin'?'admin':'student';location.href=role==='admin'?'admin.html':'dashboard.html';});
document.getElementById('signup')?.addEventListener('click',async e=>{e.preventDefault();if(!client)return;const email=document.getElementById('email').value.trim();const password=document.getElementById('password').value;if(!email||password.length<6){message.textContent='Enter an email and a password of at least 6 characters.';return}message.textContent='Creating account...';const {error}=await client.auth.signUp({email,password});message.textContent=error?error.message:'Account created. Check your email to confirm your account, then sign in.';});