const $=id=>document.getElementById(id);const toast=m=>{const t=$('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)};
const profile=JSON.parse(localStorage.getItem('orbit-user-profile')||'{}');
const fav=JSON.parse(localStorage.getItem('btech-favorites')||'[]');
$('userName').textContent=profile.name||'ORBITECH-TV WORLD USER';$('userEmail').textContent=profile.email||'user@orbitech.local';$('nameInput').value=profile.name||'';$('emailInput').value=profile.email||'';$('favorites').textContent=fav.length;
const pkg=localStorage.getItem('orbit-user-package')||'5-MIN DEMO';$('plan').textContent=pkg==='5-MIN DEMO'?pkg:Number(pkg).toLocaleString()+' CHANNELS';$('expiry').textContent=pkg==='5-MIN DEMO'?'Demo access':'30-day package';
$('save').onclick=()=>{const p={name:$('nameInput').value.trim()||'ORBITECH-TV WORLD USER',email:$('emailInput').value.trim()||'user@orbitech.local'};localStorage.setItem('orbit-user-profile',JSON.stringify(p));$('userName').textContent=p.name;$('userEmail').textContent=p.email;toast('Profile saved')};
document.querySelectorAll('[data-package]').forEach(b=>b.onclick=()=>{localStorage.setItem('orbit-user-package',b.dataset.package);$('plan').textContent=Number(b.dataset.package).toLocaleString()+' CHANNELS';$('expiry').textContent='30-day package';$('status').textContent='PACKAGE SELECTED';toast(`${Number(b.dataset.package).toLocaleString()} channel package selected`)});
$('logout').onclick=()=>{localStorage.removeItem('orbit-user-session');location.href='index.html'};
