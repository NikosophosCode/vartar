let spanPoderJugador
let poderJugador = []
let poderEnemigo = []
let indexPoderJugador 
let indexPoderEnemigo 
let secuenciaEnemigo = []
let resultadoCombate
let conclusion
let victoriasJugador = 0
let victoriasEnemigo = 0
let nuevosPersonajes = []
let todosLosPersonajes
let todosLosPoderes
let personajeJugador
let botonFUEGO
let botonAGUA
let botonTIERRA
let botonAIRE
let todosLosBotones = []
let poderesDeEnemigo
let ataqueAleatoreoEnemigo
let inputPersonajeSeleccionado
let intervalo
let posicionEnemigo
let idJugador = null
let idEnemigo = null
let enemigosServidor = []
let backgroundMap = new Image()
backgroundMap.src = "./assets/mapa.jpg"


const salaEspera = document.getElementById("espera-jugadores")
salaEspera.style.display = "none"
const spanPersonajeJ = document.getElementById("personaje-jugador")

const botonArriba = document.getElementById("arriba")
const botonAbajo = document.getElementById("abajo")
const botonIzquierda = document.getElementById("izquierda")
const botonDerecha = document.getElementById("derecha")


const spanPersonajeE = document.getElementById("personaje-enemigo")

const poderLanzadoEnemigo = document.getElementById("poder-lanzado-enemigo")
const poderLanzadoJugador = document.getElementById("poder-lanzado-jugador")

const spanVidasJ = document.getElementById("vidas-jugador")
const spanVidasE = document.getElementById("vidas-enemigo")

const sectionVerMapa = document.getElementById('ver-mapa');
sectionVerMapa.style.display = "none"
const mapa = document.getElementById('mapa');
const lienzo = mapa.getContext('2d');

const botonElegirPersonaje = document.getElementById("boton-personajeJ")
botonElegirPersonaje.addEventListener("click", seleccionarPersonajeJ)
const botonReiniciar = document.getElementById("reiniciar")
botonReiniciar.addEventListener("click", reiniciarJuego)
const tercerTitulo = document.getElementById("subtituloTres")
const cajaPoderesJugadores = document.getElementById("poderes-vidas")
cajaPoderesJugadores.style.display = "none"
const sectionPersonajeE = document.getElementById("personajes-seleccionados")
sectionPersonajeE.style.display = "none"
const sectionPersonajeJ = document.getElementById("seleccionar-personaje")
const botonesPoderes = document.getElementById("apartado-botones-poderes")
const divBotonJugador = document.getElementById("boton-personaje-jugador")
const sectionTitulosIniciales = document.getElementById("titulos-iniciales")
const sectionFinJuego = document.getElementById("fin-juego")
sectionFinJuego.style.display = "none"
const sectionResultado = document.getElementById("resultado")
sectionResultado.style.display = "none"
const sectionSeleccionarPersonaje = document.getElementById("subtituloTres")
sectionSeleccionarPersonaje.style.display = "none"
const sectionMensaje = document.getElementById("mensaje-final")
sectionMensaje.style.display = "none"
const titulo = document.getElementById("titulo")

let anchoDelMapa = window.innerWidth -20
let altoDelMapa
const anchoMaximoMapa = 900
if (anchoDelMapa > anchoMaximoMapa) {
    anchoDelMapa = anchoMaximoMapa -20
    altoDelMapa = anchoDelMapa * 3 / 4
} 
altoDelMapa = anchoDelMapa * 3 / 4
mapa.width = anchoDelMapa
mapa.height = altoDelMapa 

class Personajes {
    constructor(nombre, imagen, mini, ataques, id = null){
        this.id = id
        this.nombre = nombre
        this.imagen = imagen
        this.ataques = ataques
        this.poderes = []
        this.alto = 100 * (anchoDelMapa/ anchoMaximoMapa)
        this.ancho = 100 * (anchoDelMapa/ anchoMaximoMapa)
        this.x = aleatorio(0, mapa.width - this.ancho)
        this.y = aleatorio(0, mapa.height - this.alto)
        this.mapaImagen = new Image
        this.mapaImagen.src = mini
        this.velocidadY = 0
        this.velocidadX = 0
    }
    dibujarPersonajes() {
        lienzo.drawImage(
            this.mapaImagen,
            this.x,
            this.y,
            this.alto,
            this.ancho
            )
    }
}

