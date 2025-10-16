import L from "leaflet";
import polyline from "polyline";
import { ROUTES } from "./routes.js";
import { smartReply } from "./ai.js";

// Hybrid tap helper and global shim
function onTap(el, cb){ let t=0; const w=(e)=>{const n=Date.now(); if(e.type==='touchstart'){t=n; cb(e);} else if(n-t>400){ cb(e);} }; el.addEventListener('touchstart', w, { passive:true }); el.addEventListener('click', w); }
(function(){ const orig=EventTarget.prototype.addEventListener; EventTarget.prototype.addEventListener=function(type, listener, opts){ if(type==='click' && listener && !listener.__hybrid){ let t=0; const w=function(e){const n=Date.now(); if(e.type==='touchstart'){t=n; listener.call(this,e);} else if(n-t>400){ listener.call(this,e);} }; w.__hybrid=true; orig.call(this,'touchstart', w, { passive:true }); return orig.call(this,'click', w, opts); } return orig.call(this,type,listener,opts); }; })();

/* App State */
const state = {
  role: null, // "user" | "driver"
  session: null, // user or driver data
  map: null,
  routeLayers: new Map(),
  selectedRouteId: null,
  userMarker: null,
  driverMarker: null,
  operators: {}, // { routeId: [ { id, name, unit, plate, lat, lng } ] }
  requests: {}, // { routeId: number }
  requestLayers: new Map(),
  activeOpMarkers: new Map(),
  requestPollTimer: null
};

/* Elements */
const authView = document.getElementById("authView");
const mapView = document.getElementById("mapView");
const asUserBtn = document.getElementById("asUserBtn");
const asDriverBtn = document.getElementById("asDriverBtn");
const userForm = document.getElementById("userForm");
const driverForm = document.getElementById("driverForm");
const userRegView = document.getElementById("userRegView");
const driverRegView = document.getElementById("driverRegView");
const userRouteSel = document.getElementById("userRoute");
const driverRouteSel = document.getElementById("driverRoute");
const routeSelect = document.getElementById("routeSelect");
const operatorMapView = document.getElementById("operatorMapView");
const routeSelectOp = document.getElementById("routeSelectOp");
const fixRouteBtnOp = document.getElementById("fixRouteBtnOp");
const fixNearestBtnOp = document.getElementById("fixNearestBtnOp");
const historyBtnOp = document.getElementById("historyBtnOp");
const originSelect = document.getElementById("originSelect");
const destinationSelect = document.getElementById("destinationSelect");
const requestBtn = document.getElementById("requestBtn");
const cancelRequestBtn = document.getElementById("cancelRequestBtn");
const etaText = document.getElementById("etaText");
const destInput = document.getElementById("destInput");
const recommendBtn = document.getElementById("recommendBtn");
const statusEl = document.getElementById("status");
const driverPanel = document.getElementById("driverPanel");
const requestCount = document.getElementById("requestCount");
const logoutBtn = document.getElementById("logoutBtn");
const chatNavBtn = document.getElementById("chatNavBtn");
const chatNavBtnOp = document.getElementById("chatNavBtnOp");
const chatView = document.getElementById("chatView");
const backFromChat = document.getElementById("backFromChat");
const loginView = document.getElementById("loginView");
const loginUserView = document.getElementById("loginUserView");
const loginDriverView = document.getElementById("loginDriverView");
const loginUserForm = document.getElementById("loginUserForm");
const loginDriverForm = document.getElementById("loginDriverForm");
const backToChoiceFromLogin = document.getElementById("backToChoiceFromLogin");
const authChoice = document.getElementById("authChoice");
const sttBtn = document.getElementById("sttBtn"); const ttsBtn = document.getElementById("ttsBtn");
const roleChoiceView = document.getElementById("roleChoiceView");
const roleChosen = document.getElementById("roleChosen");
const backToHome = document.getElementById("backToHome");
const loginStatus = document.getElementById("loginStatus");
const fixRouteBtn = document.getElementById("fixRouteBtn");
const fixMeBtn = document.getElementById("fixMeBtn");
const fixNearestBtn = document.getElementById("fixNearestBtn");
const historyBtn = document.getElementById("historyBtn");
const travelHistoryView = document.getElementById("travelHistoryView");
const travelHistoryList = document.getElementById("travelHistoryList");
const backFromHistory = document.getElementById("backFromHistory");
const openProfileBtn = document.getElementById("openProfileBtn");
const openDocsBtn = document.getElementById("openDocsBtn");
const operatorProfileView = document.getElementById("operatorProfileView");
const operatorDocsView = document.getElementById("operatorDocsView");
const operatorProfileForm = document.getElementById("operatorProfileForm");
const opProfName = document.getElementById("opProfName");
const opProfUnit = document.getElementById("opProfUnit");
const opProfPlate = document.getElementById("opProfPlate");
const opProfId = document.getElementById("opProfId");
const opProfPhoto = document.getElementById("opProfPhoto");
const opProfPreview = document.getElementById("opProfPreview");
const backFromProfile = document.getElementById("backFromProfile");
const operatorDocsForm = document.getElementById("operatorDocsForm");
const docsInputs = {
  docCirculacion: document.getElementById("docCirculacion"),
  docPoliza: document.getElementById("docPoliza"),
  docLicencia: document.getElementById("docLicencia"),
  docIdentificacion: document.getElementById("docIdentificacion"),
  docSalud: document.getElementById("docSalud")
};
const docsList = document.getElementById("docsList");
const backFromDocs = document.getElementById("backFromDocs");
const settingsBtn = document.getElementById("settingsBtn");
const settingsBtnOp = document.getElementById("settingsBtnOp");
const userSettingsView = document.getElementById("userSettingsView");
const visualizeBtn = document.getElementById("visualizeBtn");
const driverSettingsView = document.getElementById("driverSettingsView");
const stateSelect = document.getElementById("stateSelect");
const municipalitySelect = document.getElementById("municipalitySelect");
const stateSelectOp = document.getElementById("stateSelectOp");
const municipalitySelectOp = document.getElementById("municipalitySelectOp");
const operatorDetailView = document.getElementById("operatorDetailView");
const opDetailPhoto = document.getElementById("opDetailPhoto");
const opDetailInfo = document.getElementById("opDetailInfo");
const backFromOperatorDetail = document.getElementById("backFromOperatorDetail");

/* chat elements (moved into chatView) */
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChatBtn");

/* Populate route selects */
function fillRouteSelects() {
  const opts = ROUTES.map(r => `<option value="${r.id}">${r.name}</option>`).join("");
  userRouteSel.innerHTML = opts; driverRouteSel.innerHTML = opts;
  routeSelect.innerHTML = `<option value="">Sin asignar</option>` + opts;
  const origins = [...new Set(ROUTES.map(r=>r.originLabel||r.name.split(" - ")[0]))];
  const dests =   [...new Set(ROUTES.map(r=>r.destinationLabel||r.name.split(" - ").slice(-1)[0]))];
  originSelect.innerHTML = `<option value="">Origen</option>` + origins.map(o=>`<option>${o}</option>`).join("");
  destinationSelect.innerHTML = `<option value="">Destino</option>` + dests.map(d=>`<option>${d}</option>`).join("");
}
fillRouteSelects();

/* Role selection */
asUserBtn.addEventListener("click", () => {
  state.role = "user"; authView.hidden = true; roleChoiceView.hidden = false; roleChosen.textContent = "Usuario";
  roleChoiceView.querySelector("#roleChoiceTitle").innerHTML = `<span class="material-symbols-rounded">how_to_reg</span> Elige una opción - Usuario`;
  roleChoiceView.querySelector("#roleChoiceDesc").textContent = "Elige la opción para registrarte o Ingresar.";
});
asDriverBtn.addEventListener("click", () => {
  state.role = "driver"; authView.hidden = true; roleChoiceView.hidden = false; roleChosen.textContent = "Operador";
  roleChoiceView.querySelector("#roleChoiceTitle").innerHTML = `<span class="material-symbols-rounded">how_to_reg</span> Elige una opción - Operador`;
  roleChoiceView.querySelector("#roleChoiceDesc").textContent = "Elige la opción para registrarte o Ingresar.";
});
backToHome.addEventListener("click", ()=>{ roleChoiceView.hidden=true; authView.hidden=false; });

document.querySelector("#roleChoiceView #goRegister").addEventListener("click",()=>{
  roleChoiceView.hidden=true; (state.role==="user"?userRegView:driverRegView).hidden=false;
});
document.querySelector("#roleChoiceView #goLogin").addEventListener("click",()=>{
  roleChoiceView.hidden = true;
  loginUserView.hidden = state.role !== "user";
  loginDriverView.hidden = state.role !== "driver";
  (state.role==="user" ? loginUserView : loginDriverView).hidden = false;
});

