import { Router } from "express";
import {
  subirDocumento,
  registrarDocumento,
  actualizarDocumento,
  obtenerDocumento,
  eliminarDocumento,
} from "./documentos.controller";

const router = Router();

router.post("/subir_documento", subirDocumento);
router.post("/registrar_documento", registrarDocumento);
router.get("/obtener_documento", obtenerDocumento);
router.put("/actualizar_documento", actualizarDocumento);
router.delete("/eliminar_documento", eliminarDocumento);

export default router;