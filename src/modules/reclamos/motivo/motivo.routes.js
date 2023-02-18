import { Router } from "express";
import {
  obtenerMotivos,
  guardarMotivo,
  eliminarMotivo,
} from "./motivo.controller";

const router = Router();

router.get("/obtener_motivos", obtenerMotivos);
router.post("/guardar_motivo", guardarMotivo);
router.delete("/eliminar_motivo/:id", eliminarMotivo);

export default router;
