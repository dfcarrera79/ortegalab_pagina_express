import dbSession from '../../../pool';
import { deducirMensajeError } from '../../../utils';

export const resumenEncomiendasBus = async (req, res) => {            
    const disco = parseInt(req.params.disco);
    const desde = "'"+req.params.desde+"'";
    const hasta = "'"+req.params.hasta+"'";
    const en_proceso = "'"+req.params.en_proceso+"'::text";
    const codigo_turno = parseInt(req.params.codigo_turno);    
    const { codigo_empresa } = req.headers;            
    const pool = dbSession(codigo_empresa);     
    const sql = `SELECT * FROM appsocios.encomiendas_vendidos_disco(${desde},${hasta},${disco},${en_proceso},${codigo_turno})
	    AS (codigo_turno INTEGER, codigo_turnorecorrido INTEGER, detalle_ruta TEXT, fecha_viaje DATE, oficina TEXT, hora_salida TEXT, info_listado TEXT, facturado NUMERIC, descuentos NUMERIC, entregado NUMERIC, en_proceso TEXT)`;    
    try{
        const { rows } = await pool.query(sql);                            
        pool.end();
        const viajes = configurarVistaResumenEncomiendasBus(rows);        
        res.send({error:'N', mensaje:'', objetos:viajes});           
    }catch(error){ 
        pool.end();       
        res.send({error:'S', mensaje:deducirMensajeError(error)});   
    }    
}

const configurarVistaResumenEncomiendasBus = (rows) => {
    const viajes = [];
    rows.forEach(row => {
        if(!viajes.find(e => e.codigo_turno === row.codigo_turno)){            
            viajes.push({
                codigo_turno:row.codigo_turno,
                detalle_ruta:row.detalle_ruta,
                fecha_viaje:row.fecha_viaje,
                hora_salida:row.hora_salida,
                en_proceso:row.en_proceso,    
                unidades:0,                            
                facturado:0.00,
                descuentos:0.00,
                entregado:0.00,
                resumen:[]
            });
        }
    });

    viajes.forEach(viaje => {        
        rows.filter(row => row.codigo_turno === viaje.codigo_turno).forEach(e => {            
            let unidades = 0;
            const info = JSON.parse(e.info_listado);           
            info.forEach(e => {
               const indexOf = e.contenido.trim().indexOf(' ');
               unidades += parseInt(e.contenido.substring(0,indexOf));               
            });
            viaje.unidades += unidades;
            viaje.facturado += e.facturado;
            viaje.descuentos += e.descuentos;
            viaje.entregado += e.entregado;             
            viaje.resumen.push({                
                codigo_turnorecorrido:e.codigo_turnorecorrido,
                oficina:e.oficina,
                hora_salida:e.hora_salida,
                unidades:unidades,
                pasajeros:e.pasajeros,
                facturado:e.facturado,
                descuentos:e.descuentos,
                entregado:e.entregado,                
            });
        });

    });

    return viajes;
}

export const listadoEncomiendasViaje = async (req, res) => {        
    const turnos = req.params.turnos;
    const { codigo_empresa } = req.headers;            
    const pool = dbSession(codigo_empresa);  
    const sql = `SELECT alm_salida, salida, hora_salida, d->>'numero_factura' AS numero_factura, d->>'destinatario' AS destinatario, d->>'destino' AS destino, d->>'contenido' AS contenido, CAST(d->>'monto_total' AS NUMERIC) AS monto, d->>'tipo' AS tipo 
        FROM comun.TListadoEncomiendas CROSS JOIN JSON_ARRAY_ELEMENTS(CAST(info_listado AS JSON)) d 
	    WHERE codigo_turnorecorrido IN (${turnos}) AND anulado LIKE 'N' ORDER BY fecha_viaje, hora_salida, d->>'numero_factura'`;     
    try{
        const { rows } = await pool.query(sql);                            
        pool.end();
        const listados = configurarVistaListadoEncomiendasViaje(rows);        
        res.send({error:'N', mensaje:'', objetos:listados});           
    }catch(error){ 
        pool.end();       
        res.send({error:'S', mensaje:deducirMensajeError(error)});   
    }    
}

