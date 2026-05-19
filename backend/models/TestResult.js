const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
    usuario: { 
        type: String, 
        required: true 
    },
    puntuacion: { 
        type: Number, 
        required: true 
    },
    respuestasCorrectas: { 
        type: Number, 
        required: true 
    },
    fecha: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('TestResult', testResultSchema);