const mongoose = require('mongoose');
const testimonioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    edad: { type: Number, required: true },
    tipoAccidente: { type: String, required: true },
    historia: { type: String, required: true },
    fecha: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Testimonio', testimonioSchema);