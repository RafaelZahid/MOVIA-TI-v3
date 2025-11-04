/**
 * ═══════════════════════════════════════════════════════════════
 * 🤖 ASISTENTE IA CONTEXTUAL CON PROMPT ENGINEERING
 * 
 * Sistema de chat inteligente diseñado específicamente para Movia TI
 * que comprende su rol como asistente virtual de transporte
 * ═══════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════
// 📋 PROMPT DEL SISTEMA - Define quién es y qué hace la IA
// ═══════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `
Eres el Asistente Virtual de Movia TI, un sistema de transporte público en el Estado de México (zona Cuautitlán Izcalli y Huehuetoca).

TU ROL:
- Asistente amigable y profesional para usuarios y operadores
- Experto en rutas, tarifas, tiempos y funcionamiento del sistema
- Proporcionas información clara, precisa y contextual
- SIEMPRE basas tus respuestas en el contexto actual del usuario

CARACTERÍSTICAS DEL SISTEMA MOVIA TI:
- Sistema de transporte con rutas predefinidas
- Operadores (conductores) que se activan y desactivan
- Usuarios que solicitan unidades y ven operadores en tiempo real
- Mapa interactivo con ubicaciones GPS en vivo
- Tarifas: $10 pesos base + $1 peso por kilómetro
- Capacidad: hasta 15 pasajeros por unidad

PARA OPERADORES (conductores):
- Deben seleccionar su ruta de operación
- Deben activar su estado para ser visibles
- Pueden ver usuarios que solicitan en su ruta
- Pueden actualizar asientos disponibles
- Ven marcadores 👤 de usuarios en el mapa

PARA USUARIOS (pasajeros):
- Deben seleccionar su ruta de destino
- Presionan "Solicitar Unidad" para aparecer en mapa de operadores
- Ven marcadores 🚌 de unidades activas
- Pueden consultar costos y tiempos

TU COMPORTAMIENTO:
1. SIEMPRE analiza el contexto proporcionado
2. Si es operador, enfócate en ayudarlo con usuarios, asientos, activación
3. Si es usuario, enfócate en rutas, costos, unidades disponibles
4. Sé específico y da instrucciones paso a paso
5. Usa emojis para claridad visual
6. NUNCA inventes información que no está en el contexto
`;

// ═══════════════════════════════════════════════════════════════
// 🧠 MOTOR DE PROCESAMIENTO DE LENGUAJE NATURAL
// ═══════════════════════════════════════════════════════════════

/**
 * Función principal que procesa la pregunta con contexto completo
 */
export async function smartReply(userQuestion, ctx) {
  const { state, ROUTES, routeStatsCache } = ctx;
  
  // 1. Construir contexto completo
  const context = buildDetailedContext(state, ROUTES, routeStatsCache);
  
  // 2. Crear prompt completo con contexto
  const fullPrompt = buildPrompt(userQuestion, context);
  
  console.log('═══════════════════════════════════════');
  console.log('🤖 ASISTENTE IA PROCESANDO');
  console.log('═══════════════════════════════════════');
  console.log('📝 Pregunta:', userQuestion);
  console.log('👤 Rol:', context.role);
  console.log('📍 Ruta:', context.routeName || 'Sin ruta');
  console.log('🔢 Usuarios:', context.userCount);
  console.log('🚌 Operadores:', context.operatorCount);
  console.log('═══════════════════════════════════════');
  
  // 3. Procesar con el motor de NLP
  const response = processWithNLP(fullPrompt, context, userQuestion);
  
  console.log('✅ Respuesta generada');
  console.log('═══════════════════════════════════════');
  
  return response;
}

// ═══════════════════════════════════════════════════════════════
// 🏗️ CONSTRUCCIÓN DE CONTEXTO DETALLADO
// ═══════════════════════════════════════════════════════════════

