import { Router } from "express";

import {
  crearDetalle,
  subirFotos,
  subirArchivo,
  registrarArchivo,
  obtenerArchivos,
  obtenerProductos,
  obtenerReclamoPorRuc,
  actualizarEstado,
  actualizarArchivo,
  eliminarArchivos,
  obtenerReclamosPorEstado,
  actualizarArchivos
} from "./reclamo.controller";

const router = Router();

router.post("/crear_detalle", crearDetalle);
router.post("/subir_fotos/:id", subirFotos);

router.post("/subir_archivo/", subirArchivo);
router.post("/registrar_archivo", registrarArchivo);

router.post("/actualizar_archivo", actualizarArchivo);
router.get("/obtener_archivos/:id", obtenerArchivos);
router.delete("/eliminar_archivos", eliminarArchivos);
router.put("/actualizar_archivos", actualizarArchivos);

// router.get("/obtener_productos/:codigo", obtenerProductos);
router.get("/obtener_productos/", obtenerProductos);
router.get("/obtener_reclamo_por_ruc/:ruc", obtenerReclamoPorRuc);
router.get("/obtener_reclamos_por_estado/:estado", obtenerReclamosPorEstado);
router.put("/actualizar_estado", actualizarEstado);

export default router;