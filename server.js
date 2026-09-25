const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = process.env.PORT || 10000;
const publicDir = path.join(__dirname, "public");

const state = {
  pcs: [
    { id:"PC-01", agent:"AGENT-PC-01", status:"ONLINE", student:"Prathiba Rani", roll:"25H51A0667", lastSeen:"Just now" },
    { id:"PC-02", agent:"AGENT-PC-02", status:"ONLINE", student:"Rahul Kumar", roll:"25H51A06XX", lastSeen:"1 min ago" }
  ],
  students: [
    { name:"Prathiba Rani", roll:"25H51A0667", pc:"PC-01", status:"ACTIVE" },
    { name:"Rahul Kumar", roll:"25H51A06XX", pc:"PC-02", status:"ACTIVE" }
  ],
  rules: [
    { id:1, name:"YouTube", pattern:"youtube.com", type:"ALERT", enabled:true },
    { id:2, name:"Google Search", pattern:"google.com", type:"LOG", enabled:true },
    { id:3, name:"Gaming Sites", pattern:"gaming", type:"ALERT", enabled:false }
  ],
  alerts: [],
  history: [
    { pc:"PC-02", student:"Rahul Kumar", event:"Unauthorized Game Activity", time:"20/09/2026, 14:28" },
    { pc:"PC-07", student:"Rahul Kumar", event:"Unauthorized Browser Activity", time:"19/09/2026, 10:14" }
  ],
  notifications: [
    { title:"Alert resolved", body:"Alert resolved by admin", time:"20/09/2026, 14:28", unread:true },
    { title:"Unauthorized Browser Activity on PC-02", body:"Browser activity detected matching rule: YouTube", time:"20/09/2026, 14:26", unread:true },
    { title:"LabSentinel initialized", body:"Monitoring system started. 4 PCs registered.", time:"20/09/2026, 09:00", unread:false }
  ]
};

function json(res, code, data) {
  res.writeHead(code, {"Content-Type":"application/json; charset=utf-8"});
  res.end(JSON.stringify(data));
}
function body(req) {
  return new Promise((resolve,reject)=>{
    let raw=""; req.on("data",c=>raw+=c);
    req.on("end",()=>{try{resolve(raw?JSON.parse(raw):{})}catch(e){reject(e)}});
  });
}
function sendFile(res, file) {
  const ext = path.extname(file);
  const types = {".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"application/javascript; charset=utf-8"};
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);return res.end("Not found")}
    res.writeHead(200,{"Content-Type":types[ext]||"application/octet-stream"});
    res.end(data);
  });
}

const server = http.createServer(async (req,res)=>{
  const u = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  try {
    if (u.pathname === "/api/dashboard" && req.method==="GET")
      return json(res,200,{totalPcs:state.pcs.length,onlinePcs:state.pcs.filter(p=>p.status==="ONLINE").length,activeAlerts:state.alerts.length,totalStudents:state.students.length,unreadNotifications:state.notifications.filter(n=>n.unread).length,recentAlerts:state.alerts.slice(0,5)});
    if (u.pathname === "/api/pcs" && req.method==="GET") return json(res,200,state.pcs);
    if (u.pathname === "/api/students" && req.method==="GET") return json(res,200,state.students);
    if (u.pathname === "/api/rules" && req.method==="GET") return json(res,200,state.rules);
    if (u.pathname === "/api/alerts" && req.method==="GET") return json(res,200,state.alerts);
    if (u.pathname === "/api/history" && req.method==="GET") return json(res,200,state.history);
    if (u.pathname === "/api/notifications" && req.method==="GET") return json(res,200,state.notifications);

    if (u.pathname === "/api/rules" && req.method==="POST") {
      const b=await body(req); if(!b.name||!b.pattern)return json(res,400,{error:"Name and pattern are required."});
      const r={id:Date.now(),name:b.name,pattern:b.pattern,type:b.type||"ALERT",enabled:true}; state.rules.push(r); return json(res,201,r);
    }
    if (u.pathname.startsWith("/api/rules/") && req.method==="PATCH") {
      const id=Number(u.pathname.split("/").pop()), r=state.rules.find(x=>x.id===id);
      if(!r)return json(res,404,{error:"Rule not found."}); const b=await body(req);
      if(typeof b.enabled==="boolean")r.enabled=b.enabled; return json(res,200,r);
    }
    if (u.pathname === "/api/alerts" && req.method==="POST") {
      const b=await body(req), a={id:Date.now(),pc:b.pc||"PC-01",student:b.student||"Unknown",event:b.event||"Monitoring alert",time:new Date().toLocaleString("en-IN"),severity:b.severity||"HIGH"};
      state.alerts.unshift(a); state.notifications.unshift({title:`New alert on ${a.pc}`,body:a.event,time:a.time,unread:true}); return json(res,201,a);
    }
    if (u.pathname === "/api/notifications/read" && req.method==="POST") {
      state.notifications.forEach(n=>n.unread=false); return json(res,200,{ok:true});
    }

    let file = u.pathname === "/" ? path.join(publicDir,"index.html") : path.join(publicDir,u.pathname.replace(/^\/+/,""));
    if (!file.startsWith(publicDir)) return res.writeHead(403).end();
    if (fs.existsSync(file) && fs.statSync(file).isFile()) return sendFile(res,file);
    return sendFile(res,path.join(publicDir,"index.html"));
  } catch(e) { console.error(e); json(res,500,{error:"Server error"}); }
});

server.listen(PORT,()=>console.log(`LabSentinel running on port ${PORT}`));
