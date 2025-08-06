const express = require("express")
const cors = require("cors")
const app = express()
const jugadores = []

// Middleware para logging de requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${req.ip}`)
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
    }
    asignarPersonaje(personaje) {
        this.personaje = personaje
    }
    actualizarPosicion(x, y) {
        this.x = x
        this.y = y
    }
    asignarAtaques(ataques) {
        this.ataques = ataques
    }
    
    // Nuevos métodos para manejo de colisiones
    iniciarColision(enemyId) {
        if (this.estadoCombate === 'libre') {
            this.estadoCombate = 'colisionando'
            this.enemigoCombate = enemyId
            this.timestampColision = Date.now()
            return true
        }
        return false
    }
    
    confirmarCombate() {
        if (this.estadoCombate === 'colisionando') {
            this.estadoCombate = 'en_combate'
            return true
        }
        return false
    }
    
    finalizarCombate() {
        this.estadoCombate = 'libre'
        this.enemigoCombate = null
        this.timestampColision = null
    }
    
    // Verificar si la colisión ha expirado (timeout de 5 segundos)
    hasColisionExpirado() {
        if (this.timestampColision && Date.now() - this.timestampColision > 5000) {
            this.finalizarCombate()
            return true
        }
        return false
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

// Nuevo endpoint para manejar detección de colisiones
app.post("/vartar/:idJugador/colision", (req, res) => {
    const idJugador = req.params.idJugador || ""
    const enemyId = req.body.enemyId || ""
    const playerX = req.body.playerX || 0
    const playerY = req.body.playerY || 0
    const enemyX = req.body.enemyX || 0
    const enemyY = req.body.enemyY || 0
    
    console.log(`🚨 Solicitud de colisión: ${idJugador} vs ${enemyId}`)
    
    const jugador = jugadores.find(j => j.id === idJugador)
    const enemigo = jugadores.find(j => j.id === enemyId)
    
    if (!jugador || !enemigo) {
        return res.status(400).json({ 
            success: false, 
            mensaje: "Jugador o enemigo no encontrado" 
        })
    }
    
    // Verificar que ambos jugadores estén libres
    if (jugador.estadoCombate !== 'libre' || enemigo.estadoCombate !== 'libre') {
        return res.json({ 
            success: false, 
            mensaje: "Uno de los jugadores ya está en combate",
            estadoJugador: jugador.estadoCombate,
            estadoEnemigo: enemigo.estadoCombate
        })
    }
    
    // Verificar proximidad real de los jugadores (validación del servidor)
    const distancia = Math.sqrt(
        Math.pow(jugador.x - enemigo.x, 2) + 
        Math.pow(jugador.y - enemigo.y, 2)
    )
    
    const DISTANCIA_COLISION = 100 // Píxeles de tolerancia
    
    if (distancia > DISTANCIA_COLISION) {
        return res.json({ 
            success: false, 
            mensaje: "Jugadores demasiado lejos para colisionar",
            distancia: Math.round(distancia)
        })
    }
    
    // Iniciar colisión bilateral
    const jugadorColisionOk = jugador.iniciarColision(enemyId)
    const enemigoColisionOk = enemigo.iniciarColision(idJugador)
    
    if (jugadorColisionOk && enemigoColisionOk) {
        console.log(`✅ Colisión confirmada: ${jugador.personaje?.nombre} vs ${enemigo.personaje?.nombre}`)
        res.json({
            success: true,
            mensaje: "Colisión confirmada",
            jugador: {
                id: jugador.id,
                personaje: jugador.personaje?.nombre
            },
            enemigo: {
                id: enemigo.id,
                personaje: enemigo.personaje?.nombre
            }
        })
    } else {
        res.json({
            success: false,
            mensaje: "No se pudo establecer la colisión bilateral"
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

app.listen(8080, '0.0.0.0', () => {
    console.log("===========================================")
    console.log("Servidor Vartar iniciado correctamente")
    console.log("Puerto: 8080")
    console.log("Accesible desde:")
    console.log("- Local: http://localhost:8080")
    console.log("- Red: http://192.168.20.33:8080")
    console.log("===========================================")
})