function buildDetailedContext(state, ROUTES, routeStatsCache) {
  const route = state.selectedRouteId ? 
    ROUTES.find(r => r.id === state.selectedRouteId) : null;
  
  const stats = route && routeStatsCache[state.selectedRouteId] ? 
    routeStatsCache[state.selectedRouteId] : null;
  
  // Contar usuarios (para operadores)
  let userCount = 0;
  if (state.role === "driver" && state.selectedRouteId) {
    const markers = state.requestLayers?.get(state.selectedRouteId) || [];
    userCount = markers.length;
  }
  
  // Contar operadores (para usuarios)
  let operatorCount = 0;
  if (state.role === "user" && state.selectedRouteId) {
    operatorCount = state.operators?.[state.selectedRouteId]?.length || 0;
  }
  
  // Calcular datos de la ruta
  let routeData = null;
  if (stats) {
    const km = (stats.distance / 1000).toFixed(1);
    const minutes = Math.round(stats.duration / 60);
    const cost = Math.round(10 + parseFloat(km));
    
    routeData = {
      distance: km,
      time: minutes,
      cost: cost
    };
  }
  
  return {
    role: state.role, // "driver" o "user"
    roleName: state.role === "driver" ? "Operador" : "Usuario",
    userName: state.session?.name || "Usuario",
    hasRoute: !!route,
    route: route,
    routeName: route?.name,
    routeId: state.selectedRouteId,
    routeData: routeData,
    hasLocation: !!(state.userMarker || state.driverMarker),
    userCount: userCount,
    operatorCount: operatorCount,
    isDriverActive: state.role === "driver" && state.session?.disponible,
    driverStatus: state.role === "driver" ? 
      (state.session?.disponible ? "ACTIVO" : "INACTIVO") : null,
    seats: state.session?.seats || 15,
    allRoutes: ROUTES,
    totalRoutes: ROUTES.length
  };
}

// ═══════════════════════════════════════════════════════════════
// 📝 CONSTRUCCIÓN DEL PROMPT COMPLETO
// ═══════════════════════════════════════════════════════════════

function buildPrompt(userQuestion, context) {
  let prompt = SYSTEM_PROMPT + `\n\n`;
  
  prompt += `CONTEXTO ACTUAL DEL ${context.roleName.toUpperCase()}:\n`;
  prompt += `- Nombre: ${context.userName}\n`;
  prompt += `- Rol: ${context.roleName}\n`;
  
  if (context.role === "driver") {
    prompt += `- Estado: ${context.driverStatus}\n`;
    prompt += `- Ruta asignada: ${context.routeName || "Sin asignar"}\n`;
    prompt += `- Usuarios en mi ruta: ${context.userCount}\n`;
    prompt += `- Asientos disponibles: ${context.seats}\n`;
    
    if (context.routeData) {
      prompt += `- Distancia de mi ruta: ${context.routeData.distance} km\n`;
      prompt += `- Tiempo de mi ruta: ${context.routeData.time} minutos\n`;
    }
    
    if (!context.hasRoute) {
      prompt += `⚠️ IMPORTANTE: Este operador AÚN NO ha seleccionado su ruta\n`;
    }
    if (!context.isDriverActive) {
      prompt += `⚠️ IMPORTANTE: Este operador está INACTIVO, no puede ver usuarios\n`;
    }
  } else {
    prompt += `- Ruta seleccionada: ${context.routeName || "Sin seleccionar"}\n`;
    prompt += `- Unidades disponibles: ${context.operatorCount}\n`;
    
    if (context.routeData) {
      prompt += `- Costo estimado: $${context.routeData.cost} MXN\n`;
      prompt += `- Tiempo estimado: ${context.routeData.time} minutos\n`;
      prompt += `- Distancia: ${context.routeData.distance} km\n`;
    }
    
    if (!context.hasRoute) {
      prompt += `⚠️ IMPORTANTE: Este usuario AÚN NO ha seleccionado su ruta\n`;
    }
  }
  
  prompt += `\nPREGUNTA DEL ${context.roleName.toUpperCase()}:\n`;
  prompt += `"${userQuestion}"\n\n`;
  
  prompt += `INSTRUCCIONES PARA TU RESPUESTA:\n`;
  prompt += `1. Lee cuidadosamente el contexto\n`;
  prompt += `2. Identifica qué está preguntando específicamente\n`;
  prompt += `3. Responde basándote SOLO en el contexto proporcionado\n`;
  prompt += `4. Si falta información, guía al usuario sobre qué hacer primero\n`;
  prompt += `5. Usa formato claro con emojis y saltos de línea\n`;
  prompt += `6. Sé específico y da pasos concretos\n\n`;
  
  return prompt;
}