let sinji = new Personajes('sinji', './assets/sinji.jpg', './assets/sinjimini.webp', '6',)
let kiira = new Personajes('kiira', './assets/kiira.jpg', './assets/kiiramini.webp', '6',)
let kimo = new Personajes('kimo', './assets/kimo.jpg', './assets/kimomini.webp', '6',)
let vera = new Personajes('vera', './assets/vera.jpg', './assets/veramini.webp', '6',)
let narobi = new Personajes('narobi', './assets/narobi.jpg','./assets/narobimini.webp', '6',)
let nutso = new Personajes('nutso', './assets/nutso.jpg', './assets/nutsomini.webp', '6',)
let limbre = new Personajes('limbre', './assets/limbre.jpg', './assets/limbremini.webp', '6',)
let iroki = new Personajes('iroki', './assets/iroki.jpg', './assets/irokimini.webp', '6',)

// let sinjiEnemigo = new Personajes('sinji', './assets/sinji.png', './assets/sinjimini.png', '6',)
// let kiiraEnemigo = new Personajes('kiira', './assets/kiira.png', './assets/kiiramini.png', '6',)
// let kimoEnemigo = new Personajes('kimo', './assets/kimo.png', './assets/kimomini.png', '6',)
// let veraEnemigo = new Personajes('vera', './assets/vera.png', './assets/veramini.png', '6',)
// let narobiEnemigo = new Personajes('narobi', './assets/narobi.png','./assets/narobimini.png', '6',)
// let nutsoEnemigo = new Personajes('nutso', './assets/nutso.png', './assets/nutsomini.png', '6',)
// let limbreEnemigo = new Personajes('limbre', './assets/limbre.png', './assets/limbremini.png', '6',)
// let irokiEnemigo = new Personajes('iroki', './assets/iroki.png', './assets/irokimini.png', '6',)
sinji.poderes.push(
    { nombre: "TIERRA 🌎", id:"TIERRA" },
    { nombre: "TIERRA 🌎", id:"TIERRA" },
    { nombre: "TIERRA 🌎", id:"TIERRA" },
    { nombre: "FUEGO 🔥", id:"FUEGO" },
    { nombre: "AGUA 💧", id:"AGUA" },
    { nombre: "AIRE ☁", id:"AIRE" },
)
kiira.poderes.push(
    { nombre: "AGUA 💧", id:"AGUA" },
    { nombre: "AGUA 💧", id:"AGUA" },
    { nombre: "AGUA 💧", id:"AGUA" },
    { nombre: "TIERRA 🌎", id:"TIERRA" },
    { nombre: "FUEGO 🔥", id:"FUEGO" },
    { nombre: "AIRE ☁", id:"AIRE" },
)
kimo.poderes.push(
    { nombre: "FUEGO 🔥", id:"FUEGO" },
    { nombre: "FUEGO 🔥", id:"FUEGO" },
    { nombre: "FUEGO 🔥", id:"FUEGO" },
    { nombre: "TIERRA 🌎", id:"TIERRA" },
    { nombre: "AGUA 💧", id:"AGUA" },
    { nombre: "AIRE ☁", id:"AIRE" },
)
vera.poderes.push(
    { nombre: "AIRE ☁", id:"AIRE" },
    { nombre: "AIRE ☁", id:"AIRE" },
    { nombre: "AIRE ☁", id:"AIRE" },
    { nombre: "TIERRA 🌎", id:"TIERRA" },
    { nombre: "FUEGO 🔥", id:"FUEGO" },
    { nombre: "AGUA 💧", id:"AGUA" },
)
narobi.poderes.push(
    { nombre: "FUEGO 🔥", id:"FUEGO" },
    { nombre: "FUEGO 🔥", id:"FUEGO" },
    { nombre: "FUEGO 🔥", id:"FUEGO" },
    { nombre: "TIERRA 🌎", id:"TIERRA" },
    { nombre: "AGUA 💧", id:"AGUA" },
    { nombre: "AIRE ☁", id:"AIRE" },
)
nutso.poderes.push(
    { nombre: "TIERRA 🌎", id:"TIERRA" },
    { nombre: "TIERRA 🌎", id:"TIERRA" },
    { nombre: "TIERRA 🌎", id:"TIERRA" },
    { nombre: "FUEGO 🔥", id:"FUEGO" },
    { nombre: "AGUA 💧", id:"AGUA" },
    { nombre: "AIRE ☁", id:"AIRE" },
)
limbre.poderes.push(
    { nombre: "AIRE ☁", id:"AIRE" },
    { nombre: "AIRE ☁", id:"AIRE" },
    { nombre: "AIRE ☁", id:"AIRE" },
    { nombre: "TIERRA 🌎", id:"TIERRA" },
    { nombre: "FUEGO 🔥", id:"FUEGO" },
    { nombre: "AGUA 💧", id:"AGUA" },
)
iroki.poderes.push(
    { nombre: "AGUA 💧", id:"AGUA" },
    { nombre: "AGUA 💧", id:"AGUA" },
    { nombre: "AGUA 💧", id:"AGUA" },
    { nombre: "TIERRA 🌎", id:"TIERRA" },
    { nombre: "FUEGO 🔥", id:"FUEGO" },
    { nombre: "AIRE ☁", id:"AIRE" },
)
// sinjiEnemigo.poderes = sinji.poderes
// kiiraEnemigo.poderes = kiira.poderes
// kimoEnemigo.poderes = kimo.poderes
// veraEnemigo.poderes = vera.poderes
// narobiEnemigo.poderes = narobi.poderes
// nutsoEnemigo.poderes = nutso.poderes
// limbreEnemigo.poderes = limbre.poderes
// irokiEnemigo.poderes = iroki.poderes

