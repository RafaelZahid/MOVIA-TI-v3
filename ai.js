/**
 * ═══════════════════════════════════════════════════════════════
 * 🤖 ASISTENTE IA CONTEXTUAL PARA MOVIA TI
 * 
 * Sistema inteligente que comprende contexto y proporciona
 * respuestas dinámicas basadas en la situación actual del usuario
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * 🧠 Función principal - Procesa preguntas y genera respuestas contextuales
 */
export async function smartReply(q, ctx) {
  const query = q.trim().toLowerCase();
  const { state, ROUTES, routeStatsCache } = ctx;
  
  // Construir contexto completo
  const context = buildContext(state, ROUTES, routeStatsCache);
  
  console.log('🤖 IA procesando:', q);
  console.log('📊 Contexto:', context);
  
  // ═════════════════════════════════════════════════════
  // 🎯 SISTEMA DE CLASIFICACIÓN DE INTENCIONES
  // ═════════════════════════════════════════════════════
  
  const intent = detectIntent(query);
  console.log('🎯 Intención detectada:', intent);
  
  switch (intent) {
    case 'greeting':
      return handleGreeting(context);
    
    case 'help':
      return handleHelp(context);
    
    case 'cost':
      return handleCostQuery(query, context);
    
    case 'time':
      return handleTimeQuery(query, context);
    
    case 'route_suggestion':
      return handleRouteSuggestion(query, context);
    
    case 'operator_info':
      return handleOperatorInfo(query, context);
    
    case 'system_status':
      return handleSystemStatus(context);
    
    case 'driver_specific':
      return handleDriverQueries(query, context);
    
    case 'user_specific':
      return handleUserQueries(query, context);
    
    default:
      return handleDefault(context);
  }
}

// ═════════════════════════════════════════════════════
// 📊 CONSTRUCCIÓN DE CONTEXTO
// ═════════════════════════════════════════════════════

function buildContext(state, ROUTES, routeStatsCache) {
  const route = state.selectedRouteId ? 
    ROUTES.find(r => r.id === state.selectedRouteId) : null;
  
  const stats = route && routeStatsCache[state.selectedRouteId] ? 
    routeStatsCache[state.selectedRouteId] : null;
  
  // Contar operadores/usuarios activos
  const activeCount = route ? 
    (state.operators[state.selectedRouteId]?.length || 0) : 0;
  
  return {
    role: state.role,
    userName: state.session?.name || "Amigo",
    hasRoute: !!route,
    route: route,
    routeName: route?.name,
    routeId: state.selectedRouteId,
    stats: stats,
    hasLocation: !!(state.userMarker || state.driverMarker),
    activeCount: activeCount,
    isDriverActive: state.role === "driver" && state.session?.disponible,
    seats: state.session?.seats || 15,
    allRoutes: ROUTES
  };
}

// ═════════════════════════════════════════════════════
// 🎯 DETECCIÓN DE INTENCIONES
// ═════════════════════════════════════════════════════

function detectIntent(query) {
  // Saludos
  if (/\b(hola|buenos|buenas|hey|qué tal|saludos)\b/.test(query)) {
    return 'greeting';
  }
  
  // Ayuda
  if (/\b(ayuda|qué puedes|cómo funciona|para qué sirve|qué haces)\b/.test(query)) {
    return 'help';
  }
  
  // Costos
  if (/\b(costo|precio|cuánto cuesta|tarifa|cobr|pag)\b/.test(query)) {
    return 'cost';
  }
  
  // Tiempo/ETA
  if (/\b(tiempo|cuánto tarda|eta|llega|demora|minutos|hora)\b/.test(query)) {
    return 'time';
  }
  
  // Sugerencias de ruta
  if (/\b(ruta|suger|recomienda|mejor|cómo llego|ir a|llevar)\b/.test(query)) {
    return 'route_suggestion';
  }
  
  // Info de operadores/unidades
  if (/\b(unidad|operador|combi|chofer|conductor)\b/.test(query)) {
    return 'operator_info';
  }
  
  // Estado del sistema
  if (/\b(disponible|activo|cuántos|hay|estado)\b/.test(query)) {
    return 'system_status';
  }
  
  // Específico de operadores
  if (/\b(asiento|capacidad|usuario|solicitud|pasajero)\b/.test(query)) {
    return 'driver_specific';
  }
  
  // Específico de usuarios
  if (/\b(solicitar|pedir|necesito|busco)\b/.test(query)) {
    return 'user_specific';
  }
  
  return 'unknown';
}

