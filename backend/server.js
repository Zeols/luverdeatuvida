const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// OJO AQUÍ: Usamos la URL interna de Docker
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://adminFeria:feria%24%25@cluster0.exs0uwt.mongodb.net/eduvial?appName=Cluster0"; 
  
  // 1. Middlewares (Siempre van primero)app.use(cors());
app.use(express.json());
// Busca la carpeta frontend desde la raíz del directorio de trabajo
app.use(express.static(path.join(process.cwd(), "frontend")));

// 2. Rutas de la API (Deben ir DESPUÉS de express.json)
const apiRoutes = require("./routes/api");
app.use("/api", apiRoutes);

// 3. Conexión a MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("[INFO] Conectado a MongoDB (EduVial DB)"))
  .catch((err) => console.error("[ERROR] Error conectando a MongoDB:", err));

// 4. Arrancar el servidor (Siempre va al final)
app.listen(PORT, () => {
  console.log(`[INFO] Servidor backend corriendo en el puerto ${PORT}`);
});
