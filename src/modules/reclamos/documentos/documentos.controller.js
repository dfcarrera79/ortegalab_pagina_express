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
  const sql = `INSERT INTO documento (id_producto, path) VALUES('${id_producto}', '${filepath}') returning id_documento`;
  try {
    const { rows } = await pool.query(sql);
    res.send({ error: "N", mensaje: "Análisis de lote ingresado correctamente", objetos: rows });
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
};

export const obtenerDocumento = async (req, res) => {
  const pool = dbSession(4);
  const { id_producto } = req.query;
  const sql = `SELECT * FROM documento WHERE id_producto = '${id_producto}'`;
  try {
    const { rows } = await pool.query(sql);
    res.send({ error: "N", mensaje: "", objetos: rows });
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
}

export const actualizarDocumento = async (req, res) => {
  const pool = dbSession(4);
  const { filepath, id_producto } = req.body;
  const sql = `UPDATE documento SET path = '${filepath}', modificado_en = NOW() WHERE id_producto = '${id_producto}' RETURNING id_documento`;
  try {
    const { rows } = await pool.query(sql);
    res.send({ error: "N", mensaje: "Análisis de lote actualizado correctamente", objetos: rows });
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
};

