const express = require("express")
const cors = require("cors")
const app = express()
const jugadores = []

// Sistema de limpieza automática
const limpiarJugadoresInactivos = () => {
    const antes = jugadores.length
    
    // Remover jugadores inactivos (más de 5 minutos sin actividad)
    for (let i = jugadores.length - 1; i >= 0; i--) {
        const jugador = jugadores[i]
        
        // Limpiar colisiones expiradas
        jugador.hasColisionExpirado()
        
        // Remover si está inactivo
        if (jugador.estaInactivo()) {
            console.log(`🧹 Removiendo jugador inactivo: ${jugador.id}`)
            jugadores.splice(i, 1)
        }
    }
    
    const despues = jugadores.length
    if (antes !== despues) {
        console.log(`📊 Limpieza completada: ${antes} -> ${despues} jugadores (removidos: ${antes - despues})`)
    }
}

// Ejecutar limpieza cada 2 minutos
setInterval(limpiarJugadoresInactivos, 120000)

// Middleware para logging de requests con información adicional
app.use((req, res, next) => {
    const timestamp = new Date().toISOString()
    const jugadoresActivos = jugadores.length
    console.log(`${timestamp} - ${req.method} ${req.url} - IP: ${req.ip} - Jugadores activos: ${jugadoresActivos}`)
    next()
})

app.use(express.static("public"))
app.use(cors())
app.use(express.json())
class Jugador {
    constructor (id) {
        this.id = id
        this.estadoCombate = 'libre' // Estados: 'libre', 'colisionando', 'en_combate'
        this.enemigoCombate = null
        this.timestampColision = null
        this.intentosColision = 0
        this.ultimaActividad = Date.now()
    }
    
    asignarPersonaje(personaje) {
        this.personaje = personaje
        this.ultimaActividad = Date.now()
    }
    
    actualizarPosicion(x, y) {
        // Solo actualizar si las coordenadas son válidas
        if (typeof x === 'number' && typeof y === 'number') {
            this.x = x
            this.y = y
            this.ultimaActividad = Date.now()
        }
    }
    
    asignarAtaques(ataques) {
        this.ataques = ataques
    }
    
    // Métodos mejorados para manejo de colisiones
    iniciarColision(enemyId) {
        // Limpiar colisiones expiradas primero
        this.hasColisionExpirado()
        
        // Solo permitir colisión si está completamente libre
        if (this.estadoCombate === 'libre' && enemyId && enemyId !== this.id) {
            this.estadoCombate = 'colisionando'
            this.enemigoCombate = enemyId
            this.timestampColision = Date.now()
            this.intentosColision++
            
            console.log(`🎯 Jugador ${this.id} inicia colisión con ${enemyId}`)
            return true
        }
        
        console.log(`⚠️ No se puede iniciar colisión: estado=${this.estadoCombate}, enemy=${enemyId}`)
        return false
    }
    
    confirmarCombate() {
        if (this.estadoCombate === 'colisionando' && this.enemigoCombate) {
            this.estadoCombate = 'en_combate'
            console.log(`⚔️ Jugador ${this.id} confirmó entrada al combate`)
            return true
        }
        console.log(`❌ No se puede confirmar combate: estado=${this.estadoCombate}`)
        return false
    }
    
    finalizarCombate() {
        const estadoAnterior = this.estadoCombate
        const enemigoAnterior = this.enemigoCombate
        
        this.estadoCombate = 'libre'
        this.enemigoCombate = null
        this.timestampColision = null
        this.intentosColision = 0
        
        if (estadoAnterior !== 'libre') {
            console.log(`🏁 Jugador ${this.id} finalizó combate con ${enemigoAnterior}`)
        }
    }
    
    // Verificar si la colisión ha expirado (timeout mejorado)
    hasColisionExpirado() {
        if (this.timestampColision) {
            const tiempoTranscurrido = Date.now() - this.timestampColision
            const timeoutColision = this.estadoCombate === 'colisionando' ? 3000 : 30000 // 3s para colisión, 30s para combate
            
            if (tiempoTranscurrido > timeoutColision) {
                console.log(`⏰ Colisión expirada para jugador ${this.id} (${tiempoTranscurrido}ms > ${timeoutColision}ms)`)
                this.finalizarCombate()
                return true
            }
        }
        return false
    }
    
