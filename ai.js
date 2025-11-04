/**
 * ═══════════════════════════════════════════════════════════════
 * 🤖 ASISTENTE IA CONTEXTUAL MEJORADO PARA MOVIA TI
 * 
 * Sistema que REALMENTE entiende el contexto y responde correctamente
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * 🧠 Función principal de respuesta inteligente
 */
export async function smartReply(q, ctx) {
  const query = q.trim().toLowerCase();
  const { state, ROUTES, routeStatsCache } = ctx;
  
  // Construir contexto completo
  const context = buildContext(state, ROUTES, routeStatsCache);
  
  console.log('═══════════════════════════════════════');
  console.log('🤖 Pregunta:', q);
  console.log('👤 Rol:', context.role);
  console.log('📍 Ruta:', context.routeName || 'Sin ruta');
  console.log('═══════════════════════════════════════');
  
  // ═══════════════════════════════════════════════════════
  // 🎯 DETECCIÓN DE INTENCIONES MEJORADA
  // ═══════════════════════════════════════════════════════
  
  // 1️⃣ SALUDOS
  if (/\b(hola|buenos|buenas|hey|qué tal|saludos|buen día)\b/i.test(query)) {
    return handleGreeting(context);
  }
  
  // 2️⃣ AYUDA GENERAL
  if (/\b(ayuda|qué puedes|cómo funciona|para qué|qué haces|comandos|opciones)\b/i.test(query)) {
    return handleHelp(context);
  }
  
  // ═══════════════════════════════════════════════════════
  // 🚌 PREGUNTAS ESPECÍFICAS DE OPERADOR
  // ═══════════════════════════════════════════════════════
  
  if (context.role === "driver") {
    
    // Preguntas sobre USUARIOS EN RUTA
    if (/cuántos usuarios|usuarios (?:en|hay)|pasajeros|solicitudes|clientes|gente/i.test(query)) {
      return handleDriverUserCount(context);
    }
    
    // Preguntas sobre ASIENTOS
    if (/asiento|capacidad|actualiz.*asiento|cambiar asiento|modificar asiento/i.test(query)) {
      return handleDriverSeats(context);
    }
    
    // Preguntas sobre TRÁFICO o SUGERENCIAS
    if (/tráfico|evitar|sugerencia|recomend|mejor ruta|congest/i.test(query)) {
      return handleDriverTraffic(context, query);
    }
    
    // Preguntas sobre TIEMPO DE RUTA
    if (/cuánto (?:tiempo|tarda)|duración|minutos.*ruta|tiempo.*ruta|completar.*ruta/i.test(query)) {
      return handleDriverRouteTime(context);
    }
    
    // Preguntas sobre ESTADO/ACTIVACIÓN
    if (/cómo activ|activar|estado|disponible|conectar/i.test(query)) {
      return handleDriverStatus(context);
    }
  }
  
  // ═══════════════════════════════════════════════════════
  // 👤 PREGUNTAS ESPECÍFICAS DE USUARIO
  // ═══════════════════════════════════════════════════════
  
  if (context.role === "user") {
    
    // Preguntas sobre COSTO
    if (/cuánto cuesta|precio|tarifa|costo|pagar|cobrar/i.test(query)) {
      return handleUserCost(context, query);
    }
    
    // Preguntas sobre TIEMPO/ETA
    if (/cuánto (?:tarda|tiempo)|demora|minutos|llega|eta/i.test(query)) {
      return handleUserTime(context, query);
    }
    
    // Preguntas sobre UNIDADES DISPONIBLES
    if (/hay unidades|operadores|combis|disponibles|activos/i.test(query)) {
      return handleUserOperators(context);
    }
    
    // Preguntas sobre RUTAS/CÓMO LLEGAR
    if (/(?:qué|cuál) (?:ruta|combi)|cómo llego|llevar|ir a|suger/i.test(query)) {
      return handleUserRoute(context, query);
    }
    
    // Preguntas sobre SOLICITAR
    if (/solicitar|pedir|necesito|busco|quiero/i.test(query)) {
      return handleUserRequest(context);
    }
  }
  
  // ═══════════════════════════════════════════════════════
  // 🤷 RESPUESTA POR DEFECTO
  // ═══════════════════════════════════════════════════════
  
  return handleDefault(context, query);
}