document.getElementById("backToRoleFromUser").addEventListener("click", ()=>{
  userRegView.hidden = true; roleChoiceView.hidden = false;
});
document.getElementById("backToRoleFromDriver").addEventListener("click", ()=>{
  driverRegView.hidden = true; roleChoiceView.hidden = false;
});

/* Registration handlers */
userForm.addEventListener("submit", e => {
  e.preventDefault();
  const data = {
    role: "user",
    name: document.getElementById("userName").value.trim(),
    email: document.getElementById("userEmail").value.trim(),
    city: document.getElementById("userCity").value.trim(),
    count: Number(document.getElementById("userCount").value),
    preferredRouteId: userRouteSel.value,
    pass: document.getElementById("userPass").value
  };
  const users = db.read(DB_KEYS.users);
  if (users.some(u=>u.email===data.email)) { alert("Ese correo ya está registrado."); return; }
  users.push({ ...data }); db.write(DB_KEYS.users, users);
  state.session = { ...data }; localStorage.setItem("session", JSON.stringify(state.session));
  userRegView.hidden = true; enterMapView();
});

driverForm.addEventListener("submit", e => {
  e.preventDefault();
  const drivers = db.read(DB_KEYS.drivers);
  const ident = "OP-" + String(drivers.length + 1).padStart(4, "0");
  const data = {
    role: "driver",
    name: document.getElementById("driverName").value.trim(),
    unit: document.getElementById("driverUnit").value.trim(),
    plate: document.getElementById("driverPlate").value.trim(),
    routeId: driverRouteSel.value,
    email: document.getElementById("driverEmail").value.trim(),
    pass: document.getElementById("driverPass").value,
    id: ident,
    ident
  };
  if (drivers.some(d=>d.email===data.email)) { alert("Ese correo ya está en uso."); return; }
  if (drivers.some(d=>d.unit===data.unit)) { alert("Ese número de unidad ya está registrado."); return; }
  drivers.push({ ...data }); db.write(DB_KEYS.drivers, drivers);
  state.session = data; localStorage.setItem("session", JSON.stringify(data));
  driverRegView.hidden = true;
  const ops = JSON.parse(localStorage.getItem("operators") || "{}");
  ops[data.routeId] = ops[data.routeId] || [];
  if (!ops[data.routeId].some(o => o.id === data.id)) {
    ops[data.routeId].push({ id: data.id, name: data.name, unit: data.unit, plate: data.plate, lat: null, lng: null });
  }
  localStorage.setItem("operators", JSON.stringify(ops));
  enterMapView();
});

/* Login handler */
loginForm.addEventListener("submit", e=>{
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const pass = document.getElementById("loginPass").value;
  const users = db.read(DB_KEYS.users);
  const drivers = db.read(DB_KEYS.drivers);
  let sess = users.find(u=>u.email===email && u.pass===pass) || drivers.find(d=>d.email===email && d.pass===pass);
  if (!sess) { loginStatus.textContent = "La contraseña o correo son incorrectos."; return; }
  loginStatus.textContent = "";
  state.session = sess; state.role = sess.role; localStorage.setItem("session", JSON.stringify(sess));
  loginView.hidden = true; enterMapView();
});
backToChoiceFromLogin.addEventListener("click", ()=>{ loginView.hidden=true; roleChoiceView.hidden=false; });

/* Restore session if exists */
// Hard reset de registros (usuarios, operadores y sesión) solicitado
// localStorage.removeItem("db_users");
// localStorage.removeItem("db_drivers");
// localStorage.removeItem("session");
// localStorage.removeItem("operators");
const saved = localStorage.getItem("session");
if (saved) {
  state.session = JSON.parse(saved);
  state.role = state.session.role;
  enterMapView(true);
}

/* Map init */
/* =======================
   MAPA LIMPIO CON CALLES
   ======================= */
function initMap(containerId = "map") {
  if (state.map && state.map._container?.id === containerId) return;
  if (state.map) { state.map.remove(); state.map = null; }

  // Inicializa el mapa centrado en Cuautitlán Izcalli (puedes cambiar coordenadas)
  state.map = L.map(containerId, { zoomControl: true, scrollWheelZoom: true })
    .setView([19.745, -99.198], 13);

  // 🔹 Mapa base claro, profesional, con nombres de calles legibles
  L.tileLayer("https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=xrO87CllVe6FoVJkwW2a", {
    maxZoom: 20,
    attribution: '© <a href="https://www.maptiler.com/">MapTiler</a> © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
  }).addTo(state.map);
}



/* custom icons */
const personIcon = L.divIcon({ className:"", html:'<div style="width:28px;height:28px;border-radius:50%;background:#1976D2;display:grid;place-items:center;color:#fff;font-size:18px;box-shadow:0 4px 10px rgba(0,0,0,.2)">👤</div>', iconSize:[28,28], iconAnchor:[14,28] });
const combiIcon = L.divIcon({ className:"", html:'<div style="width:32px;height:32px;border-radius:8px;background:#43A047;display:grid;place-items:center;color:#fff;font-size:18px;box-shadow:0 4px 10px rgba(0,0,0,.2)">🚌</div>', iconSize:[32,32], iconAnchor:[16,32] });
const stopIcon = L.divIcon({ className:"", html:'<div style="font-size:18px;line-height:1">🚦</div>', iconSize:[18,18], iconAnchor:[9,9] });
const originIcon = L.divIcon({ className:"", html:'<div style="font-size:22px;line-height:1">🟢</div>', iconSize:[22,22], iconAnchor:[11,11] });
const destIcon = L.divIcon({ className:"", html:'<div style="font-size:22px;line-height:1">🟠</div>', iconSize:[22,22], iconAnchor:[11,11] });

/* origin/destination markers */
let originMarker = null, destMarker = null, userPathLayer = null;
let lastUserMarker = null, userPosPoll = null;
let odMarkers = [], waypointMarkers = [];

/* Enter map view */
async function enterMapView(isRestore=false) {
  authView.hidden = true;
  const topbar = document.querySelector(".topbar");
  topbar.hidden = false; logoutBtn.hidden = false; chatView.hidden = true;
  if (state.role === "driver") {
    mapView.hidden = true; operatorMapView.hidden = false;
    initMap("opMap");
    routeSelectOp.innerHTML = `<option value="">Sin asignar</option>` + ROUTES.map(r=>`<option value="${r.id}">${r.name}</option>`).join("");
    routeSelectOp.value = ""; state.selectedRouteId = null;
    const ridSess = state.session?.routeId || "";
    driverRouteName.textContent = ridSess ? (ROUTES.find(r=>r.id===ridSess)?.name || "--") : "--";
    driverPanel.hidden = false;
    // solo dibujar/actualizar cuando el operador seleccione ruta
    updateOperatorSeatsDisplay(); updateETAUI();
    updateRequestCount();
    startUserPosPolling();
    startRequestPollingOperator();
    chatNavBtnOp.hidden = false;
  } else {
    operatorMapView.hidden = true; mapView.hidden = false; initMap("map");
    requestBtn.style.display = "inline-flex"; routeSelect.value = ""; state.selectedRouteId = null;
    if (chatNavBtn) chatNavBtn.hidden = false;
    // ensure user location visible on login
    navigator.geolocation.getCurrentPosition(p=>{
      const ll=[p.coords.latitude,p.coords.longitude];
      if (!state.userMarker) {
        state.userMarker = L.marker(ll,{icon:personIcon}).addTo(state.map).bindPopup("Tu ubicación");
      } else state.userMarker.setLatLng(ll);
      state.map.setView(ll, 15);
    }, ()=>{ /* silent */ }, { enableHighAccuracy:true, timeout:8000 });
  }
  watchPosition();
}

