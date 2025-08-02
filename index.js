const express = require("express")
const cors = require("cors")
const app = express()
const jugadores = []


app.use(express.static("public"))
app.use(cors())
app.use(express.json())
class Jugador {
    constructor (id) {
        this.id = id
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
        jugadores[jugadorIndex].actualizarPosicion(x, y)
    }
    // Solo enemigos con personaje y posición válidos
    const enemigos = jugadores.filter((enemigo) => 
        idJugador != enemigo.id &&
        enemigo.personaje &&
        typeof enemigo.x === 'number' &&
        typeof enemigo.y === 'number'
    )
    res.send({
        enemigos     
    })
    console.log(enemigos)
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

// Middleware para logging de requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${req.ip}`)
    next()
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