    // Verificar si el jugador está inactivo
    estaInactivo(timeoutInactividad = 300000) { // 5 minutos por defecto
        return Date.now() - this.ultimaActividad > timeoutInactividad
    }
    
    // Obtener información de estado completa
    getEstadoCompleto() {
        return {
            id: this.id,
            estadoCombate: this.estadoCombate,
            enemigoCombate: this.enemigoCombate,
            timestampColision: this.timestampColision,
            intentosColision: this.intentosColision,
            tiempoDesdeUltimaActividad: Date.now() - this.ultimaActividad,
            personaje: this.personaje?.nombre || null,
            posicion: { x: this.x || 0, y: this.y || 0 }
        }
    }
}
class Personaje {
    constructor (nombre){
        this.nombre = nombre
    }
}

app.get("/users", (req, res) => {
    const id = `${Math.random()}`
    const nuevoJugador = new Jugador(id)
    jugadores.push(nuevoJugador)
    
    res.send(id)
})
app.post("/vartar/:idJugador", (req, res) => {
    const idJugador = req.params.idJugador || ""
    const nombrePersonaje = req.body.personaje || ""
    const personaje = new Personaje(nombrePersonaje)
    const jugadorIndex = jugadores.findIndex((jugador) => idJugador == jugador.id)
    if (jugadorIndex >= 0) {
        jugadores[jugadorIndex].asignarPersonaje(personaje)
    }
    res.end()
})
app.post("/vartar/:idJugador/posicion", (req, res) => {
    const idJugador = req.params.idJugador || ""
    const x = req.body.x || 0
    const y = req.body.y || 0
    const jugadorIndex = jugadores.findIndex((jugador) => idJugador == jugador.id)
    if (jugadorIndex >= 0) {
        // Limpiar colisiones expiradas antes de actualizar
        jugadores[jugadorIndex].hasColisionExpirado()
        jugadores[jugadorIndex].actualizarPosicion(x, y)
    }
    
    // Solo enemigos con personaje, posición válidos y libres para combate
    const enemigos = jugadores.filter((enemigo) => 
        idJugador != enemigo.id &&
        enemigo.personaje &&
        typeof enemigo.x === 'number' &&
        typeof enemigo.y === 'number'
    ).map(enemigo => ({
        id: enemigo.id,
        personaje: enemigo.personaje,
        x: enemigo.x,
        y: enemigo.y,
        estadoCombate: enemigo.estadoCombate,
        enemigoCombate: enemigo.enemigoCombate
    }))
    
    res.send({
        enemigos,
        estadoPropio: jugadores[jugadorIndex]?.estadoCombate || 'libre'
    })
    
    // Log reducido para debugging
    if (enemigos.length > 0) {
        console.log(`Jugador ${idJugador}: ${enemigos.length} enemigos activos`)
    }
})

