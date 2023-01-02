import { Router } from 'express';
import { verificarAcceso, cambiarClaveAcceso, resetearClaveAcceso } from './socio.controller';

const router = Router();

router.get('/verificar_acceso', verificarAcceso);
router.get('/cambiar_clave_acceso', cambiarClaveAcceso);
router.get('/resetear_clave_acceso', resetearClaveAcceso);

export default router;