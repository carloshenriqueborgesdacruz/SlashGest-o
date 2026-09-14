const USERS = {
  admin: {name:"Carlos", role:"Administrador", level:"admin", password:"admin123"},
  usuario: {name:"Usuário Demo", role:"Editor", level:"editor", password:"user123"},
  visitante: {name:"Visitante", role:"Visualizador", level:"viewer", password:"view123"}
};

const defaultTasks = [
  {id:1,title:"Preparar relatório mensal",owner:"Carlos",due:"2026-09-15",status:"Em andamento"},
  {id:2,title:"Revisar orçamento do projeto",owner:"Ana",due:"2026-09-13",status:"Pendente"},
  {id:3,title:"Atualizar página inicial",owner:"Carlos",due:"2026-09-18",status:"Concluída"},
  {id:4,title:"Conferência de parceiros",owner:"Marcos",due:"2026-09-20",status:"Em andamento"},
  {id:5,title:"Validar cadastro de clientes",owner:"Ana",due:"2026-09-17",status:"Pendente"},
  {id:6,title:"Publicar documentação",owner:"Carlos",due:"2026-09-19",status:"Concluída"}
];
const defaultProjects = [
  {id:1,name:"SlashGestão MVP",client:"Projeto Web Front-End",progress:78},
  {id:2,name:"Portal de Clientes",client:"Equipe Comercial",progress:54},
  {id:3,name:"Automação Interna",client:"Operações",progress:32}
];

let tasks = JSON.parse(localStorage.getItem("slash_tasks") || "null") || defaultTasks;
let projects = JSON.parse(localStorage.getItem("slash_projects") || "null") || defaultProjects;
let currentUser = null;

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

function saveData(){
  localStorage.setItem("slash_tasks", JSON.stringify(tasks));
  localStorage.setItem("slash_projects", JSON.stringify(projects));
}
function escapeHTML(v){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function canEdit(){return currentUser && (currentUser.level==="admin" || currentUser.level==="editor")}
function canDelete(){return currentUser && currentUser.level==="admin"}
function showToast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2400)}
function formatDate(date){if(!date)return "-"; const [y,m,d]=date.split("-"); return `${d}/${m}/${y}`}
function statusClass(s){return s==="Concluída"?"done":s==="Em andamento"?"progress":"pending"}

function login(user){
  currentUser=user;
  sessionStorage.setItem("slash_session", JSON.stringify({name:user.name,role:user.role,level:user.level}));
  $("#loginScreen").classList.add("hidden"); $("#app").classList.remove("hidden");
  $("#userName").textContent=user.name; $("#topName").textContent=user.name; $("#welcomeName").textContent=user.name;
  $("#userRole").textContent=user.role; $("#currentUserText").textContent=`${user.name} — ${user.role}`;
  $("#avatarLetter").textContent=user.name.charAt(0).toUpperCase(); $("#topAvatar").textContent=user.name.charAt(0).toUpperCase();
  $$(".can-edit").forEach(b=>b.disabled=!canEdit());
  renderAll();
}
function logout(){sessionStorage.removeItem("slash_session");location.reload()}

$("#loginForm").addEventListener("submit",e=>{
  e.preventDefault();
  const key=$("#email").value.trim().toLowerCase(), pass=$("#password").value;
  const user=USERS[key];
  if(user && user.password===pass){$("#loginError").textContent="";login(user)}
  else $("#loginError").textContent="Usuário ou senha inválidos.";
});

$$(".nav-item[data-section]").forEach(btn=>btn.addEventListener("click",()=>{
  $$(".nav-item[data-section]").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
  $$(".section").forEach(s=>s.classList.add("hidden"));
  $(`#${btn.dataset.section}Section`).classList.remove("hidden");
  $("#pageTitle").textContent=btn.textContent.trim();
  $("#sidebar").classList.remove("open");$("#overlay").classList.add("hidden");
}));

