const express = require("express");
const router = express.Router();

// Importación unificada de modelos
const Testimonio = require("../models/Testimonio");
const Opinion = require("../models/Opinion");
const TestResult = require("../models/TestResult");

// --- RUTAS PARA OPINIONES ---

// POST: Guardar una nueva opinión
router.post("/opiniones", async (req, res) => {
  try {
    const nuevaOpinion = new Opinion(req.body);
    await nuevaOpinion.save();
    res.status(201).json({ mensaje: "Opinión guardada con éxito" });
  } catch (error) {
    console.error("[ERROR] Error al guardar la opinión:", error);
    res
      .status(500)
      .json({
        error: "Hubo un error al guardar la opinión",
        detalle: error.message,
      });
  }
});

// GET: Obtener todas las opiniones
router.get("/opiniones", async (req, res) => {
  try {
    const opiniones = await Opinion.find().sort({ fecha: -1 });
    res.status(200).json(opiniones);
  } catch (error) {
    console.error("[ERROR] Error al obtener las opiniones:", error);
    res.status(500).json({ error: "Error al obtener las opiniones" });
  }
});

// --- RUTAS PARA TEST DE LICENCIA ---

// POST: Guardar el resultado de un test
router.post("/test-resultados", async (req, res) => {
  try {
    const nuevoResultado = new TestResult(req.body);
    await nuevoResultado.save();
    res.status(201).json({ mensaje: "Resultado del test guardado" });
  } catch (error) {
    console.error("[ERROR] Error al guardar el resultado del test:", error);
    res.status(500).json({ error: "Hubo un error al guardar el resultado" });
  }
});

// GET: Obtener resultados (para estadísticas)
router.get("/test-resultados", async (req, res) => {
  try {
    const resultados = await TestResult.find().sort({ fecha: -1 });
    res.status(200).json(resultados);
  } catch (error) {
    console.error("[ERROR] Error al obtener los resultados del test:", error);
    res.status(500).json({ error: "Error al obtener los resultados" });
  }
});

// --- RUTAS PARA TESTIMONIOS ---

// POST: Guardar un nuevo testimonio
router.post("/testimonios", async (req, res) => {
  try {
    const nuevoTestimonio = new Testimonio(req.body);
    await nuevoTestimonio.save();
    res.status(201).json({ mensaje: "Testimonio guardado con éxito" });
  } catch (error) {
    // Esto imprimirá el error real en tu terminal de VS Code / Docker
    console.error("[ERROR] Error detallado al guardar testimonio:", error);
    res
      .status(500)
      .json({
        error: "Hubo un error al guardar el testimonio",
        detalle: error.message,
      });
  }
});

// GET: Obtener todos los testimonios
router.get("/testimonios", async (req, res) => {
  try {
    const testimonios = await Testimonio.find().sort({ fecha: -1 });
    res.status(200).json(testimonios);
  } catch (error) {
    console.error("[ERROR] Error al obtener los testimonios:", error);
    res.status(500).json({ error: "Error al obtener los testimonios" });
  }
});

module.exports = router;