// Endpoint mejorado para manejar detección de colisiones bilaterales
app.post("/vartar/:idJugador/colision", (req, res) => {
    const idJugador = req.params.idJugador || ""
    const enemyId = req.body.enemyId || ""
    const playerX = req.body.playerX || 0
    const playerY = req.body.playerY || 0
    const enemyX = req.body.enemyX || 0
    const enemyY = req.body.enemyY || 0
    
    console.log(`🚨 Solicitud de colisión bilateral: ${idJugador} vs ${enemyId}`)
    console.log(`📍 Posiciones - Jugador: (${playerX}, ${playerY}), Enemigo: (${enemyX}, ${enemyY})`)
    
    const jugador = jugadores.find(j => j.id === idJugador)
    const enemigo = jugadores.find(j => j.id === enemyId)
    
    if (!jugador || !enemigo) {
        console.log(`❌ Jugador o enemigo no encontrado: jugador=${!!jugador}, enemigo=${!!enemigo}`)
        return res.status(400).json({ 
            success: false, 
            mensaje: "Jugador o enemigo no encontrado" 
        })
    }
    
    // Verificar que ambos jugadores tengan personajes asignados
    if (!jugador.personaje || !enemigo.personaje) {
        console.log(`❌ Personajes no asignados: jugador=${!!jugador.personaje}, enemigo=${!!enemigo.personaje}`)
        return res.json({ 
            success: false, 
            mensaje: "Personajes no asignados completamente" 
        })
    }
    
    // Verificar que ambos jugadores estén libres
    if (jugador.estadoCombate !== 'libre' || enemigo.estadoCombate !== 'libre') {
        console.log(`⚠️ Estados de combate: jugador=${jugador.estadoCombate}, enemigo=${enemigo.estadoCombate}`)
        return res.json({ 
            success: false, 
            mensaje: "Uno de los jugadores ya está en combate",
            estadoJugador: jugador.estadoCombate,
            estadoEnemigo: enemigo.estadoCombate
        })
    }
    
    // Verificar posiciones actualizadas en el servidor (más preciso)
    const posicionJugadorServidor = { x: jugador.x || 0, y: jugador.y || 0 }
    const posicionEnemigoServidor = { x: enemigo.x || 0, y: enemigo.y || 0 }
    
    // Calcular distancias - tanto cliente como servidor
    const distanciaCliente = Math.sqrt(
        Math.pow(playerX - enemyX, 2) + 
        Math.pow(playerY - enemyY, 2)
    )
    
    const distanciaServidor = Math.sqrt(
        Math.pow(posicionJugadorServidor.x - posicionEnemigoServidor.x, 2) + 
        Math.pow(posicionJugadorServidor.y - posicionEnemigoServidor.y, 2)
    )
    
    const DISTANCIA_COLISION = 90 // Píxeles de tolerancia más precisa
    const TOLERANCIA_SINCRONIZACION = 30 // Tolerancia para diferencias cliente-servidor
    
    console.log(`📏 Distancias - Cliente: ${distanciaCliente.toFixed(1)}, Servidor: ${distanciaServidor.toFixed(1)}`)
    
    // Verificar si las posiciones están demasiado desincronizadas
    const diferenciaDistancia = Math.abs(distanciaCliente - distanciaServidor)
    if (diferenciaDistancia > TOLERANCIA_SINCRONIZACION) {
        console.log(`⚠️ Posiciones desincronizadas, diferencia: ${diferenciaDistancia.toFixed(1)}px`)
        return res.json({
            success: false,
            mensaje: "Posiciones desincronizadas entre cliente y servidor",
            detalles: {
                distanciaCliente: Math.round(distanciaCliente),
                distanciaServidor: Math.round(distanciaServidor),
                diferencia: Math.round(diferenciaDistancia)
            }
        })
    }
    
    // Usar la distancia del servidor como autoridad
    if (distanciaServidor > DISTANCIA_COLISION) {
        console.log(`📏 Jugadores demasiado lejos: ${distanciaServidor.toFixed(1)}px > ${DISTANCIA_COLISION}px`)
        return res.json({ 
            success: false, 
            mensaje: "Jugadores demasiado lejos para colisionar",
            distancia: Math.round(distanciaServidor),
            limiteDistancia: DISTANCIA_COLISION
        })
    }
    
    // Verificación adicional: validar que los jugadores no hayan cambiado de estado desde la solicitud
    jugador.hasColisionExpirado()
    enemigo.hasColisionExpirado()
    
    if (jugador.estadoCombate !== 'libre' || enemigo.estadoCombate !== 'libre') {
        console.log(`⚠️ Estados cambiaron durante validación: jugador=${jugador.estadoCombate}, enemigo=${enemigo.estadoCombate}`)
        return res.json({ 
            success: false, 
            mensaje: "Estado de jugadores cambió durante validación" 
        })
    }
    
    // Iniciar colisión bilateral atómica
    const jugadorColisionOk = jugador.iniciarColision(enemyId)
    const enemigoColisionOk = enemigo.iniciarColision(idJugador)
    
    if (jugadorColisionOk && enemigoColisionOk) {
        console.log(`✅ Colisión bilateral confirmada: ${jugador.personaje.nombre} (${idJugador}) vs ${enemigo.personaje.nombre} (${enemyId})`)
        console.log(`📊 Distancia final: ${distanciaServidor.toFixed(1)}px`)
        
        res.json({
            success: true,
            mensaje: "Colisión bilateral confirmada",
            timestamp: Date.now(),
            jugador: {
                id: jugador.id,
                personaje: jugador.personaje.nombre,
                posicion: posicionJugadorServidor
            },
            enemigo: {
                id: enemigo.id,
                personaje: enemigo.personaje.nombre,
                posicion: posicionEnemigoServidor
            },
            distancia: Math.round(distanciaServidor)
        })
    } else {
        // Si falló, asegurarse de que ambos estén libres
        jugador.finalizarCombate()
        enemigo.finalizarCombate()
        
        console.log(`❌ No se pudo establecer colisión bilateral: jugador=${jugadorColisionOk}, enemigo=${enemigoColisionOk}`)
        res.json({
            success: false,
            mensaje: "No se pudo establecer la colisión bilateral de forma atómica",
            detalles: {
                jugadorDisponible: jugadorColisionOk,
                enemigoDisponible: enemigoColisionOk
            }
        })
    }
})

