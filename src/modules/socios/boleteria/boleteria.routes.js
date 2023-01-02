import { Router } from 'express';
import { resumenViajesBus, listadoPasajerosViaje, boletosDeRetorno } from './boleteria.controller';

const router = Router();

router.get('/resumen_viajes_bus/:disco/:desde/:hasta/:en_proceso/:codigo_turno', resumenViajesBus);
router.get('/listado_pasajeros_viaje/:turnos/:en_proceso', listadoPasajerosViaje);
router.get('/boletos_retorno/:disco/:destino', boletosDeRetorno);

export default router;