import dbSession from '../../../pool';
import { deducirMensajeError } from '../../../utils';

export const resumenViajesBus = async (req, res) => {            
    const disco = parseInt(req.params.disco);
    const desde = "'"+req.params.desde+"'";
    const hasta = "'"+req.params.hasta+"'";
    const en_proceso = "'"+req.params.en_proceso+"'::text";
    const codigo_turno = parseInt(req.params.codigo_turno);    
    const { codigo_empresa } = req.headers;            
    const pool = dbSession(codigo_empresa);     
    const sql = `SELECT * FROM appsocios.boletos_vendidos_disco(${desde},${hasta},${disco},${en_proceso},${codigo_turno})
	    AS (codigo_turno INTEGER, codigo_turnorecorrido INTEGER, detalle_ruta TEXT, fecha_viaje DATE, oficina TEXT, hora_salida TEXT, pasajeros INTEGER, facturado NUMERIC, descuentos NUMERIC, entregado NUMERIC, en_proceso TEXT, tipo TEXT)`;    
    try{
        const { rows } = await pool.query(sql);                            
        pool.end();
        const viajes = configurarVistaResumenViajesBus(rows);        
        res.send({error:'N', mensaje:'', objetos:viajes});           
    }catch(error){ 
        pool.end();       
        res.send({error:'S', mensaje:deducirMensajeError(error)});   
    }    
}

const configurarVistaResumenViajesBus = (rows) => {
    const viajes = [];
    rows.forEach(row => {
        if(!viajes.find(e => e.codigo_turno === row.codigo_turno)){
            viajes.push({
                codigo_turno:row.codigo_turno,
                detalle_ruta:row.detalle_ruta,
                fecha_viaje:row.fecha_viaje,
                hora_salida:row.hora_salida,
                en_proceso:row.en_proceso,
                tipo:row.tipo,
                pasajeros:0,
                facturado:0.00,
                descuentos:0.00,
                entregado:0.00,
                resumen:[]
            });
        }
    });

    viajes.forEach(viaje => {        
        rows.filter(row => row.codigo_turno === viaje.codigo_turno).forEach(e => {
            viaje.pasajeros += e.pasajeros;
            viaje.facturado += e.facturado;
            viaje.descuentos += e.descuentos;
            viaje.entregado += e.entregado; 
            viaje.resumen.push({                
                codigo_turnorecorrido:e.codigo_turnorecorrido,
                oficina:e.oficina,
                hora_salida:e.hora_salida,
                pasajeros:e.pasajeros,
                facturado:e.facturado,
                descuentos:e.descuentos,
                entregado:e.entregado,                
            });
        });

    });

    return viajes;
}

export const listadoPasajerosViaje = async (req, res) => {        
    const turnos = req.params.turnos;
    const en_proceso = req.params.en_proceso;
    const { codigo_empresa } = req.headers;            
    const pool = dbSession(codigo_empresa);  
    const sql_1 = `SELECT fecha_viaje, hora_salida, alm_salida, salida, d->>'cedula' AS cedula, d->>'nombre' AS nombre, d->>'destino' AS destino, d->>'asientos' AS asientos, CAST(d->>'total' AS NUMERIC) AS monto FROM comun.TListadoViaje CROSS JOIN JSON_ARRAY_ELEMENTS(CAST(info_listado AS JSON)) d 
	    WHERE codigo_turnorecorrido IN (${turnos}) AND anulado LIKE 'N' `;
    const sql_2 = ` UNION ALL 
        SELECT CAST(info_factura->>'fecha_viaje' AS DATE) AS fecha_viaje, info_factura->>'hora_salida' AS hora_salida, CAST(info_factura->>'alm_salida' AS INTEGER) AS alm_salida, info_factura->>'salida' AS salida, info_factura->>'cedula' AS cedula, info_factura->>'nombre' AS nombre, 
            info_factura->>'destino' AS destino, info_factura->>'asientos' AS asientos, total AS monto FROM comun.TFBoleto WHERE codigo_turnorecorrido IN (${turnos}) AND estado_factura = 0 `;    
    const sql_3 = `ORDER BY 1, 2, 8`;     
    const sql = sql_1 + (en_proceso === 'N' ? '' : sql_2) + ' ' +sql_3;    
    try{
        const { rows } = await pool.query(sql);                            
        pool.end();
        const listados = configurarVistaListadoPasajerosViaje(rows);        
        res.send({error:'N', mensaje:'', objetos:listados});           
    }catch(error){ 
        pool.end();       
        res.send({error:'S', mensaje:deducirMensajeError(error)});   
    }    
}