/* Geolocation */
let watchId = null;
function watchPosition() {
  if (!navigator.geolocation) {
    statusEl.textContent = "Geolocalización no disponible.";
    return;
  }
  if (watchId) navigator.geolocation.clearWatch(watchId);
  watchId = navigator.geolocation.watchPosition(
    pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      if (state.role === "user") {
        if (!state.userMarker) {
          state.userMarker = L.marker([lat, lng], { icon: personIcon }).addTo(state.map).bindPopup("Tu ubicación");
        } else state.userMarker.setLatLng([lat, lng]);
        localStorage.setItem("last_user_pos", JSON.stringify({ lat, lng, at: Date.now() })); // compartir ubicación a operadores
        updateETAUI();
      } else {
        // mostrar/ocultar marcador según estado activo
        const ops = JSON.parse(localStorage.getItem("operators") || "{}");
        const r = state.session.routeId;
        const meIdx = ops[r]?.findIndex(o => o.id === state.session.id);
        const isActive = meIdx >= 0 ? (ops[r][meIdx].active ?? false) : false;
        if (isActive) {
          if (!state.driverMarker) {
            state.driverMarker = L.marker([lat, lng], { icon: combiIcon }).addTo(state.map).bindPopup("Tu unidad");
          } else state.driverMarker.setLatLng([lat, lng]);
        } else {
          if (state.driverMarker) { state.map.removeLayer(state.driverMarker); state.driverMarker = null; }
        }
        // persist operator location
        if (meIdx >= 0) {
          ops[r][meIdx].lat = lat; ops[r][meIdx].lng = lng;
          localStorage.setItem("operators", JSON.stringify(ops));
        }
        updateRequestCount();
        updateETAUI();
      }
    },
    err => { statusEl.textContent = "No se pudo obtener ubicación."; console.warn(err); },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
  );
}

