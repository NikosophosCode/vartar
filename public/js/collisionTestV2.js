// Test básico para el sistema de colisiones V2
// Ejecutar en la consola del navegador después de unirse al juego

function testCollisionSystemV2() {
    console.log('🧪 Iniciando test del Sistema de Colisiones V2...');
    
    // Verificar que el juego tenga el sistema V2
    if (!window.game || !window.game.collisionSystemV2) {
        console.error('❌ CollisionSystemV2 no encontrado');
        return false;
    }
    
    const system = window.game.collisionSystemV2;
    
    // Test 1: Verificar inicialización
    console.log('✅ Test 1: Sistema inicializado correctamente');
    console.log('Estado actual:', system.getSystemState());
    
    // Test 2: Verificar configuración
    const config = system.config;
    console.log('✅ Test 2: Configuración cargada');
    console.log('Radio de detección:', config.detectionRadius);
    console.log('Radio de confirmación:', config.confirmationRadius);
    
    // Test 3: Verificar métodos principales
    const methods = [
        'checkCollisions',
        'detectPreciseCollision', 
        'initiateCollisionProcess',
        'resetCollisionState',
        'getSystemState'
    ];
    
    const missingMethods = methods.filter(method => typeof system[method] !== 'function');
    
    if (missingMethods.length === 0) {
        console.log('✅ Test 3: Todos los métodos principales disponibles');
    } else {
        console.error('❌ Test 3: Métodos faltantes:', missingMethods);
        return false;
    }
    
    // Test 4: Verificar estado inicial
    const state = system.getSystemState();
    if (state.state === 'idle') {
        console.log('✅ Test 4: Estado inicial correcto (idle)');
    } else {
        console.warn('⚠️ Test 4: Estado inicial inesperado:', state.state);
    }
    
    // Test 5: Verificar integración con el juego
    if (window.game.combatState === 'free' && window.game.gameState === 'map') {
        console.log('✅ Test 5: Integración con juego correcta');
    } else {
        console.log('ℹ️ Test 5: Estado del juego:', {
            combat: window.game.combatState,
            game: window.game.gameState
        });
    }
    
    console.log('🎉 Tests completados. Sistema listo para usar.');
    return true;
}

// Función para simular colisión (solo para testing en desarrollo)
function simularColision(enemyIndex = 0) {
    if (!window.game || !window.game.enemies) {
        console.error('❌ No hay enemigos disponibles para simular colisión');
        return;
    }
    
    const enemy = window.game.enemies[enemyIndex];
    if (!enemy) {
        console.error('❌ Enemigo no encontrado en índice:', enemyIndex);
        return;
    }
    
    console.log('🎭 Simulando colisión con:', enemy.name || enemy.id);
    
    // Acercar el jugador al enemigo para forzar colisión
    const player = window.game.playerCharacter;
    if (player) {
        const oldX = player.position.x;
        const oldY = player.position.y;
        
        // Posicionar muy cerca del enemigo
        player.position.x = enemy.position.x + 10;
        player.position.y = enemy.position.y + 10;
        
        console.log(`📍 Jugador movido de (${oldX}, ${oldY}) a (${player.position.x}, ${player.position.y})`);
        console.log(`📍 Enemigo en (${enemy.position.x}, ${enemy.position.y})`);
        
        // El sistema debería detectar la colisión en el siguiente frame
        setTimeout(() => {
            console.log('🔍 Estado del sistema después de simular colisión:', 
                window.game.collisionSystemV2.getSystemState());
        }, 100);
    }
}

// Función para mostrar métricas del servidor
async function mostrarMetricasServidor() {
    try {
        const response = await fetch(`${Config.SERVER.BASE_URL}/vartar/metricas`);
        const metricas = await response.json();
        
        console.log('📊 Métricas del Servidor:');
        console.table(metricas.jugadores);
        console.log('👥 Estados de jugadores:', metricas.estados);
        
    } catch (error) {
        console.error('❌ Error obteniendo métricas:', error);
    }
}

// Exportar funciones para uso en consola
window.testCollisionSystemV2 = testCollisionSystemV2;
window.simularColision = simularColision;
window.mostrarMetricasServidor = mostrarMetricasServidor;

console.log(`
🧪 SISTEMA DE PRUEBAS V2 CARGADO
================================

Funciones disponibles:
• testCollisionSystemV2() - Ejecuta pruebas del sistema
• simularColision(index) - Simula colisión con enemigo
• mostrarMetricasServidor() - Muestra métricas del servidor

Ejemplo de uso:
> testCollisionSystemV2()
> simularColision(0)  // Simular colisión con primer enemigo
> mostrarMetricasServidor()
`);
