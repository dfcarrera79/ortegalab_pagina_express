import { Router } from "express";
import {
  subirRegistro,
  grabarRegistro,
  actualizarRegistro,
  obtenerRegistro
} from "./registros.controller";

const router = Router();

router.post("/subir_registro", subirRegistro);
router.post("/grabar_registro", grabarRegistro);
router.get("/obtener_registro", obtenerRegistro);
router.put("/actualizar_registro", actualizarRegistro);

export default router;