// ═══════════════════════════════════════════════════════════════
// 📊 CONSTRUCCIÓN DE CONTEXTO
// ═══════════════════════════════════════════════════════════════

function buildContext(state, ROUTES, routeStatsCache) {
  const route = state.selectedRouteId ? 
    ROUTES.find(r => r.id === state.selectedRouteId) : null;
  
  const stats = route && routeStatsCache[state.selectedRouteId] ? 
    routeStatsCache[state.selectedRouteId] : null;
  
  // Para operadores: contar usuarios en requestLayers
  let userCount = 0;
  if (state.role === "driver" && state.selectedRouteId) {
    const markers = state.requestLayers.get(state.selectedRouteId) || [];
    userCount = markers.length;
  }
  
  // Para usuarios: contar operadores activos
  let operatorCount = 0;
  if (state.role === "user" && state.selectedRouteId) {
    operatorCount = state.operators[state.selectedRouteId]?.length || 0;
  }
  
  return {
    role: state.role,
    userName: state.session?.name || "Amigo",
    hasRoute: !!route,
    route: route,
    routeName: route?.name,
    routeId: state.selectedRouteId,
    stats: stats,
    hasLocation: !!(state.userMarker || state.driverMarker),
    userCount: userCount,
    operatorCount: operatorCount,
    isDriverActive: state.role === "driver" && state.session?.disponible,
    seats: state.session?.seats || 15,
    allRoutes: ROUTES
  };
}

// ═══════════════════════════════════════════════════════════════
// 🚌 MANEJADORES DE OPERADOR
// ═══════════════════════════════════════════════════════════════

/**
 * 👥 Cuántos usuarios hay en mi ruta
 */
function handleDriverUserCount(ctx) {
  console.log('🎯 Detectado: Pregunta sobre usuarios');
  console.log('📊 Usuarios en ruta:', ctx.userCount);
  
  if (!ctx.hasRoute) {
    return `📋 **Para ver usuarios:**\n\n` +
      `1️⃣ Primero selecciona tu ruta de operación\n` +
      `2️⃣ Luego activa tu estado\n` +
      `3️⃣ Los usuarios aparecerán en el mapa\n\n` +
      `¿En qué ruta vas a operar hoy?`;
  }
  
  if (!ctx.isDriverActive) {
    return `⚠️ **Tu estado está INACTIVO**\n\n` +
      `Para ver usuarios en tiempo real:\n\n` +
      `🔘 Presiona el botón "Cambiar Estado"\n` +
      `✅ Cámbialo a "Activo"\n\n` +
      `Una vez activo, verás los marcadores 👤 de usuarios en tu mapa`;
  }
  
  if (ctx.userCount === 0) {
    return `📊 **Usuarios en "${ctx.routeName}"**\n\n` +
      `👥 Actualmente: **0 usuarios**\n\n` +
      `💡 Cuando haya usuarios solicitando esta ruta,\n` +
      `aparecerán automáticamente como marcadores 👤 en tu mapa.\n\n` +
      `✅ Mantén tu estado activo para recibirlos.`;
  }
  
  return `📊 **Usuarios en "${ctx.routeName}"**\n\n` +
    `👥 Usuarios activos: **${ctx.userCount}**\n\n` +
    `📍 Los ves en el mapa como marcadores azules 👤\n\n` +
    `💡 **Haz clic en un marcador para ver:**\n` +
    `• Nombre del usuario\n` +
    `• Su ubicación exacta\n` +
    `• Hace cuánto solicitó\n\n` +
    `💺 Asientos disponibles: **${ctx.seats}**`;
}

/**
 * 💺 Actualizar asientos
 */