// ═════════════════════════════════════════════════════
// 💬 MANEJADORES DE RESPUESTAS
// ═════════════════════════════════════════════════════

/**
 * 👋 Saludos personalizados
 */
function handleGreeting(ctx) {
  const greetings = [
    `¡Hola ${ctx.userName}! 👋`,
    `¡Qué gusto verte, ${ctx.userName}!`,
    `¡Buenos días! Soy tu asistente de Movia TI 🚌`
  ];
  
  const greeting = randomChoice(greetings);
  
  if (ctx.role === "driver") {
    if (!ctx.hasRoute) {
      return `${greeting}\n\n📋 **Para empezar:**\n1. Selecciona tu ruta de operación\n2. Activa tu estado\n3. ¡Empieza a ver usuarios!`;
    }
    if (!ctx.isDriverActive) {
      return `${greeting}\n\n📍 Tienes la ruta **"${ctx.routeName}"** seleccionada.\n\n¿Listo para activarte y empezar a recibir pasajeros?`;
    }
    return `${greeting}\n\n✅ **Estás activo** en "${ctx.routeName}"\n👥 Usuarios en tu ruta: **${ctx.activeCount}**\n💺 Asientos disponibles: **${ctx.seats}**`;
  } else {
    if (!ctx.hasRoute) {
      return `${greeting}\n\n¿A dónde te diriges hoy? 🗺️\n\nSelecciona una ruta y te mostraré las unidades disponibles cerca de ti.`;
    }
    return `${greeting}\n\n📍 Ruta seleccionada: **"${ctx.routeName}"**\n🚌 Unidades activas: **${ctx.activeCount}**\n\n¿Necesitas saber el costo o tiempo estimado?`;
  }
}

/**
 * ❓ Ayuda contextual
 */
function handleHelp(ctx) {
  if (ctx.role === "driver") {
    return `🚌 **Asistente para Operadores**\n\n` +
      `Puedo ayudarte con:\n\n` +
      `📊 **Información de tu servicio**\n` +
      `   • Ver usuarios activos en tu ruta\n` +
      `   • Estadísticas de demanda\n\n` +
      `🛠️ **Gestión de tu unidad**\n` +
      `   • Actualizar asientos disponibles\n` +
      `   • Cambiar tu estado (Activo/Inactivo)\n\n` +
      `📍 **Rutas y tiempos**\n` +
      `   • Calcular tiempos de recorrido\n` +
      `   • Sugerencias de rutas con más demanda\n\n` +
      `💡 **Ejemplos de preguntas:**\n` +
      `   • "¿Cuántos usuarios hay en mi ruta?"\n` +
      `   • "¿Cuánto tiempo toma completar la ruta?"\n` +
      `   • "¿Cómo actualizo mis asientos?"`;
  } else {
    return `👤 **Asistente de Transporte**\n\n` +
      `Puedo ayudarte con:\n\n` +
      `🗺️ **Rutas y ubicaciones**\n` +
      `   • Encontrar la mejor ruta a tu destino\n` +
      `   • Ver unidades cercanas en tiempo real\n\n` +
      `💰 **Costos de viaje**\n` +
      `   • Calcular tarifa según distancia\n` +
      `   • Sistema: $10 base + $1/km\n\n` +
      `⏱️ **Tiempos estimados**\n` +
      `   • Tiempo de recorrido\n` +
      `   • Tiempo de llegada de unidades\n\n` +
      `💡 **Ejemplos de preguntas:**\n` +
      `   • "¿Cuánto cuesta ir al Suburbano?"\n` +
      `   • "¿Cuánto tarda hasta Dorado?"\n` +
      `   • "¿Qué ruta me lleva a Quebrada?"`;
  }
}

/**
 * 💰 Consultas de costo
 */