$("#menuBtn").addEventListener("click",()=>{$("#sidebar").classList.add("open");$("#overlay").classList.remove("hidden")});
$("#closeSidebar").addEventListener("click",()=>{$("#sidebar").classList.remove("open");$("#overlay").classList.add("hidden")});
$("#overlay").addEventListener("click",()=>{$("#sidebar").classList.remove("open");$("#overlay").classList.add("hidden")});
$("#logoutBtn").addEventListener("click",logout);
$("#toggleContrast").addEventListener("click",()=>document.body.classList.toggle("high-contrast"));

function renderDashboard(){
  const total=tasks.length, done=tasks.filter(t=>t.status==="Concluída").length;
  const progress=tasks.filter(t=>t.status==="Em andamento").length, pending=tasks.filter(t=>t.status==="Pendente").length;
  $("#statTotal").textContent=total;$("#statDone").textContent=done;$("#statPending").textContent=pending;$("#statProjects").textContent=projects.length;
  const pct=total?Math.round(done/total*100):0;$("#donePercent").textContent=`${pct}%`;$("#donutPercent").textContent=`${pct}%`;
  $("#legendDone").textContent=done;$("#legendProgress").textContent=progress;$("#legendPending").textContent=pending;
  const d=total?done/total*360:0, p=total?progress/total*360:0;
  $("#donutChart").style.background=`conic-gradient(#53dc91 0deg ${d}deg,#2f89ff ${d}deg ${d+p}deg,#ffb34a ${d+p}deg 360deg)`;
  const days=["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"], counts=[2,3,5,3,4,2,1];
  $("#weeklyChart").innerHTML=days.map((day,i)=>`<div class="bar-col"><div class="bar" style="height:${counts[i]*25}px" title="${counts[i]} tarefas"></div><span>${day}</span></div>`).join("");
  const alerts=tasks.filter(t=>t.status!=="Concluída").slice(0,3);
  $("#alertsList").innerHTML=alerts.length?alerts.map(t=>`<div class="alert-item"><div class="alert-icon">!</div><div><strong>${escapeHTML(t.title)}</strong><small>Prazo: ${formatDate(t.due)} · ${t.status}</small></div></div>`).join(""):`<div class="alert-item"><div class="alert-icon">✓</div><div><strong>Tudo em ordem!</strong><small>Nenhum alerta pendente.</small></div></div>`;
  $("#recentList").innerHTML=tasks.slice(-4).reverse().map(t=>`<div class="recent-item"><div class="recent-icon">✓</div><div><strong>${escapeHTML(t.title)}</strong><small>${escapeHTML(t.owner)} · ${formatDate(t.due)}</small></div></div>`).join("");
}
function renderTasks(){
  const q=$("#taskSearch").value.toLowerCase(), f=$("#statusFilter").value;
  const list=tasks.filter(t=>(f==="all"||t.status===f)&&(`${t.title} ${t.owner}`.toLowerCase().includes(q)));
  $("#tasksTable").innerHTML=list.length?list.map(t=>`<tr><td><strong>${escapeHTML(t.title)}</strong></td><td>${escapeHTML(t.owner)}</td><td>${formatDate(t.due)}</td><td><span class="status-badge ${statusClass(t.status)}">${t.status}</span></td><td><div class="row-actions">${canEdit()?`<button class="mini-btn" onclick="editTask(${t.id})">Editar</button>`:""}${canDelete()?`<button class="mini-btn danger" onclick="deleteTask(${t.id})">Excluir</button>`:""}${!canEdit()&&!canDelete()?"Somente leitura":""}</div></td></tr>`).join(""):`<tr><td colspan="5">Nenhuma tarefa encontrada.</td></tr>`;
}
function renderProjects(){
  $("#projectCards").innerHTML=projects.map(p=>`<article class="panel project-card"><h4>${escapeHTML(p.name)}</h4><p>${escapeHTML(p.client)}</p><div class="progress-track"><span style="width:${p.progress}%"></span></div><div class="progress-meta"><span>Progresso</span><strong>${p.progress}%</strong></div>${canDelete()?`<button class="mini-btn danger" style="margin-top:14px" onclick="deleteProject(${p.id})">Excluir</button>`:""}</article>`).join("");
}
function renderAll(){renderDashboard();renderTasks();renderProjects()}

