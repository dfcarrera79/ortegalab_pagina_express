import { Router } from "express";

import {
  respuestaLab,
} from "./correo.controller";

const router = Router();

router.put("/respuestaLab", respuestaLab);

export default router;
