/* ==========================================================================
   Vision & Engineering Hub  —  Goal → Milestone → Task Sheet → Session Sheet
   ========================================================================== */

/* ============================ Helpers ============================ */
function esc(s){
  return String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function loadJSON(key, fallback){
  try { const v = JSON.parse(localStorage.getItem(key)); return (v===null||v===undefined)?fallback:v; }
  catch(e){ return fallback; }
}
function persist(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function formatDateKey(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function keyToDate(k){ const p=k.split('-'); return new Date(+p[0], +p[1]-1, +p[2]); }
function mondayOf(d){ const x=new Date(d.getFullYear(),d.getMonth(),d.getDate()); x.setDate(x.getDate()-((x.getDay()+6)%7)); return x; }
function wkStartFor(v){ if(v==='Later') return ''; const d=mondayOf(new Date()); if(v==='Next Week') d.setDate(d.getDate()+7); return formatDateKey(d); }
function weekLabel(w){
  if(!w.weekStart) return 'Later';
  const diff = Math.round((keyToDate(w.weekStart)-mondayOf(new Date()))/6048e5);
  return diff<0?'Earlier':diff===0?'This Week':diff===1?'Next Week':'Later';
}
function pct(done,total){ return total>0 ? Math.round(done/total*100) : 0; }

/* ============================ Tabs ============================ */
function showTab(name){
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-'+name));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  window.scrollTo(0,0);
}

/* ============================ Data ============================ */
const WEEKS = ["This Week", "Next Week", "Later"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const defaultData = {
  goals: [
    { text: "Build open-weights 70B sovereign agent stack", tag: "6M", done: false },
    { text: "Deploy sub-20ms decentralized inference network", tag: "1Y", done: false },
    { text: "Architect fully autonomous self-replicating code lab", tag: "3Y", done: false }
  ],
  milestones: [
    { id: "m1", month: "Oct", text: "Ship speculative decoding engine v1.0",
      tasks: [
        { text: "Draft-token model training", done: true },
        { text: "Kernel-level batched verification", done: false },
        { text: "Latency benchmark vs baseline", done: false }
      ] },
    { id: "m2", month: "Nov", text: "Publish distributed continuous batching paper",
      tasks: [
        { text: "Draft paper sections 1-3", done: false },
        { text: "Run ablation studies", done: false }
      ] },
    { id: "m3", month: "Dec", text: "Scale microVM sandbox to 500 sessions",
      tasks: [
        { text: "gVisor runtime hardening", done: false },
        { text: "Autoscaler for 500 concurrent sessions", done: false }
      ] }
  ],
  weekly: [
    { text: "Ship speculative decoding engine v1.0", week: "This Week", weekStart: wkStartFor("This Week"), milestone: "Oct", day: "Wed", done: false },
    { text: "Scale microVM sandbox to 500 concurrent sessions", week: "Next Week", weekStart: wkStartFor("Next Week"), milestone: "Dec", day: "", done: false },
    { text: "Publish paper on distributed continuous batching", week: "Later", weekStart: "", milestone: "Nov", day: "", done: false }
  ]
};

/* One-time migration from the old single-file version (matrix_data_v3 + works). */
(function migrate(){
  try{
    if(localStorage.getItem('matrix_data_v4')) return;
    const old = loadJSON('matrix_data_v3', null);
    if(!old) return;
    const nw = {
      goals: old.goals || [],
      milestones: (old.milestones || []).map(x => ({
        id: 'm'+Math.random().toString(36).slice(2), month: x.month, text: x.text, tasks: []
      })),
      weekly: old.weekly || []
    };
    (old.works || []).forEach(w => {
      const tag = (w.tag || '').toUpperCase();
      let target = nw.milestones.find(x => (x.month||'').toUpperCase() === tag);
      if(!target){
        target = { id:'m'+Math.random().toString(36).slice(2), month: w.tag || '—', text: w.title, tasks: [] };
        nw.milestones.push(target);
      }
      (w.tasks || []).forEach(t => target.tasks.push({ text: t.text, done: !!t.done }));
    });
    persist('matrix_data_v4', nw);

    const sess = {};
    const todayKey = formatDateKey(new Date());
    if((old.daily || []).length) sess[todayKey] = old.daily.map(d => ({ text: d.text, done: !!d.done }));
    const ct = loadJSON('calendar_tasks', {});
    Object.keys(ct).forEach(k => { if(!sess[k]) sess[k]=[]; ct[k].forEach(t => sess[k].push({ text:t.text, done:!!t.done })); });
    if(Object.keys(sess).length) persist('sessions_v1', sess);
  }catch(e){ /* ignore — start fresh if migration fails */ }
})();

let data = loadJSON('matrix_data_v4', defaultData);
if(!Array.isArray(data.goals)) data.goals = [];
if(!Array.isArray(data.milestones)) data.milestones = [];
if(!Array.isArray(data.weekly)) data.weekly = [];
data.milestones.forEach(m => {
  if(!Array.isArray(m.tasks)) m.tasks = [];
  if(!m.id) m.id = 'm'+Math.random().toString(36).slice(2);
});

let sessions = loadJSON('sessions_v1', {});
if(typeof sessions !== 'object' || sessions === null) sessions = {};

/* Seed today's session the first time so the board isn't empty. */
(function seedToday(){
  const tk = formatDateKey(new Date());
  if(sessions[tk] === undefined){
    sessions[tk] = [
      { text: "Review multi-node NCCL latency profiling traces", done: true },
      { text: "Refactor paged KV cache allocator", done: false },
      { text: "Standup notes + plan tomorrow", done: false }
    ];
    persist('sessions_v1', sessions);
  }
})();

function saveData(){ persist('matrix_data_v4', data); renderAll(); }
function saveSessions(){ persist('sessions_v1', sessions); renderAll(); }

/* ============================ Task Sheet (weekly) ============================ */
function renderWeekly(){
  const el = document.getElementById('weekly-list'); if(!el) return; el.innerHTML='';
  const items = data.weekly; let done = 0;
  WEEKS.forEach(wk => {
    const group = items.filter(i => weekLabel(i) === wk);
    if(!group.length) return;
    const g = document.createElement('div'); g.className='week-group';
    const gd = group.filter(i => i.done).length;
    const head = document.createElement('div'); head.className='week-head';
    head.innerHTML = '<span>'+esc(wk.toUpperCase())+'</span><span>'+gd+'/'+group.length+'</span>';
    g.appendChild(head);
    group.forEach(it => {
      const idx = items.indexOf(it); if(it.done) done++;
      const row = document.createElement('div'); row.className='matrix-item '+(it.done?'done':'');
      let tags='';
      if(it.milestone) tags += '<span class="tag-ms">'+esc(it.milestone)+'</span>';
      if(it.day) tags += '<span class="tag-day">'+esc(it.day)+'</span>';
      row.innerHTML =
        '<div class="m-checkbox" onclick="toggleWeekly('+idx+')">'+(it.done?'\u2713':'')+'</div>'+
        '<div class="m-item-text">'+esc(it.text)+'</div>'+
        '<div class="wk-tags">'+tags+'</div>'+
        '<button class="m-del" onclick="deleteWeekly('+idx+')">\u2715</button>';
      g.appendChild(row);
    });
    el.appendChild(g);
  });
  if(!items.length) el.innerHTML = '<div class="empty-note">No tasks yet. Add one above, or push a milestone task over with &rarr; Week.</div>';
  setProgress('weekly', done, items.length);
}
function addWeekly(){
  const inp = document.getElementById('weekly-input'); const text = inp.value.trim(); if(!text) return;
  const week = document.getElementById('weekly-week').value;
  data.weekly.push({
    text: text, week: week, weekStart: wkStartFor(week),
    milestone: document.getElementById('weekly-milestone').value,
    day: document.getElementById('weekly-day').value, done: false
  });
  inp.value=''; saveData();
}
function toggleWeekly(i){ if(data.weekly[i]){ data.weekly[i].done = !data.weekly[i].done; saveData(); } }
function deleteWeekly(i){ data.weekly.splice(i,1); saveData(); }
function renderWeeklyOptions(){
  const sel = document.getElementById('weekly-milestone'); if(!sel) return;
  const cur = sel.value;
  let opts = '<option value="">\u2014 milestone \u2014</option>';
  data.milestones.forEach(m => { opts += '<option value="'+esc(m.month)+'">'+esc(m.month)+'</option>'; });
  sel.innerHTML = opts;
  if(cur) sel.value = cur;
}

/* ============================ Goals ============================ */
function renderGoals(){
  const el = document.getElementById('goals-list'); if(!el) return; el.innerHTML='';
  const items = data.goals; let done = 0;
  items.forEach((it, idx) => {
    if(it.done) done++;
    const row = document.createElement('div'); row.className='matrix-item '+(it.done?'done':'');
    row.innerHTML =
      '<div class="m-checkbox" onclick="toggleGoal('+idx+')">'+(it.done?'\u2713':'')+'</div>'+
      '<div class="m-item-text">'+esc(it.text)+'</div>'+
      '<div class="m-tag">'+esc(it.tag)+'</div>'+
      '<button class="m-del" onclick="deleteGoal('+idx+')">\u2715</button>';
    el.appendChild(row);
  });
  if(!items.length) el.innerHTML = '<div class="empty-note">No goals yet. Add one above.</div>';
  setProgress('goals', done, items.length);
}
function addGoal(){
  const inp = document.getElementById('goals-input'); const text = inp.value.trim(); if(!text) return;
  data.goals.push({ text: text, tag: document.getElementById('goals-tag').value, done: false });
  inp.value=''; saveData();
}
function toggleGoal(i){ if(data.goals[i]){ data.goals[i].done = !data.goals[i].done; saveData(); } }
function deleteGoal(i){ data.goals.splice(i,1); saveData(); }

/* ============================ Milestones (each with its own tasks) ============================ */
function renderMilestones(){
  const el = document.getElementById('milestones-list'); if(!el) return; el.innerHTML='';
  data.milestones.forEach((m, mi) => {
    const block = document.createElement('div'); block.className='ms-block';
    const d = m.tasks.filter(t => t.done).length;
    block.innerHTML =
      '<div class="ms-block-top">'+
        '<input class="ms-month" value="'+esc(m.month)+'" placeholder="Month">'+
        '<input class="ms-text" value="'+esc(m.text)+'" placeholder="Milestone...">'+
        '<button class="work-del" title="Delete milestone">\u2715</button>'+
      '</div>'+
      '<div class="work-meta">'+d+'/'+m.tasks.length+' tasks done &middot; '+pct(d, m.tasks.length)+'%</div>'+
      '<div class="work-tasks"></div>'+
      '<div class="work-add"><input placeholder="Add task to this milestone..."><button>+</button></div>';
    el.appendChild(block);

    const mi1 = block.querySelector('.ms-month');
    const mt1 = block.querySelector('.ms-text');
    mi1.onchange = () => { m.month = mi1.value.trim() || m.month; saveData(); renderWeeklyOptions(); };
    mt1.onchange = () => { m.text = mt1.value; saveData(); };
    block.querySelector('.work-del').onclick = () => { data.milestones.splice(mi,1); saveData(); };

    const tl = block.querySelector('.work-tasks');
    m.tasks.forEach((t, ti) => {
      const r = document.createElement('div'); r.className='work-task'+(t.done?' done':'');
      r.innerHTML =
        '<div class="wt-check">'+(t.done?'\u2713':'')+'</div>'+
        '<div class="wt-text">'+esc(t.text)+'</div>'+
        '<button class="wt-week-btn" title="Push to Task Sheet">\u2192 Week</button>'+
        '<button class="wt-del">\u2715</button>';
      r.querySelector('.wt-check').onclick = () => { t.done = !t.done; saveData(); };
      r.querySelector('.wt-week-btn').onclick = () => pushToWeekly(mi, ti);
      r.querySelector('.wt-del').onclick = () => { m.tasks.splice(ti,1); saveData(); };
      tl.appendChild(r);
    });

    const inp = block.querySelector('.work-add input');
    const btn = block.querySelector('.work-add button');
    inp.addEventListener('keydown', e => { if(e.key==='Enter') addMilestoneTask(mi); });
    btn.addEventListener('click', () => addMilestoneTask(mi));
  });
  if(!data.milestones.length) el.innerHTML = '<div class="empty-note">No milestones yet. Add one above.</div>';
  renderWeeklyOptions();
}
function addMilestone(){
  const mo = document.getElementById('ms-month').value.trim();
  const tx = document.getElementById('ms-text').value.trim();
  if(!mo && !tx) return;
  data.milestones.push({ id:'m'+Date.now(), month:(mo||'\u2014').toUpperCase(), text:tx, tasks:[] });
  document.getElementById('ms-month').value=''; document.getElementById('ms-text').value='';
  saveData();
}
function addMilestoneTask(mi){
  const block = document.querySelectorAll('.ms-block')[mi]; if(!block) return;
  const inp = block.querySelector('.work-add input'); const text = inp.value.trim(); if(!text) return;
  data.milestones[mi].tasks.push({ text:text, done:false });
  inp.value=''; saveData();
}
function pushToWeekly(mi, ti){
  const t = data.milestones[mi].tasks[ti]; if(!t) return;
  const sel = document.getElementById('weekly-week');
  const week = sel ? sel.value : 'This Week';
  data.weekly.push({ text:t.text, week:week, weekStart:wkStartFor(week), milestone:data.milestones[mi].month, day:'', done:false });
  saveData();
}

/* ============================ Session Sheet (nightly) ============================ */
let sessionDay = 'today';
function sessionDateKey(){
  const d = new Date();
  if(sessionDay === 'tomorrow') d.setDate(d.getDate()+1);
  return formatDateKey(d);
}
function setSessionDay(day){
  sessionDay = day;
  document.querySelectorAll('#session-seg .seg-btn').forEach(b => b.classList.toggle('active', b.dataset.day === day));
  renderSession();
}
function renderSession(){
  const key = sessionDateKey();
  const items = sessions[key] || [];
  const el = document.getElementById('session-list'); if(!el) return; el.innerHTML='';
  let done = 0;
  items.forEach((it, idx) => {
    if(it.done) done++;
    const row = document.createElement('div'); row.className='glass milestone'+(it.done?' done':'');
    row.innerHTML =
      '<div class="check">'+(it.done?'\u2713':'')+'</div>'+
      '<div><div class="m-title">'+esc(it.text)+'</div>'+
      '<div class="m-meta">'+(sessionDay==='today'?'Today':'Tomorrow')+' &middot; '+esc(key)+'</div></div>'+
      '<div class="ms-actions"><span class="badge">'+(it.done?'COMPLETED':'PENDING')+'</span>'+
      '<button class="m-del">\u2715</button></div>';
    row.querySelector('.check').onclick = () => { it.done = !it.done; saveSessions(); };
    row.querySelector('.m-del').onclick = () => { items.splice(idx,1); saveSessions(); };
    el.appendChild(row);
  });
  if(!items.length){
    el.innerHTML = '<div class="glass milestone"><div class="check"></div><div>'+
      '<div class="m-title" style="color:var(--muted)">'+(sessionDay==='today'?'Nothing planned for today':'Nothing planned for tomorrow yet')+'</div>'+
      '<div class="m-meta">'+(sessionDay==='today'?'Tick off what you did, then plan tomorrow below.':'Tonight, decide what tomorrow looks like.')+'</div>'+
      '</div><span class="badge">EMPTY</span></div>';
  }
  const p = pct(done, items.length);
  document.getElementById('session-ring-val').innerText = p+'%';
  document.getElementById('session-ring-label').innerText = sessionDay==='today' ? 'TODAY COMPLETE' : 'TOMORROW PLANNED';
  document.documentElement.style.setProperty('--progress', p+'%');
  const head = document.getElementById('session-head');
  if(head){
    head.innerText = (sessionDay==='today'?'TODAY':'TOMORROW')+' \u2014 '+
      keyToDate(key).toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short'}).toUpperCase();
  }
}
function addSession(){
  const inp = document.getElementById('session-input'); const text = inp.value.trim(); if(!text) return;
  const key = sessionDateKey();
  (sessions[key] = sessions[key] || []).push({ text:text, done:false });
  inp.value=''; saveSessions();
}

/* ============================ Daily Success Tracker (Calendar) ============================ */
let currentDate = new Date();
let selectedDateKey = formatDateKey(new Date());

function sessionPctFor(key){
  const a = sessions[key] || [];
  return a.length ? pct(a.filter(x => x.done).length, a.length) : null;
}
function renderCalendar(){
  const y = currentDate.getFullYear(), mo = currentDate.getMonth();
  const title = document.getElementById('calendar-title'); if(title) title.innerText = MONTH_NAMES[mo]+' '+y;
  const first = new Date(y,mo,1).getDay();
  const dim = new Date(y,mo+1,0).getDate();
  const prev = new Date(y,mo,0).getDate();
  const c = document.getElementById('calendar-days'); if(!c) return; c.innerHTML='';
  const tk = formatDateKey(new Date());

  for(let i=first-1;i>=0;i--){
    const e = document.createElement('div'); e.className='day muted';
    e.innerHTML = '<span class="day-num">'+(prev-i)+'</span>';
    c.appendChild(e);
  }
  for(let i=1;i<=dim;i++){
    const key = y+'-'+String(mo+1).padStart(2,'0')+'-'+String(i).padStart(2,'0');
    const e = document.createElement('div');
    e.className = 'day'+(key===tk?' today':'')+(key===selectedDateKey?' selected':'');
    const a = sessions[key] || [];
    const tot = a.length, dn = a.filter(x => x.done).length;
    const p = tot ? pct(dn, tot) : null;
    let h = '<span class="day-num">'+i+'</span>';
    if(p !== null){
      h += '<span class="day-pct">'+p+'%</span><span class="bar"><i style="width:'+p+'%"></i></span>';
      e.style.boxShadow = 'inset 0 0 0 999px rgba(255,122,0,'+(p/100*.26).toFixed(2)+')';
      h += '<span class="day-count">'+dn+'/'+tot+'</span>';
    }
    e.innerHTML = h;
    e.onclick = () => selectDate(key);
    c.appendChild(e);
  }
}
function selectDate(key){
  selectedDateKey = key;
  const lbl = document.getElementById('selected-date-label');
  if(lbl){
    lbl.innerText = keyToDate(key)
      .toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short',year:'numeric'})
      .toUpperCase();
  }
  renderCalendar(); renderTasks();
}
function prevMonth(){ currentDate.setMonth(currentDate.getMonth()-1); renderCalendar(); }
function nextMonth(){ currentDate.setMonth(currentDate.getMonth()+1); renderCalendar(); }
function goToday(){ currentDate = new Date(); selectDate(formatDateKey(new Date())); }

function renderTasks(){
  const container = document.getElementById('tasks-container'); if(!container) return; container.innerHTML='';
  const tasks = sessions[selectedDateKey] || [];
  tasks.forEach((t, index) => {
    const item = document.createElement('div');
    item.className = 'focus-task'+(t.done?' done':'');
    item.innerHTML =
      '<div class="task-check">'+(t.done?'\u2713':'')+'</div>'+
      '<div class="task-text">'+esc(t.text)+'</div>'+
      '<button class="delete-task">\u2715</button>';
    item.querySelector('.task-check').onclick = () => toggleTask(index);
    item.querySelector('.delete-task').onclick = () => deleteTask(index);
    container.appendChild(item);
  });
  if(!tasks.length) container.innerHTML = '<div class="empty-note">No session items for this day.</div>';
}
function addTask(){
  const input = document.getElementById('task-input'); const val = input.value.trim(); if(!val) return;
  (sessions[selectedDateKey] = sessions[selectedDateKey] || []).push({ text:val, done:false });
  persist('sessions_v1', sessions);
  input.value=''; renderAll();
}
function toggleTask(index){
  const arr = sessions[selectedDateKey];
  if(arr && arr[index]){ arr[index].done = !arr[index].done; persist('sessions_v1', sessions); renderAll(); }
}
function deleteTask(index){
  const arr = sessions[selectedDateKey];
  if(arr){ arr.splice(index,1); persist('sessions_v1', sessions); renderAll(); }
}

/* ============================ Progress + stats ============================ */
function setProgress(type, done, total){
  const p = pct(done, total);
  const t = document.getElementById(type+'-progress-text');
  const b = document.getElementById(type+'-progress-bar');
  if(t) t.innerText = p+'% ('+done+'/'+total+')';
  if(b) b.style.width = p+'%';
}
function setBar(id, p, cnt){
  const t = document.getElementById(id+'-text');
  const b = document.getElementById(id+'-bar');
  if(t) t.innerText = p+'% ('+cnt+')';
  if(b) b.style.width = p+'%';
}
function milestoneTotals(){
  let done=0, total=0;
  data.milestones.forEach(m => { total += m.tasks.length; done += m.tasks.filter(t => t.done).length; });
  return { done, total };
}
function thisWeekTasks(){
  return data.weekly.filter(w => weekLabel(w) === 'This Week');
}
function renderTrackerBars(){
  const tk = formatDateKey(new Date());
  const a = sessions[tk] || [];
  const sd = a.filter(x => x.done).length;
  setBar('ts-session', pct(sd, a.length), sd+'/'+a.length);

  const wk = thisWeekTasks(), wd = wk.filter(w => w.done).length;
  setBar('ts-task', pct(wd, wk.length), wd+'/'+wk.length);

  const m = milestoneTotals();
  setBar('ts-ms', pct(m.done, m.total), m.done+'/'+m.total);
}
function dayDone(k){ return (sessions[k]||[]).some(x => x.done); }
function streakCount(){
  let n = 0; const d = new Date();
  if(!dayDone(formatDateKey(d))) d.setDate(d.getDate()-1);
  while(n < 3650 && dayDone(formatDateKey(d))){ n++; d.setDate(d.getDate()-1); }
  return n;
}
function renderStats(){
  const el = document.getElementById('statbar'); if(!el) return;
  const tk = formatDateKey(new Date());
  const a = sessions[tk] || [];
  const td = a.filter(x => x.done).length;
  const wk = thisWeekTasks(), wd = wk.filter(w => w.done).length;
  const m = milestoneTotals();
  const s = streakCount();
  const cell = (b,l) => '<div class="stat"><b>'+b+'</b><span>'+l+'</span></div>';
  el.innerHTML =
    cell(a.length ? pct(td, a.length)+'%' : '\u2014', 'TODAY ('+td+'/'+a.length+')') +
    cell(s+(s===1?' day':' days')+' \uD83D\uDD25', 'ACTIVE STREAK') +
    cell(wd+'/'+wk.length, 'THIS WEEK') +
    cell(m.done+'/'+m.total, 'MILESTONE TASKS');
}

/* ============================ Render all ============================ */
function renderAll(){
  renderWeekly();
  renderSession();
  renderMilestones();
  renderGoals();
  renderCalendar();
  renderTasks();
  renderStats();
  renderTrackerBars();
}

/* ============================ Backup ============================ */
function exportData(){
  const b = new Blob([JSON.stringify({ matrix:data, sessions:sessions, vision:loadJSON('vision_text','') }, null, 1)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = 'vision-backup-'+formatDateKey(new Date())+'.json';
  a.click();
}
function importData(ev){
  const f = ev.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = () => {
    try{
      const j = JSON.parse(r.result);
      if(!j.matrix) throw 0;
      persist('matrix_data_v4', j.matrix);
      persist('sessions_v1', j.sessions || {});
      if(j.vision) persist('vision_text', j.vision);
      location.reload();
    }catch(e){ alert('Invalid backup file'); }
  };
  r.readAsText(f);
}

/* ============================ Bootstrap ============================ */
window.addEventListener('DOMContentLoaded', () => {
  showTab('today');
  const v = document.getElementById('vision-text');
  if(v){
    v.innerText = loadJSON('vision_text','') || v.dataset.default;
    v.addEventListener('blur', () => persist('vision_text', v.innerText.trim()));
  }
  selectDate(selectedDateKey);
  renderAll();
});