$("#taskSearch").addEventListener("input",renderTasks);$("#statusFilter").addEventListener("change",renderTasks);
$("#quickAddBtn").addEventListener("click",openNewTask);$("#newTaskBtn").addEventListener("click",openNewTask);
$("#newProjectBtn").addEventListener("click",()=>{if(!canEdit())return showToast("Seu nível não permite criar projetos.");$("#projectForm").reset();$("#projectDialog").showModal()});

function openNewTask(){
  if(!canEdit())return showToast("Seu nível não permite criar tarefas.");
  $("#taskForm").reset();$("#taskId").value="";$("#taskDialogTitle").textContent="Nova tarefa";$("#taskDialog").showModal();
}
function editTask(id){
  if(!canEdit())return showToast("Sem permissão para editar.");
  const t=tasks.find(x=>x.id===id);if(!t)return;
  $("#taskId").value=t.id;$("#taskTitle").value=t.title;$("#taskOwner").value=t.owner;$("#taskDue").value=t.due;$("#taskStatus").value=t.status;$("#taskDialogTitle").textContent="Editar tarefa";$("#taskDialog").showModal();
}
function deleteTask(id){
  if(!canDelete())return showToast("Somente administradores podem excluir.");
  if(confirm("Excluir esta tarefa?")){tasks=tasks.filter(t=>t.id!==id);saveData();renderAll();showToast("Tarefa excluída.");}
}
function deleteProject(id){
  if(!canDelete())return showToast("Somente administradores podem excluir.");
  if(confirm("Excluir este projeto?")){projects=projects.filter(p=>p.id!==id);saveData();renderAll();showToast("Projeto excluído.");}
}
$("#taskForm").addEventListener("submit",e=>{
  e.preventDefault();
  const id=$("#taskId").value, item={title:$("#taskTitle").value.trim(),owner:$("#taskOwner").value.trim(),due:$("#taskDue").value,status:$("#taskStatus").value};
  if(id) tasks=tasks.map(t=>t.id==id?{...t,...item}:t); else tasks.push({id:Date.now(),...item});
  saveData();renderAll();$("#taskDialog").close();showToast(id?"Tarefa atualizada!":"Tarefa criada!");
});
$("#projectForm").addEventListener("submit",e=>{
  e.preventDefault();projects.push({id:Date.now(),name:$("#projectName").value.trim(),client:$("#projectClient").value.trim(),progress:Math.max(0,Math.min(100,Number($("#projectProgress").value)))});
  saveData();renderAll();$("#projectDialog").close();showToast("Projeto criado!");
});
$$("[data-close]").forEach(b=>b.addEventListener("click",()=>document.getElementById(b.dataset.close).close()));
$("#notificationsBtn").addEventListener("click",()=>{$(".section:not(.hidden)")?.scrollIntoView({behavior:"smooth"});showToast(`${tasks.filter(t=>t.status!=="Concluída").length} tarefa(s) precisam de atenção.`)});

const saved=JSON.parse(sessionStorage.getItem("slash_session")||"null");
if(saved){currentUser={...saved,password:""};$("#loginScreen").classList.add("hidden");$("#app").classList.remove("hidden");$("#userName").textContent=saved.name;$("#topName").textContent=saved.name;$("#welcomeName").textContent=saved.name;$("#userRole").textContent=saved.role;$("#currentUserText").textContent=`${saved.name} — ${saved.role}`;$("#avatarLetter").textContent=saved.name.charAt(0).toUpperCase();$("#topAvatar").textContent=saved.name.charAt(0).toUpperCase();$$(".can-edit").forEach(b=>b.disabled=!canEdit());renderAll()}