/* Routing helpers */
async function geocodePlace(q) {
  const key = "geo:" + q;
  const cached = JSON.parse(localStorage.getItem(key) || "null");
  if (cached) return cached;
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1`;
  const res = await fetch(url, { headers: { "Accept-Language": "es" } });
  const json = await res.json();
  const hit = json[0];
  if (!hit) throw new Error("No se pudo geocodificar: " + q);
  const coord = { lat: parseFloat(hit.lat), lng: parseFloat(hit.lon) };
  localStorage.setItem(key, JSON.stringify(coord));
  return coord;
}

async function routeLineWithStats(coords) {
  // Prefer OSRM for multi-waypoint driving
  const locs = coords.map(c => `${c.lng},${c.lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${locs}?overview=full&geometries=polyline&steps=false&annotations=distance,duration`;
  const res = await fetch(url);
  const data = await res.json();
  const r = data.routes?.[0];
  if (!r) throw new Error("Ruta no disponible.");
  const pts = polyline.decode(r.geometry).map(([lat,lng])=>[lat,lng]);
  return { points: pts, distance: r.distance, duration: r.duration };
}

/* Draw all routes as colored background polylines */
async function drawAllRoutes() {
  state.routeLayers.forEach(l => state.map.removeLayer(l));
  state.routeLayers.clear();
  for (const r of ROUTES) {
    try {
      const coords = r.waypoints.map(w => ({ lat: w.lat, lng: w.lng }));
      let full = [];
      for (let i = 1; i < coords.length; i++) {
        const seg = await routeLineWithStats([coords[i - 1], coords[i]]);
        full = full.concat(seg.points);
      }
      const layer = L.polyline(full, { color: r.color, weight: 4, opacity: 0.6 });
      layer.addTo(state.map);
      state.routeLayers.set(r.id, layer);
    } catch (e) { console.warn("Error dibujando ruta", r.name, e); }
  }
}

/* Draw selected route emphasized */
let selectedLayer = null, routeStatsCache = {};
async function getRouteStats(routeId){
  if (routeStatsCache[routeId]) return routeStatsCache[routeId];
  const r = ROUTES.find(x=>x.id===routeId); const coords = r.waypoints.map(w=>({lat:w.lat,lng:w.lng}));
  const stat = await routeLineWithStats(coords); routeStatsCache[routeId] = stat; return stat;
}
async function drawSelectedRoute(routeId, fit=false) {
  const r = ROUTES.find(x => x.id === routeId); if (!r) return;
  const coords = r.waypoints.map(w=>({lat:w.lat,lng:w.lng}));
  const { points, distance, duration } = await getRouteStats(routeId);
  if (selectedLayer) state.map.removeLayer(selectedLayer);
  const lineColor = state.role==="driver" ? "#e53935" : "#1976D2";
  selectedLayer = L.polyline(points, { color: lineColor, weight:5, opacity:1, dashArray:"2 12", lineCap:"round" }).addTo(state.map);
  // origin/destination markers
  odMarkers.forEach(m=>state.map.removeLayer(m)); odMarkers=[];
  const oM = L.marker([coords[0].lat, coords[0].lng], { icon: originIcon }).addTo(state.map).bindPopup("Origen");
  const dM = L.marker([coords[coords.length-1].lat, coords[coords.length-1].lng], { icon: destIcon }).addTo(state.map).bindPopup("Destino");
  odMarkers.push(oM, dM);
  // limpiar marcadores previos de paradas
  waypointMarkers.forEach(m=>state.map.removeLayer(m)); waypointMarkers=[];
  waypointMarkers = coords.map((w,i)=>{
    const m = L.marker([w.lat, w.lng], { icon: stopIcon }).addTo(state.map).bindPopup("Parada...");
    labelWaypoint(w.lat, w.lng).then(name=> m.setPopupContent(name||"Parada"));
    return m;
  });
  // stats
  const activeUnits = countActiveOperators(routeId);
  const statsText = `Distancia total: ${(distance/1000).toFixed(1)} km | Tiempo total: ~${Math.max(1, Math.round(duration/60))} min | Unidades activas: ${activeUnits}`;
  const el = state.role==="driver" ? document.getElementById("routeStatsOp") : document.getElementById("routeStats");
  if (el) el.textContent = statsText;
  if (fit) state.map.fitBounds(selectedLayer.getBounds(), { padding: [20,20] });
  // remove user-to-destination path drawing
}

/* Route selection change */
routeSelect.addEventListener("change", async e => {
  const rid = e.target.value;
  state.selectedRouteId = rid || null;
  clearRouteVisuals();
  statusEl.textContent = rid ? "Ruta seleccionada: " + ROUTES.find(r=>r.id===rid)?.name : "";
  if (rid) await drawSelectedRoute(rid, true);
  if (rid && state.role === "driver") renderRequestMarkers(rid);
  updateETAUI();
});
routeSelectOp?.addEventListener("change", async e => {
  const rid = e.target.value; state.selectedRouteId = rid || null;
  driverRouteName.textContent = rid ? (ROUTES.find(r=>r.id===rid)?.name || "--") : "--";
  clearRouteVisuals();
  statusEl.textContent = rid ? "Ruta seleccionada: " + ROUTES.find(r=>r.id===rid)?.name : "";
  if (rid) await drawSelectedRoute(rid, true); if (rid) renderRequestMarkers(rid); updateETAUI();
});

/* Requests handling */
function getRequests() {
  state.requests = JSON.parse(localStorage.getItem("requests") || "{}");
  return state.requests;
}
function setRequests(obj) {
  localStorage.setItem("requests", JSON.stringify(obj));
  state.requests = obj;
}

function updateRequestCount() {
  const rr = getRouteRequests();
  const list = rr[state.session?.routeId] || [];
  const activeCount = list.filter(x=>x.active!==false).length;
  requestCount.textContent = String(activeCount);
}

/* Find nearest operator on route to user */
function findNearestOperator(routeId, userLatLng) {
  const ops = JSON.parse(localStorage.getItem("operators") || "{}")[routeId] || [];
  let best = null, bestD = Infinity;
  for (const o of ops) {
    if (o.lat == null || o.lng == null || o.active === false) continue;
    const d = haversine(userLatLng, { lat:o.lat, lng:o.lng });
    if (d < bestD) { bestD = d; best = o; }
  }
  return best;
}

/* Request button */
requestBtn.addEventListener("click", async () => {
  if (!state.session) { statusEl.textContent = "Debes iniciar sesión para solicitar una unidad."; return; }
  const rid = state.selectedRouteId;
  if (!rid) { statusEl.textContent = "Selecciona una ruta primero."; return; }
  const reqs = getRequests();
  reqs[rid] = (reqs[rid] || 0) + 1;
  setRequests(reqs);
  statusEl.textContent = "Solicitud enviada. Buscando próxima unidad...";
  // show nearest operator marker popup
  let userPos = null;
  if (state.userMarker) {
    const ll = state.userMarker.getLatLng();
    userPos = { lat: ll.lat, lng: ll.lng };
  }
  const op = userPos ? findNearestOperator(rid, userPos) : null;
  if (op) {
    const marker = L.marker([op.lat, op.lng]).addTo(state.map).bindPopup(`Próxima unidad: ${op.unit} (${op.plate})`).openPopup();
    setTimeout(() => state.map.removeLayer(marker), 8000);
    statusEl.textContent = "Unidad localizada.";
    updateETAUI();
  } else {
    statusEl.textContent = "No hay unidades activas en esta ruta ahora.";
  }
  // persist detailed request with user location
  if (state.userMarker) {
    const ll = state.userMarker.getLatLng();
    const rr = getRouteRequests();
    rr[rid] = rr[rid] || [];
    rr[rid].push({ lat: ll.lat, lng: ll.lng, name: state.session?.name || "Usuario", email: state.session?.email || "", at: Date.now(), active: true });
    setRouteRequests(rr);
    // if a driver is viewing this route, refresh markers
    if (state.role === "driver" && state.session.routeId === rid) renderRequestMarkers(rid);
  }
  // log travel history
  const hist = JSON.parse(localStorage.getItem("travel_history") || "[]");
  const rname = ROUTES.find(r=>r.id===rid)?.name || rid;
  hist.push({ routeId: rid, routeName: rname, at: new Date().toISOString() });
  localStorage.setItem("travel_history", JSON.stringify(hist));
  // mostrar todas las unidades activas en la ruta seleccionada
  showActiveOperatorsForRoute(rid);
});

cancelRequestBtn.addEventListener("click", () => {
  const rid = state.selectedRouteId;
  if (!rid) { statusEl.textContent = "Selecciona una ruta primero."; return; }
  const rr = getRouteRequests(); const list = rr[rid] || [];
  const email = state.session?.email || "";
  rr[rid] = list.filter(req => req.email !== email);
  setRouteRequests(rr);
  const reqs = getRequests(); reqs[rid] = Math.max(0, (reqs[rid] || 0) - 1); setRequests(reqs);
  statusEl.textContent = "Has dejado de solicitar esta ruta.";
  if (state.role === "driver" && state.session.routeId === rid) renderRequestMarkers(rid);
  // limpiar marcadores de operadores en el mapa del usuario
  const arr = state.activeOpMarkers.get(rid)||[];
  arr.forEach(m=> state.map.removeLayer(m));
  state.activeOpMarkers.delete(rid);
});

/* Logout */
logoutBtn.addEventListener("click", () => {
  // clear session and forms
  localStorage.removeItem("session");
  authView.hidden = false;
  mapView.hidden = true;
  operatorMapView.hidden = true; // ocultar interfaz del operador
  chatView.hidden = true;
  logoutBtn.hidden = true;
  driverPanel.hidden = true;
  userForm.reset();
  driverForm.reset();
  statusEl.textContent = "";
  if (watchId) navigator.geolocation.clearWatch(watchId);
  stopUserPosPolling(); // limpiar vista de operador
  stopRequestPollingOperator();
  // limpiar marcadores de operadores mostrados al usuario
  state.activeOpMarkers.forEach(arr=> arr.forEach(m=> state.map?.removeLayer(m)));
  state.activeOpMarkers.clear();
  if (state.map) { state.map.remove(); state.map = null; } // destruir mapa activo
  // note: keep operators and requests to simulate ongoing system
  userRegView.hidden = true; driverRegView.hidden = true; authView.hidden = false;
  // cancelar solicitudes del usuario al cerrar sesión
  try {
    const rr = getRouteRequests();
    const email = state.session?.email;
    Object.keys(rr).forEach(rid=>{
      rr[rid] = (rr[rid]||[]).filter(x=>x.email!==email);
    });
    setRouteRequests(rr);
  } catch {}
});

/* Accessibility: focus management */
routeSelect.addEventListener("change", () => requestBtn.focus());

/* Navigation to chat view */
chatNavBtn?.addEventListener("click", (e) => {
  e.currentTarget.classList.add("pressed"); setTimeout(()=>e.currentTarget.classList.remove("pressed"),90);
  document.querySelector(".topbar").hidden = true;
  mapView.hidden = true; operatorMapView.hidden = true; chatView.hidden = false; saveChat(); restoreChat(); setChatIntro();
});
chatNavBtnOp?.addEventListener("click", (e) => {
  e.currentTarget.classList.add("pressed"); setTimeout(()=>e.currentTarget.classList.remove("pressed"),90);
  document.querySelector(".topbar").hidden = true;
  operatorMapView.hidden = true; chatView.hidden = false; saveChat(); restoreChat(); setChatIntro();
});
backFromChat.addEventListener("click", (e) => {
  e.currentTarget.classList.add("pressed"); setTimeout(()=>e.currentTarget.classList.remove("pressed"),90);
  document.querySelector(".topbar").hidden = false; // mostrar topbar al salir del chat
  chatView.hidden = true; (state.role==="driver"?operatorMapView:mapView).hidden = false; saveChat();
});

function setChatIntro(){
  const greetings = ["¡Buenos días!", "¡Hola!", "¡Qué gusto verte!", "¿Listo para la ruta?", "Buen servicio"];
  const g = greetings[Math.floor(Math.random()*greetings.length)];
  const intro = document.getElementById("chatIntro");
  const chipsBox = document.querySelector("#chatSuggestions .chips");
  const descUser = "Asistente IA para rutas, horarios, costos y emergencias. Escribe tu consulta abajo.";
  const descOp = "Asistente IA para operadores: estado de ruta, solicitudes, capacidad y recomendaciones.";
  if (state.role === "driver") {
    chipsBox.innerHTML = `
      <button class="chip">¿Cuántos usuarios hay en mi ruta?</button>
      <button class="chip">¿Cómo actualizo asientos?</button>
      <button class="chip">Sugerencias para tráfico en Dorado</button>
    `;
  } else {
    chipsBox.innerHTML = `
      <button class="chip">¿Qué combi me lleva al Suburbano desde Av. Jilotepec?</button>
      <button class="chip">¿A qué hora pasa por Las Ánimas?</button>
      <button class="chip">¿Cuánto cuesta de Dorado a Quebrada?</button>
    `;
  }
  if (chatMessages.children.length === 0) { intro.innerHTML = `<div class="greet">${g}</div><div class="desc">${state.role==="driver"?descOp:descUser}</div>`; intro.style.display = "block"; }
  else { intro.style.display = "none"; }
}

/* store detailed user requests with location */
function getRouteRequests() {
  return JSON.parse(localStorage.getItem("route_requests") || "{}");
}
function setRouteRequests(obj) {
  localStorage.setItem("route_requests", JSON.stringify(obj));
}

/* render request markers for a route (driver view) */
function renderRequestMarkers(routeId) {
  // si el operador no está activo, no mostrar solicitudes
  const ops = JSON.parse(localStorage.getItem("operators") || "{}");
  const r = state.session?.routeId; const me = ops[r]?.find(o=>o.id===state.session?.id);
  if (!me?.active) {
    state.requestLayers.forEach(arr => arr.forEach(m => state.map.removeLayer(m)));
    state.requestLayers.clear();
    requestCount.textContent = "0";
    return;
  }
  // clear all previous request markers
  state.requestLayers.forEach(arr => arr.forEach(m => state.map.removeLayer(m)));
  state.requestLayers.clear();
  const reqsAll = getRouteRequests()[routeId] || [];
  const reqs = reqsAll.filter(r=>r.active!==false);
  const markers = reqs.map(req => {
    const when = req.at ? new Date(req.at).toLocaleString() : "sin fecha";
    return L.marker([req.lat, req.lng], { icon: personIcon })
      .addTo(state.map).bindPopup(`${req.name}`);
  });
  state.requestLayers.set(routeId, markers);
  requestCount.textContent = String(reqs.length || 0);
}

function findNearestUser(routeId, fromPos){
  const rr = getRouteRequests(); const list = (rr[routeId]||[]).slice();
  if (!list.length) {
    const last = JSON.parse(localStorage.getItem("last_user_pos")||"null");
    return last ? { lat:last.lat, lng:last.lng, at:last.at } : null;
  }
  let best=null, bestD=Infinity; for(const u of list){
    const d = haversine(fromPos, { lat:u.lat, lng:u.lng }); if(d<bestD){ bestD=d; best=u; }
  } return best;
}

function updateETAUI() {
  if (!state.selectedRouteId || !state.userMarker) {
    etaText.textContent = "ETA: --";
    if (opLiveMarker) { state.map.removeLayer(opLiveMarker); opLiveMarker = null; }
    return;
  }
  const ll = state.userMarker.getLatLng();
  const eta = predictETA(state.selectedRouteId, { lat: ll.lat, lng: ll.lng });
  if (!eta) {
    etaText.textContent = "ETA: sin unidades";
    if (opLiveMarker) { state.map.removeLayer(opLiveMarker); opLiveMarker = null; }
    return;
  }
  getRouteStats(state.selectedRouteId).then(stat=>{
    const distKm = (eta.meters/1000).toFixed(2);
    const totalKm = (stat.distance/1000).toFixed(1);
    const totalMin = Math.max(1, Math.round(stat.duration/60));
    etaText.textContent = `Unidad: ~${eta.minutes} min, ${distKm} km | Ruta: ${totalKm} km, ~${totalMin} min`;
  });
  // show operator marker to user with details
  if (eta.op) {
    if (opLiveMarker) state.map.removeLayer(opLiveMarker);
    const rName = ROUTES.find(r=>r.id===state.selectedRouteId)?.name || "--";
    const prof = JSON.parse(localStorage.getItem("driver_profile_" + (eta.op.id||"")) || "{}");
    const name = prof.name || eta.op.name || "--";
    const ident = prof.ident || eta.op.id || "--";
    const seats = eta.op.seats ?? prof.seats ?? '--';
    const photo = prof.photoURL ? `<br><img id="opPhotoBtn_${ident}" src="${prof.photoURL}" alt="Foto del operador" style="width:72px;height:72px;border-radius:8px;object-fit:cover;border:1px solid #e6e8eb;margin-top:6px;cursor:pointer;">` : `<br><button id="opPhotoBtn_${ident}" class="secondary">Ver foto y perfil</button>`;
    opLiveMarker = L.marker([eta.op.lat, eta.op.lng], { icon: combiIcon })
      .addTo(state.map)
      .bindPopup(`Unidad ${eta.op.unit} • Placa ${eta.op.plate}<br>Ruta: ${rName}<br>Asientos: ${seats}<br>Nombre: ${name}<br>ID: ${ident}${photo}`)
      .openPopup();
    setTimeout(()=>{ const el = document.getElementById(`opPhotoBtn_${ident}`); el && (el.onclick = ()=> openOperatorDetail(ident)); }, 8);
  }
}

function pointToSegmentDistance(p, a, b) {
  const toXY = (c)=>({ x: c.lng, y: c.lat });
  const P=toXY(p), A=toXY(a), B=toXY(b);
  const ABx=B.x-A.x, ABy=B.y-A.y; const APx=P.x-A.x, APy=P.y-A.y;
  const t = Math.max(0, Math.min(1, (APx*ABx + APy*ABy)/(ABx*ABx + ABy*ABy || 1)));
  const cx=A.x + t*ABx, cy=A.y + t*ABy;
  return Math.hypot(P.x - cx, P.y - cy);
}

function distanceToRoute(routeId, point) {
  const layer = state.routeLayers.get(routeId);
  if (!layer) return Infinity;
  const ll = layer.getLatLngs();
  let best = Infinity;
  for (let i=1;i<ll.length;i++) {
    best = Math.min(best, pointToSegmentDistance(point, ll[i-1], ll[i]));
  }
  return best;
}

function distanceToRouteFromWaypoints(route, point){
  const w = route.waypoints; let best = Infinity;
  for(let i=1;i<w.length;i++){
    best = Math.min(best, pointToSegmentDistance(point, w[i-1], w[i]));
  }
  return best;
}

recommendBtn.addEventListener("click", async () => {
  const destLabel = destinationSelect.value.trim();
  if (!destLabel) { statusEl.textContent = "Selecciona destino."; return; }
  let userPos=null;
  if (state.userMarker) { const ll=state.userMarker.getLatLng(); userPos={lat:ll.lat,lng:ll.lng}; }
  if (!userPos) { statusEl.textContent = "Esperando tu ubicación..."; return; }
  const candidates = ROUTES.filter(r=>r.name.toLowerCase().includes(destLabel.toLowerCase()));
  if (!candidates.length){ statusEl.textContent="No hay rutas hacia ese destino."; return; }
  const ranked = candidates.map(r=>({ r, d: distanceToRouteFromWaypoints(r, userPos) })).sort((a,b)=>a.d-b.d);
  const best = ranked[0].r; routeSelect.value = best.id; state.selectedRouteId = best.id;
  await drawSelectedRoute(best.id, true); statusEl.textContent = `Ruta sugerida: ${best.name}`; updateETAUI();
});

function appendMsg(role, text){
  const el = document.createElement("div");
  el.textContent = text;
  el.className = role==="user" ? "msg user" : "msg bot";
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

let conversationHistory = [];
async function sendChat(){
  const text = chatInput.value.trim(); if(!text) return;
  document.getElementById("chatIntro").style.display = "none";
  appendMsg("user", text); chatInput.value="";
  conversationHistory.push({ role:"user", content:text });
  conversationHistory = conversationHistory.slice(-10);
  try {
    const r = state.selectedRouteId ? ROUTES.find(x=>x.id===state.selectedRouteId) : null;
    const stat = state.selectedRouteId ? await getRouteStats(state.selectedRouteId) : null;
    const extra = r && stat ? `Ruta actual: ${r.name}. Distancia ${(stat.distance/1000).toFixed(1)} km, tiempo ~${Math.max(1,Math.round(stat.duration/60))} min. Tarifas: base $10 + $1/km. Operadores activos: ${countActiveOperators(r.id)}.` : `Sin ruta seleccionada. Tarifas: base $10 + $1/km.`;
    const sys = `Eres la IA asistente de Movia TI (Estado de México, zona Cuautitlán Izcalli). Ayudas a usuarios y operadores a: seleccionar/fijar rutas, calcular tarifas/distancias, mostrar info de unidades, orientar sobre funciones, sugerir rutas cercanas según ubicación y estimar ETA. Interfaces: Usuario (solicitar unidad, ver operadores activos, historial, costos) y Operador (fijar ruta, asientos hasta 15, ver solicitudes, subir documentos, editar perfil). Usa ubicación si está disponible; si no, indica alternativas manuales. ${extra} Responde en español, claro, práctico y accionable.`;
    const completion = await websim.chat.completions.create({
      messages: [{ role:"system", content:sys }, ...conversationHistory],
    });
    const reply = completion.content;
    appendMsg("bot", reply);
    conversationHistory.push({ role:"assistant", content:reply });
  } catch {
    const ctx = { state, ROUTES, routeStatsCache };
    appendMsg("bot", await smartReply(text, ctx));
  }
}

chatInput.addEventListener("keydown",(e)=>{ if(e.key==="Enter"){ e.preventDefault(); sendChat(); } });

function haversine(a, b) {
  const R = 6371e3, toRad = d=>d*Math.PI/180;
  const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(h)); // meters
}

function predictETA(routeId, userPos) {
  const op = userPos ? findNearestOperator(routeId, userPos) : null;
  if (!op) return null;
  const meters = haversine(userPos, { lat: op.lat, lng: op.lng });
  const avgSpeedKmh = 28;
  const minutes = Math.max(1, Math.round((meters/1000) / avgSpeedKmh * 60));
  return { minutes, meters, op };
}

function speakText(text){ const u = new SpeechSynthesisUtterance(text); u.lang="es-MX"; window.speechSynthesis.speak(u); }

function handleEmergency(){
  mapView.hidden = true; chatView.hidden = false;
  appendMsg("bot","Emergencia detectada. ¿Deseas compartir tu ubicación o ver números locales?");
  const btn = document.createElement("div");
  btn.className="msg bot";
  btn.innerHTML = "Opciones: <button class='secondary' id='shareLoc'>Compartir ubicación</button> <button class='secondary' id='localNum'>Ver número de emergencia</button>";
  chatMessages.appendChild(btn); chatMessages.scrollTop = chatMessages.scrollHeight;
  document.getElementById("shareLoc").onclick = async ()=>{
    try{ const p = await new Promise((res,rej)=>navigator.geolocation.getCurrentPosition(res,rej));
      const {latitude,longitude}=p.coords; const url=`https://maps.google.com/?q=${latitude},${longitude}`;
      appendMsg("bot",`Ubicación lista para compartir: ${url}`); saveChat();
    }catch{ appendMsg("bot","No se pudo obtener tu ubicación."); }
  };
  document.getElementById("localNum").onclick = ()=> appendMsg("bot","Emergencias: 911 | Protección Civil: 555-555-5555");
}