// ═══════════════════════════════════════════════════════════════
// 🎯 MOTOR DE PROCESAMIENTO NLP (Natural Language Processing)
// ═══════════════════════════════════════════════════════════════

function processWithNLP(fullPrompt, context, question) {
  const q = question.toLowerCase().trim();
  
  // ═══════════════════════════════════════════════════════
  // CATEGORIZACIÓN DE INTENCIÓN
  // ═══════════════════════════════════════════════════════
  
  const intent = detectIntent(q, context);
  
  console.log('🎯 Intención detectada:', intent);
  
  // ═══════════════════════════════════════════════════════
  // GENERACIÓN DE RESPUESTA SEGÚN INTENCIÓN Y CONTEXTO
  // ═══════════════════════════════════════════════════════
  
  switch (intent) {
    case 'driver_user_count':
      return respondDriverUserCount(context);
    
    case 'driver_seats':
      return respondDriverSeats(context);
    
    case 'driver_activation':
      return respondDriverActivation(context);
    
    case 'driver_route_time':
      return respondDriverRouteTime(context);
    
    case 'driver_traffic':
      return respondDriverTraffic(context, q);
    
    case 'user_cost':
      return respondUserCost(context, q);
    
    case 'user_time':
      return respondUserTime(context, q);
    
    case 'user_operators':
      return respondUserOperators(context);
    
    case 'user_route_suggestion':
      return respondUserRouteSuggestion(context, q);
    
    case 'user_request':
      return respondUserRequest(context);
    
    case 'greeting':
      return respondGreeting(context);
    
    case 'help':
      return respondHelp(context);
    
    default:
      return respondDefault(context, q);
  }
}

// ═══════════════════════════════════════════════════════════════
// 🔍 DETECTOR DE INTENCIONES MEJORADO
// ═══════════════════════════════════════════════════════════════

