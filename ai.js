export async function smartReply(q, ctx){
  const s = q.trim().toLowerCase();
  const { state, ROUTES, routeStatsCache } = ctx;
  const route = state.selectedRouteId ? ROUTES.find(r=>r.id===state.selectedRouteId) : null;
  const stat = route ? routeStatsCache[state.selectedRouteId] : null;
  const say = (t)=>t[Math.floor(Math.random()*t.length)];
  if (s.includes("hola")||s.includes("buenos")) return say(["¡Hola! ¿A dónde te llevo hoy?","Hola, listo para planear tu ruta.","¡Qué gusto! Dime tu destino y te ayudo."]);
  if (stat && (s.includes("costo")||s.includes("precio"))) {
    const km = stat.distance/1000, base=10, perKm=1; const cost = Math.round(base+km*perKm);
    return `Para ${route.name}, distancia ${km.toFixed(1)} km, costo estimado ~$${cost} MXN (tarifa base $10 + $1/km).`;
  }
  if (stat && (s.includes("tiempo")||s.includes("eta")||s.includes("llega"))) {
    const traffic = s.includes("pico")||s.includes("tráfico") ? 1.35 : 1.0;
    return `Tiempo aproximado: ~${Math.round((stat.duration/60)*traffic)} min considerando condiciones actuales.`;
  }
  if (s.includes("suger")||s.includes("ruta")) {
    const dest = guessDest(s); const cand = ROUTES.filter(r=>dest && r.name.toLowerCase().includes(dest));
    if (cand.length){ return `Te sugiero: ${cand[0].name}. ¿Quieres que la seleccione?`; }
    return route ? `Ruta actual: ${route.name}. Puedo cambiarla si indicas destino.` : "Indica origen y destino, y te sugiero la mejor ruta.";
  }
  if (state.role==="driver" && (s.includes("asiento")||s.includes("capacidad"))) {
    return `Puedes actualizar los asientos en el panel. Estado actual: ${document.getElementById("seatsAvailable").textContent}.`;
  }
  const live = await liveETA(state);
  if (live) return `Unidad ${live.op.unit} (${live.op.plate}) llega en ~${live.minutes} min, a ${ (live.meters/1000).toFixed(2) } km.`;
  return say(["Te ayudo con costos, tiempos y sugerencias. Prueba: 'Costo al Suburbano'.","Dime tu destino y calculo ruta y tiempo.","¿Quieres ver la ruta en línea punteada? Selecciona una del menú."]);
}
function guessDest(s){ const keys={suburbano:"suburbano", dorado:"dorado", quebrada:"quebrada", jilotepec:"jilotepec", teoloyucan:"teoloyucan"}; return Object.keys(keys).find(k=>s.includes(k))||null; }
async function liveETA(state){
  if (!state.selectedRouteId || !state.userMarker) return null;
  const ll = state.userMarker.getLatLng(); 
  const eta = predictETA(state.selectedRouteId, { lat: ll.lat, lng: ll.lng }, state);
  return eta;
}
function haversine(a,b){ const R=6371e3,toRad=d=>d*Math.PI/180; const dLat=toRad(b.lat-a.lat), dLon=toRad(b.lng-a.lng); const lat1=toRad(a.lat), lat2=toRad(b.lat); const h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2; return 2*R*Math.asin(Math.sqrt(h)); }
function predictETA(routeId, userPos, state){
  const ops = JSON.parse(localStorage.getItem("operators")||"{}")[routeId]||[];
  const active = ops.filter(o=>o.lat!=null && o.lng!=null && o.active!==false);
  if (!active.length) return null;
  let best=null, bestD=Infinity; for(const o of active){ const d=haversine(userPos,{lat:o.lat,lng:o.lng}); if(d<bestD){bestD=d; best=o;} }
  const avg=28; const minutes=Math.max(1,Math.round((bestD/1000)/avg*60)); return { minutes, meters:bestD, op:best };
}