function saveChat(){ localStorage.setItem("chat_messages", chatMessages.innerHTML); }
function restoreChat(){ const html = localStorage.getItem("chat_messages"); if(html) chatMessages.innerHTML = html; }

sendChatBtn.addEventListener("click", sendChat);
sttBtn.addEventListener("click", startSTT);
ttsBtn.addEventListener("click", ()=> speakText(chatMessages.lastElementChild?.textContent||""));
emergencyBtn.addEventListener("click", handleEmergency);

function startSTT(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){ appendMsg("bot","Tu dispositivo no soporta dictado de voz."); return; }
  const r = new SR(); r.lang="es-MX"; r.onresult=e=>{ chatInput.value = e.results[0][0].transcript; sendChat(); };
  r.onerror=()=>appendMsg("bot","Error de reconocimiento de voz."); r.start();
}

/* DB Keys */
const DB_KEYS = { users:"db_users", drivers:"db_drivers" };
const db = {
  read: (k)=> JSON.parse(localStorage.getItem(k)||"[]"),
  write: (k,v)=> localStorage.setItem(k, JSON.stringify(v))
};

/* init carousel */
function initCarousel(){
  const slides = document.querySelector("#heroCarousel .slides");
  const dots = Array.from(document.querySelectorAll("#heroCarousel .dot"));
  let i=0, n=dots.length; const go=(nIdx)=>{ i=nIdx; slides.style.transform=`translateX(-${i*100}%)`; dots.forEach((d,j)=>d.classList.toggle("active", j===i)); };
  dots.forEach(d=>d.addEventListener("click",()=>go(Number(d.dataset.i))));
  setInterval(()=>go((i+1)%n), 4000); go(0);
}
window.addEventListener("DOMContentLoaded", ()=>{
  initCarousel();
  document.getElementById("yearNow").textContent = new Date().getFullYear();
  setTimeout(()=>{ const s=document.getElementById("splash"); if(s) s.style.display="none"; }, 2000);
  initFilters(stateSelect, municipalitySelect, routeSelect);
  initFilters(stateSelectOp, municipalitySelectOp, routeSelectOp);
});

