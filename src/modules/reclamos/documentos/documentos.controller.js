import dbSession from "../../../pool";
import { deducirMensajeError } from "../../../utils";
import formidable from "formidable";
import path from "path";

export const subirDocumento = async (req, res) => {
  const form = new formidable.IncomingForm();
  const directorio = path.join(__dirname, '../../../../public/documentos');
  form.uploadDir = directorio;
  form.options.keepExtensions = true;
  form.parse(req, async (_, fields, files) => {
    res.send({ fields, files })
  });
};

export const registrarDocumento = async (req, res) => {
  const pool = dbSession(4);
  const { filepath, id_producto } = req.body;
  const sql = `INSERT INTO documentacion (id_producto, tipo, path) VALUES('${id_producto}', '1', '${filepath}') returning id_documento`;
  try {
    const { rows } = await pool.query(sql);
    res.send({ error: "N", mensaje: "Análisis de lote ingresado correctamente", objetos: rows });
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
};

// export const obtenerDocumento = async (req, res) => {
//   const modifiedTime = new Date().toUTCString();
//   res.set('Last-Modified', modifiedTime);
//   const pool = dbSession(4);
//   const { id_producto } = req.query;
//   const sql = `SELECT * FROM documentacion WHERE id_producto = '${id_producto}' AND tipo = '1'`;
//   console.log('[SQL documento]: ', sql);
//   try {
//     const { rows } = await pool.query(sql);
//     res.send({ error: "N", mensaje: "", objetos: rows });
//   } catch (error) {
//     res.send({ error: "S", mensaje: deducirMensajeError(error) });
//   } finally {
//     pool.end();
//   }
// }

export const obtenerDocumento = async (req, res) => {
  const pool = dbSession(4);
  const { id_producto } = req.query;
  const sql = `SELECT * FROM documentacion WHERE id_producto = '${id_producto}' AND tipo = '1'`;
  try {
    const { rows } = await pool.query(sql);
    res.send({ error: "N", mensaje: "", objetos: rows });
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
};

export const actualizarDocumento = async (req, res) => {
  const pool = dbSession(4);
  const { filepath, id_producto } = req.body;
  const sql = `UPDATE documentacion SET path = '${filepath}', modificado_en = NOW() WHERE id_producto = '${id_producto}' AND tipo = '1' RETURNING id_documento`;
  try {
    const { rows } = await pool.query(sql);
    res.send({ error: "N", mensaje: "Análisis de lote actualizado correctamente", objetos: rows });
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
};