nuevosPersonajes.push(sinji,kiira,kimo,vera,narobi,nutso,limbre,iroki)
nuevosPersonajes.forEach((personaje) => {
    todosLosPersonajes = `
    <input type="radio" name="personaje" id=${personaje.nombre} />
    <label class="tarjeta-personaje" for=${personaje.nombre}>
        <img src=${personaje.imagen} alt=${personaje.nombre}>
    </label>
    `
    sectionPersonajeJ.innerHTML += todosLosPersonajes
})
unirseAlServidor()
function unirseAlServidor() {
    fetch("http://localhost:3000/users")
        .then(function(res) {
            if (res.ok) {
                res.text()
                    .then(function(respuesta) {
                        console.log(respuesta)
                        idJugador = respuesta
                    })
            }
        }) 
}

//función seleccionar personaje jugador
async function seleccionarPersonajeJ() {
    let img = document.createElement("img")
    img.width = 140
    img.height = 120
    img.style.borderRadius = "16px"
    inputPersonajeSeleccionado = document.querySelector('input[type="radio"]:checked').id
    if (inputPersonajeSeleccionado) {
        for (let im = 0; im < nuevosPersonajes.length; im++) {
            if (inputPersonajeSeleccionado == nuevosPersonajes[im].nombre) {
            img.src = nuevosPersonajes[im].imagen
            img.alt = nuevosPersonajes[im].nombre
            spanPersonajeJ.appendChild(img)
            personajeJugador = nuevosPersonajes[im].nombre   
            }
        }    
    } else {
            alert("¡Selecciona un personaje!")
            return
        }
     
    tomarPoderJugador(personajeJugador)
    enviarPersonaje(personajeJugador)
    iniciarMapa() 
    sectionVerMapa.style.display = "flex"
    sectionPersonajeJ.style.display = "none"
    divBotonJugador.style.display = "none"
    sectionTitulosIniciales.style.display = "none"
}
function enviarPersonaje(personajeJugador) {
    fetch(`http://localhost:3000/vartar/${idJugador}`, {
        method:"post",
        headers:{
            "Content-Type":"application/json"},
        body:JSON.stringify({
            personaje: personajeJugador
        })  
    })
}
function aleatorio(min, max) {
    return Math.floor( Math.random() * (max - min + 1) + min)
}
// función para obtener los poderes del personaje seleccionado 
function tomarPoderJugador(personajeJugador) {
    let poderesElegidos 
    for (let i = 0; i < nuevosPersonajes.length; i++) {
        if (personajeJugador == nuevosPersonajes[i].nombre) {
            poderesElegidos = nuevosPersonajes[i].poderes   
        }  
    }
    ejecutarPoderes(poderesElegidos)
}
// función para mostrar los poderes en el HTML 
function ejecutarPoderes(poderesElegidos) {
    poderesElegidos.forEach((poder) => {
        todosLosPoderes = `
        <button id=${poder.id} class="boton-de-poderes botonPoderes">${poder.nombre}</button>
        `
        botonesPoderes.innerHTML += todosLosPoderes
    })
    botonFUEGO = document.getElementById("FUEGO")
    botonAGUA = document.getElementById("AGUA")
    botonTIERRA = document.getElementById("TIERRA")
    botonAIRE = document.getElementById("AIRE")

    todosLosBotones = document.querySelectorAll(".botonPoderes")
}
// función elección dinámica de poderes      
function secuenciaPoderes() {
    todosLosBotones.forEach((boton) => {
        boton.addEventListener("click", (e) => {
            if (e.target.textContent == "FUEGO 🔥") {
                poderJugador.push("FUEGO 🔥")
                console.log(poderJugador)
                boton.style.background = "#0000007d"
                boton.style.color = "#2a2323" 
                sectionResultado.style.display = "flex"
                boton.disabled = true
            } else if (e.target.textContent == "TIERRA 🌎") {
                poderJugador.push("TIERRA 🌎")
                console.log(poderJugador)
                boton.style.background = "#0000007d" 
                boton.style.color = "#2a2323" 
                sectionResultado.style.display = "flex"
                boton.disabled = true
            } else if (e.target.textContent == "AGUA 💧") {
                poderJugador.push("AGUA 💧")
                console.log(poderJugador)
                boton.style.background = "#0000007d"
                boton.style.color = "#2a2323" 
                sectionResultado.style.display = "flex"
                boton.disabled = true
            } else {
                poderJugador.push("AIRE ☁")
                console.log(poderJugador)
                boton.style.background = "#0000007d"
                boton.style.color = "#2a2323" 
                sectionResultado.style.display = "flex"
                boton.disabled = true   
            }
            if (poderJugador.length == 6) {
                enviarAtaquesServidor() 
            }
           
        })         
    })
}     
// function seleccionarPersonajeE(enemigo) {
//     let imgEnemigo = document.createElement("img")
//     imgEnemigo.src = enemigo.imagen
//     imgEnemigo.alt = enemigo.nombre
//     imgEnemigo.width = 140
//     imgEnemigo.height = 120
//     imgEnemigo.style.borderRadius = "16px"
//     spanPersonajeE.appendChild(imgEnemigo)   
//     poderesDeEnemigo = enemigo.poderes
    
    
// }  
     //Función para enviar al servidor los ataques seleccionados