function handleDriverSeats(ctx) {
  console.log('🎯 Detectado: Pregunta sobre asientos');
  
  return `💺 **Gestión de Asientos**\n\n` +
    `📊 Capacidad actual: **${ctx.seats} asientos**\n\n` +
    `🔧 **Para actualizar:**\n\n` +
    `1️⃣ Busca el botón "Actualizar Asientos" en tu panel\n` +
    `2️⃣ Ingresa el número de asientos disponibles (0-15)\n` +
    `3️⃣ Confirma el cambio\n\n` +
    `✅ Los usuarios verán tu capacidad actualizada\n` +
    `en tiempo real.\n\n` +
    `💡 **Tip:** Mantén actualizada tu capacidad\n` +
    `para un mejor servicio.`;
}

/**
 * 🚦 Sugerencias de tráfico
 */
function handleDriverTraffic(ctx, query) {
  console.log('🎯 Detectado: Pregunta sobre tráfico');
  
  // Extraer ubicación mencionada
  const location = extractLocation(query);
  
  let baseResponse = `🚦 **Sugerencias de Tráfico**\n\n`;
  
  if (location) {
    baseResponse += `📍 Para la zona de **${location}**:\n\n`;
  }
  
  baseResponse += 
    `💡 **Recomendaciones generales:**\n\n` +
    `• **Horas pico** (7-9am, 6-8pm): Mayor congestión\n` +
    `• **Vías principales**: Considera rutas alternas\n` +
    `• **Clima**: La lluvia aumenta 30% el tiempo\n\n` +
    `🗺️ **Rutas disponibles:**\n`;
  
  // Listar primeras 3 rutas
  ctx.allRoutes.slice(0, 3).forEach((r, i) => {
    baseResponse += `${i + 1}. ${r.name}\n`;
  });
  
  baseResponse += 
    `\n📊 Selecciona una ruta para ver:\n` +
    `• Tiempo estimado\n` +
    `• Distancia exacta\n` +
    `• Usuarios en esa ruta`;
  
  return baseResponse;
}

/**
 * ⏱️ Tiempo de la ruta
 */
function handleDriverRouteTime(ctx) {
  console.log('🎯 Detectado: Pregunta sobre tiempo de ruta');
  
  if (!ctx.hasRoute) {
    return `⏱️ Para calcular el tiempo de tu ruta:\n\n` +
      `1️⃣ Selecciona tu ruta en el menú\n` +
      `2️⃣ Te mostraré el tiempo completo\n\n` +
      `¿Qué ruta quieres consultar?`;
  }
  
  if (!ctx.stats) {
    return `⏳ Cargando datos de "${ctx.routeName}"...\n\n` +
      `Intenta de nuevo en un momento.`;
  }
  
  const minutes = Math.round(ctx.stats.duration / 60);
  const km = (ctx.stats.distance / 1000).toFixed(1);
  const withTraffic = Math.round(minutes * 1.3);
  
  return `⏱️ **Tiempo de "${ctx.routeName}"**\n\n` +
    `🕐 Tiempo normal: **~${minutes} minutos**\n` +
    `🚦 Con tráfico: **~${withTraffic} minutos**\n` +
    `📏 Distancia: **${km} km**\n\n` +
    `📊 **Desglose aproximado:**\n` +
    `• Sin paradas: ${Math.round(minutes * 0.8)} min\n` +
    `• Con paradas: ${minutes} min\n` +
    `• Hora pico: ${withTraffic} min\n\n` +
    `💡 Estos tiempos son estimados según\n` +
    `condiciones normales de tráfico.`;
}

/**
 * 🔘 Activar estado
 */
