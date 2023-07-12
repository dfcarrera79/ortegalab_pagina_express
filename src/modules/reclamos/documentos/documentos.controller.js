import dbSession from "../../../pool";
import { deducirMensajeError } from "../../../utils";
import formidable from "formidable";
import path from "path";
import fs from 'fs';

export const deleteDocument = (filePath) => {
  const fileName = path.basename(filePath);

  const directorio = path.join(__dirname, '../../../../public/documentos');
  const fullPath = path.join(directorio, fileName);

  fs.unlink(fullPath, (error) => {
    if (error) {
      console.error(`Error deleting file ${fileName}:`, error);
    } else {
      console.log(`File ${fileName} deleted successfully.`);
    }
  });
};

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

export const obtenerDocumento = async (req, res) => {
  const pool = dbSession(4);
  const { id_producto } = req.query;
  const sql = `SELECT * FROM documentacion WHERE id_producto = '${id_producto}' AND tipo = '1' ORDER BY id_documento`;
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
  const { filepath, id_producto, id_documento } = req.body;
  const sql = `UPDATE documentacion SET path = '${filepath}', modificado_en = NOW() WHERE id_producto = '${id_producto}' AND tipo = '1' AND id_documento = '${id_documento}' RETURNING id_documento`;
  try {
    const { rows } = await pool.query(sql);
    res.send({ error: "N", mensaje: "Análisis de lote actualizado correctamente", objetos: rows });
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
};

export const eliminarDocumento = async (req, res) => {
  const pool = dbSession(4);
  const { id_documento } = req.query;
  const sql = `DELETE FROM documentacion WHERE id_documento = '${id_documento}' RETURNING path`;
  try {
    const { rows } = await pool.query(sql);
    const fileName = rows[0].path;
    res.send({ error: "N", mensaje: "Documento eliminado correctamente" });
    deleteDocument(fileName);
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
};


