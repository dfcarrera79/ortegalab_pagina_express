import dbSession from "../../../pool";
import { deducirMensajeError, formatoFecha, enviarEmailReclamo } from "../../../utils";
import formidable from "formidable";
import path from "path";

export const respuestaReclamo = async (req, res) => {
  const pool = dbSession(4);
  try {
  const data = req.body;
  const { email, respuesta } = data;


  const subject = 'APROMED: Respuesta a su reclamo';
  const message = `
    <html lang="es">
      <head>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
      </head>
      <body>
        <div class="card" style="max-width: 18rem; margin: 0 auto; margin-top: 20px; border: 1px solid rgba(0,0,0,.125); font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.5;">
          <div class="card-header" style="background-color: #f8f9fa; border-bottom: 1px solid rgba(0,0,0,.125); padding: .75rem 1.25rem;">
            <img src="http://apromedloja.com/assets/logo_apromed.448c2c5f.png" alt="Apromed Logo" style="height: 50px; width: 100px;">
                <h5 style="color: #636466;">RECLAMOS APP</h5> 
          </div>

          <div class="card-body" style="padding: 1.25rem;">
            <h5 class="card-title" style="color: #636466">Por favor, no responda a este correo.</h5>
            <p>Estimado/a.</p>
            <p class="card-text">En respuesta a su reclamo:</p>
            <p>${respuesta}</p>
            <p class="card-text">También puedes consultar el estado de tu raclamo online:</p>
            <a href="https://apromedfarmaloja-cloud.com:3008/#/login/1" class="btn btn-outline-primary" style="text-decoration: none; color: #007bff; background-color: transparent; border-color: #007bff; display: inline-block; font-weight: 400; text-align: center; white-space: nowrap; vertical-align: middle; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; border: 1px solid #007bff; padding: .375rem .75rem; font-size: 16px; line-height: 1.5; border-radius: .25rem;">Ir a Reclamos App</a>
          </div>
          <div class="card-footer text-body-secondary" style="background-color: #f8f9fa; border-top: 1px solid rgba(0,0,0,.125); padding: .75rem 1.25rem;">
            <p>Reclamos App<br>
              Apromed S.A.S.<br>
              <a href="http://apromedloja.com/">http://apromedloja.com</a>
            </p>
          </div>
        </div>  
      </body>
    </html>
    `;


    const payload = {
      from: '"Apromed S.A.S." <reclamos@apromedloja.com>',
      emails: email,
      subject,
      message,
      codigo_empresa: 5,
    };

    const response = await enviarEmailReclamo(payload);


    if (response.ok) {
      // Assuming you have an active database connection/session
      res.send({ error: "N", mensaje: `Respuesta a reclamo enviada al correo ${email}`, objetos: '' });
    }
  } catch (error) {
    return { error: "S", mensaje: deducirMensajeError(error) };
  } finally {
    pool.end();
  }  
};

const obtenerFactura = async (ruc_cliente, numero_factura) => {
  const pool = dbSession(5);
  const sql = `SELECT TEgreso.trn_compro AS no_factura, TEgreso.trn_fecreg AS fecha_factura, TReferente.clp_cedruc AS ruc_cliente, TReferente.clp_descri AS razon_social, TReferente.clp_contacto AS nombre_comercial, TReferente.clp_calles AS direccion, TReferente.ciu_descri AS ciudad, TReferente.celular AS telefonos, TReferente.email, TEgreso.trn_codigo FROM comun.TEgreso INNER JOIN referente.TReferente ON TEgreso.clp_codigo = TReferente.clp_codigo WHERE TRIM(TReferente.clp_cedruc) LIKE '${ruc_cliente}' AND TRIM(TEgreso.trn_compro) LIKE '${numero_factura}' AND TEgreso.doc_codigo = 1 AND TEgreso.trn_valido = 0`;
  try {
    const { rows } = await pool.query(sql);
    if (rows.length === 0) {
      return {
        error: "S",
        mensaje: "No se encontró la factura con los datos suministrados.",
      };
    } else {
      const factura = rows[0];
      return {
        error: "N",
        mensaje: "",
        objetos: factura,
      };
    }
  } catch (error) {
    return { error: "S", mensaje: deducirMensajeError(error) };
  } finally {
    pool.end();
  }
};

