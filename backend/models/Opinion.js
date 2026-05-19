const mongoose = require('mongoose');

const opinionSchema = new mongoose.Schema({
    nombre: { 
        type: String, 
        required: true 
    },
    comentario: { 
        type: String, 
        required: true 
    },
    fecha: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Opinion', opinionSchema);