function detectIntent(query, context) {
  // Normalizar query
  const q = query.toLowerCase().replace(/[¿?¡!]/g, '');
  
  // ═══════════════════════════════════════════════════════
  // SALUDOS (universal)
  // ═══════════════════════════════════════════════════════
  if (/^(hola|buenos|buenas|hey|qué tal|saludos|buen día|hi|hello)/i.test(q)) {
    return 'greeting';
  }
  
  // ═══════════════════════════════════════════════════════
  // AYUDA (universal)
  // ═══════════════════════════════════════════════════════
  if (/(ayuda|qué puedes|cómo funciona|para qué|qué haces|ayúdame)/i.test(q)) {
    return 'help';
  }
  
  // ═══════════════════════════════════════════════════════
  // INTENCIONES ESPECÍFICAS DE OPERADOR
  // ═══════════════════════════════════════════════════════
  if (context.role === "driver") {
    
    // Usuarios en ruta
    if (/(cuántos usuarios|usuarios (?:hay|en|tengo)|pasajeros|solicitudes|cuánta gente|personas en|clientes)/i.test(q)) {
      return 'driver_user_count';
    }
    
    // Asientos
    if (/(asientos?|capacidad|actualizar asientos?|cambiar asientos?|modificar asientos?|cuántos asientos?)/i.test(q)) {
      return 'driver_seats';
    }
    
    // Activación/Estado
    if (/(cómo (?:me )?activ|activar(?:me)?|estado|desactiv|cambiar estado|poner(?:me)? activ)/i.test(q)) {
      return 'driver_activation';
    }
    
    // Tiempo de ruta
    if (/(cuánto (?:tiempo|tarda|demora)|tiempo (?:de|toma)|duración (?:de )?(?:la |mi )?ruta|minutos (?:de )?(?:la |mi )?ruta)/i.test(q)) {
      return 'driver_route_time';
    }
    
    // Tráfico
    if (/(tráfico|evitar|congestión|sugerencia|recomendación|mejor ruta|ruta alterna)/i.test(q)) {
      return 'driver_traffic';
    }
  }
  
  // ═══════════════════════════════════════════════════════
  // INTENCIONES ESPECÍFICAS DE USUARIO
  // ═══════════════════════════════════════════════════════
  if (context.role === "user") {
    
    // Costo
    if (/(cuánto cuesta|precio|tarifa|costo|cuánto (?:me )?cobr|cuánto pag|cuánto vale)/i.test(q)) {
      return 'user_cost';
    }
    
    // Tiempo
    if (/(cuánto (?:tiempo|tarda|demora)|tiempo (?:de viaje|estimado)|minutos?|eta|llegar)/i.test(q)) {
      return 'user_time';
    }
    
    // Operadores disponibles
    if (/(hay (?:unidades|operadores|combis)|unidades (?:disponibles|activas)|operadores (?:disponibles|activos)|cuántas unidades)/i.test(q)) {
      return 'user_operators';
    }
    
    // Sugerencia de ruta
    if (/(qué ruta|cuál ruta|ruta (?:me lleva|para|hacia)|cómo llego|llevar(?:me)? a|ir a|mejor ruta)/i.test(q)) {
      return 'user_route_suggestion';
    }
    
    // Solicitar
    if (/(solicitar|pedir|necesito|busco|quiero (?:una )?unidad)/i.test(q)) {
      return 'user_request';
    }
  }
  
  return 'unknown';
}

// ═══════════════════════════════════════════════════════════════
// 💬 GENERADORES DE RESPUESTAS
// ═══════════════════════════════════════════════════════════════

function respondDriverUserCount(ctx) {
  if (!ctx.hasRoute) {
    return ` **No puedo mostrarte usuarios aún**\n\n` +
      `❌ Aún no has seleccionado tu ruta de operación.\n\n` +
      `**Pasos para ver usuarios:**\n` +
      `1️⃣ Selecciona tu ruta en el menú desplegable\n` +
      `2️⃣ Activa tu estado presionando "Cambiar Estado"\n` +
      `3️⃣ Los usuarios aparecerán automáticamente en tu mapa\n\n` +
      `💡 Una vez activo, verás marcadores 👤 azules de usuarios que solicitan tu ruta.`;
  }
  
  if (!ctx.isDriverActive) {
    return `⚠️ **Tu estado está INACTIVO**\n\n` +
      `No puedes ver usuarios porque no estás activo.\n\n` +
      `**Para activarte:**\n` +
      ` Presiona el botón "Cambiar Estado"\n` +
      ` Tu estado cambiará a "Activo"\n\n` +
      `Una vez activo, los usuarios que soliciten "${ctx.routeName}" aparecerán en tu mapa con marcadores 👤`;
  }
  
  if (ctx.userCount === 0) {
    return ` **Usuarios en "${ctx.routeName}"**\n\n` +
      ` Actualmente: **0 usuarios**\n\n` +
      ` Estás activo y visible para usuarios\n` +
      ` Cuando un usuario solicite esta ruta, aparecerá automáticamente en tu mapa\n\n` +
      ` **Recuerda:**\n` +
      `• Los usuarios te ven en el mapa \n` +
      `• Tu ubicación se actualiza en tiempo real\n` +
      `• Asientos disponibles: ${ctx.seats}`;
  }
  
  return ` **Usuarios activos en "${ctx.routeName}"**\n\n` +
    ` **Total: ${ctx.userCount} usuario(s)**\n\n` +
    ` Los ves en el mapa como marcadores azules 👤\n\n` +
    `**Haz clic en un marcador para ver:**\n` +
    `• Nombre del usuario\n` +
    `• Su ubicación exacta\n` +
    `• Hace cuánto solicitó\n\n` +
    ` Asientos disponibles: **${ctx.seats}**\n` +
    ` Tu unidad está visible para todos ellos`;
}

