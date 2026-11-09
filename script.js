const $=id=>document.getElementById(id);let selection={};let noCount=0;
function show(id){document.querySelectorAll('.page').forEach(el=>el.classList.toggle('active',el.id===id));window.scrollTo({top:0,behavior:'smooth'});}
$('open').onclick=()=>{$('open').classList.add('open');setTimeout(()=>show('letter'),800)};
$('yes').onclick=()=>show('details');
$('no').onclick=()=>{noCount++;const s=Math.max(.7,1-noCount*.08);$('no').style.transform=`scale(${s})`;if(noCount>=4){$('no-msg').textContent='Если не хочешь встречаться, это нормально 💗';$('no').textContent='Не хочу встречаться';$('no').onclick=()=>show('declined');}else $('no-msg').textContent='Ты можешь выбрать любой ответ ♡';};
$('return').onclick=()=>show('letter');
const dateInput=$('date');const today=new Date();const next=new Date(today);next.setDate(today.getDate()+(3-today.getDay()+7)%7);function localISO(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}dateInput.value=localISO(next);dateInput.min=localISO(today);
function renderSummary(){const date=new Date(selection.date+'T12:00:00');const formatted=new Intl.DateTimeFormat('ru-RU',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(date);return `<div>📅 ${formatted}</div><div>🕔 ${selection.time}</div><div>📍 ${escapeHtml(selection.place)}</div>`;}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
$('meeting-form').onsubmit=e=>{e.preventDefault();if(!e.target.reportValidity())return;const date=dateInput.value;const d=new Date(date+'T12:00:00');if(d.getDay()!==3){dateInput.setCustomValidity('Пожалуйста, выбери среду.');dateInput.reportValidity();return;}dateInput.setCustomValidity('');selection={date,time:$('time').value,place:$('place').value.trim(),accepted:true};$('summary').innerHTML=renderSummary();show('confirm');};
dateInput.addEventListener('change',()=>dateInput.setCustomValidity(''));
$('back').onclick=()=>show('details');
$('send').onclick=async()=>{const btn=$('send');btn.disabled=true;btn.textContent='Отправляем…';$('error').textContent='';try{const res=await fetch('/api/meeting',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(selection)});const result=await res.json();if(!res.ok)throw Error(result.error||'Ошибка отправки');$('final-summary').innerHTML=renderSummary();show('done');}catch(err){$('error').textContent=err.message;}finally{btn.disabled=false;btn.textContent='Подтвердить и отправить 💌';}};