function handleCostQuery(query, ctx) {
  // Extraer destino de la pregunta
  const destination = extractDestination(query);
  
  // Si no hay ruta seleccionada, intentar sugerir
  if (!ctx.hasRoute) {
    if (destination) {
      const suggestedRoute = findRouteByDestination(destination, ctx.allRoutes);
      if (suggestedRoute) {
        return `📍 Para llegar a **${destination}**, te recomiendo:\n\n` +
          `🚌 Ruta: **"${suggestedRoute.name}"**\n\n` +
          `Selecciónala en el menú y te calcularé el costo exacto.\n\n` +
          `💡 Sistema de tarifas:\n` +
          `• Base: $10 MXN\n` +
          `• Por kilómetro: $1 MXN`;
      }
    }
    
    return `💰 **Sistema de Tarifas**\n\n` +
      `Para calcular el costo exacto de tu viaje:\n\n` +
      `1️⃣ Selecciona tu ruta en el menú\n` +
      `2️⃣ Te diré el costo preciso\n\n` +
      `📊 Cálculo:\n` +
      `• Tarifa base: $10 MXN\n` +
      `• Por kilómetro: $1 MXN\n\n` +
      `¿A dónde necesitas ir?`;
  }
  
  // Calcular costo con ruta seleccionada
  if (!ctx.stats) {
    return `⚠️ Cargando información de la ruta...\n\nIntenta de nuevo en un momento.`;
  }
  
  const km = (ctx.stats.distance / 1000).toFixed(1);
  const base = 10;
  const perKm = 1;
  const costPerKm = (km * perKm).toFixed(0);
  const total = Math.round(base + parseFloat(km) * perKm);
  
  return `💰 **Costo de "${ctx.routeName}"**\n\n` +
    `📏 Distancia total: **${km} km**\n` +
    `💵 Tarifa base: $${base} MXN\n` +
    `📊 Por distancia (${km} km): $${costPerKm} MXN\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `💳 **Total aproximado: $${total} MXN**\n\n` +
    `✅ Pago en efectivo al operador\n` +
    `🎫 Las tarifas son estimadas`;
}

/**
 * ⏱️ Consultas de tiempo
 */
function handleTimeQuery(query, ctx) {
  if (!ctx.hasRoute || !ctx.stats) {
    return `⏱️ Para calcular el tiempo exacto, selecciona una ruta primero.\n\n` +
      `¿A dónde te diriges?`;
  }
  
  const minutes = Math.round(ctx.stats.duration / 60);
  const hasTrafficKeyword = /tráfico|pico|pesado|congestion/.test(query);
  const trafficFactor = hasTrafficKeyword ? 1.35 : 1.0;
  const adjustedMinutes = Math.round(minutes * trafficFactor);
  
  let response = `⏱️ **Tiempo de "${ctx.routeName}"**\n\n` +
    `🕐 Tiempo normal: **~${minutes} minutos**\n`;
  
  if (hasTrafficKeyword) {
    response += `🚦 Con tráfico pesado: **~${adjustedMinutes} minutos**\n\n` +
      `⚠️ Considerando hora pico o congestión`;
  } else {
    response += `\n✅ En condiciones normales de tráfico`;
  }
  
  // Agregar ETA de unidad más cercana si aplica
  if (ctx.role === "user" && ctx.activeCount > 0 && ctx.hasLocation) {
    const eta = calculateNearestOperatorETA(ctx);
    if (eta) {
      response += `\n\n🚌 **Unidad más cercana:**\n` +
        `• Operador: ${eta.op.unit} (${eta.op.plate})\n` +
        `• Llegará en: **~${eta.minutes} min**\n` +
        `• Distancia: ${(eta.meters / 1000).toFixed(2)} km`;
    }
  }
  
  return response;
}

/**
 * 🗺️ Sugerencias de rutas
 */
function handleRouteSuggestion(query, ctx) {
  const destination = extractDestination(query);
  
  if (!destination) {
    const popular = ctx.allRoutes.slice(0, 5);
    return `🗺️ **Rutas Disponibles**\n\n` +
      popular.map((r, i) => `${i + 1}. ${r.name}`).join('\n') +
      `\n\n¿A cuál de estos destinos vas?\n` +
      `💡 También puedo buscar: Suburbano, Dorado, Quebrada, Jilotepec`;
  }
  
  const suggestedRoute = findRouteByDestination(destination, ctx.allRoutes);
  
  if (!suggestedRoute) {
    return `🔍 No encontré rutas directas a **"${destination}"**.\n\n` +
      `¿Podrías ser más específico?\n\n` +
      `Destinos disponibles: Suburbano, Dorado, Quebrada, Jilotepec, Teoloyucan`;
  }
  
  return `✅ **Te recomiendo:** "${suggestedRoute.name}"\n\n` +
    `📍 Esta ruta te llevará a ${destination}\n\n` +
    `🎯 **Siguiente paso:**\n` +
    `Selecciónala en el menú para ver:\n` +
    `• Unidades disponibles\n` +
    `• Costo del viaje\n` +
    `• Tiempo estimado`;
}

/**
 * 🚌 Info de operadores (para usuarios)
 */
function handleOperatorInfo(query, ctx) {
  if (ctx.role === "driver") {
    return `Como operador, puedes:\n\n` +
      `• Ver tu información en "Perfil"\n` +
      `• Actualizar asientos disponibles\n` +
      `• Cambiar tu estado (Activo/Inactivo)\n\n` +
      `¿Qué necesitas hacer?`;
  }
  
  if (!ctx.hasRoute) {
    return `🚌 Para ver operadores disponibles:\n\n` +
      `1️⃣ Selecciona una ruta\n` +
      `2️⃣ Te mostraré las unidades activas\n\n` +
      `¿A dónde vas?`;
  }
  
  if (ctx.activeCount === 0) {
    return `⚠️ **No hay unidades activas** en "${ctx.routeName}" ahora.\n\n` +
      `💡 Sugerencias:\n` +
      `• Intenta en unos minutos\n` +
      `• Prueba otra ruta cercana\n` +
      `• Los operadores suelen estar más activos en horas pico`;
  }
  
  return `🚌 **Unidades en "${ctx.routeName}"**\n\n` +
    `✅ Operadores activos: **${ctx.activeCount}**\n\n` +
    `📍 Puedes verlos en el mapa con marcadores verdes 🚌\n\n` +
    `💡 Haz clic en un marcador para ver:\n` +
    `• Número de unidad\n` +
    `• Placa\n` +
    `• Asientos disponibles`;
}

/**
 * 📊 Estado del sistema
 */
function handleSystemStatus(ctx) {
  if (ctx.role === "driver") {
    const status = ctx.isDriverActive ? "✅ ACTIVO" : "⚪ INACTIVO";
    return `📊 **Tu Estado Actual**\n\n` +
      `${status}\n\n` +
      `📍 Ruta: ${ctx.hasRoute ? `"${ctx.routeName}"` : "Sin asignar"}\n` +
      `👥 Usuarios en tu ruta: **${ctx.activeCount}**\n` +
      `💺 Asientos disponibles: **${ctx.seats}**\n\n` +
      (ctx.isDriverActive ? 
        `Los usuarios pueden verte en el mapa 🗺️` : 
        `Actívate para que los usuarios te vean`);
  } else {
    return `📊 **Estado de "${ctx.routeName || 'tu ruta'}"**\n\n` +
      `🚌 Unidades activas: **${ctx.activeCount}**\n` +
      `📍 Tu ubicación: ${ctx.hasLocation ? "✅ Activa" : "⚠️ Esperando GPS"}\n` +
      `🗺️ Ruta seleccionada: ${ctx.hasRoute ? `"${ctx.routeName}"` : "Ninguna"}\n\n` +
      `💡 ${ctx.activeCount > 0 ? 
        "Puedes ver las unidades en el mapa" : 
        "No hay unidades activas ahora"}`;
  }
}

/**
 * 🚌 Consultas específicas de operadores
 */
function handleDriverQueries(query, ctx) {
  if (ctx.role !== "driver") {
    return handleDefault(ctx);
  }
  
  // Asientos
  if (/asiento|capacidad/.test(query)) {
    return `💺 **Gestión de Asientos**\n\n` +
      `📊 Actual: **${ctx.seats}** asientos\n\n` +
      `🔧 Para actualizar:\n` +
      `1. Usa el botón "Actualizar Asientos" en el panel\n` +
      `2. Ingresa el número de asientos disponibles\n` +
      `3. Los usuarios verán la capacidad actualizada\n\n` +
      `💡 Mantén actualizada tu capacidad para mejor servicio`;
  }
  
  // Usuarios/Solicitudes
  if (/usuario|solicitud|pasajero/.test(query)) {
    if (!ctx.hasRoute) {
      return `📋 Para ver usuarios:\n\n` +
        `1️⃣ Selecciona tu ruta\n` +
        `2️⃣ Activa tu estado\n` +
        `3️⃣ ¡Verás usuarios en tiempo real!`;
    }
    
    if (!ctx.isDriverActive) {
      return `⚠️ Tu estado está **INACTIVO**\n\n` +
        `Para ver usuarios:\n` +
        `Presiona el botón "Cambiar Estado" → Activo\n\n` +
        `Una vez activo, verás marcadores 👤 en el mapa`;
    }
    
    if (ctx.activeCount === 0) {
      return `👥 **Usuarios en "${ctx.routeName}"**\n\n` +
        `Actualmente: **0 usuarios**\n\n` +
        `💡 Cuando haya usuarios solicitando esta ruta,\n` +
        `aparecerán automáticamente en tu mapa`;
    }
    
    return `👥 **Usuarios en "${ctx.routeName}"**\n\n` +
      `✅ Activos ahora: **${ctx.activeCount}**\n\n` +
      `📍 Los ves en el mapa como marcadores azules 👤\n\n` +
      `💡 Haz clic en ellos para ver:\n` +
      `• Nombre del usuario\n` +
      `• Su ubicación exacta\n` +
      `• Hace cuánto solicitó`;
  }
  
  return `🚌 Como operador, puedo ayudarte con:\n\n` +
    `• Ver usuarios en tu ruta\n` +
    `• Actualizar asientos\n` +
    `• Calcular tiempos de recorrido\n` +
    `• Cambiar tu estado\n\n` +
    `¿Qué necesitas?`;
}

/**
 * 👤 Consultas específicas de usuarios
 */
function handleUserQueries(query, ctx) {
  if (ctx.role !== "user") {
    return handleDefault(ctx);
  }
  
  // Solicitar unidad
  if (/solicitar|pedir|necesito/.test(query)) {
    if (!ctx.hasRoute) {
      return `📍 **Para solicitar una unidad:**\n\n` +
        `1️⃣ Selecciona tu ruta de destino\n` +
        `2️⃣ Presiona "Solicitar Unidad"\n` +
        `3️⃣ Verás las unidades disponibles\n\n` +
        `¿A dónde te diriges?`;
    }
    
    if (ctx.activeCount === 0) {
      return `⚠️ No hay unidades activas en "${ctx.routeName}" ahora.\n\n` +
        `💡 Opciones:\n` +
        `• Espera unos minutos\n` +
        `• Prueba otra ruta cercana\n` +
        `• Los operadores suelen estar activos en horas pico`;
    }
    
    return `✅ **Listo para solicitar en "${ctx.routeName}"**\n\n` +
      `🚌 Unidades disponibles: **${ctx.activeCount}**\n\n` +
      `🎯 Presiona el botón "Solicitar Unidad" y:\n` +
      `• Los operadores te verán en su mapa\n` +
      `• Sabrán tu ubicación exacta\n` +
      `• Podrán llegar a recogerte`;
  }
  
  return `👤 Como usuario, puedo ayudarte con:\n\n` +
    `• Encontrar la mejor ruta\n` +
    `• Calcular costos\n` +
    `• Ver unidades disponibles\n` +
    `• Estimar tiempos de llegada\n\n` +
    `¿Qué necesitas saber?`;
}

/**
 * 🤷 Respuesta por defecto inteligente
 */
function handleDefault(ctx) {
  const suggestions = [];
  
  if (ctx.role === "driver") {
    if (!ctx.hasRoute) {
      suggestions.push("Selecciona tu ruta de operación");
    } else if (!ctx.isDriverActive) {
      suggestions.push("Activa tu estado para recibir pasajeros");
    } else {
      suggestions.push(`Tienes ${ctx.activeCount} usuario(s) en tu ruta`);
    }
    
    return `💬 No estoy seguro de entender.\n\n` +
      `📊 Estado actual:\n${suggestions.join('\n')}\n\n` +
      `💡 Puedes preguntarme:\n` +
      `• "¿Cuántos usuarios hay?"\n` +
      `• "¿Cómo actualizo asientos?"\n` +
      `• "¿Cuánto tiempo toma la ruta?"`;
  } else {
    if (!ctx.hasRoute) {
      suggestions.push("Selecciona una ruta para empezar");
    } else {
      suggestions.push(`Hay ${ctx.activeCount} unidad(es) en "${ctx.routeName}"`);
    }
    
    return `💬 No estoy seguro de entender.\n\n` +
      `📊 Estado actual:\n${suggestions.join('\n')}\n\n` +
      `💡 Puedes preguntarme:\n` +
      `• "¿Cuánto cuesta?"\n` +
      `• "¿Cuánto tarda?"\n` +
      `• "¿Hay unidades disponibles?"`;
  }
}

// ═════════════════════════════════════════════════════
// 🛠️ FUNCIONES AUXILIARES
// ═════════════════════════════════════════════════════

/**
 * Extraer destino de una pregunta
 */
function extractDestination(query) {
  const destinations = {
    'suburbano': ['suburbano', 'tren'],
    'dorado': ['dorado', 'el dorado'],
    'quebrada': ['quebrada', 'la quebrada'],
    'jilotepec': ['jilotepec', 'av jilotepec'],
    'teoloyucan': ['teoloyucan'],
    'huehuetoca': ['huehuetoca', 'centro huehuetoca'],
    'animas': ['animas', 'las animas'],
    'torres': ['torres', 'las torres']
  };
  
  for (const [dest, keywords] of Object.entries(destinations)) {
    if (keywords.some(keyword => query.includes(keyword))) {
      return dest;
    }
  }
  
  return null;
}

/**
 * Encontrar ruta por destino
 */
function findRouteByDestination(destination, routes) {
  const destLower = destination.toLowerCase();
  
  // Buscar coincidencia exacta primero
  let match = routes.find(r => 
    r.name.toLowerCase().includes(destLower) ||
    r.destinationLabel?.toLowerCase().includes(destLower)
  );
  
  // Si no hay coincidencia, buscar en origin también
  if (!match) {
    match = routes.find(r => 
      r.originLabel?.toLowerCase().includes(destLower)
    );
  }
  
  return match || null;
}

/**
 * Calcular ETA del operador más cercano
 */
function calculateNearestOperatorETA(ctx) {
  if (!ctx.hasLocation || !ctx.activeCount) return null;
  
  const operators = ctx.operators[ctx.routeId] || [];
  if (operators.length === 0) return null;
  
  // Obtener posición del usuario
  const userMarker = ctx.userMarker || ctx.driverMarker;
  if (!userMarker) return null;
  
  const userPos = userMarker.getLatLng();
  const userCoords = { lat: userPos.lat, lng: userPos.lng };
  
  // Encontrar operador más cercano
  let nearest = null;
  let minDistance = Infinity;
  
  for (const op of operators) {
    const distance = haversine(userCoords, { lat: op.lat, lng: op.lng });
    if (distance < minDistance) {
      minDistance = distance;
      nearest = op;
    }
  }
  
  if (!nearest) return null;
  
  // Calcular ETA
  const avgSpeed = 28; // km/h
  const minutes = Math.max(1, Math.round((minDistance / 1000) / avgSpeed * 60));
  
  return {
    op: nearest,
    meters: minDistance,
    minutes: minutes
  };
}

/**
 * Cálculo de distancia Haversine
 */
function haversine(point1, point2) {
  const R = 6371e3; // Radio de la Tierra en metros
  const toRad = deg => deg * Math.PI / 180;
  
  const dLat = toRad(point2.lat - point1.lat);
  const dLng = toRad(point2.lng - point1.lng);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.asin(Math.sqrt(a));
  
  return R * c; // Distancia en metros
}

/**
 * Elegir elemento aleatorio de un array
 */
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// ═════════════════════════════════════════════════════
// 📤 EXPORTAR FUNCIÓN PRINCIPAL
// ═════════════════════════════════════════════════════

console.log('🤖 Asistente IA mejorado cargado correctamente');
      