export const obtenerProductos = async (req, res) => {
  const pool = dbSession(5);
  const ruc_reclamante = req.query.ruc_reclamante;
  const no_factura = req.query.no_factura;
  const respuesta = await obtenerFactura(ruc_reclamante, no_factura);
  if (respuesta.error === "S" || respuesta.objetos.length === 0) {
    res.send(respuesta);
    return;
  }
  const factura = respuesta.objetos;
  const sql = `SELECT TArticulo.art_codigo, TArticulo.art_codbar, TArticulo.art_nomlar, TDetEgre.dt_cant, TDetEgre.dt_lote, TDetEgre.dt_fecha, TDetEgre.conteo_pedido FROM articulo.TArticulo INNER JOIN comun.TDetEgre ON TArticulo.art_codigo = TDetEgre.art_codigo AND TDetEgre.trn_codigo = ${factura.trn_codigo} ORDER BY TArticulo.art_nomlar`;
  try {
    const { rows } = await pool.query(sql);

    res.send({ error: "N", mensaje: "", objetos: rows });
    
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
};

export const crearDetalle = async (req, res) => {
  const pool = dbSession(4);
  const { tipo, no_factura, reclamos, ruc_reclamante } = req.body;
  const respuesta = await obtenerFactura(ruc_reclamante, no_factura);
  if (respuesta.error === "S") {
    res.send(respuesta);
    return;
  }
  const factura = respuesta.objetos;
  let sql = `INSERT INTO reclamo (no_factura, fecha_reclamo, fecha_factura, ruc_cliente, razon_social, nombre_comercial, direccion, ciudad, telefonos, email, trn_codigo) VALUES('${
    factura.no_factura
  }', current_timestamp, '${formatoFecha(factura.fecha_factura)}', '${
    factura.ruc_cliente
  }', '${factura.razon_social}', '${factura.nombre_comercial}', '${
    factura.direccion
  }', '${factura.ciudad}', '${factura.telefonos}', '${factura.email}', '${
    factura.trn_codigo
  }') ON CONFLICT ON CONSTRAINT reclamo_unico DO UPDATE SET no_factura=EXCLUDED.no_factura RETURNING id_reclamo, estado, razon_social`;
  try {
    let rows = await pool.query(sql);
    const { id_reclamo, estado, razon_social } = rows.rows[0];
    if (estado === "FIN") {
      res.send({
        error: "S",
        mensaje:
          "El reclamo ya está finalizado, no es posible agregar detalles",
        objetos: { id_reclamo, estado, razon_social },
      });
      return;
    }
    sql = `INSERT INTO detalle_reclamo VALUES(DEFAULT, '${id_reclamo}', '${tipo}', '${reclamos}', current_timestamp, '${ruc_reclamante}', '${razon_social}') RETURNING id_detalle`;
    rows = await pool.query(sql);
    let id = rows.rows[0].id_detalle;
    res.send({
      error: "N",
      mensaje: "Reclamo agregado exitosamente",
      objetos: rows.rows[0].id_detalle,
    });
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
};

export const obtenerReclamoPorRuc = async (req, res) => {
  const { codigo_empresa } = req.headers;
  const pool = dbSession(codigo_empresa);
  const ruc = req.params.ruc;
  const factura = req.query.factura;
  const estado = req.query.estado;
  const desde = req.query.desde;
  const hasta = req.query.hasta;

  let sql = `SELECT reclamo.estado, ruc_reclamante, reclamo.no_factura, reclamo.id_reclamo, reclamo.fecha_reclamo, reclamo.fecha_factura, reclamo.fecha_reclamo, nombre_reclamante, id_detalle, reclamo.nombre_usuario, reclamo.fecha_enproceso, reclamo.fecha_finalizado, reclamo.respuesta_finalizado, reclamos
  FROM detalle_reclamo 
  JOIN reclamo ON detalle_reclamo.id_reclamo = reclamo.id_reclamo 
  WHERE ruc_reclamante='${ruc}'`;

  if (factura !== undefined && factura !== '') {
    sql += ` AND reclamo.no_factura LIKE '${factura}'`;
  }

  if (estado !== undefined && factura !== '') {
    sql += ` AND reclamo.estado LIKE '${estado}'`;
  }

  if (desde !== undefined && desde !== '' && hasta !== undefined && hasta !== '') {
    sql += `AND CAST(reclamo.fecha_reclamo AS DATE) BETWEEN '${desde}' AND '${hasta}'`;
  }

  sql += ` ORDER BY id_reclamo`;

  try {
    const { rows } = await pool.query(sql);

    if (rows[0] !== undefined) {
      const { ruc_reclamante, fecha_factura } = rows[0];
      const reclamo = {
        fecha_factura,
        ruc_reclamante,
        detalles: rows,
      };

      res.send({ error: "N", mensaje: "", objetos: reclamo });
    } else {
      res.send({
        error: "N",
        mensaje: "",
        objetos: 0,
      });
    }
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
};

export const obtenerNumeroDePaginas = async (req, res) => {
  const pool = dbSession(4);
  const estado = req.params.estado;
  const factura = req.query.factura;
  const ruc = req.query.ruc;
  const cliente = req.query.cliente;
  const desde = req.query.desde;
  const hasta = req.query.hasta;

  let sql =  `SELECT COUNT(*) AS num_registros FROM detalle_reclamo JOIN reclamo ON detalle_reclamo.id_reclamo = reclamo.id_reclamo WHERE reclamo.estado LIKE '${estado}'`

  if (factura !== undefined && factura !== '') {
    sql += ` AND reclamo.no_factura LIKE '${factura}'`;
  }

  if (ruc !== undefined && factura !== '') {
    sql += ` AND reclamo.ruc_cliente='${ruc}'`;
  }

  if (cliente !== undefined && cliente !== '' && cliente !== 'null') {
    sql += ` AND reclamo.razon_social LIKE '${cliente}'`;
  }

  if (desde !== undefined && desde !== '' && hasta !== undefined && hasta !== '') {
    sql += ` AND CAST(reclamo.fecha_reclamo AS DATE) BETWEEN '${desde}' AND '${hasta}'`;
  } 

  try {
    const { rows } = await pool.query(sql);
    if (rows.length === 0) {
      res.send({
        error: "S",
        mensaje: ''
      });
    } else {
      res.send({
        error: "N",
        mensaje: "",
        objetos: rows[0].num_registros,
      });
    }
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }

};

export const obtenerReclamosPorEstado = async (req, res) => {
  const { codigo_empresa } = req.headers;
  const pool = dbSession(codigo_empresa);
  const estado = req.params.estado;
  const factura = req.query.factura;
  const ruc = req.query.ruc;
  const cliente = req.query.cliente;
  const desde = req.query.desde;
  const hasta = req.query.hasta;
  const numeroDePagina = req.query.numeroDePagina;
  const registrosPorPagina = req.query.registrosPorPagina;

  let offset = (numeroDePagina - 1) * registrosPorPagina;

  let sql = `SELECT id_detalle, reclamo.id_reclamo, reclamo.fecha_reclamo, nombre_reclamante, ruc_reclamante, reclamo.no_factura, reclamo.fecha_factura,reclamo.fecha_enproceso, reclamo.fecha_finalizado, reclamo.respuesta_finalizado, reclamo.nombre_usuario, reclamo.email, reclamos
  FROM detalle_reclamo 
  JOIN reclamo ON detalle_reclamo.id_reclamo = reclamo.id_reclamo 
  WHERE reclamo.estado LIKE '${estado}'`;

  if (factura !== undefined && factura !== '') {
    sql += ` AND reclamo.no_factura LIKE '${factura}'`;
  }

  if (ruc !== undefined && factura !== '') {
    sql += ` AND reclamo.ruc_cliente='${ruc}'`;
  }

  if (cliente !== undefined && cliente !== '' && cliente !== 'null') {
    sql += ` AND reclamo.razon_social LIKE '${cliente}'`;
  }

  if (desde !== undefined && desde !== '' && hasta !== undefined && hasta !== '') {
    sql += ` AND CAST(reclamo.fecha_reclamo AS DATE) BETWEEN '${desde}' AND '${hasta}'`;
  } 

  sql += ` ORDER BY id_reclamo OFFSET ${offset} ROWS FETCH FIRST ${registrosPorPagina} ROWS ONLY`;


  try {
    const { rows } = await pool.query(sql);
    if (rows[0] !== undefined) {
      res.send({ error: "N", mensaje: "", objetos: rows });
    } else {
      res.send({
        error: "N",
        mensaje: "",
        objetos: 0,
      });
    }
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
};

export const actualizarEstado = async (req, res) => {
  const pool = dbSession(4);
  const { id_reclamo, estado, login_usuario, nombre_usuario, respuesta_finalizado } = req.body;


  let sql = "";

  if (estado === "PEN") {
    sql = `UPDATE reclamo SET estado='PEN', fecha_enproceso=NULL, login_usuario=NULL, nombre_usuario=NULL WHERE id_reclamo='${id_reclamo}' RETURNING id_reclamo`;
  }

  if (estado === "PRO") {
    const fecha = new Date().toISOString();
    sql = `UPDATE reclamo SET estado='PRO', fecha_enproceso='${fecha}', login_usuario='${login_usuario}', nombre_usuario='${nombre_usuario}', respuesta_finalizado='${respuesta_finalizado}' WHERE id_reclamo='${id_reclamo}' RETURNING id_reclamo`;
  }

  if (estado === "FIN") {
    const fecha = new Date().toISOString();
    sql = `UPDATE reclamo SET estado='FIN', fecha_finalizado='${fecha}', login_usuario='${login_usuario}', nombre_usuario='${nombre_usuario}', respuesta_finalizado='${respuesta_finalizado}' WHERE id_reclamo='${id_reclamo}' RETURNING id_reclamo`;
  }


  try {
    const { rows } = await pool.query(sql);
    res.send({
      error: "N",
      mensaje: "Estado actualizado exitosamente",
      objetos: rows[0].id_motivo,
    });
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
};

export const subirFotos = async (req, res) => {
  const form = new formidable.IncomingForm();
  const id = req.params.id;
  const directorio = path.join(__dirname, '../../../../public/imagenes_reclamos');
  form.uploadDir = directorio;
  form.options.keepExtensions = true;
  form.parse(req, async (_, fields, files) => {
    res.send({ fields, files })
  });
};

export const subirArchivo = async (req, res) => {
  const form = new formidable.IncomingForm();
  const directorio = path.join(__dirname, '../../../../public/imagenes_reclamos');
  form.uploadDir = directorio;
  form.options.keepExtensions = true;
  form.parse(req, async (_, fields, files) => {
    res.send({ fields, files })
  });
};

export const registrarArchivo = async (req, res) => {
  const pool = dbSession(4);
  const { filepath } = req.body;
  const sql = `INSERT INTO archivo (id_detalle, path) VALUES(0, '${filepath}') returning id_archivo`;

  try {
    const { rows } = await pool.query(sql);
    res.send({ error: "N", mensaje: "", objetos: rows });
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }

};

export const eliminarArchivos = async (req, res) => {
  const pool = dbSession(4);
  const sql = `DELETE FROM archivo WHERE id_detalle = 0`;
  try {
    const { rows } = await pool.query(sql);
    res.send({ error: "N", mensaje: "", objetos: rows });
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
};

export const actualizarArchivos = async (req, res) => {
  const pool = dbSession(4);
  const { id_detalle, id_archivo } = req.body;
  const sql = `UPDATE archivo SET id_detalle = ${id_detalle} WHERE id_archivo = ${id_archivo}`;
  try {
    const { rows } = await pool.query(sql);
    res.send({ error: "N", mensaje: "", objetos: rows });
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
};

export const actualizarArchivo = async (req, res) => {
  const pool = dbSession(4);
  const { id_detalle, filepath } = req.body;
  const sql = `INSERT INTO archivo (id_detalle, path) VALUES(${id_detalle}, '${filepath}')`;
  try {
    const { rows } = await pool.query(sql);
    res.send({ error: "N", mensaje: "", objetos: rows });
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }

};

export const obtenerArchivos = async (req, res) => {
  const { codigo_empresa } = req.headers;
  const pool = dbSession(codigo_empresa);
  const id_archivo = req.params.id;
  const sql = `SELECT path FROM archivo WHERE id_archivo=${id_archivo}`;
  try {
    const { rows } = await pool.query(sql);
    res.send({ error: "N", mensaje: "", objetos: rows });
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
};

export const obtenerReclamos = async (req, res) => {
  const pool = dbSession(4);
  const sql = `SELECT razon_social FROM reclamo ORDER BY fecha_reclamo`;
  try {
    const { rows } = await pool.query(sql);
    res.send({ error: "N", mensaje: "", objetos: rows });
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
};


export const obtenerReclamoPorCliente = async (req, res) => {
  const { codigo_empresa } = req.headers;
  const pool = dbSession(codigo_empresa);
  const cliente = req.params.cliente;
  const estado = req.query.estado;
  const desde = req.query.desde;
  const hasta = req.query.hasta;

  let sql = `SELECT reclamo.estado, ruc_reclamante, reclamo.no_factura, reclamo.id_reclamo, reclamo.fecha_reclamo, reclamo.fecha_factura, reclamo.fecha_reclamo, nombre_reclamante, id_detalle, reclamo.nombre_usuario, reclamo.fecha_enproceso, reclamo.fecha_finalizado, reclamo.respuesta_finalizado, reclamos
  FROM detalle_reclamo 
  JOIN reclamo ON detalle_reclamo.id_reclamo = reclamo.id_reclamo 
  WHERE reclamo.razon_social='${cliente}'`;

  if (estado !== undefined) {
    sql += ` AND reclamo.estado LIKE '${estado}'`;
  }

  if (desde !== undefined && desde !== '' && hasta !== undefined && hasta !== '') {
    sql += `AND CAST(reclamo.fecha_reclamo AS DATE) BETWEEN '${desde}' AND '${hasta}'`;
  }

  sql += ` ORDER BY id_reclamo`;

  try {
    const { rows } = await pool.query(sql);

    if (rows[0] !== undefined) {
      const { ruc_reclamante, fecha_factura } = rows[0];
      const reclamo = {
        fecha_factura,
        ruc_reclamante,
        detalles: rows,
      };

      res.send({ error: "N", mensaje: "", objetos: reclamo });
    } else {
      res.send({
        error: "N",
        mensaje: "",
        objetos: 0,
      });
    }
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
};