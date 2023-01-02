import dbSession from '../../../pool';
import { deducirMensajeError, generateRandomString, validarEmail, enviarEmail, obtenerDataBase } from '../../../utils';

// Logea el socio y devuelve sus datos
const validarSocio = async (pool, login, clave) => {     
    try{            
        if(login === undefined){
            return {mensaje:'No ha proporcionado su login'};            
        }
        if(clave === undefined){
            return {mensaje:'No ha proporcionado su contraseña'};            
        }        
        const { rows } = await pool.query("SELECT * FROM appsocios.login_socio($1,$2) AS (clp_codigo INTEGER, clp_descri TEXT, clp_id TEXT, clp_cedruc TEXT)", [login.trim(), clave.trim()]);
        if(rows.length === 0){
            return {mensaje:'Las credenciales ingresadas no son las correctas'};                        
        }else{
            return {mensaje:'', objetos:rows[0]};
        }
    }catch(error){
        return {mensaje:deducirMensajeError(error)};                     
    }    
}

export const verificarAcceso = async (req, res) => {
    try {
        const { login, clave, bus, codigo_empresa } = req.headers;            
        const pool = dbSession(codigo_empresa);    
        const respuesta = await validarSocio(pool, login, clave);
        if(respuesta.mensaje.length > 0){
            pool.end();
            return res.send({error:'S', mensaje:respuesta.mensaje});       
        }    
        const socio = respuesta.objetos;
        // obtener los datos referente al bus
        const respuestaDisco = await obtenerDatosSocio(pool, socio.clp_cedruc, bus);
        if(respuestaDisco.mensaje.length > 0){
            pool.end();
            return res.send({error:'S', mensaje:respuestaDisco.mensaje});       
        }    
        if(respuestaDisco.objetos.length === 0){
            pool.end();
            return res.send({error:'S', mensaje:`El Bus No. ${bus} no esta asociado con el socio con RUC ${login}`});       
        }
        pool.end();
        socio['info'] = respuestaDisco.objetos;    
        res.send({error:'N', mensaje:'', objetos:respuesta.objetos});
    } catch (error) {
        res.send({error:'S', mensaje:deducirMensajeError(error)});
    }
}

export const obtenerDatosSocio = async (pool, login, bus) => {
    try{        
        const sql = `SELECT codigo_disco, nombre_esquema, numero_disco, numero_placa, cantidad_asientos, COALESCE(TReferente.email, NULL, '') AS email, TReferente.clp_descri
            FROM comun.TDisco INNER JOIN comun.TEsquemaCarroceria ON TDisco.codigo_esquema = TEsquemaCarroceria.codigo_esquema LEFT JOIN referente.TReferente 
            ON TDisco.codigo_socio = TReferente.clp_codigo WHERE (TReferente.clp_cedruc) LIKE '${login}' AND TRIM(numero_disco) LIKE '${bus}' `;        
        const { rows } = await pool.query(sql);
        return {mensaje:'', objetos:rows};        
    }catch(error){
        return {mensaje:deducirMensajeError(error)};        
    }
}

export const cambiarClaveAcceso = async (req, res) => {
    const { codigo_empresa, actual, nueva, bus, ruc } = req.headers;    
    const pool = dbSession(codigo_empresa);    
    try{        
        const respuesta = await obtenerDatosSocio(pool, ruc, actual);
        if(respuesta.mensaje.length > 0){
            pool.end();
            return res.send({mensaje:respuesta.mensaje});       
        }    
        const sql = 'UPDATE referente.TReferente SET clave = md5(TRIM($1)) WHERE TRIM(clp_cedruc) LIKE TRIM($2) AND clp_estado = 1';        
        const { rows } = await pool.query(sql,[nueva, ruc]);
        pool.end();
        res.send({mensaje:''});                
    }catch(error){
        pool.end();
        res.send({mensaje:deducirMensajeError(error)});        
    }
}

export const resetearClaveAcceso = async (req, res) => {
    const { codigo_empresa, bus, ruc } = req.headers;    
    const pool = dbSession(codigo_empresa);        
    const respuestaSocios = await obtenerDatosSocio(pool, ruc, bus);
    if(respuestaSocios.mensaje.length > 0){
        pool.end();
        res.send({mensaje:respuestaSocios.mensaje});   
        return;
    }        
    const socios = respuestaSocios.objetos;
    if(socios.length === 0){
        pool.end();
        res.send({mensaje:`No existe socio con RUC ${ruc} para el Bus No. ${bus}...proceso cancelado`});   
        return;
    }    
    const emails = [];
    let nombre_socio = '';
    socios.forEach(socio => {               
        nombre_socio = socio.clp_descri;
        socio.email.trim().split(';').forEach(email => {            
            if(validarEmail(email)){
                emails.push(email);                                
            }
        });                
    });
    if(emails.length === 0){
        pool.end();
        res.send({mensaje:'No registra emails, solicite al departamento administrativo la inclución de su email(s)...proceso detenido'});   
        return;
    }
    const clave = generateRandomString(10);    
    try{
        const database = obtenerDataBase(codigo_empresa);
        const respuesta = await enviarEmail({
            codigo_empresa:parseInt(codigo_empresa),
            emails:emails,
            from: '"LoxaSoluciones" <soporte@loxasoluciones.com>',            
            subject: "Nueva clave de acceso", 
            message: `Estimad@ ${nombre_socio}, mediante el presente email le enviamos la nueva clave generada y le recomendamos cambiarla lo antes posible por una personal
                <p><strong>Nueva clave: </strong>${clave}</p>
                <p><a href='${database.url_redirect}/${ruc}/${clave}/${bus}/${codigo_empresa}'>Cambiar la clave de acceso en este momento</></p>
            `,
        });
        if(respuesta.ok == false){
            pool.end();            
            res.send({mensaje:respuesta.mensaje});                    
            return;
        }
        const sql = `UPDATE referente.TReferente SET clave = md5(TRIM('${clave}')) WHERE TRIM(clp_cedruc) LIKE '${ruc.trim()}' AND clp_estado = 1`;
        const {rows} = await pool.query(sql);                        
        pool.end();            
        res.send({mensaje:`Se envió la nueva clave de acceso a ${emails.join(',')}`});                
    }catch(error){
        pool.end();
        res.send({mensaje:deducirMensajeError(error)});        
    }
}