/* Chat suggestions */
document.getElementById("chatSuggestions").addEventListener("click",(e)=>{
  if (!e.target.classList.contains("chip")) return;
  const t = e.target.textContent.toLowerCase();
  if (state.role === "driver") {
    if (t.includes("cuántos usuarios")) { chatInput.value="¿Cuántos usuarios hay en mi ruta actual?"; sendChat(); return; }
    if (t.includes("actualizo asientos")) { chatInput.value="¿Cómo actualizo el número de asientos disponibles?"; sendChat(); return; }
    if (t.includes("tráfico")) { chatInput.value="Sugerencias para evitar tráfico en Dorado Huehuetoca"; sendChat(); return; }
  } else {
    if (t.includes("suburbano")) { chatInput.value="Costo y tiempo hacia Suburbano"; sendChat(); return; }
    if (t.includes("ánimas")) { chatInput.value="¿A qué hora pasa por Las Ánimas?"; sendChat(); return; }
    if (t.includes("cuesta")) { chatInput.value="Costo de Dorado a Quebrada"; sendChat(); return; }
  }
});

// Draw user path to destination (disabled per requirements)
async function drawUserPathToDest(){
  return; // la ruta debe ir del punto inicial (verde) al destino (azul) pasando por waypoints
}

const driverRouteName = document.getElementById("driverRouteName");
const seatsAvailable = document.getElementById("seatsAvailable");
const updateSeatsBtn = document.getElementById("updateSeatsBtn");
const driverOnlineStatus = document.getElementById("driverOnlineStatus");
const toggleActiveBtn = document.getElementById("toggleActiveBtn");

function updateOperatorSeatsDisplay(){
  const ops = JSON.parse(localStorage.getItem("operators") || "{}");
  const r = state.session?.routeId; const me = ops[r]?.find(o=>o.id===state.session?.id);
  seatsAvailable.textContent = me?.seats ?? "--";
  updateOperatorStatusDisplay();
}

function updateOperatorStatusDisplay(){
  const ops = JSON.parse(localStorage.getItem("operators") || "{}");
  const r = state.session?.routeId; const me = ops[r]?.find(o=>o.id===state.session?.id);
  driverOnlineStatus.textContent = me?.active ? "Activo" : "Inactivo";
}

if (driverPanel) {
  updateSeatsBtn?.addEventListener("click", ()=>{
    const val = prompt("Ingresa asientos disponibles (número):", seatsAvailable.textContent || "0");
    const num = Math.max(0, Number(val||0));
    const ops = JSON.parse(localStorage.getItem("operators") || "{}");
    const r = state.session.routeId; const idx = ops[r]?.findIndex(o=>o.id===state.session.id);
    if (idx>=0){ ops[r][idx].seats = num; localStorage.setItem("operators", JSON.stringify(ops)); }
    updateOperatorSeatsDisplay(); updateETAUI();
  });
  toggleActiveBtn?.addEventListener("click", ()=>{
    const ops = JSON.parse(localStorage.getItem("operators") || "{}");
    const r = state.session.routeId; const idx = ops[r]?.findIndex(o=>o.id===state.session.id);
    if (idx>=0){ ops[r][idx].active = !(ops[r][idx].active ?? false); localStorage.setItem("operators", JSON.stringify(ops)); }
    updateOperatorStatusDisplay();
    // actualizar visibilidad del marcador según estado
    const me = ops[r]?.[idx];
    if (me && (me.active === false) && state.driverMarker) { state.map.removeLayer(state.driverMarker); state.driverMarker = null; }
    if (me && me.active === true && !state.driverMarker && me.lat!=null && me.lng!=null) {
      state.driverMarker = L.marker([me.lat, me.lng], { icon: combiIcon }).addTo(state.map).bindPopup("Tu unidad");
    }
    updateETAUI();
  });
}

const entities = {
  suburbano: "Suburbano de Cuautitlán",
  jilotepec: "Av. Jilotepec",
  dorado: "El Dorado",
  quebrada: "La Quebrada",
  animas: "Las Ánimas",
  teoloyucan: "Teoloyucan"
};

let opLiveMarker = null;

function clearRouteVisuals(){
  if (selectedLayer){ state.map.removeLayer(selectedLayer); selectedLayer=null; }
  odMarkers.forEach(m=>state.map.removeLayer(m)); odMarkers=[];
  waypointMarkers.forEach(m=>state.map.removeLayer(m)); waypointMarkers=[];
}

fixRouteBtn.addEventListener("click", async ()=>{
  const rid = state.selectedRouteId || routeSelect.value || state.session?.preferredRouteId;
  if (!rid) { statusEl.textContent = "Selecciona una ruta para fijarla."; return; }
  routeSelect.value = rid; state.selectedRouteId = rid; await drawSelectedRoute(rid, true); statusEl.textContent = "Ruta fijada en el mapa.";
});

fixMeBtn.addEventListener("click", ()=>{
  if (!state.userMarker) {
    navigator.geolocation.getCurrentPosition(p=>{
      const ll=[p.coords.latitude,p.coords.longitude];
      state.userMarker = L.marker(ll,{icon:personIcon}).addTo(state.map).bindPopup("Tu ubicación");
      state.map.setView(ll, Math.max(state.map.getZoom(), 15)); statusEl.textContent="Ubicación fijada.";
    }, ()=> statusEl.textContent="Esperando tu ubicación...");
    return;
  }
  const ll = state.userMarker.getLatLng(); state.map.setView(ll, Math.max(state.map.getZoom(), 15)); statusEl.textContent = "Ubicación fijada.";
});

fixNearestBtn.addEventListener("click", ()=>{
  if (!state.selectedRouteId) { statusEl.textContent = "Selecciona una ruta."; return; }
  if (!state.userMarker) { statusEl.textContent = "Esperando tu ubicación..."; return; }
  const ll = state.userMarker.getLatLng();
  const op = findNearestOperator(state.selectedRouteId, { lat: ll.lat, lng: ll.lng });
  if (!op) { statusEl.textContent = "No hay unidades activas cercanas."; return; }
  const m = L.marker([op.lat, op.lng], { icon: combiIcon }).addTo(state.map).bindPopup(`Unidad ${op.unit} (${op.plate})`).openPopup();
  state.map.setView([op.lat, op.lng], Math.max(state.map.getZoom(), 15));
  setTimeout(()=> state.map.removeLayer(m), 8000);
  statusEl.textContent = "Unidad más cercana fijada.";
});

historyBtn.addEventListener("click", ()=>{
  mapView.hidden = true; travelHistoryView.hidden = false;
  const hist = JSON.parse(localStorage.getItem("travel_history") || "[]").slice().reverse();
  travelHistoryList.innerHTML = hist.length ? hist.map(h=>{
    const dt = new Date(h.at);
    return `<div>• ${h.routeName} — ${dt.toLocaleDateString()} ${dt.toLocaleTimeString()}</div>`;
  }).join("") : "<div>No hay viajes aún.</div>";
});

backFromHistory.addEventListener("click", ()=>{
  travelHistoryView.hidden = true; (state.role==="driver"?operatorMapView:mapView).hidden = false;
});

