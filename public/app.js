const content = document.getElementById("content");
const navBadge = document.getElementById("navBadge");
const toastEl = document.getElementById("toast");

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
async function api(url, opts={}) {
  const r = await fetch(url, {headers: {"Content-Type":"application/json"}, ...opts});
  if (!r.ok) throw new Error((await r.json()).error || "Request failed");
  return r.json();
}
function toast(msg){toastEl.textContent=msg;toastEl.classList.add("show");setTimeout(()=>toastEl.classList.remove("show"),2200)}
function setActive(page){document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active", b.dataset.page===page))}
function showPage(page){setActive(page); const views={dashboard,live,alerts,history,pcs,students,rules,notifications,settings}; views[page](); window.scrollTo({top:0,behavior:"smooth"})}
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));

async function dashboard(){
  const d=await api("/api/dashboard");
  content.innerHTML=`<div class="page-head"><div><div class="eyebrow">LABSENTINEL</div><h1>Dashboard</h1><p>Real-time laboratory monitoring overview</p></div></div>
  <div class="cards">
    ${stat("TOTAL PCs",d.totalPcs,"Registered","▣")}${stat("ONLINE PCs",d.onlinePcs,"Currently connected","⌁")}
    ${stat("ACTIVE ALERTS",d.activeAlerts,"Needs attention","!")}
    ${stat("TOTAL STUDENTS",d.totalStudents,"Registered users","♙")}${stat("UNREAD ALERTS",d.unreadNotifications,"Notifications","♢")}
  </div>
  <div class="grid-2">
    <div class="panel"><div class="panel-title"><h3>PC Status Overview</h3><span class="muted">${d.onlinePcs} online</span></div>
      <div class="table-wrap"><table class="table"><thead><tr><th>PC</th><th>Student</th><th>Status</th><th>Last Seen</th></tr></thead><tbody>
      ${(await api("/api/pcs")).map(p=>`<tr><td><b>${esc(p.id)}</b></td><td>${esc(p.student||"—")}</td><td>${badge(p.status)}</td><td>${esc(p.lastSeen)}</td></tr>`).join("")}</tbody></table></div>
    </div>
    <div class="panel"><div class="panel-title"><h3>System Health</h3></div>
      ${health("PCs Online",d.onlinePcs+" / "+d.totalPcs,"good")}${health("Active Students",d.totalStudents,"good")}${health("Alerts Needed",d.activeAlerts,d.activeAlerts?"warn":"good")}${health("Monitoring Rules",(await api("/api/rules")).length,"good")}
    </div>
  </div>`;
}
function stat(label,val,sub,icon){return `<div class="card"><div class="stat-icon">${icon}</div><div class="stat-label">${label}</div><div class="stat-value">${val}</div><div class="stat-sub">${sub}</div></div>`}
function health(k,v,c){return `<div class="health-row"><span class="health-key">${k}</span><span class="health-value ${c}">${v}</span></div>`}
function badge(s){const cls=s==="ONLINE"||s==="ACTIVE"?"online":s==="HIGH"?"high":"offline";return `<span class="badge ${cls}">${esc(s)}</span>`}