const configurarVistaListadoPasajerosViaje = (rows) => {
    const listados = [];
    rows.forEach(row => {
        if(!listados.find(e => e.alm_salida === row.alm_salida)){
            listados.push({
                alm_salida:row.alm_salida,
                salida:row.salida,
                hora_salida:row.hora_salida,                
                pasajeros:[]
            });
        }
    });
    listados.forEach(listado => {        
        rows.filter(row => row.alm_salida === listado.alm_salida).forEach(e => {
            listado.pasajeros.push({                
                cedula:e.cedula,
                nombre:e.nombre,
                destino:e.destino,
                asientos:e.asientos,
                monto:e.monto
            });
        });

    });

    return listados;
}

export const boletosDeRetorno = async (req, res) => {    
    const disco = parseInt(req.params.disco);
    const destino = parseInt(req.params.destino);
    const { codigo_empresa } = req.headers;            
    const pool = dbSession(codigo_empresa);  
    const sql = `SELECT TFBoleto.alm_codigo, codigo_factura, fecha_emision, SPLIT_PART(numero_factura,'-',1)||'-'||SPLIT_PART(numero_factura,'-',2)||'-'||LPAD(SPLIT_PART(numero_factura,'-',3),9,'0') AS numero_factura, info_factura->>'alm_vendido' AS alm_vendido, info_factura->>'salida' AS salida, 
        info_factura->>'nombre' AS nombre, info_factura->>'cedula' AS cedula, info_factura->>'destino' AS destino, total, CAST(info_factura->>'fecha_viaje' AS DATE) AS fecha_viaje, info_factura->>'hora_salida' AS hora_salida, info_factura->>'asientos' AS asientos 
        FROM comun.TFBoleto INNER JOIN comun.TTurnoRecorridoTramo ON TFBoleto.codigo_turnorecorrido = TTurnoRecorridoTramo.codigo_turnorecorrido AND TFBoleto.estado_factura = 0 AND TFBoleto.codigo_nc = 0 AND TFBoleto.tipo = 1 AND TFBoleto.codigo_lista > 0 
        AND TRIM(TFBoleto.retorno) LIKE 'S' AND TFBoleto.codigo_retorno = 0 AND CASE WHEN ${destino} = 0 THEN 1=1 ELSE TFBoleto.alm_codigo = ${destino} END
        INNER JOIN comun.TTurnoViaje ON TTurnoRecorridoTramo.codigo_turno = TTurnoViaje.codigo_turno INNER JOIN comun.TDisco ON CASE WHEN TTurnoViaje.disco_reemplazo = 0 THEN TTurnoViaje.codigo_disco = TDisco.codigo_disco 
        ELSE TTurnoViaje.disco_reemplazo = TDisco.codigo_disco END AND TDisco.codigo_disco = ${disco} ORDER BY TFBoleto.fecha_emision, info_factura->>'salida', TFBoleto.numero_factura`;                 
    try{
        const { rows } = await pool.query(sql);                            
        pool.end();
        const listados = configurarVistaBoletosRetorno(rows);        
        res.send({error:'N', mensaje:'', objetos:listados});           
    }catch(error){ 
        pool.end();       
        res.send({error:'S', mensaje:deducirMensajeError(error)});   
    }
}

const configurarVistaBoletosRetorno = (rows) => {
    const listados = [];
    rows.forEach(row => {
        if(!listados.find(e => e.alm_codigo === row.alm_codigo)){
            listados.push({
                alm_codigo:row.alm_codigo,
                alm_vendido:row.alm_vendido,
                por_cobrar:0.00,
                boletos:[]
            });
        }
    });
    listados.forEach(listado => {        
        rows.filter(row => row.alm_codigo === listado.alm_codigo).forEach(e => {
            listado.por_cobrar += e.total;
            listado.boletos.push({          
                fecha_emision:e.fecha_emision,                      
                numero_factura:e.numero_factura,                                
                cedula:e.cedula,
                nombre:e.nombre,
                monto:e.total,                
                salida:e.salida,
                destino:e.destino,
                asientos:e.asientos,
                fviaje:e.fecha_viaje
            });
        });

    });

    return listados;
}
