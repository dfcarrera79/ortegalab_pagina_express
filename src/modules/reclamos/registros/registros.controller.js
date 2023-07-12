import dbSession from "../../../pool";
import { deducirMensajeError } from "../../../utils";
import formidable from "formidable";
import path from "path";

export const subirRegistro = async (req, res) => {
  const form = new formidable.IncomingForm();
  const directorio = path.join(__dirname, '../../../../public/documentos');
  form.uploadDir = directorio;
  form.options.keepExtensions = true;
  form.parse(req, async (_, fields, files) => {
    res.send({ fields, files })
  });
};

export const grabarRegistro = async (req, res) => {
  const pool = dbSession(4);
  const { filepath, id_producto } = req.body;
  const sql = `INSERT INTO documentacion (id_producto, tipo, path) VALUES('${id_producto}', '2', '${filepath}') returning id_documento`;
  try {
    const { rows } = await pool.query(sql);
    res.send({ error: "N", mensaje: "Registro sanitario ingresado correctamente", objetos: rows });
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
};

export const obtenerRegistro = async (req, res) => {
  const pool = dbSession(4);
  const { id_producto } = req.query;
  const sql = `SELECT * FROM documentacion WHERE id_producto = '${id_producto}' AND tipo = '2'`;
  try {
    const { rows } = await pool.query(sql);
    res.send({ error: "N", mensaje: "", objetos: rows });
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
}

export const actualizarRegistro = async (req, res) => {
  const pool = dbSession(4);
  const { filepath, id_producto } = req.body;
  const sql = `UPDATE documentacion SET path = '${filepath}', modificado_en = NOW() WHERE id_producto = '${id_producto}' AND tipo = '2' RETURNING id_documento`;
  try {
    const { rows } = await pool.query(sql);
    res.send({ error: "N", mensaje: "Registro sanitario actualizado correctamente", objetos: rows });
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
}

