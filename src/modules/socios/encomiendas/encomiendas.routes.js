import { Router } from 'express';
import { resumenEncomiendasBus, listadoEncomiendasViaje, encomiendasAlCobro } from './encomiendas.controller';

const router = Router();

router.get('/resumen_encomiendas_bus/:disco/:desde/:hasta/:en_proceso/:codigo_turno', resumenEncomiendasBus);
router.get('/listado_encomiendas_viaje/:turnos', listadoEncomiendasViaje);
router.get('/encomiendas_al_cobro/:disco/:destino', encomiendasAlCobro);

export default router;