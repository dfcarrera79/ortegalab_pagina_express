import { Router } from "express";
import { validarUsuario } from "./usuario.controller";

const router = Router();

router.get("/validarUsuario", validarUsuario);

export default router;