function handleDriverStatus(ctx) {
  console.log('🎯 Detectado: Pregunta sobre activación');
  
  if (!ctx.hasRoute) {
    return `📋 **Para activarte:**\n\n` +
      `Primero necesitas seleccionar tu ruta.\n\n` +
      `1️⃣ Selecciona tu ruta en el menú desplegable\n` +
      `2️⃣ Luego podrás activar tu estado\n\n` +
      `¿En qué ruta operarás?`;
  }
  
  if (ctx.isDriverActive) {
    return `✅ **Ya estás ACTIVO**\n\n` +
      `📍 Ruta: "${ctx.routeName}"\n` +
      `👥 Usuarios: ${ctx.userCount}\n` +
      `💺 Asientos: ${ctx.seats}\n\n` +
      `Para desactivarte, presiona el botón\n` +
      `"Cambiar Estado" nuevamente.`;
  }
  
  return `🔘 **Para activarte:**\n\n` +
    `1️⃣ Asegúrate de tener GPS activo\n` +
    `2️⃣ Presiona el botón "Cambiar Estado"\n` +
    `3️⃣ Tu estado cambiará a "Activo" ✅\n\n` +
    `Una vez activo:\n` +
    `• Los usuarios te verán en el mapa 🗺️\n` +
    `• Verás usuarios solicitando tu ruta 👤\n` +
    `• Tu ubicación se actualizará en tiempo real\n\n` +
    `📍 Ruta seleccionada: "${ctx.routeName}"`;
}

// ═══════════════════════════════════════════════════════════════
// 👤 MANEJADORES DE USUARIO
// ═══════════════════════════════════════════════════════════════

/**
 * 💰 Costo de viaje
 */
