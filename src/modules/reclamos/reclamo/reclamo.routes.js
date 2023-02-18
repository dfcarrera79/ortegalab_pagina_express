import { Router } from "express";

import {
  crearDetalle,
  subirFotos,
  obtenerArchivos,
  obtenerReclamoPorRuc,
  actualizarEstado,
  actualizarArchivo,
  obtenerReclamosPorEstado
} from "./reclamo.controller";

const router = Router();

router.post("/crear_detalle", crearDetalle);
router.post("/subir_fotos/:id", subirFotos);
router.post("/actualizar_archivo", actualizarArchivo);
router.get("/obtener_archivos/:id", obtenerArchivos);
router.get("/obtener_reclamo_por_ruc/:ruc", obtenerReclamoPorRuc);
router.get("/obtener_reclamos_por_estado/:estado", obtenerReclamosPorEstado);
router.put("/actualizar_estado", actualizarEstado);

export default router;