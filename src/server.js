import express from "express";
import dotenv from "dotenv";
import dns from "node:dns";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/users.routes.js";
import webRoutes from "./routes/web.routes.js";
import seedRoles from "./utils/seedRoles.js";
import seedUsers from "./utils/seedUsers.js";

// Cargar variables de entorno
dotenv.config();

// Configuración DNS para MongoDB Atlas
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Motor de plantillas EJS y archivos estáticos
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Habilitar CORS
app.use(cors());

// Permitir solicitudes JSON
app.use(express.json());

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/", webRoutes);

// Validar estado del servidor
app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

// Rutas inexistentes
app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      message: "Recurso no encontrado",
    });
  }

  res.status(404).render("404", {
    title: "No encontrada",
    requiredRoles: null,
  });
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error(err);

  if (err.name === "ValidationError" || err.name === "CastError") {
    err.status = 400;
  }

  if (err.code === 11000) {
    err.status = 400;
    err.message = "El email ya se encuentra en uso";
  }

  res.status(err.status || 500).json({
    message: err.message || "Error interno del servidor",
  });
});

// Puerto del servidor
const PORT = process.env.PORT || 3000;

// Conexión con MongoDB Atlas
mongoose
  .connect(process.env.MONGODB_URI, { autoIndex: true })
  .then(async () => {
    console.log("Mongo connected");

    // Inicializar roles y usuarios de prueba
    await seedRoles();
    await seedUsers();

    // Iniciar servidor web
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error al conectar con Mongo:", err);
    process.exit(1);
  });