async function live(){
  const pcs=await api("/api/pcs");
  content.innerHTML=`<div class="page-head"><div><div class="eyebrow">LIVE SESSION</div><h1>Live Monitoring</h1><p>Auto-refreshing laboratory activity</p></div><span class="badge online">● LIVE</span></div>
  <div class="table-wrap"><table class="table"><thead><tr><th>PC</th><th>Student</th><th>Status</th><th>Activity</th><th>Last Seen</th></tr></thead><tbody>
  ${pcs.map(p=>`<tr><td><b>${esc(p.id)}</b></td><td>${esc(p.student)}</td><td>${badge(p.status)}</td><td>${p.status==="ONLINE"?"Normal activity":"Offline"}</td><td>${esc(p.lastSeen)}</td></tr>`).join("")}</tbody></table></div>`;
}
async function alerts(){
  const a=await api("/api/alerts");
  content.innerHTML=`<div class="page-head"><div><div class="eyebrow">SECURITY EVENTS</div><h1>Active Alerts</h1><p>${a.length} alert(s) require attention</p></div></div>
  ${a.length?`<div class="table-wrap"><table class="table"><thead><tr><th>PC</th><th>Student</th><th>Event</th><th>Severity</th><th>Time</th></tr></thead><tbody>${a.map(x=>`<tr><td>${esc(x.pc)}</td><td>${esc(x.student)}</td><td>${esc(x.event)}</td><td>${badge(x.severity)}</td><td>${esc(x.time)}</td></tr>`).join("")}</tbody></table></div>`:`<div class="panel empty"><div><div class="empty-icon">✓</div><b>No active alerts</b><div class="muted">All monitored activity is currently within configured rules.</div></div></div>`}`;
}
async function history(){
  const h=await api("/api/history");
  content.innerHTML=`<div class="page-head"><div><div class="eyebrow">SECURITY LOG</div><h1>Alert History</h1><p>${h.length} recorded events</p></div></div>
  <div class="toolbar"><input class="input" id="histSearch" placeholder="Search PC, student, event..."><select class="select" id="pcFilter"><option>All PCs</option>${[...new Set(h.map(x=>x.pc))].map(x=>`<option>${esc(x)}</option>`).join("")}</select></div>
  <div class="table-wrap"><table class="table"><thead><tr><th>PC</th><th>Student</th><th>Event</th><th>Time</th></tr></thead><tbody id="historyBody"></tbody></table></div>`;
  const render=()=>{const q=document.getElementById("histSearch").value.toLowerCase(),pc=document.getElementById("pcFilter").value;
    document.getElementById("historyBody").innerHTML=h.filter(x=>(pc==="All PCs"||x.pc===pc)&&Object.values(x).some(v=>String(v).toLowerCase().includes(q))).map(x=>`<tr><td>${esc(x.pc)}</td><td>${esc(x.student)}</td><td>${esc(x.event)}</td><td>${esc(x.time)}</td></tr>`).join("")};
  document.getElementById("histSearch").oninput=render;document.getElementById("pcFilter").onchange=render;render();
}
async function pcs(){
  const p=await api("/api/pcs");
  content.innerHTML=`<div class="page-head"><div><div class="eyebrow">DEVICES</div><h1>PC Management</h1><p>${p.length} registered device(s)</p></div></div>
  <div class="table-wrap"><table class="table"><thead><tr><th>PC Number</th><th>Agent ID</th><th>Status</th><th>Assigned Student</th><th>Last Seen</th></tr></thead><tbody>${p.map(x=>`<tr><td><b>${esc(x.id)}</b></td><td>${esc(x.agent)}</td><td>${badge(x.status)}</td><td>${esc(x.student)}</td><td>${esc(x.lastSeen)}</td></tr>`).join("")}</tbody></table></div>`;
}
async function students(){
  const s=await api("/api/students");
  content.innerHTML=`<div class="page-head"><div><div class="eyebrow">USERS</div><h1>Student Management</h1><p>${s.length} registered student(s)</p></div><button class="btn" onclick="showAddStudent()">+ Add Student</button></div>
  <div id="studentForm" class="panel" style="display:none;margin-bottom:14px">
    <div class="panel-title"><h3>Add New Student</h3><button class="btn ghost" onclick="hideAddStudent()">Cancel</button></div>
    <form id="addStudentForm">
      <div class="toolbar">
        <input class="input" id="studentName" placeholder="Student name" required>
        <input class="input" id="studentRoll" placeholder="Roll number" required>
      </div>
      <div class="toolbar">
        <select class="select" id="studentPc"><option value="Unassigned">Unassigned</option>${[...new Set((await api("/api/pcs")).map(x=>x.id))].map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join("")}</select>
        <select class="select" id="studentStatus"><option>ACTIVE</option><option>INACTIVE</option></select>
        <button class="btn" type="submit">Add Student</button>
      </div>
    </form>
  </div>
  <div class="table-wrap"><table class="table"><thead><tr><th>Name</th><th>Roll Number</th><th>Assigned PC</th><th>Status</th></tr></thead><tbody>${s.map(x=>`<tr><td><b>${esc(x.name)}</b></td><td>${esc(x.roll)}</td><td>${esc(x.pc)}</td><td>${badge(x.status)}</td></tr>`).join("")}</tbody></table></div>`;
  document.getElementById("addStudentForm").addEventListener("submit", async e=>{
    e.preventDefault();
    try {
      await api("/api/students",{method:"POST",body:JSON.stringify({
        name:document.getElementById("studentName").value,
        roll:document.getElementById("studentRoll").value,
        pc:document.getElementById("studentPc").value,
        status:document.getElementById("studentStatus").value
      })});
      toast("Student added successfully");
      students();
    } catch(err) { toast(err.message); }
  });
}
function showAddStudent(){const f=document.getElementById("studentForm"); if(f) f.style.display="block"; document.getElementById("studentName")?.focus()}
function hideAddStudent(){const f=document.getElementById("studentForm"); if(f) f.style.display="none"}

