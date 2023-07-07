import dbSession from "../../../pool";
import { deducirMensajeError } from "../../../utils";

export const obtenerLaboratorios = async (req, res) => {
  const pool = dbSession(5);
  const sql = `SELECT cat_codigo AS pkey_laboratorio, cat_descri AS nombre_laboratorio FROM articulo.Tcategoria WHERE fam_codigo = 1 ORDER BY cat_descri`;
  try {
    const { rows } = await pool.query(sql);
    res.send({ error: "N", mensaje: "", objetos: rows });
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
};

export const obtenerProductosLaboratorio = async (req, res) => {
  const pool = dbSession(5);
  const laboratorio = req.query.laboratorio;

  console.log('[LABORATORIO]: ', laboratorio);
  
  const sql = `SELECT TArticulo.art_codigo, TFamilia.fam_descri AS seccion, TCategoria.cat_descri AS laboratorio, TArticulo.art_codbar AS codigo_interno, TUniArt.ua_codbar AS codigo_barras, TArticulo.art_nomlar AS nombre_articulo, TUnidad.uni_siglas||' x '||TRUNC(TUniArt.ua_cant,0) AS presentacion
  FROM articulo.TArticulo INNER JOIN articulo.TFamilia ON TArticulo.fam_codigo = TFamilia.fam_codigo AND TFamilia.fam_codigo = 1 AND TArticulo.art_estado = 0
  INNER JOIN articulo.TCategoria ON TArticulo.cat_codigo =  TCategoria.cat_codigo AND TCategoria.cat_descri = '${laboratorio}'
  INNER JOIN articulo.TUniArt ON TArticulo.art_codigo = TUniArt.art_codigo AND TUniArt.ua_def = 1
  INNER JOIN articulo.TUnidad ON TUniArt.uni_codigo = TUnidad.uni_codigo
  ORDER BY TArticulo.art_nomlar`;

  console.log('[SQL]: ', sql);

  try {
    const { rows } = await pool.query(sql);
    res.send({ error: "N", mensaje: "", objetos: rows });
    
  } catch (error) {
    res.send({ error: "S", mensaje: deducirMensajeError(error) });
  } finally {
    pool.end();
  }
};