// Endpoint para confirmar entrada a combate
app.post("/vartar/:idJugador/combate", (req, res) => {
    const idJugador = req.params.idJugador || ""
    const jugador = jugadores.find(j => j.id === idJugador)
    
    if (!jugador) {
        return res.status(400).json({ success: false, mensaje: "Jugador no encontrado" })
    }
    
    const confirmado = jugador.confirmarCombate()
    
    if (confirmado) {
        console.log(`⚔️ Jugador ${idJugador} entró en combate`)
        res.json({ success: true, mensaje: "Combate confirmado" })
    } else {
        res.json({ success: false, mensaje: "No se pudo confirmar el combate" })
    }
})

// Endpoint para finalizar combate
app.post("/vartar/:idJugador/finalizar-combate", (req, res) => {
    const idJugador = req.params.idJugador || ""
    const jugador = jugadores.find(j => j.id === idJugador)
    
    if (jugador) {
        const enemigoId = jugador.enemigoCombate
        const enemigo = jugadores.find(j => j.id === enemigoId)
        
        // Finalizar combate para ambos jugadores
        jugador.finalizarCombate()
        if (enemigo) {
            enemigo.finalizarCombate()
        }
        
        console.log(`🏁 Combate finalizado: ${idJugador}`)
        res.json({ success: true, mensaje: "Combate finalizado" })
    } else {
        res.status(400).json({ success: false, mensaje: "Jugador no encontrado" })
    }
})
app.post("/vartar/:idJugador/poderes", (req, res) => {
    const idJugador = req.params.idJugador || ""
    const ataques = req.body.ataques || []
    
    const jugadorIndex = jugadores.findIndex((jugador) => idJugador == jugador.id)
    if (jugadorIndex >= 0) {
        jugadores[jugadorIndex].asignarAtaques(ataques)
    }
    res.end()
})
app.get("/vartar/:idJugador/poderes", (req, res) => {
    const idJugador = req.params.idJugador || ""
    const jugador = jugadores.find((jugador) => jugador.id == idJugador)
    res.send( {
         ataques: jugador.ataques
    })
})

// Endpoint para obtener métricas del servidor (opcional, para debugging)
app.get("/vartar/metricas", (req, res) => {
    const ahora = Date.now()
    
    // Estadísticas de jugadores
    const estadisticas = {
        timestamp: ahora,
        jugadores: {
            total: jugadores.length,
            libres: jugadores.filter(j => j.estadoCombate === 'libre').length,
            colisionando: jugadores.filter(j => j.estadoCombate === 'colisionando').length,
            en_combate: jugadores.filter(j => j.estadoCombate === 'en_combate').length,
            inactivos: jugadores.filter(j => j.estaInactivo()).length
        },
        estados: jugadores.map(j => ({
            id: j.id.substring(0, 8) + '...',
            estado: j.estadoCombate,
            tiempoEnEstado: j.timestampColision ? ahora - j.timestampColision : 0,
            personaje: j.personaje?.nombre || 'Sin asignar'
        }))
    }
    
    res.json(estadisticas)
})

app.listen(8080, '0.0.0.0', () => {
    console.log("===========================================")
    console.log("🚀 Servidor Vartar iniciado correctamente")
    console.log("⚡ Sistema de colisiones V2 habilitado")
    console.log("Puerto: 8080")
    console.log("Accesible desde:")
    console.log("- Local: http://localhost:8080")
    console.log("- Red: http://192.168.20.33:8080") 
    console.log("- Métricas: http://localhost:8080/vartar/metricas")
    console.log("===========================================")
})