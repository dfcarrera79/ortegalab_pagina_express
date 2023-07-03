import { Router } from "express";
import { validarUsuario, cambiarClave, resetearClave } from "./usuario.controller";

const router = Router();

router.get("/validarUsuario", validarUsuario);
router.put("/cambiarClave", cambiarClave);
router.put("/resetearClave", resetearClave);

export default router;