openProfileBtn?.addEventListener("click", ()=>{
  operatorMapView.hidden = true; operatorProfileView.hidden = false;
  const key = "driver_profile_" + (state.session?.id||"");
  const prof = JSON.parse(localStorage.getItem(key) || "{}");
  opProfName.value = prof.name || state.session?.name || "";
  opProfUnit.value = prof.unit || state.session?.unit || "";
  opProfPlate.value = prof.plate || state.session?.plate || "";
  opProfId.value = prof.ident || state.session?.ident || state.session?.id || "";
  opProfId.readOnly = true;
  opProfPreview.innerHTML = prof.photoName ? `Foto cargada: ${prof.photoName}` : "Sin foto";
});
backFromProfile?.addEventListener("click", ()=>{
  operatorProfileView.hidden = true; operatorMapView.hidden = false;
});
opProfPhoto?.addEventListener("change", ()=>{
  const f = opProfPhoto.files?.[0]; if(!f){ opProfPreview.textContent="Sin foto"; return; }
  opProfPreview.textContent = `Foto lista: ${f.name}`;
});
operatorProfileForm?.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const key = "driver_profile_" + (state.session?.id||"");
  const f = opProfPhoto.files?.[0] || null;
  let uploadedURL = null;
  if (f) {
    try { uploadedURL = await websim.upload(f); } catch { /* ignore upload error */ }
  }
  const data = {
    name: opProfName.value.trim(),
    unit: opProfUnit.value.trim(),
    plate: opProfPlate.value.trim(),
    ident: opProfId.value.trim(),
    photoName: f?.name || null,
    photoURL: uploadedURL
  };
  localStorage.setItem(key, JSON.stringify(data));
  appendMsg("bot","Perfil actualizado.");
});

openDocsBtn?.addEventListener("click", ()=>{
  operatorMapView.hidden = true; operatorDocsView.hidden = false;
  renderDocsList();
});
backFromDocs?.addEventListener("click", ()=>{
  operatorDocsView.hidden = true; operatorMapView.hidden = false;
});

function renderDocsList(){
  const key = "driver_docs_" + (state.session?.id||"");
  const saved = JSON.parse(localStorage.getItem(key) || "{}");
  const entries = Object.entries(saved);
  docsList.innerHTML = entries.length ? entries.map(([k,v])=>{
    return `<div>• ${labelForDoc(k)} — <a href="${v.url}" target="_blank" rel="noopener">${v.name}</a></div>`;
  }).join("") : "<div>No hay documentos cargados.</div>";
}
function labelForDoc(k){
  const map = {
    docCirculacion: "Tarjeta de Circulación",
    docPoliza: "Póliza de Seguros",
    docLicencia: "Licencia Tipo E",
    docIdentificacion: "Tarjeta de Identificación",
    docSalud: "Certificado de Salud"
  };
  return map[k] || k;
}
operatorDocsForm?.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const key = "driver_docs_" + (state.session?.id||"");
  const saved = JSON.parse(localStorage.getItem(key) || "{}");
  for (const [k,input] of Object.entries(docsInputs)){
    const f = input.files?.[0]; if (!f) continue;
    try {
      const url = await websim.upload(f);
      saved[k] = { name: f.name, url };
    } catch {
      /* ignore upload error */
    }
  }
  localStorage.setItem(key, JSON.stringify(saved));
  renderDocsList();
  appendMsg("bot","Documentos actualizados.");
});

fixRouteBtnOp?.addEventListener("click", async ()=>{
  const rid = state.selectedRouteId || routeSelectOp.value || state.session?.routeId;
  if(!rid){ statusEl.textContent="Selecciona una ruta para fijarla."; return; }
  routeSelectOp.value = rid; state.selectedRouteId = rid; await drawSelectedRoute(rid,true); statusEl.textContent="Ruta fijada en el mapa.";
});

fixNearestBtnOp?.addEventListener("click", ()=>{
  if (!state.driverMarker) { statusEl.textContent = "Activa tu ubicación."; return; }
  const rid = state.selectedRouteId || state.session?.routeId;
  const ll = state.driverMarker.getLatLng();
  const u = findNearestUser(rid, { lat: ll.lat, lng: ll.lng });
  if (!u) { statusEl.textContent = "No hay solicitudes de usuarios en esta ruta."; return; }
  const m = L.marker([u.lat, u.lng], { icon: personIcon }).addTo(state.map).bindPopup(`Usuario más cercano<br><small>${new Date(u.at).toLocaleString?.()||""}</small>`).openPopup();
  state.map.setView([u.lat, u.lng], Math.max(state.map.getZoom(), 15)); setTimeout(()=> state.map.removeLayer(m), 8000);
  statusEl.textContent = "Usuario más cercano fijado.";
});
historyBtnOp?.addEventListener("click", ()=>{
  operatorMapView.hidden = true; travelHistoryView.hidden = false;
  const hist = JSON.parse(localStorage.getItem("travel_history") || "[]").slice().reverse();
  travelHistoryList.innerHTML = hist.length ? hist.map(h=>{
    const dt = new Date(h.at);
    return `<div>• ${h.routeName} — ${dt.toLocaleDateString()} ${dt.toLocaleTimeString()}</div>`;
  }).join("") : "<div>No hay viajes aún.</div>";
});

/* mostrar/actualizar marcador del último usuario en vista del operador */
function updateLastUserMarkerFromStorage(){
  try{
    const data = JSON.parse(localStorage.getItem("last_user_pos")||"null");
    if (!data || !state.map) return;
    const { lat, lng } = data;
    if (!lastUserMarker) {
      lastUserMarker = L.marker([lat, lng], { icon: personIcon }).addTo(state.map).bindPopup("Usuario (última ubicación)");
    } else {
      lastUserMarker.setLatLng([lat, lng]);
    }
  }catch{}
}
function startUserPosPolling(){
  updateLastUserMarkerFromStorage();
  if (userPosPoll) return;
  userPosPoll = setInterval(updateLastUserMarkerFromStorage, 4000);
}
function stopUserPosPolling(){
  if (userPosPoll) { clearInterval(userPosPoll); userPosPoll = null; }
  if (lastUserMarker && state.map) { state.map.removeLayer(lastUserMarker); lastUserMarker = null; }
}

function countActiveOperators(routeId){
  const ops = JSON.parse(localStorage.getItem("operators") || "{}")[routeId] || [];
  return ops.filter(o => o.lat!=null && o.lng!=null && o.active!==false).length;
}

/* Login handler */
loginUserForm.addEventListener("submit", e=>{
  e.preventDefault();
  const email = document.getElementById("loginUserEmail").value.trim();
  const pass = document.getElementById("loginUserPass").value;
  const u = db.read(DB_KEYS.users).find(x=>x.email===email && x.pass===pass);
  if(!u){ document.getElementById("loginUserStatus").textContent="Credenciales incorrectas."; return; }
  state.session=u; state.role="user"; localStorage.setItem("session", JSON.stringify(u));
  loginUserView.hidden=true; enterMapView();
});
document.getElementById("backToChoiceFromLoginUser").addEventListener("click", ()=>{ loginUserView.hidden=true; roleChoiceView.hidden=false; });

/* Login handler */
loginDriverForm.addEventListener("submit", e=>{
  e.preventDefault();
  const email = document.getElementById("loginDriverEmail").value.trim();
  const pass = document.getElementById("loginDriverPass").value;
  const d = db.read(DB_KEYS.drivers).find(x=>x.email===email && x.pass===pass);
  if(!d){ document.getElementById("loginDriverStatus").textContent="Credenciales incorrectas."; return; }
  state.session=d; state.role="driver"; localStorage.setItem("session", JSON.stringify(d));
  loginDriverView.hidden=true; enterMapView();
});
document.getElementById("backToChoiceFromLoginDriver").addEventListener("click", ()=>{ loginDriverView.hidden=true; roleChoiceView.hidden=false; });

/* Settings */
settingsBtn?.addEventListener("click", ()=>{ mapView.hidden=true; userSettingsView.hidden=false; loadUserSettings(); });
visualizeBtn?.addEventListener("click", ()=>{
  if (state.role!=="user") return;
  if (!state.session) { statusEl.textContent = "Inicia sesión para visualizar unidades."; return; }
  const rid = state.selectedRouteId || routeSelect.value;
  if (!rid) { statusEl.textContent = "Selecciona una ruta primero."; return; }
  showActiveOperatorsForRoute(rid);
  statusEl.textContent = "Mostrando unidades activas en esta ruta.";
});
settingsBtnOp?.addEventListener("click", ()=>{ operatorMapView.hidden=true; driverSettingsView.hidden=false; loadDriverSettings(); });
document.getElementById("backFromUserSettings")?.addEventListener("click", ()=>{ userSettingsView.hidden=true; mapView.hidden=false; });
document.getElementById("backFromDriverSettings")?.addEventListener("click", ()=>{ driverSettingsView.hidden=true; operatorMapView.hidden=false; });

