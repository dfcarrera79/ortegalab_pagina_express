import { portalSuspended } from "pg-protocol/dist/messages";
import dbSession from "../../../pool";
import { codify, deCodify, deducirMensajeError } from "../../../utils";

export const validarUsuario = async (req, res) => {
  const id = req.query.id;
  const clave = req.query.clave;
  const appCodigo = parseInt(req.query.appCodigo);

  console.log(id);
  console.log(clave);
  console.log(appCodigo);

  if (appCodigo === 1) {
    res.send(await validarCliente(id, clave));
  } else if (appCodigo === 2) {
    res.send(await obtenerUsuarioSistemaContable(id, clave));
  } else {
    res.send({ error: "S", mensaje: "El código de aplicaci{on no es correcto" });
  }
};

export const validarCliente = async (id, clave) => {
  const pool = dbSession(4);

  let sql = `SELECT * FROM usuario WHERE TRIM(ruc_cliente) LIKE '${id.trim()}'`;
  try {
    let { rows } = await pool.query(sql);
    if (rows.length === 0) {
      let respuesta = obtenerClienteSistemaContable(id);
      if (respuesta.error === "S") {
        return respuesta;
      }
      const usuario = respuesta.objetos;
      usuario.clave = codify(usuario.id);
      respuesta = await crearUsuario(pool, usuario);
      return respuesta;
    } else {
      const clienteApp = rows[0];
      if (clienteApp.clave === codify(clave)) {
        return { error: "N", mensaje: "", objetos: clienteApp };
      } else {
        return {
          error: "S",
          mensaje: `Hola ${clienteApp.razon_social}, tu clave de acceso ingresada no es correcta, no puede acceder al sistema`,
          objetos: rows,
        };
      }
    }
  } catch (error) {
    return { error: "S", mensaje: deducirMensajeError(error) };
  } finally {
    pool.end();
  }
};

const obtenerClienteSistemaContable = async (id) => {
  const pool = dbSession(5);
  const sql = `SELECT clp_cedruc AS ruc_cliente, clp_descri AS razon_social, clp_contacto AS nombre_comercial, '' AS clave WHERE clp_cedruc LIKE '${id.trim()}'`;
  try {
    const { rows } = await pool.query(sql);
    if (rows.length === 0) {
      return {
        error: "S",
        mensaje:
          "No existe un cliente con el RUC Nro. " +
          id +
          " registrado en el sistema contable",
      };
    } else {
      return {
        error: "N",
        mensaje: "",
        objetos: rows[0],
      };
    }
  } catch (error) {
    return { error: "S", mensaje: deducirMensajeError(error) };
  } finally {
    pool.end();
  }
};

const obtenerUsuarioSistemaContable = async (id, clave) => {
  const pool = dbSession(5);
  const sql = `SELECT usu_login AS ruc_cliente, usu_nomape AS razon_social, usu_nomape AS nombre_comercial, usu_clave AS clave FROM usuario.TUsuario WHERE TRIM(usu_login) LIKE '${id.trim()}'`;
  try {
    const { rows } = await pool.query(sql);
    if (rows.length === 0) {
      return {
        error: "S",
        mensaje: "El login ingresado no está registrado en el sistema contable",
      };
    } else {
      const usuario = rows[0];
      const ok = usuario.clave === codify(clave);
      return {
        error: ok ? "N" : "S",
        mensaje: ok
          ? ""
          : `Hola ${usuario.razon_social}, la clave ingresada no es correcta`,
        objetos: ok ? usuario : undefined,
      };
    }
  } catch (error) {
    return { error: "S", mensaje: deducirMensajeError(error) };
  } finally {
    pool.end();
  }
};