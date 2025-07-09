class ErrorHandler {
    static logError(error, context = '') {
        const errorInfo = {
            message: error.message || error,
            context,
            timestamp: new Date().toISOString(),
            stack: error.stack || 'No stack trace available'
        };
        
        console.group(`🚨 Error en ${context || 'Aplicación'}`);
        console.error('Mensaje:', errorInfo.message);
        console.error('Contexto:', errorInfo.context);
        console.error('Timestamp:', errorInfo.timestamp);
        console.error('Stack:', errorInfo.stack);
        console.groupEnd();
        
        // Aquí podrías enviar el error a un servicio de logging
        this.sendToLoggingService(errorInfo);
    }
    
    static sendToLoggingService(errorInfo) {
        // Implementar envío a servicio de logging si es necesario
        // Por ahora solo guardamos en localStorage para debugging
        try {
            const errors = JSON.parse(localStorage.getItem('vartar_errors') || '[]');
            errors.push(errorInfo);
            localStorage.setItem('vartar_errors', JSON.stringify(errors.slice(-50))); // Mantener solo últimos 50 errores
        } catch (e) {
            console.warn('No se pudo guardar el error en localStorage');
        }
    }
    
    static handleAsyncError(promise, context = '') {
        return promise.catch(error => {
            this.logError(error, context);
            throw error; // Re-lanzar para que el código que llama pueda manejar el error
        });
    }
    
    static showUserError(message, isTemporary = true) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'user-error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 9999;
            max-width: 300px;
        `;
        
        document.body.appendChild(errorDiv);
        
        if (isTemporary) {
            setTimeout(() => {
                errorDiv.remove();
            }, 5000);
        }
    }
}