function respondDriverSeats(ctx) {
  return ` **Gestión de Asientos**\n\n` +
    ` **Capacidad actual: ${ctx.seats} asientos**\n\n` +
    `**Para actualizar:**\n\n` +
    `1️⃣ Busca el botón **"Actualizar Asientos"** en tu panel superior\n` +
    `2️⃣ Haz clic en él\n` +
    `3️⃣ Ingresa el número de asientos disponibles (0-15)\n` +
    `4️⃣ Confirma el cambio\n\n` +
    ` Los usuarios verán tu capacidad actualizada en tiempo real\n\n` +
    ` **Tip:** Actualiza tus asientos cada vez que suban o bajen pasajeros para dar un mejor servicio`;
}

function respondDriverActivation(ctx) {
  if (!ctx.hasRoute) {
    return `❌ **No puedes activarte aún**\n\n` +
    `Primero necesitas seleccionar tu ruta de operación.\n\n` +
      `**Pasos:**\n` +
      `1️⃣ Ve al menú desplegable "Ruta"\n` +
      `2️⃣ Selecciona tu ruta\n` +
      `3️⃣ Luego presiona "Cambiar Estado"\n\n` +
      `💡 Sin ruta asignada, los usuarios no sabrán dónde encontrarte`;
  }
  
  if (ctx.isDriverActive) {
    return ` **Ya estás ACTIVO**\n\n` +
      ` **Estado actual:**\n` +
      `• Estado: ACTIVO \n` +
      `• Ruta: "${ctx.routeName}"\n` +
      `• Usuarios en ruta: ${ctx.userCount}\n` +
      `• Asientos: ${ctx.seats}\n\n` +
      ` Los usuarios te ven en el mapa como un marcador verde \n\n` +
      `**Para desactivarte:**\n` +
      `Presiona el botón "Cambiar Estado" nuevamente`;
  }
  
  return ` **Instrucciones para activarte**\n\n` +
    `Tu ruta ya está seleccionada: "${ctx.routeName}"\n\n` +
    `**Pasos:**\n` +
    `1️⃣ Asegúrate de tener GPS activo\n` +
    `2️⃣ Presiona el botón **"Cambiar Estado"**\n` +
    `3️⃣ Tu estado cambiará a "Activo" \n\n` +
    `**Una vez activo:**\n` +
    ` Aparecerás en el mapa de usuarios\n` +
    ` Verás usuarios solicitando tu ruta\n` +
    ` Tu ubicación se actualizará automáticamente`;
}

function respondDriverRouteTime(ctx) {
  if (!ctx.hasRoute) {
    return `⏱ **Para calcular el tiempo:**\n\n` +
      `Primero selecciona tu ruta en el menú.\n\n` +
      `Una vez seleccionada, te mostraré el tiempo completo del recorrido.`;
  }
  
  if (!ctx.routeData) {
    return ` Cargando datos de "${ctx.routeName}"...\n\nIntenta de nuevo en un momento.`;
  }
  
  const withTraffic = Math.round(ctx.routeData.time * 1.3);
  
  return `⏱ **Tiempo de "${ctx.routeName}"**\n\n` +
    ` **Tiempo normal: ~${ctx.routeData.time} minutos**\n` +
    ` Con tráfico: ~${withTraffic} minutos\n` +
    ` Distancia total: ${ctx.routeData.distance} km\n\n` +
    `**Desglose aproximado:**\n` +
    `• Sin paradas: ${Math.round(ctx.routeData.time * 0.8)} min\n` +
    `• Con paradas normales: ${ctx.routeData.time} min\n` +
    `• En hora pico: ${withTraffic} min\n\n` +
    ` Estos tiempos son estimados según condiciones normales`;
}