function handleUserCost(ctx, query) {
  console.log('🎯 Detectado: Pregunta sobre costo');
  
  const destination = extractDestination(query);
  
  if (!ctx.hasRoute) {
    if (destination) {
      const route = findRouteByDestination(destination, ctx.allRoutes);
      if (route) {
        return `📍 Para llegar a **${destination}**:\n\n` +
          `🚌 Te recomiendo: "${route.name}"\n\n` +
          `Selecciónala en el menú y te calcularé\n` +
          `el costo exacto del viaje.`;
      }
    }
    
    return `💰 **Sistema de Tarifas**\n\n` +
      `📊 Cálculo:\n` +
      `• Base: $10 MXN\n` +
      `• Por kilómetro: $1 MXN\n\n` +
      `Para calcular tu viaje exacto:\n` +
      `1️⃣ Selecciona tu ruta de destino\n` +
      `2️⃣ Te diré el costo preciso\n\n` +
      `¿A dónde vas?`;
  }
  
  if (!ctx.stats) {
    return `⏳ Cargando datos de ruta...\nIntenta en un momento.`;
  }
  
  const km = (ctx.stats.distance / 1000).toFixed(1);
  const base = 10;
  const perKm = 1;
  const total = Math.round(base + parseFloat(km) * perKm);
  
  return `💰 **Costo de "${ctx.routeName}"**\n\n` +
    `📏 Distancia: **${km} km**\n` +
    `💵 Base: $${base} MXN\n` +
    `📊 Distancia: $${(parseFloat(km) * perKm).toFixed(0)} MXN\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `💳 **Total: $${total} MXN**\n\n` +
    `✅ Pago en efectivo al operador\n` +
    `🚌 Unidades disponibles: ${ctx.operatorCount}`;
}

/**
 * ⏱️ Tiempo de viaje
 */
function handleUserTime(ctx, query) {
  console.log('🎯 Detectado: Pregunta sobre tiempo');
  
  if (!ctx.hasRoute || !ctx.stats) {
    return `⏱️ Para calcular el tiempo:\n\n` +
      `Selecciona primero tu ruta de destino.\n\n` +
      `¿A dónde te diriges?`;
  }
  
  const minutes = Math.round(ctx.stats.duration / 60);
  const km = (ctx.stats.distance / 1000).toFixed(1);
  
  return `⏱️ **Tiempo de "${ctx.routeName}"**\n\n` +
    `🕐 Duración: **~${minutes} minutos**\n` +
    `📏 Distancia: **${km} km**\n\n` +
    `🚌 Unidades disponibles: **${ctx.operatorCount}**\n\n` +
    `✅ Tiempo en condiciones normales`;
}

/**
 * 🚌 Operadores disponibles
 */
function handleUserOperators(ctx) {
  console.log('🎯 Detectado: Pregunta sobre operadores');
  
  if (!ctx.hasRoute) {
    return `🚌 Para ver unidades disponibles:\n\n` +
      `1️⃣ Selecciona tu ruta\n` +
      `2️⃣ Verás los operadores activos\n\n` +
      `¿A dónde vas?`;
  }
  
  if (ctx.operatorCount === 0) {
    return `⚠️ **No hay unidades activas**\n` +
      `en "${ctx.routeName}" ahora.\n\n` +
      `💡 Sugerencias:\n` +
      `• Espera unos minutos\n` +
      `• Prueba en horas pico (7-9am, 6-8pm)\n` +
      `• Considera otra ruta cercana`;
  }
  
  return `🚌 **Unidades en "${ctx.routeName}"**\n\n` +
    `✅ Operadores activos: **${ctx.operatorCount}**\n\n` +
    `📍 Los ves en el mapa con marcadores verdes 🚌\n\n` +
    `💡 Haz clic en un marcador para ver:\n` +
    `• Número de unidad\n` +
    `• Placa del vehículo\n` +
    `• Asientos disponibles\n\n` +
    `🎯 Presiona "Solicitar Unidad" cuando estés listo`;
}

/**
 * 🗺️ Sugerencia de ruta
 */
function handleUserRoute(ctx, query) {
  console.log('🎯 Detectado: Pregunta sobre ruta');
  
  const destination = extractDestination(query);
  
  if (!destination) {
    return `🗺️ **¿A dónde vas?**\n\n` +
      `Puedo sugerirte rutas hacia:\n\n` +
      `• Suburbano\n` +
      `• Dorado\n` +
      `• Quebrada\n` +
      `• Jilotepec\n` +
      `• Huehuetoca\n\n` +
      `Dime tu destino y te sugiero la mejor ruta.`;
  }
  
  const route = findRouteByDestination(destination, ctx.allRoutes);
  
  if (!route) {
    return `❌ No encontré rutas directas a "${destination}".\n\n` +
      `¿Podrías ser más específico?`;
  }
  
  return `✅ **Te sugiero:** "${route.name}"\n\n` +
    `📍 Esta ruta pasa por ${destination}\n\n` +
    `🎯 **Selecciónala en el menú para ver:**\n` +
    `• Operadores disponibles\n` +
    `• Costo del viaje\n` +
    `• Tiempo estimado`;
}

/**
 * 📞 Solicitar unidad
 */
function handleUserRequest(ctx) {
  console.log('🎯 Detectado: Solicitar unidad');
  
  if (!ctx.hasRoute) {
    return `📍 **Para solicitar una unidad:**\n\n` +
      `1️⃣ Selecciona tu ruta de destino\n` +
      `2️⃣ Presiona "Solicitar Unidad"\n` +
      `3️⃣ Los operadores te verán en el mapa\n\n` +
      `¿A dónde necesitas ir?`;
  }
  
  if (ctx.operatorCount === 0) {
    return `⚠️ No hay unidades activas en\n` +
      `"${ctx.routeName}" en este momento.\n\n` +
      `💡 Intenta:\n` +
      `• Esperar unos minutos\n` +
      `• Otra ruta cercana`;
  }
  
  return `✅ **Listo para solicitar**\n\n` +
    `🚌 Unidades disponibles: **${ctx.operatorCount}**\n\n` +
    `🎯 **Presiona el botón "Solicitar Unidad" y:**\n` +
    `• Los operadores verán tu ubicación 📍\n` +
    `• Sabrán que necesitas transporte\n` +
    `• Podrán llegar a recogerte\n\n` +
    `📍 Ruta: "${ctx.routeName}"`;
}

// ═══════════════════════════════════════════════════════════════
// 💬 SALUDOS Y AYUDA
// ═══════════════════════════════════════════════════════════════

function handleGreeting(ctx) {
  const greetings = [
    `¡Hola ${ctx.userName}! 👋`,
    `¡Qué gusto verte!`,
    `¡Buenos días! 🌅`
  ];
  
  const greeting = randomChoice(greetings);
  
  if (ctx.role === "driver") {
    if (!ctx.hasRoute) {
      return `${greeting}\n\nPara empezar, selecciona tu ruta de operación.`;
    }
    if (!ctx.isDriverActive) {
      return `${greeting}\n\nRuta "${ctx.routeName}" seleccionada.\n¿Listo para activarte?`;
    }
    return `${greeting}\n\n✅ Activo en "${ctx.routeName}"\n👥 Usuarios: ${ctx.userCount}`;
  } else {
    if (!ctx.hasRoute) {
      return `${greeting}\n\n¿A dónde te diriges hoy?`;
    }
    return `${greeting}\n\n📍 "${ctx.routeName}"\n🚌 Unidades: ${ctx.operatorCount}`;
  }
}

function handleHelp(ctx) {
  if (ctx.role === "driver") {
    return `🚌 **Asistente para Operadores**\n\n` +
      `Puedo ayudarte con:\n\n` +
      `• "¿Cuántos usuarios hay?"\n` +
      `• "¿Cómo actualizo asientos?"\n` +
      `• "¿Cuánto tiempo toma la ruta?"\n` +
      `• "Sugerencias de tráfico"\n` +
      `• "¿Cómo me activo?"`;
  } else {
    return `👤 **Asistente de Transporte**\n\n` +
      `Puedo ayudarte con:\n\n` +
      `• "¿Cuánto cuesta?"\n` +
      `• "¿Cuánto tarda?"\n` +
      `• "¿Hay unidades disponibles?"\n` +
      `• "¿Qué ruta me lleva a...?"\n` +
      `• "Quiero solicitar unidad"`;
  }
}

function handleDefault(ctx, query) {
  if (ctx.role === "driver") {
    return `💬 No entendí bien la pregunta.\n\n` +
      `💡 Prueba preguntarme:\n` +
      `• "¿Cuántos usuarios hay?"\n` +
      `• "¿Cómo actualizo asientos?"\n` +
      `• "¿Cuánto tiempo toma mi ruta?"`;
  } else {
    return `💬 No entendí bien la pregunta.\n\n` +
      `💡 Prueba preguntarme:\n` +
      `• "¿Cuánto cuesta?"\n` +
      `• "¿Hay unidades disponibles?"\n` +
      `• "¿Qué ruta me lleva a...?"`;
  }
}

// ═══════════════════════════════════════════════════════════════
// 🛠️ FUNCIONES AUXILIARES
// ═══════════════════════════════════════════════════════════════

function extractDestination(query) {
  const destinations = {
    'suburbano': /suburbano|tren/i,
    'dorado': /dorado|el dorado/i,
    'quebrada': /quebrada|la quebrada/i,
    'jilotepec': /jilotepec/i,
    'teoloyucan': /teoloyucan/i,
    'huehuetoca': /huehuetoca/i
  };
  
  for (const [dest, regex] of Object.entries(destinations)) {
    if (regex.test(query)) return dest;
  }
  
  return null;
}

function extractLocation(query) {
  const locations = ['dorado', 'quebrada', 'jilotepec', 'huehuetoca', 'suburbano', 'teoloyucan'];
  
  for (const loc of locations) {
    if (query.includes(loc)) {
      return loc.charAt(0).toUpperCase() + loc.slice(1);
    }
  }
  
  return null;
}

function findRouteByDestination(destination, routes) {
  return routes.find(r => 
    r.name.toLowerCase().includes(destination) ||
    r.destinationLabel?.toLowerCase().includes(destination)
  );
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

console.log('🤖 Asistente IA mejorado cargado correctamente ✅');
