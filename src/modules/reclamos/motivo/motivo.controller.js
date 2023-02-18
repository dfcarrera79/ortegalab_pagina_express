import dbSession from "../../../pool";
import { deducirMensajeError } from "../../../utils";

export const obtenerMotivos = async (req, res) => {
  const { codigo_empresa } = req.headers;
  const pool = dbSession(codigo_empresa);
  const sql = `SELECT * FROM motivo ORDER BY nombre_motivo`;
  try {
    const { rows } = await pool.query(sql);
    res.send({ error: "N", mensaje: "", objetos: rows });
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
};

export const guardarMotivo = async (req, res) => {
  const { codigo_empresa } = req.headers;
  const pool = dbSession(codigo_empresa);
  const motivo = req.body;
  let sql =
    motivo.id_motivo === 0
      ? `INSERT INTO motivo (nombre_motivo) VALUES('${motivo.nombre_motivo}') RETURNING id_motivo`
      : `UPDATE motivo SET nombre_motivo='${motivo.nombre_motivo}' WHERE id_motivo='${motivo.id_motivo}' RETURNING id_motivo`;
  try {
    const { rows } = await pool.query(sql);
    res.send({
      error: "N",
      mensaje: "Motivo agregado exitosamente",
      objetos: rows[0].id_motivo,
    });
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
};

export const eliminarMotivo = async (req, res) => {
  const { codigo_empresa } = req.headers;
  const pool = dbSession(codigo_empresa);

  const id_motivo = req.params.id;
  const sql = `DELETE FROM motivo WHERE id_motivo='${id_motivo}'`;

  try {
    const { rows } = await pool.query(sql);
    res.send({
      error: "N",
      mensaje: "Motivo eliminado exitosamente",
      objetos: "",
    });
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
};