async function rules(){
  const r=await api("/api/rules");
  content.innerHTML=`<div class="page-head"><div><div class="eyebrow">POLICIES</div><h1>Monitoring Rules</h1><p>Configure rules used by the PC monitoring agent.</p></div><button class="btn" onclick="addRule()">+ Add Rule</button></div>
  <div class="rule-grid">${r.map(x=>`<div class="rule-card"><h3>${esc(x.name)}</h3><p>${esc(x.pattern)} · ${esc(x.type)}</p><div class="rule-actions"><span class="badge ${x.type==="ALERT"?"high":"online"}">${esc(x.type)}</span><button class="toggle ${x.enabled?"on":""}" onclick="toggleRule(${x.id},${!x.enabled})"></button></div></div>`).join("")}</div>`;
}
async function addRule(){
  const name=prompt("Rule name:"); if(!name)return;
  const pattern=prompt("Pattern / domain:"); if(!pattern)return;
  await api("/api/rules",{method:"POST",body:JSON.stringify({name,pattern,type:"ALERT"})});toast("Rule added");rules();
}
async function toggleRule(id,enabled){await api("/api/rules/"+id,{method:"PATCH",body:JSON.stringify({enabled})});rules();toast(enabled?"Rule enabled":"Rule disabled")}
async function notifications(){
  const n=await api("/api/notifications");
  content.innerHTML=`<div class="page-head"><div><div class="eyebrow">UPDATES</div><h1>Notifications</h1><p>${n.filter(x=>x.unread).length} unread</p></div><button class="btn ghost" onclick="readAll()">Mark all as read</button></div>
  <div class="notifications">${n.map(x=>`<div class="notice"><div class="notice-icon">♢</div><div><h4>${esc(x.title)}</h4><p>${esc(x.body)}</p><small>${esc(x.time)} ${x.unread?"· UNREAD":""}</small></div></div>`).join("")}</div>`;
}
async function readAll(){await api("/api/notifications/read",{method:"POST"});toast("Notifications marked as read");notifications();updateBadge()}
async function updateBadge(){const d=await api("/api/dashboard");navBadge.textContent=d.unreadNotifications;navBadge.style.display=d.unreadNotifications?"grid":"none"}
async function settings(){
  content.innerHTML=`<div class="page-head"><div><div class="eyebrow">CONFIGURATION</div><h1>Settings</h1><p>System configuration and laboratory information</p></div></div>
  <div class="settings">
    <div class="panel"><div class="panel-title"><h3>API / Backend Connection</h3><span class="badge online">CONNECTED</span></div>
      ${setting("Backend URL",location.origin)}${setting("API Status","Operational")}${setting("Environment","Production-ready")}${setting("Authentication","Session / API compatible")}
    </div>
    <div class="panel"><div class="panel-title"><h3>Laboratory Information</h3></div>
      ${setting("Lab Name","Computer Laboratory")}${setting("Project","LabSentinel")}${setting("Monitoring","Browser and application activity")}
    </div>
  </div>`;
}
function setting(k,v){return `<div class="setting-line"><div class="setting-label">${k}</div><div class="setting-value">${esc(v)}</div></div>`}
document.getElementById("logout").onclick=()=>toast("Demo session ended");
showPage("dashboard");updateBadge();
setInterval(()=>{ if(document.querySelector(".nav-item.active")?.dataset.page==="dashboard") dashboard(); updateBadge(); }, 15000);