const configurarVistaListadoEncomiendasViaje = (rows) => {
    const listados = [];
    rows.forEach(row => {
        if(!listados.find(e => e.alm_salida === row.alm_salida)){
            listados.push({
                alm_salida:row.alm_salida,
                salida:row.salida,
                hora_salida:row.hora_salida,                
                encomiendas:[]
            });
        }
    });
    listados.forEach(listado => {        
        rows.filter(row => row.alm_salida === listado.alm_salida).forEach(e => {
            listado.encomiendas.push({                
                tipo:parseInt(e.tipo),
                numero_factura:e.numero_factura,
                destinatario:e.destinatario,
                destino:e.destino,
                contenido:e.contenido,
                monto:e.monto
            });
        });

    });

    return listados;
}

export const encomiendasAlCobro = async (req, res) => {    
    const disco = parseInt(req.params.disco);
    const destino = parseInt(req.params.destino);
    const { codigo_empresa } = req.headers;            
    const pool = dbSession(codigo_empresa);  
    const sql = `SELECT fecha_emision, SPLIT_PART(numero_factura,'-',1)||'-'||SPLIT_PART(numero_factura,'-',2)||'-'||LPAD(SPLIT_PART(numero_factura,'-',3),9,'0') AS numero_factura, info_factura->'respaldo'->>'numero_documento' AS numero_documento, 
        info_factura->>'salida' AS salida, info_factura->>'nombre' AS nombre, info_factura->>'cedula' AS cedula, info_factura->>'destino' AS destino, total, CAST(info_factura->>'fecha_viaje' AS DATE) AS fecha_viaje, info_factura->>'hora_salida' AS hora_salida,
        CAST(info_factura->>'alm_salida' AS INTEGER) AS alm_cobrar
        FROM comun.TFEncomienda INNER JOIN comun.TTurnoRecorridoTramo ON TFEncomienda.codigo_turnorecorrido = TTurnoRecorridoTramo.codigo_turnorecorrido AND TFEncomienda.estado_factura = 0 AND TFEncomienda.codigo_nc = 0 AND TFEncomienda.tipo = 1 
        AND TRIM(info_factura->>'estado_encomienda') LIKE 'DESDE GUIA' AND TFEncomienda.codigo_retorno = 0 AND CASE WHEN ${destino} = 0 THEN 1=1 ELSE CAST(info_factura->>'alm_salida' AS INTEGER) = ${destino} END
        INNER JOIN comun.TTurnoViaje ON TTurnoRecorridoTramo.codigo_turno = TTurnoViaje.codigo_turno 
        INNER JOIN comun.TDisco ON CASE WHEN TTurnoViaje.disco_reemplazo = 0 THEN TTurnoViaje.codigo_disco = TDisco.codigo_disco ELSE TTurnoViaje.disco_reemplazo = TDisco.codigo_disco END AND TDisco.codigo_disco = ${disco}
        ORDER BY TFEncomienda.fecha_emision, TFEncomienda.numero_factura`;             
    try{
        const { rows } = await pool.query(sql);                            
        pool.end();
        const listados = configurarVistaEncomiendasAlCobro(rows);        
        res.send({error:'N', mensaje:'', objetos:listados});           
    }catch(error){ 
        pool.end();       
        res.send({error:'S', mensaje:deducirMensajeError(error)});   
    }
}

const configurarVistaEncomiendasAlCobro = (rows) => {
    const listados = [];
    rows.forEach(row => {
        if(!listados.find(e => e.alm_cobrar === row.alm_cobrar)){
            listados.push({
                alm_cobrar:row.alm_cobrar,
                destino:row.destino,
                por_cobrar:0.00,
                encomiendas:[]
            });
        }
    });
    listados.forEach(listado => {        
        rows.filter(row => row.alm_cobrar === listado.alm_cobrar).forEach(e => {
            listado.por_cobrar += e.total;
            listado.encomiendas.push({          
                fecha_emision:e.fecha_emision,                      
                numero_factura:e.numero_factura,                
                salida:e.salida,
                cedula:e.cedula,
                nombre:e.nombre,
                monto:e.total,
                guia:e.numero_documento,
                fviaje:e.fecha_viaje
            });
        });

    });

    return listados;
}