function respondDriverTraffic(ctx, query) {
  const location = extractLocation(query);
  
  let response = ` **Sugerencias de Tráfico**\n\n`;
  
  if (location) {
    response += ` Zona consultada: **${location}**\n\n`;
  }
  
  response += 
    ` **Recomendaciones generales:**\n\n` +
    ` **Horas pico** (7-9am, 2-3pm, 6-8pm)\n` +
    `   Mayor congestión en vías principales\n\n` +
    ` **Clima**\n` +
    `   La lluvia aumenta 30% el tiempo\n\n` +
    ` **Rutas alternas**\n` +
    `   Considera vías secundarias en hora pico\n\n`;
  
  if (ctx.hasRoute) {
    response += `📍 Tu ruta actual: "${ctx.routeName}"\n`;
    if (ctx.routeData) {
      response += ` Tiempo normal: ${ctx.routeData.time} min\n`;
      response += ` Con tráfico: ~${Math.round(ctx.routeData.time * 1.3)} min`;
    }
  }
  
  return response;
}

function respondUserCost(ctx, query) {
  if (!ctx.hasRoute) {
    const dest = extractDestination(query);
    
    if (dest) {
      const route = findRouteByDestination(dest, ctx.allRoutes);
      if (route) {
        return ` **Para llegar a ${dest}:**\n\n` +
          `Te recomiendo: "${route.name}"\n\n` +
          `**Siguiente paso:**\n` +
          `Selecciónala en el menú y te calcularé el costo exacto.`;
      }
    }
    
    return ` **Sistema de Tarifas de Movia TI**\n\n` +
      ` Cálculo:\n` +
      `• Tarifa base: $10 MXN\n` +
      `• Por cada kilómetro: $1 MXN\n\n` +
      `**Para calcular tu viaje:**\n` +
      `1️⃣ Selecciona tu ruta de destino en el menú\n` +
      `2️⃣ Te mostraré el costo exacto\n\n` +
      `¿A dónde necesitas ir?`;
  }
  
  if (!ctx.routeData) {
    return ` Cargando información de ruta...\nIntenta en un momento.`;
  }
  
  return ` **Costo de "${ctx.routeName}"**\n\n` +
    ` Distancia: **${ctx.routeData.distance} km**\n` +
    ` Tarifa base: $10 MXN\n` +
    ` Por distancia: $${(parseFloat(ctx.routeData.distance)).toFixed(0)} MXN\n` +
    `\n` +
    ` **TOTAL: $${ctx.routeData.cost} MXN**\n\n` +
    ` Pago en efectivo al operador\n` +
    ` Unidades disponibles: ${ctx.operatorCount}`;
}

function respondUserTime(ctx, query) {
  if (!ctx.hasRoute || !ctx.routeData) {
    return ` **Para calcular el tiempo:**\n\n` +
      `Primero selecciona tu ruta de destino.\n\n` +
      `¿A dónde te diriges?`;
  }
  
  return ` **Tiempo de "${ctx.routeName}"**\n\n` +
    ` Duración: **~${ctx.routeData.time} minutos**\n` +
    ` Distancia: **${ctx.routeData.distance} km**\n\n` +
    ` Unidades disponibles: **${ctx.operatorCount}**\n\n` +
    ` En condiciones normales de tráfico`;
}

