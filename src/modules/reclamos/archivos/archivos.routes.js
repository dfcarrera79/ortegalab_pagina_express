import { Router } from "express";
import {
  obtenerLaboratorios, 
  obtenerProductosLaboratorio
} from "./archivos.controller";

const router = Router();

router.get("/obtener_laboratorios", obtenerLaboratorios);
router.get("/obtener_productos_laboratorio", obtenerProductosLaboratorio);

export default router;