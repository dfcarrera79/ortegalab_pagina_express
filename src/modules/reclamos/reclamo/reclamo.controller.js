import dbSession from "../../../pool";
import { deducirMensajeError, formatoFecha } from "../../../utils";
import formidable from "formidable";
import path from "path";

export const obtenerProductos = async (req, res) => {
  const pool = dbSession(5);
  const codigo = req.params.codigo;
  const sql = `SELECT TArticulo.art_codigo, TArticulo.art_codbar, TArticulo.art_nomlar, TDetEgre.dt_cant, TDetEgre.dt_lote, TDetEgre.dt_fecha, TDetEgre.conteo_pedido 
	FROM articulo.TArticulo INNER JOIN comun.TDetEgre ON TArticulo.art_codigo = TDetEgre.art_codigo AND TDetEgre.trn_codigo = ${codigo} ORDER BY TArticulo.art_nomlar`;
  try {
    const { rows } = await pool.query(sql);
    res.send({ error: "N", mensaje: "", objetos: rows });
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
};

const obtenerFactura = async (ruc_cliente, numero_factura) => {
  const pool = dbSession(5);
  const sql = `SELECT TEgreso.trn_compro AS no_factura, TEgreso.trn_fecreg AS fecha_factura, TReferente.clp_cedruc AS ruc_cliente, TReferente.clp_descri AS razon_social, TReferente.clp_contacto AS nombre_comercial, TReferente.clp_calles AS direccion, TReferente.ciu_descri AS ciudad, TReferente.celular AS telefonos, TReferente.email, TEgreso.  FROM comun.TEgreso INNER JOIN referente.TReferente ON TEgreso.clp_codigo = TReferente.clp_codigo WHERE TRIM(TReferente.clp_cedruc) LIKE '${ruc_cliente}' AND TRIM(TEgreso.trn_compro) LIKE '${numero_factura}' AND TEgreso.doc_codigo = 1 AND TEgreso.trn_valido = 0`;
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

export const crearDetalle = async (req, res) => {
  const pool = dbSession(4);
  const { tipo, no_factura, id_motivo, comentario, ruc_reclamante } = req.body;
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
    }
    sql = `INSERT INTO detalle_reclamo VALUES(DEFAULT, '${id_reclamo}', '${id_motivo}', '${tipo}', '${comentario}', current_timestamp, '${ruc_reclamante}', '${razon_social}') RETURNING id_detalle`;
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

  let sql = `SELECT reclamo.estado, ruc_reclamante, reclamo.no_factura, reclamo.id_reclamo, reclamo.fecha_reclamo, reclamo.fecha_factura, motivo.nombre_motivo, reclamo.fecha_reclamo, nombre_reclamante, comentario, id_detalle, reclamo.nombre_usuario, reclamo.fecha_enproceso, reclamo.fecha_finalizado, reclamo.respuesta_finalizado
  FROM detalle_reclamo 
  JOIN reclamo ON detalle_reclamo.id_reclamo = reclamo.id_reclamo 
  JOIN motivo ON detalle_reclamo.id_motivo = motivo.id_motivo 
  WHERE ruc_reclamante='${ruc}'`;

  if (factura !== undefined) {
    sql += ` AND reclamo.no_factura LIKE '${factura}'`;
  }

  if (estado !== undefined) {
    sql += ` AND reclamo.estado LIKE '${estado}'`;
  }

  if (desde !== undefined && hasta !== undefined) {
    sql += `AND reclamo.fecha_reclamo BETWEEN '${desde}' AND '${hasta}'`;
  }

  sql += ` ORDER BY id_reclamo FETCH FIRST 50 ROWS ONLY`;

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

export const obtenerReclamosPorEstado = async (req, res) => {
  const { codigo_empresa } = req.headers;
  const pool = dbSession(codigo_empresa);
  const estado = req.params.estado;
  const factura = req.query.factura;
  const ruc = req.query.ruc;
  const desde = req.query.desde;
  const hasta = req.query.hasta;

  let sql = `SELECT reclamo.id_reclamo, ruc_reclamante, reclamo.no_factura, reclamo.fecha_reclamo, reclamo.fecha_factura, motivo.nombre_motivo, reclamo.fecha_reclamo, nombre_reclamante, comentario, id_detalle, reclamo.nombre_usuario, reclamo.fecha_enproceso, reclamo.fecha_finalizado, reclamo.respuesta_finalizado
  FROM detalle_reclamo 
  JOIN reclamo ON detalle_reclamo.id_reclamo = reclamo.id_reclamo 
  JOIN motivo ON detalle_reclamo.id_motivo = motivo.id_motivo 
  WHERE reclamo.estado LIKE '${estado}'`;

  if (factura !== undefined) {
    sql += ` AND reclamo.no_factura LIKE '${factura}'`;
  }

  if (ruc !== undefined) {
    sql += ` AND reclamo.ruc_cliente='${ruc}'`;
  }

  if (desde !== undefined && hasta !== undefined) {
    sql += ` AND reclamo.fecha_reclamo BETWEEN '${desde}' AND '${hasta}'`;
  }

  sql += ` ORDER BY id_reclamo FETCH FIRST 50 ROWS ONLY`;

  try {
    const { rows } = await pool.query(sql);

    if (rows[0] !== undefined) {
      const { ruc_reclamante, fecha_factura } = rows[0];
      const reclamo = {
        fecha_factura,
        ruc_reclamante,
        detalles: rows,
      };

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
    const fecha = new Date().toJSON();
    sql = `UPDATE reclamo SET estado='PRO', fecha_enproceso='${fecha}', login_usuario='${login_usuario}', nombre_usuario='${nombre_usuario}' WHERE id_reclamo='${id_reclamo}' RETURNING id_reclamo`;
  }

  if (estado === "FIN") {
    const fecha = new Date().toJSON();
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
  const id_detalle = req.params.id;
  const sql = `SELECT path FROM archivo WHERE id_detalle=${id_detalle}`;
  try {
    const { rows } = await pool.query(sql);
    res.send({ error: "N", mensaje: "", objetos: rows });
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
};