function loadUserSettings(){
  const k="user_settings_"+(state.session?.email||"");
  const s=JSON.parse(localStorage.getItem(k)||"{}");
  document.getElementById("setUserNotify").checked=!!s.notify;
  document.getElementById("setUserShare").checked=!!s.share;
  document.getElementById("setUserShowUnits").checked=!!s.showUnits;
}
document.getElementById("userSettingsForm")?.addEventListener("submit",(e)=>{
  e.preventDefault();
  const k="user_settings_"+(state.session?.email||"");
  const s={ notify:document.getElementById("setUserNotify").checked, share:document.getElementById("setUserShare").checked, showUnits:document.getElementById("setUserShowUnits").checked };
  localStorage.setItem(k, JSON.stringify(s));
});

function loadDriverSettings(){
  const k="driver_settings_"+(state.session?.id||"");
  const s=JSON.parse(localStorage.getItem(k)||"{}");
  document.getElementById("setDriverActiveMap").checked=!!s.activeMap;
  document.getElementById("setDriverAutoSeats").checked=!!s.autoSeats;
  document.getElementById("setDriverNotifyReq").checked=!!s.notifyReq;
}
document.getElementById("driverSettingsForm")?.addEventListener("submit",(e)=>{
  e.preventDefault();
  const k="driver_settings_"+(state.session?.id||"");
  const s={ activeMap:document.getElementById("setDriverActiveMap").checked, autoSeats:document.getElementById("setDriverAutoSeats").checked, notifyReq:document.getElementById("setDriverNotifyReq").checked };
  localStorage.setItem(k, JSON.stringify(s));
});

document.getElementById("userDeleteAccountBtn")?.addEventListener("click", ()=> deleteAccountAndLogout("user"));
document.getElementById("driverDeleteAccountBtn")?.addEventListener("click", ()=> deleteAccountAndLogout("driver"));

function deleteAccountAndLogout(role){
  if(!confirm("¿Seguro que deseas borrar tu cuenta? Esta acción es permanente.")) return;
  if(role==="user"){
    const users=db.read(DB_KEYS.users).filter(u=>u.email!==state.session.email);
    db.write(DB_KEYS.users, users);
    const rr=getRouteRequests(); Object.keys(rr).forEach(rid=> rr[rid]=(rr[rid]||[]).filter(x=>x.email!==state.session.email)); setRouteRequests(rr);
  }else{
    const drivers=db.read(DB_KEYS.drivers).filter(d=>d.email!==state.session.email);
    db.write(DB_KEYS.drivers, drivers);
    const ops=JSON.parse(localStorage.getItem("operators")||"{}");
    const r=state.session.routeId; if(ops[r]) ops[r]=ops[r].filter(o=>o.id!==state.session.id);
    localStorage.setItem("operators", JSON.stringify(ops));
    localStorage.removeItem("driver_profile_"+state.session.id);
    localStorage.removeItem("driver_docs_"+state.session.id);
    localStorage.removeItem("driver_settings_"+state.session.id);
  }
  localStorage.removeItem("session");
  authView.hidden=false; mapView.hidden=true; operatorMapView.hidden=true; chatView.hidden=true; logoutBtn.hidden=true;
  if (state.map){ state.map.remove(); state.map=null; }
}

const revCache = {};
async function labelWaypoint(lat,lng){
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (revCache[key]) return revCache[key];
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
  const res = await fetch(url, { headers:{ "Accept-Language":"es" } });
  const j = await res.json();
  const a = j.address||{};
  const name = a.neighbourhood || a.suburb || a.village || a.town || a.city || j.display_name;
  revCache[key] = name; return name;
}

function showActiveOperatorsForRoute(routeId){
  // clear all previously shown operator markers for any route
  state.activeOpMarkers.forEach(arr=> arr.forEach(m=> state.map.removeLayer(m)));
  state.activeOpMarkers.clear();
  const ops = JSON.parse(localStorage.getItem("operators")||"{}")[routeId]||[];
  const actives = ops.filter(o=>o.lat!=null && o.lng!=null && o.active!==false);
  const markers = actives.map(o=> {
    const ident = o.id;
    const prof = JSON.parse(localStorage.getItem("driver_profile_"+ident)||"{}");
    const btn = prof.photoURL ? `<br><img id="opPhotoBtn_${ident}" src="${prof.photoURL}" alt="Foto del operador" style="width:56px;height:56px;border-radius:8px;object-fit:cover;border:1px solid #e6e8eb;margin-top:6px;cursor:pointer;">` : `<br><button id="opPhotoBtn_${ident}" class="secondary">Ver foto y perfil</button>`;
    const m = L.marker([o.lat,o.lng], { icon: combiIcon }).addTo(state.map).bindPopup(`Unidad ${o.unit} (${o.plate})${btn}`);
    m.on("popupopen", ()=> {
      const el = document.getElementById(`opPhotoBtn_${ident}`); el && (el.onclick = ()=> openOperatorDetail(ident));
    });
    return m;
  });
  state.activeOpMarkers.set(routeId, markers);
}

function startRequestPollingOperator(){
  if (state.role!=="driver") return;
  if (state.requestPollTimer) return;
  state.requestPollTimer = setInterval(()=>{
    const rid = state.selectedRouteId || state.session?.routeId;
    if (!rid) return;
    renderRequestMarkers(rid);
  }, 4000);
}

function stopRequestPollingOperator(){
  if (state.requestPollTimer){ clearInterval(state.requestPollTimer); state.requestPollTimer=null; }
}

/* init filters */
const MUNICIPALITIES = {
  "Estado de México": ["Cuautitlán", "Huehuetoca", "Coyotepec", "Dorado", "La Quebrada"]
};
const ROUTE_BY_MUNICIPALITY = {
  "Cuautitlán": ["jilo-sub","dorado-sub","sub-dorado","las-torres-sub"],
  "Huehuetoca": ["jilo-hueh-centro","jilo-hueh-dorado","dorado-sub","sub-dorado","dorado-quebrada","las-torres-hueh-centro","las-torres-hueh-dorado"],
  "Coyotepec": ["jilo-sub","jilo-hueh-centro","jilo-hueh-dorado"],
  "Dorado": ["jilo-hueh-dorado","dorado-sub","sub-dorado","dorado-quebrada","las-torres-hueh-dorado","quebrada-dorado"],
  "La Quebrada": ["dorado-quebrada","las-torres-quebrada","quebrada-dorado"]
};

function initFilters(selectState, selectMunicipality, selectRoute){
  selectState.innerHTML = `<option value="Estado de México">Estado de México</option>`;
  const munis = MUNICIPALITIES["Estado de México"];
  selectMunicipality.innerHTML = `<option value="">Municipio</option>` + munis.map(m=>`<option>${m}</option>`).join("");
  selectRoute.innerHTML = `<option value="">Sin asignar</option>`;
  selectMunicipality.addEventListener("change", ()=>{
    const m = selectMunicipality.value;
    const ids = ROUTE_BY_MUNICIPALITY[m]||[];
    const opts = ids.map(id=> `<option value="${id}">${ROUTES.find(r=>r.id===id)?.name||id}</option>`).join("");
    selectRoute.innerHTML = `<option value="">Sin asignar</option>` + opts;
  });
}

function openOperatorDetail(opId){
  const prof = JSON.parse(localStorage.getItem("driver_profile_" + (opId||"")) || "{}");
  const ops = JSON.parse(localStorage.getItem("operators")||"{}");
  const rid = state.selectedRouteId;
  const opBase = (ops[rid]||[]).find(o=>o.id===opId) || {};
  opDetailPhoto.src = prof.photoURL || `https://images.websim.com/avatar/${(prof.name||opBase.name||"operador").replace(/\s+/g,'').toLowerCase()}`;
  const rName = ROUTES.find(r=>r.id===rid)?.name || "--";
  opDetailInfo.innerHTML = [
    `• Nombre: ${prof.name||opBase.name||"--"}`,
    `• ID: ${prof.ident||opBase.id||"--"}`,
    `• Unidad: ${prof.unit||opBase.unit||"--"}`,
    `• Placa: ${prof.plate||opBase.plate||"--"}`,
    `• Asientos: ${opBase.seats ?? "--"}`,
    `• Ruta: ${rName}`
  ].map(t=>`<div>${t}</div>`).join("");
  (state.role==="driver"?operatorMapView:mapView).hidden = true;
  operatorDetailView.hidden = false;
}

backFromOperatorDetail.addEventListener("click", ()=>{
  operatorDetailView.hidden = true;
  (state.role==="driver"?operatorMapView:mapView).hidden = false;
});