function enviarAtaquesServidor() {
        fetch(`http://localhost:3000/vartar/${idJugador}/poderes`, {
            method:"post",
            headers:{
                "Content-Type":"application/json"},
            body:JSON.stringify({
                ataques: poderJugador
            })  
        })
        intervalo = setInterval(obtenerAtaques, 50)     
}
function obtenerAtaques() {
    fetch(`http://localhost:3000/vartar/${idEnemigo}/poderes`)
        .then(function (res) {
            if (res.ok) {
                res.json()
                    .then(function({ ataques }) {
                        if (ataques.length == 6) {
                            poderEnemigo = ataques
                            combinacionPoderes()
                        }
                    })   
            }
        })    
}
  //Función para modificar el DOOM mediante createElement y appendChild
function mensajeAtaque() {
        
        let parrafoPoderEnemigo = document.createElement("p")
        let parrafoPoderJugador = document.createElement("p")
        parrafoPoderEnemigo.innerHTML = indexPoderEnemigo
        parrafoPoderJugador.innerHTML = indexPoderJugador
        poderLanzadoJugador.appendChild(parrafoPoderJugador)
        poderLanzadoEnemigo.appendChild(parrafoPoderEnemigo) 
}
       
    //Función para dar resultado en combinatoria de poderes
function combinacionPoderes() {
        clearInterval(intervalo)
        for (let index = 0; index < poderJugador.length; index++) {
            if (poderJugador[index] == poderEnemigo[index]) {
                indexAmbosOponentes(index, index)
            } else if (poderJugador[index] == "FUEGO 🔥" && poderEnemigo[index] == "TIERRA 🌎" || poderJugador[index] == "AGUA 💧" && poderEnemigo[index] == "FUEGO 🔥" || poderJugador[index] == "TIERRA 🌎" && poderEnemigo[index] == "AIRE ☁" || poderJugador[index] == "AIRE ☁" && poderEnemigo[index] == "AGUA 💧" || poderJugador[index] == "AIRE ☁" && poderEnemigo[index] == "FUEGO 🔥" || poderJugador[index] == "TIERRA 🌎" && poderEnemigo[index] == "AGUA 💧") {
            victoriasJugador++
            indexAmbosOponentes(index, index)
            
            } else {
            victoriasEnemigo++
            indexAmbosOponentes(index, index)
            
            }
            mensajeAtaque()
        } 
        spanVidasE.innerHTML = victoriasEnemigo
        spanVidasJ.innerHTML = victoriasJugador 
        resultadoFinal()
}
function indexAmbosOponentes(jugador, enemigo) {
    indexPoderJugador = poderJugador[jugador]
    indexPoderEnemigo = poderEnemigo[enemigo]
}
function resultadoFinal() {
    if (victoriasJugador > victoriasEnemigo) {
        ultimoMensaje("¡ENHORABUENA HAS GANADO!🎉") 
    } else if (victoriasJugador < victoriasEnemigo) {
        ultimoMensaje("OH, LO SENTIMOS, HAS PERDIDO 😢")
    } else {
        ultimoMensaje("HAS EMPATADO XD")
    }
}
function ultimoMensaje(conclusion) {
    sectionMensaje.style.display = "flex"
    let mensajeFinal = document.createElement("h2")
    mensajeFinal.innerHTML = conclusion 
    sectionMensaje.appendChild(mensajeFinal)
    botonFUEGO.disabled = true
    botonTIERRA.disabled = true
    botonAGUA.disabled = true
    botonAIRE.disabled = true
}
//funciona mapa del Personaje en canvas
function mapaPersonaje() {
    lienzo.clearRect(0, 0, mapa.width, mapa.height)
    lienzo.drawImage(
        backgroundMap,
        0,
        0,
        mapa.width,
        mapa.height
    )
    for (let v = 0; v < nuevosPersonajes.length; v++) {
        if (inputPersonajeSeleccionado == nuevosPersonajes[v].nombre) {
        nuevosPersonajes[v].dibujarPersonajes()
        nuevosPersonajes[v].x += nuevosPersonajes[v].velocidadX
        nuevosPersonajes[v].y += nuevosPersonajes[v].velocidadY
    }
    actualizarPosicion(nuevosPersonajes[v].x, nuevosPersonajes[v].y)
    enemigosServidor.forEach(function(personaje) {
        if (personaje && typeof personaje.dibujarPersonajes === 'function') {
            personaje.dibujarPersonajes()
            revisarColision(personaje)
        }
    })
}
  
}
//función para enviar al servidor la posicion actual del personaje
function actualizarPosicion(x, y) {
    fetch(`http://localhost:3000/vartar/${idJugador}/posicion`, {
        method:"post",
        headers:{
            "Content-Type":"application/json"},
        body:JSON.stringify({
            x,
            y
        })  
    })
    .then(function(res) {
        if (res.ok) {
            res.json()
            .then(function ({ enemigos }) {
            
                enemigosServidor = enemigos.map(function (enemigo) {
                if(enemigo.personaje != null)   {    
                    let personajeEnemigo = null
                    const enemigoNombre = enemigo.personaje.nombre || ""
                    if (enemigoNombre == 'sinji') {
                        personajeEnemigo = new Personajes('sinji', './assets/sinji.png', './assets/sinjimini.png', '6', enemigo.id)
                    } else if (enemigoNombre == 'kiira') {
                        personajeEnemigo = new Personajes('kiira', './assets/kiira.png', './assets/kiiramini.png', '6', enemigo.id)
                    } else if (enemigoNombre == 'kimo') {
                    personajeEnemigo = new Personajes('kimo', './assets/kimo.png', './assets/kimomini.png', '6', enemigo.id)
                    }  else if (enemigoNombre == 'vera') {
                    personajeEnemigo = new Personajes('vera', './assets/vera.png', './assets/veramini.png', '6', enemigo.id)
                    }  else if (enemigoNombre == 'narobi') {
                    personajeEnemigo = new Personajes('narobi', './assets/narobi.png','./assets/narobimini.png', '6', enemigo.id)
                    } else if (enemigoNombre == 'nutso') {
                    personajeEnemigo = new Personajes('nutso', './assets/nutso.png', './assets/nutsomini.png', '6', enemigo.id)
                    } else if (enemigoNombre == 'limbre') {
                    personajeEnemigo = new Personajes('limbre', './assets/limbre.png', './assets/limbremini.png', '6', enemigo.id)
                    } else if (enemigoNombre == 'iroki') {
                    personajeEnemigo = new Personajes('iroki', './assets/iroki.png', './assets/irokimini.png', '6', enemigo.id) 
                    } else { console.log("El personaje nombre.personaje no existe") }
                    personajeEnemigo.x = enemigo.x
                    personajeEnemigo.y = enemigo.y
                    return personajeEnemigo
                } else {
                    return null
                } 
                }).filter(enemigo => enemigo !== null)
            
                
            })
        }
    })
    
}
function desplazarPersonaje(event) {
    event.preventDefault() // ← evita que el navegador toque cosas raras en mobile
    const boton = event.target.id
    for (let m = 0; m < nuevosPersonajes.length; m++) {
        if (inputPersonajeSeleccionado === nuevosPersonajes[m].nombre) {
            switch (boton) {
                case "arriba":
                    nuevosPersonajes[m].velocidadY = -5
                    break
                case "abajo":
                    nuevosPersonajes[m].velocidadY = 5
                    break
                case "izquierda":
                    nuevosPersonajes[m].velocidadX = -5
                    break
                case "derecha":
                    nuevosPersonajes[m].velocidadX = 5
                    break
            }
        }
    }
}