function respondUserOperators(ctx) {
  if (!ctx.hasRoute) {
    return ` **Para ver unidades disponibles:**\n\n` +
      `1️⃣ Selecciona tu ruta de destino\n` +
      `2️⃣ Verás los operadores activos en el mapa\n\n` +
      `¿A dónde vas?`;
  }
  
  if (ctx.operatorCount === 0) {
    return `⚠️ **No hay unidades activas**\n` +
      `en "${ctx.routeName}" en este momento.\n\n` +
      `💡 **Sugerencias:**\n` +
      `• Espera unos minutos\n` +
      `• Las unidades suelen estar activas en horas pico\n` +
      `• Considera otra ruta cercana`;
  }
  
  return ` **Unidades en "${ctx.routeName}"**\n\n` +
    ` **Operadores activos: ${ctx.operatorCount}**\n\n` +
    ` Los ves en el mapa con marcadores verdes \n\n` +
    `**Haz clic en un marcador para ver:**\n` +
    `• Número de unidad\n` +
    `• Placa del vehículo\n` +
    `• Asientos disponibles\n\n` +
    ` Presiona "Solicitar Unidad" cuando estés listo`;
}

function respondUserRouteSuggestion(ctx, query) {
  const dest = extractDestination(query);
  
  if (!dest) {
    return ` **¿A dónde necesitas ir?**\n\n` +
      `Puedo sugerirte rutas hacia:\n\n` +
      `• Suburbano\n` +
      `• Dorado\n` +
      `• Quebrada\n` +
      `• Jilotepec\n` +
      `• Huehuetoca\n\n` +
      `Dime tu destino y te sugiero la mejor ruta.`;
  }
  
  const route = findRouteByDestination(dest, ctx.allRoutes);
  
  if (!route) {
    return ` No encontré rutas directas a "${dest}".\n\n` +
      `¿Podrías ser más específico con el destino?`;
  }
  
  return ` **Te recomiendo: "${route.name}"**\n\n` +
    ` Esta ruta pasa por ${dest}\n\n` +
    `**Siguiente paso:**\n` +
    `Selecciónala en el menú para ver:\n` +
    `•  Operadores disponibles\n` +
    `•  Costo del viaje\n` +
    `•  Tiempo estimado`;
}

function respondUserRequest(ctx) {
  if (!ctx.hasRoute) {
    return ` **Para solicitar una unidad:**\n\n` +
      `1️⃣ Selecciona tu ruta de destino en el menú\n` +
      `2️⃣ Presiona el botón "Solicitar Unidad"\n` +
      `3️⃣ Los operadores te verán en su mapa\n\n` +
      `¿A dónde necesitas ir?`;
  }
  
  if (ctx.operatorCount === 0) {
    return `⚠️ **No hay unidades activas** en\n` +
      `"${ctx.routeName}" en este momento.\n\n` +
      `💡 **Intenta:**\n` +
      `• Esperar unos minutos\n` +
      `• Revisar otra ruta cercana`;
  }
  
  return ` **Listo para solicitar en "${ctx.routeName}"**\n\n` +
    ` Unidades disponibles: **${ctx.operatorCount}**\n\n` +
    `**Presiona "Solicitar Unidad" para:**\n` +
    `✓ Aparecer en el mapa de operadores\n` +
    `✓ Mostrar tu ubicación exacta\n` +
    `✓ Que puedan llegar a recogerte\n\n` +
    ` Asegúrate de tener GPS activo`;
}

function respondGreeting(ctx) {
  const greetings = [
    `¡Hola ${ctx.userName}! `,
    `¡Qué gusto verte, ${ctx.userName}!`,
    `¡Hola! Soy tu asistente de Movia TI 🚌`
  ];
  
  const greeting = randomChoice(greetings);
  
  if (ctx.role === "driver") {
    if (!ctx.hasRoute) {
      return `${greeting}\n\n Para empezar, selecciona tu ruta de operación en el menú.\n\n💡 Una vez seleccionada, podrás activarte y ver usuarios.`;
    }
    if (!ctx.isDriverActive) {
      return `${greeting}\n\n Ruta seleccionada: "${ctx.routeName}"\n\n ¿Listo para activarte y empezar a operar?`;
    }
    return `${greeting}\n\n **Estás activo en "${ctx.routeName}"**\n Usuarios: ${ctx.userCount}\n Asientos: ${ctx.seats}`;
  } else {
    if (!ctx.hasRoute) {
      return `${greeting}\n\n¿A dónde te diriges hoy? \n\nSelecciona una ruta y te mostraré las unidades disponibles.`;
    }
    return `${greeting}\n\n Ruta: "${ctx.routeName}"\n Unidades: ${ctx.operatorCount}\n\n¿Necesitas saber el costo o tiempo?`;
  }
}

