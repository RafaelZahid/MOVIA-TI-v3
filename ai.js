// 🤖 IA MEJORADA PARA MOVIA TI
// Asistente inteligente para usuarios y operadores

import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  where 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore();

/**
 * Función principal de respuesta inteligente
 * @param {string} q - Pregunta del usuario
 * @param {object} ctx - Contexto (state, ROUTES, etc.)
 * @returns {Promise<string>} - Respuesta de la IA
 */
export async function smartReply(q, ctx) {
  const question = q.trim().toLowerCase();
  const { state, ROUTES, routeStatsCache } = ctx;
  
  // Obtener información actualizada de Firebase
  const realtimeData = await getRealtimeData(state);
  
  // Identificar la intención del usuario
  const intent = identifyIntent(question, state.role);
  
  // Generar respuesta según la intención
  return await generateResponse(intent, question, state, ROUTES, routeStatsCache, realtimeData);
}

/**
 * Obtener datos en tiempo real de Firebase
 */
async function getRealtimeData(state) {
  try {
    const data = {
      activeOperators: 0,
      totalRequests: 0,
      nearbyOperators: [],
      userRequests: []
    };
    
    // Contar operadores activos
    const opsQuery = query(
      collection(db, "conductores"),
      where("disponible", "==", true)
    );
    const opsSnapshot = await getDocs(opsQuery);
    data.activeOperators = opsSnapshot.size;
    
    // Obtener operadores cercanos si hay ruta seleccionada
    if (state.selectedRouteId) {
      const routeOpsQuery = query(
        collection(db, "conductores"),
        where("routeId", "==", state.selectedRouteId),
        where("disponible", "==", true)
      );
      const routeOpsSnapshot = await getDocs(routeOpsQuery);
      data.nearbyOperators = routeOpsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
    
    // Contar solicitudes activas
    const reqsQuery = query(
      collection(db, "solicitudes"),
      where("active", "==", true)
    );
    const reqsSnapshot = await getDocs(reqsQuery);
    data.totalRequests = reqsSnapshot.size;
    
    // Si es operador, obtener solicitudes de su ruta
    if (state.role === "driver" && state.session?.routeId) {
      const myReqsQuery = query(
        collection(db, "solicitudes"),
        where("routeId", "==", state.session.routeId),
        where("active", "==", true)
      );
      const myReqsSnapshot = await getDocs(myReqsQuery);
      data.userRequests = myReqsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
    
    return data;
  } catch (error) {
    console.error("Error obteniendo datos en tiempo real:", error);
    return {
      activeOperators: 0,
      totalRequests: 0,
      nearbyOperators: [],
      userRequests: []
    };
  }
}

/**
 * Identificar la intención del usuario
 */
function identifyIntent(question, role) {
  const intents = {
    // Saludos
    greeting: /^(hola|buenos|buenas|hey|qué tal|saludos)/i,
    
    // Costos y precios
    pricing: /(costo|precio|cuánto|tarifa|pagar|cobr|vale)/i,
    
    // Tiempo y ETA
    timing: /(tiempo|cuánto tard|eta|llega|demora|minutos|horas|rápido|cuando)/i,
    
    // Rutas y sugerencias
    routes: /(ruta|camino|llegar|ir|voy|destino|origen|suger|recomiend)/i,
    
    // Ubicación
    location: /(dónde|ubicación|posición|cercano|cerca|próximo|lejos)/i,
    
    // Disponibilidad (usuarios)
    availability: /(hay|están|disponib|activ|funciona|opera)/i,
    
    // Asientos (operadores)
    seats: /(asiento|capacidad|lugar|cupo|espacio|pasajero)/i,
    
    // Solicitudes (operadores)
    requests: /(solicitud|petición|usuario|cliente|pedido|esperando)/i,
    
    // Estado (operadores)
    status: /(estado|activ|desactiv|online|offline|encend|apag)/i,
    
    // Ayuda general
    help: /(ayuda|cómo|funciona|usar|manual|guía|explica|qué hago)/i,
    
    // Emergencia
    emergency: /(emergencia|ayuda|accidente|problema|urgente|peligro)/i,
    
    // Historial
    history: /(historial|viaje|anterior|pasado|registro)/i,
    
    // Específico de lugares
    places: /(suburbano|dorado|quebrada|jilotepec|teoloyucan|ánimas|torres)/i
  };
  
  // Buscar coincidencias
  for (const [intent, pattern] of Object.entries(intents)) {
    if (pattern.test(question)) {
      return intent;
    }
  }
  
  return 'general';
}

/**
 * Generar respuesta según la intención
 */
async function generateResponse(intent, question, state, ROUTES, routeStatsCache, realtimeData) {
  const route = state.selectedRouteId ? ROUTES.find(r => r.id === state.selectedRouteId) : null;
  const stat = route && routeStatsCache[state.selectedRouteId] ? routeStatsCache[state.selectedRouteId] : null;
  const isDriver = state.role === "driver";
  
  switch (intent) {
    case 'greeting':
      return handleGreeting(state, isDriver);
      
    case 'pricing':
      return handlePricing(question, route, stat, ROUTES);
      
    case 'timing':
      return handleTiming(question, route, stat, state, realtimeData);
      
    case 'routes':
      return handleRoutes(question, route, ROUTES, state);
      
    case 'location':
      return handleLocation(state, realtimeData);
      
    case 'availability':
      return handleAvailability(realtimeData, route);
      
    case 'seats':
      return handleSeats(state, isDriver);
      
    case 'requests':
      return handleRequests(state, realtimeData, isDriver);
      
    case 'status':
      return handleStatus(state, isDriver);
      
    case 'help':
      return handleHelp(isDriver);
      
    case 'emergency':
      return handleEmergency();
      
    case 'history':
      return handleHistory(state);
      
    case 'places':
      return handlePlaces(question, ROUTES);
      
    default:
      return handleGeneral(state, realtimeData, isDriver);
  }
}

// ===== HANDLERS ESPECÍFICOS =====

function handleGreeting(state, isDriver) {
  const greetings = isDriver ? [
    `¡Hola ${state.session?.name || "operador"}! ¿Listo para tu ruta?`,
    `¡Buen día! ¿Cómo va el servicio hoy?`,
    `Hola, ¿necesitas ayuda con solicitudes o asientos?`
  ] : [
    `¡Hola ${state.session?.name || ""}! ¿A dónde te diriges hoy?`,
    `¡Buenos días! ¿Necesitas ayuda para encontrar tu ruta?`,
    `Hola, ¿te ayudo a solicitar una unidad?`
  ];
  
  return greetings[Math.floor(Math.random() * greetings.length)];
}

function handlePricing(question, route, stat, ROUTES) {
  if (!route || !stat) {
    const example = ROUTES[0];
    return `Para calcular el costo, selecciona primero una ruta. Por ejemplo, para ${example.name}, el costo base es $10 MXN + $1 por kilómetro. ¿Quieres que te muestre las rutas disponibles?`;
  }
  
  const km = stat.distance / 1000;
  const base = 10;
  const perKm = 1;
  const cost = Math.round(base + km * perKm);
  
  const trafficWords = /(pico|tráfico|congestion|hora pico)/i;
  const hasTraffic = trafficWords.test(question);
  
  let response = `**${route.name}**\n\n`;
  response += `💰 **Costo estimado:** $${cost} MXN\n`;
  response += `📏 **Distancia:** ${km.toFixed(1)} km\n`;
  response += `📊 **Desglose:** Base $${base} + ${km.toFixed(1)} km × $${perKm}/km\n\n`;
  
  if (hasTraffic) {
    const trafficCost = Math.round(cost * 1.15);
    response += `⚠️ En hora pico el costo puede aumentar a ~$${trafficCost} MXN`;
  } else {
    response += `💡 **Tip:** El costo puede variar en hora pico (+15%)`;
  }
  
  return response;
}

function handleTiming(question, route, stat, state, realtimeData) {
  if (!route || !stat) {
    return `Para calcular el tiempo de viaje, selecciona primero una ruta del menú. Después podré darte el tiempo estimado de llegada.`;
  }
  
  const baseMinutes = Math.round(stat.duration / 60);
  const trafficWords = /(pico|tráfico|congestion|hora pico)/i;
  const hasTraffic = trafficWords.test(question);
  const trafficMultiplier = hasTraffic ? 1.35 : 1.0;
  const adjustedMinutes = Math.round(baseMinutes * trafficMultiplier);
  
  let response = `**${route.name}**\n\n`;
  response += `⏱️ **Tiempo estimado:** ${adjustedMinutes} minutos\n`;
  response += `📏 **Distancia:** ${(stat.distance / 1000).toFixed(1)} km\n`;
  
  if (realtimeData.nearbyOperators.length > 0) {
    response += `\n🚌 **Unidades activas:** ${realtimeData.nearbyOperators.length}\n`;
    
    // Calcular ETA de la unidad más cercana
    if (state.userMarker) {
      const userPos = state.userMarker.getLatLng();
      let nearest = null;
      let minDist = Infinity;
      
      for (const op of realtimeData.nearbyOperators) {
        if (op.lat && op.lng) {
          const dist = haversine(
            { lat: userPos.lat, lng: userPos.lng },
            { lat: op.lat, lng: op.lng }
          );
          if (dist < minDist) {
            minDist = dist;
            nearest = op;
          }
        }
      }
      
      if (nearest) {
        const etaMinutes = Math.max(1, Math.round((minDist / 1000) / 28 * 60));
        response += `🚗 **Unidad más cercana:** ${nearest.unit} - ETA ${etaMinutes} min\n`;
      }
    }
  } else {
    response += `\n⚠️ No hay unidades activas en esta ruta ahora mismo.`;
  }
  
  if (hasTraffic) {
    response += `\n\n⚠️ Tiempo ajustado por hora pico (+35%)`;
  }
  
  return response;
}

function handleRoutes(question, currentRoute, ROUTES, state) {
  // Extraer lugares mencionados
  const places = extractPlaces(question);
  
  if (places.length > 0) {
    const matchingRoutes = ROUTES.filter(route => 
      places.some(place => route.name.toLowerCase().includes(place))
    );
    
    if (matchingRoutes.length > 0) {
      let response = `📍 Encontré estas rutas para ti:\n\n`;
      
      matchingRoutes.slice(0, 3).forEach((route, index) => {
        response += `${index + 1}. **${route.name}**\n`;
      });
      
      response += `\n💡 Selecciona la ruta desde el menú para ver más detalles.`;
      return response;
    }
  }
  
  if (currentRoute) {
    return `Estás viendo la ruta **${currentRoute.name}**. ¿Quieres cambiar a otra? Dime el destino y te sugiero opciones.`;
  }
  
  let response = `🗺️ **Rutas disponibles:**\n\n`;
  ROUTES.slice(0, 5).forEach((route, index) => {
    response += `${index + 1}. ${route.name}\n`;
  });
  response += `\n📌 Selecciona una ruta desde el menú para ver detalles completos.`;
  
  return response;
}

function handleLocation(state, realtimeData) {
  if (state.role === "driver") {
    return `Como operador, tu ubicación se actualiza automáticamente en el mapa. Los usuarios pueden verte cuando estás activo. ${realtimeData.userRequests.length > 0 ? `Tienes ${realtimeData.userRequests.length} solicitud(es) esperando.` : ''}`;
  }
  
  if (!state.userMarker) {
    return `📍 Necesito acceso a tu ubicación para mostrarte las unidades más cercanas. Haz clic en el botón "Activar ubicación" en el mapa.`;
  }
  
  if (realtimeData.nearbyOperators.length > 0) {
    return `📍 Tu ubicación está activa. Hay ${realtimeData.nearbyOperators.length} unidad(es) cerca de ti en la ruta seleccionada.`;
  }
  
  return `📍 Tu ubicación está activa, pero no hay unidades cercanas en esta ruta ahora. Intenta seleccionar otra ruta.`;
}

function handleAvailability(realtimeData, route) {
  const { activeOperators, nearbyOperators } = realtimeData;
  
  let response = `🚌 **Estado del servicio:**\n\n`;
  response += `✅ Operadores activos: ${activeOperators}\n`;
  
  if (route) {
    response += `📍 En tu ruta (${route.name}): ${nearbyOperators.length} unidad(es)\n\n`;
    
    if (nearbyOperators.length > 0) {
      response += `Las unidades están operando normalmente. ¡Solicita tu viaje!`;
    } else {
      response += `⚠️ No hay unidades en esta ruta. Prueba con otra ruta cercana.`;
    }
  } else {
    response += `\n💡 Selecciona una ruta para ver disponibilidad específica.`;
  }
  
  return response;
}

function handleSeats(state, isDriver) {
  if (!isDriver) {
    return `Los asientos disponibles se muestran al solicitar una unidad. Las combis tienen entre 10-15 asientos normalmente.`;
  }
  
  const seatsEl = document.getElementById("seatsAvailable");
  const currentSeats = seatsEl ? seatsEl.textContent : "--";
  
  return `🪑 **Asientos disponibles:** ${currentSeats}\n\n📝 Para actualizar:\n1. Haz clic en "Actualizar número disponible de asientos"\n2. Ingresa el número (0-15)\n3. Los usuarios verán la actualización en tiempo real`;
}

function handleRequests(state, realtimeData, isDriver) {
  if (!isDriver) {
    return `Para solicitar una unidad:\n1. Selecciona tu ruta\n2. Haz clic en "Solicitar unidad"\n3. Espera a que una unidad acepte tu solicitud`;
  }
  
  const { userRequests } = realtimeData;
  
  if (userRequests.length === 0) {
    return `📋 No tienes solicitudes activas en tu ruta ahora. Las solicitudes nuevas aparecerán automáticamente en el mapa.`;
  }
  
  let response = `📋 **Tienes ${userRequests.length} solicitud(es) activa(s):**\n\n`;
  
  userRequests.slice(0, 3).forEach((req, index) => {
    response += `${index + 1}. ${req.userName || "Usuario"}\n`;
    if (req.lat && req.lng) {
      response += `   📍 Ubicación visible en el mapa\n`;
    }
  });
  
  if (userRequests.length > 3) {
    response += `\n...y ${userRequests.length - 3} más`;
  }
  
  response += `\n\n💡 Haz clic en "Fijar usuario más cercano" para navegar al más próximo.`;
  
  return response;
}

function handleStatus(state, isDriver) {
  if (!isDriver) {
    return `Tu estado como usuario siempre está activo. Puedes solicitar unidades en cualquier momento.`;
  }
  
  const statusEl = document.getElementById("driverOnlineStatus");
  const currentStatus = statusEl ? statusEl.textContent : "Desconocido";
  
  let response = `🔘 **Estado actual:** ${currentStatus}\n\n`;
  
  if (currentStatus === "Activo") {
    response += `✅ Los usuarios pueden verte en el mapa\n`;
    response += `✅ Recibes solicitudes de tu ruta\n`;
    response += `✅ Tu ubicación se actualiza en tiempo real\n\n`;
    response += `Para desactivarte, haz clic en "Cambiar estado"`;
  } else {
    response += `⚪ Los usuarios NO pueden verte\n`;
    response += `⚪ No recibes solicitudes\n`;
    response += `⚪ No apareces en el mapa\n\n`;
    response += `Para activarte, haz clic en "Cambiar estado"`;
  }
  
  return response;
}

function handleHelp(isDriver) {
  if (isDriver) {
    return `🎓 **Guía rápida para operadores:**\n\n` +
      `1️⃣ **Activar servicio:** Botón "Cambiar estado"\n` +
      `2️⃣ **Actualizar asientos:** Botón en el panel\n` +
      `3️⃣ **Ver solicitudes:** Aparecen automáticamente en el mapa\n` +
      `4️⃣ **Fijar usuario cercano:** Botón "Fijar usuario más cercano"\n` +
      `5️⃣ **Perfil y documentos:** Botones en el panel\n\n` +
      `💡 Pregúntame: "¿Cuántos usuarios hay?" o "¿Cómo actualizo asientos?"`;
  }
  
  return `🎓 **Guía rápida para usuarios:**\n\n` +
    `1️⃣ **Seleccionar ruta:** Menú desplegable\n` +
    `2️⃣ **Ver rutas:** Aparecen en el mapa\n` +
    `3️⃣ **Solicitar unidad:** Botón verde "Solicitar unidad"\n` +
    `4️⃣ **Ver unidades activas:** Botón "Visualizar"\n` +
    `5️⃣ **Ver historial:** Botón "Historial de viajes"\n\n` +
    `💡 Pregúntame: "¿Cuánto cuesta al Suburbano?" o "¿Cuánto tarda?"`;
}

function handleEmergency() {
  return `🚨 **EMERGENCIA**\n\n` +
    `📞 **Números de emergencia:**\n` +
    `• 911 - Emergencias generales\n` +
    `• 089 - Denuncia anónima\n` +
    `• 555-555-5555 - Protección Civil\n\n` +
    `📍 ¿Necesitas compartir tu ubicación? Haz clic en el botón de emergencia (🚨) en el mapa para más opciones.`;
}

function handleHistory(state) {
  if (state.role === "driver") {
    return `📚 Para ver el historial de viajes, haz clic en el botón "Historial de viajes" en el panel del operador.`;
  }
  
  return `📚 **Historial de viajes:**\n\nHaz clic en el botón "Historial de viajes" (ícono 📜) para ver todos tus viajes anteriores con fecha y hora.`;
}

function handlePlaces(question, ROUTES) {
  const places = extractPlaces(question);
  
  if (places.length === 0) {
    return `No reconocí el lugar. ¿Puedes ser más específico? Por ejemplo: "Ruta al Suburbano" o "Cómo llegar a Dorado"`;
  }
  
  const matchingRoutes = ROUTES.filter(route =>
    places.some(place => route.name.toLowerCase().includes(place))
  );
  
  if (matchingRoutes.length === 0) {
    return `No encontré rutas hacia ${places.join(", ")}. ¿Quieres ver todas las rutas disponibles?`;
  }
  
  let response = `🗺️ **Rutas hacia ${places[0]}:**\n\n`;
  
  matchingRoutes.forEach((route, index) => {
    response += `${index + 1}. ${route.name}\n`;
  });
  
  response += `\n📌 Selecciona la ruta desde el menú para ver detalles.`;
  
  return response;
}

function handleGeneral(state, realtimeData, isDriver) {
  const { activeOperators, nearbyOperators } = realtimeData;
  
  if (isDriver) {
    return `🚌 **Panel de operador:**\n\n` +
      `• Operadores activos en el sistema: ${activeOperators}\n` +
      `• Tus solicitudes activas: ${realtimeData.userRequests.length}\n\n` +
      `💡 Pregúntame sobre: solicitudes, asientos, estado, o ayuda.`;
  }
  
  return `🚌 **Información del sistema:**\n\n` +
    `• Operadores activos: ${activeOperators}\n` +
    `• Operadores en tu ruta: ${nearbyOperators.length}\n\n` +
    `💡 Pregúntame sobre: costos, tiempos, rutas, o disponibilidad.`;
}

// ===== FUNCIONES AUXILIARES =====

function extractPlaces(text) {
  const places = {
    'suburbano': /suburbano/i,
    'dorado': /dorado|el dorado/i,
    'quebrada': /quebrada|la quebrada/i,
    'jilotepec': /jilotepec/i,
    'teoloyucan': /teoloyucan/i,
    'ánimas': /ánimas|animas|las ánimas/i,
    'torres': /torres|las torres/i,
    'coyotepec': /coyotepec/i,
    'huehuetoca': /huehuetoca/i
  };
  
  const found = [];
  
  for (const [place, pattern] of Object.entries(places)) {
    if (pattern.test(text)) {
      found.push(place);
    }
  }
  
  return found;
}

function haversine(a, b) {
  const R = 6371e3;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}