function detenerMovimiento() {
    for (let v = 0; v < nuevosPersonajes.length; v++) {
        if (inputPersonajeSeleccionado == nuevosPersonajes[v].nombre) {
            nuevosPersonajes[v].velocidadX = 0
            nuevosPersonajes[v].velocidadY = 0
        }
    }
}        

function iniciarMapa() {
    const botonesDireccion = [botonArriba, botonAbajo, botonIzquierda, botonDerecha]
    botonesDireccion.forEach((boton) => {
        boton.addEventListener("mousedown", desplazarPersonaje)
        boton.addEventListener("mouseup", detenerMovimiento)
    
        // Compatibilidad móvil:
        boton.addEventListener("touchstart", desplazarPersonaje)
        boton.addEventListener("touchend", detenerMovimiento)
    })
    

    
    intervalo = setInterval(mapaPersonaje, 50)
    window.addEventListener("keydown", teclaPresionada)
    window.addEventListener("keyup", detenerMovimiento)
}
function teclaPresionada(event) {
    for (let m = 0; m < nuevosPersonajes.length; m++) {
        if (inputPersonajeSeleccionado == nuevosPersonajes[m].nombre) {
        switch(event.key) {
            case "ArrowUp":
                nuevosPersonajes[m].velocidadY = -5
                break;
            case "ArrowDown":
                nuevosPersonajes[m].velocidadY = 5
                break;
            case "ArrowRight":
                nuevosPersonajes[m].velocidadX = 5
                break;
            case "ArrowLeft":
                nuevosPersonajes[m].velocidadX = -5
                break;    
            }
        } 
    }
}
function revisarColision(enemigo) {
    const arribaPersonajeE = enemigo.y +25 
    const abajoPersonajeE = enemigo.y + enemigo.alto -25 
    const derechaPersonajeE = enemigo.x + enemigo.ancho -25
    const izquierdaPersonajeE = enemigo.x +25
    for (let v = 0; v < nuevosPersonajes.length; v++) {
        if (inputPersonajeSeleccionado == nuevosPersonajes[v].nombre) {
            const arribaPersonajeJ = nuevosPersonajes[v].y
            const abajoPersonajeJ = nuevosPersonajes[v].y + nuevosPersonajes[v].alto
            const derechaPersonajeJ = nuevosPersonajes[v].x + nuevosPersonajes[v].ancho
            const izquierdaPersonajeJ = nuevosPersonajes[v].x
            if (abajoPersonajeJ < arribaPersonajeE || arribaPersonajeJ > abajoPersonajeE || derechaPersonajeJ < izquierdaPersonajeE || izquierdaPersonajeJ > derechaPersonajeE) {
                return
            } else {
                detenerMovimiento()
                clearInterval(intervalo)
                console.log("Se detecto una colision")
                idEnemigo = enemigo.id
                console.log(enemigo.personaje.nombre)
                sectionVerMapa.style.display = "none"
                sectionFinJuego.style.display = "flex"
                sectionPersonajeE.style.display = "flex"
                sectionSeleccionarPersonaje.style.display = "flex"
                cajaPoderesJugadores.style.display = "grid"
                // seleccionarPersonajeE(enemigo)
                secuenciaPoderes()
            }
        }
            
        
    }    
}
function reiniciarJuego() {
    location.reload()
}