function respondHelp(ctx) {
  if (ctx.role === "driver") {
    return ` **Asistente para Operadores**\n\n` +
      `Soy tu asistente virtual. Puedo ayudarte con:\n\n` +
      ` **Información de servicio**\n` +
      `• "¿Cuántos usuarios hay en mi ruta?"\n` +
      `• "¿Cuánto tiempo toma mi ruta?"\n\n` +
      ` **Gestión de unidad**\n` +
      `• "¿Cómo actualizo asientos?"\n` +
      `• "¿Cómo me activo?"\n\n` +
      ` **Rutas y tráfico**\n` +
      `• "Sugerencias para tráfico"\n` +
      `• "Tiempo de mi ruta"\n\n` +
      ` Pregúntame lo que necesites sobre tu operación.`;
  } else {
    return `👤 **Asistente de Transporte**\n\n` +
      `Soy tu asistente virtual. Puedo ayudarte con:\n\n` +
      ` **Costos**\n` +
      `• "¿Cuánto cuesta ir a...?"\n` +
      `• "Precio de la ruta"\n\n` +
      ` **Tiempos**\n` +
      `• "¿Cuánto tarda?"\n` +
      `• "Tiempo de viaje"\n\n` +
      ` **Unidades**\n` +
      `• "¿Hay unidades disponibles?"\n` +
      `• "¿Qué ruta me lleva a...?"\n\n` +
      ` Pregúntame lo que necesites sobre tu viaje.`;
  }
}

function respondDefault(ctx, query) {
  if (ctx.role === "driver") {
    return ` No estoy seguro de entender tu pregunta.\n\n` +
      ` **Tu estado actual:**\n` +
      `• Ruta: ${ctx.routeName || "Sin asignar"}\n` +
      `• Estado: ${ctx.driverStatus}\n` +
      `• Usuarios: ${ctx.userCount}\n\n` +
      ` **Puedes preguntarme:**\n` +
      `• "¿Cuántos usuarios hay?"\n` +
      `• "¿Cómo actualizo asientos?"\n` +
      `• "¿Cuánto tiempo toma la ruta?"\n\n` +
      `O escribe "ayuda" para ver todas las opciones.`;
  } else {
    return ` No estoy seguro de entender tu pregunta.\n\n` +
      ` **Tu estado actual:**\n` +
      `• Ruta: ${ctx.routeName || "Sin seleccionar"}\n` +
      `• Unidades: ${ctx.operatorCount}\n\n` +
      ` **Puedes preguntarme:**\n` +
      `• "¿Cuánto cuesta?"\n` +
      `• "¿Hay unidades disponibles?"\n` +
      `• "¿Qué ruta me lleva a...?"\n\n` +
      `O escribe "ayuda" para ver todas las opciones.`;
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
    'huehuetoca': /huehuetoca/i,
    'animas': /animas|las animas/i,
    'torres': /torres|las torres/i
  };
  
  for (const [dest, regex] of Object.entries(destinations)) {
    if (regex.test(query)) {
      return dest.charAt(0).toUpperCase() + dest.slice(1);
    }
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
  const destLower = destination.toLowerCase();
  return routes.find(r => 
    r.name.toLowerCase().includes(destLower) ||
    r.destinationLabel?.toLowerCase().includes(destLower) ||
    r.originLabel?.toLowerCase().includes(destLower)
  );
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

console.log('═══════════════════════════════════════');
console.log('🤖 ASISTENTE IA MEJORADO CON PROMPT ENGINEERING');
console.log('✅ Sistema cargado correctamente');
console.log('📋 Contexto del sistema comprendido');
console.log('🎯 Detector de intenciones activado');
console.log('═══════════════════════════════════════');
