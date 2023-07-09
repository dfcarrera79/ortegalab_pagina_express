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
  const sql = `INSERT INTO registro (id_producto, path) VALUES('${id_producto}', '${filepath}') returning id_registro`;
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
  const sql = `SELECT * FROM registro WHERE id_producto = '${id_producto}'`;
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
  const sql = `UPDATE registro SET path = '${filepath}', modificado_en = NOW() WHERE id_producto = '${id_producto}' RETURNING id_registro`;
  try {
    const { rows } = await pool.query(sql);
    res.send({ error: "N", mensaje: "Registro sanitario actualizado correctamente", objetos: rows });
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
}

