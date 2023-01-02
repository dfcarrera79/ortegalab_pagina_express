import dbSession from '../../../pool';
import { deducirMensajeError } from '../../../utils';

export const resumenCreditos = async (req, res) => {            
    const ruc = req.params.ruc;
    const { codigo_empresa } = req.headers;            
    const pool = dbSession(codigo_empresa);     
    const sql = `SELECT TRIM(TCredito.concepto) AS concepto, TRIM(doc_acro)||' '||TRIM(trn_compro) AS referencia, trn_fecreg, cre_fecven, cre_monto, cre_saldo, cre_abonos, TCredito.cre_codigo, CASE WHEN cre_fecven < current_date THEN CAST(current_date - cre_fecven AS INTEGER) ELSE 0 END AS cre_diamor
        FROM comun.Tegreso INNER JOIN comun.TCredito ON Tegreso.trn_codigo = TCredito.trn_codigo AND cre_tipo = 1 AND trn_valido = 0 INNER JOIN comun.TDocumento ON Tegreso.doc_codigo = TDocumento.doc_codigo AND Tegreso.alm_codigo = TDocumento.alm_codigo 
        AND TDocumento.doc_codigo IN (1,2,7,19,23,42,44,48) AND TDocumento.doc_codigo = TCredito.doc_codigo 
        INNER JOIN referente.TReferente ON TCredito.clp_codigo = TReferente.clp_codigo AND TCredito.cre_codigo > 0 AND ROUND(cre_saldo,2) > 0 AND cre_incobrable = 0 
        AND UPPER(TRIM(TReferente.clp_cedruc)) LIKE '${ruc}'      
        UNION ALL 
        SELECT TRIM(TCredito.concepto) AS concepto, TRIM(doc_acro)||' '||TRIM(trn_compro) AS referencia, trn_fecreg, cre_fecven, cre_monto, cre_saldo, cre_abonos, TCredito.cre_codigo, CASE WHEN cre_fecven < current_date THEN CAST(current_date - cre_fecven AS INTEGER) ELSE 0 END AS cre_diamor
        FROM comun.Tingreso INNER JOIN comun.TCredito ON Tingreso.trn_codigo = TCredito.trn_codigo AND cre_tipo = 1  AND trn_valido = 0 INNER JOIN comun.TDocumento ON Tingreso.doc_codigo = TDocumento.doc_codigo AND Tingreso.alm_codigo = TDocumento.alm_codigo 
        AND TDocumento.doc_codigo IN (12) AND TDocumento.doc_codigo = TCredito.doc_codigo  INNER JOIN referente.TReferente ON TCredito.clp_codigo = TReferente.clp_codigo 
        AND TCredito.cre_codigo > 0 AND ROUND(cre_saldo,2) > 0 AND cre_incobrable = 0 AND UPPER(TRIM(TReferente.clp_cedruc)) LIKE '${ruc}'
	    ORDER BY 2`;    
    try{
        const { rows } = await pool.query(sql);                            
        pool.end();        
        res.send({error:'N', mensaje:'', objetos:rows});           
    }catch(error){ 
        pool.end();       
        res.send({error:'S', mensaje:deducirMensajeError(error)});   
    }    
}

export const detalleCredito = async (req, res) => {        
    const cre_codigo = parseInt(req.params.cre_codigo);
    const { codigo_empresa } = req.headers;            
    const pool = dbSession(codigo_empresa);  
    const sql = `SELECT cuo_numero, cuo_fecven, cuo_monto, ROUND(cuo_monto - cuo_saldo,2) AS cuo_abono, cuo_saldo FROM comun.TCuota WHERE cre_codigo = ${cre_codigo} AND cuo_saldo > 0 ORDER BY cuo_numero`;     
    try{
        const { rows } = await pool.query(sql);                            
        pool.end();        
        res.send({error:'N', mensaje:'', objetos:rows});           
    }catch(error){ 
        pool.end();       
        res.send({error:'S', mensaje:deducirMensajeError(error)});   
    }    
}

export const resumenAportaciones = async (req, res) => {            
    const ruc = req.params.ruc;
    const { codigo_empresa } = req.headers;            
    const pool = dbSession(codigo_empresa);     
    const sql = `SELECT TDiarioFactura.concepto, TDiarioFactura.credito AS cre_monto, TDiarioFactura.abonado AS cre_abonos, ROUND(TDiarioFactura.credito - TDiarioFactura.abonado, 2) AS cre_saldo, 
        TDiarioFactura.codigo_diario, TDiarioFactura.codigo_socio, TDiarioFactura.ultimo_pago AS ult_pago, TDiarioFactura.pendientes 
        FROM contabilidad.TDiarioFactura INNER JOIN referente.TReferente socio ON TDiarioFactura.codigo_socio = socio.clp_codigo AND TDiarioFactura.anulado LIKE 'N' AND TRIM(socio.clp_cedruc) LIKE '${ruc}' 
        ORDER BY TRIM(socio.clp_id), TDiarioFactura.inicia`;    
    try{
        const { rows } = await pool.query(sql);                            
        pool.end();        
        res.send({error:'N', mensaje:'', objetos:rows});           
    }catch(error){ 
        pool.end();       
        res.send({error:'S', mensaje:deducirMensajeError(error)});   
    }    
}