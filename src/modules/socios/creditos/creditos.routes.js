import { Router } from 'express';
import { resumenCreditos, detalleCredito, resumenAportaciones } from './creditos.controller';

const router = Router();

router.get('/resumen_creditos/:ruc', resumenCreditos);
router.get('/detalle_credito/:cre_codigo', detalleCredito);
router.get('/resumen_aportaciones/:ruc', resumenAportaciones);

export default router;