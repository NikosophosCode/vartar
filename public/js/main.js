// Inicializar el juego cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.game = new Game();
        console.log('Juego iniciado correctamente');
    } catch (error) {
        ErrorHandler.logError(error, 'Inicialización del juego');
        ErrorHandler.showUserError('Error crítico al inicializar el juego');
    }
});

// Manejo global de errores no capturados
window.addEventListener('error', (event) => {
    ErrorHandler.logError(event.error, 'Error global no capturado');
});

window.addEventListener('unhandledrejection', (event) => {
    ErrorHandler.logError(event.reason, 'Promise rechazada no manejada');
});