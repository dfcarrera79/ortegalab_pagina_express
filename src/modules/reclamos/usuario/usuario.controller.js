import dbSession from "../../../pool";
import { codify, generateRandomString, deducirMensajeError, enviarEmail } from "../../../utils";

export const validarUsuario = async (req, res) => {
  const id = req.query.id;
  const clave = req.query.clave;
  const appCodigo = parseInt(req.query.appCodigo);

  if (appCodigo === 1 || appCodigo === 4) {
    res.send(await validarCliente(id, clave));
  } else if (appCodigo === 2 || appCodigo === 3) {
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
      let respuesta = await obtenerClienteSistemaContable(id);
      if (respuesta.error === "S") {
        return respuesta;
      }
      const usuario = respuesta.objetos;

      if(usuario[0].clave === null) {
        let response = crearUsuario(usuario[0].ruc_cliente, usuario[0].razon_social, usuario[0].nombre_comercial);
        return response;
      }
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
  const sql = `SELECT clp_cedruc AS ruc_cliente, clp_descri AS razon_social, clp_contacto AS nombre_comercial, clave FROM referente.TReferente WHERE clp_cedruc LIKE '${id.trim()}'`;
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
        objetos: rows,
      };
    }
  } catch (error) {
    return { error: "S", mensaje: deducirMensajeError(error) };
  } finally {
    pool.end();
  }
};

const crearUsuario = async (ruc_cliente, razon_social, nombre_comercial) => {
  const pool = dbSession(4);
  const sql = `INSERT INTO usuario (ruc_cliente, razon_social, nombre_comercial, clave) VALUES ('${ruc_cliente}', '${razon_social}', '${nombre_comercial}', '${codify(ruc_cliente)}')`;
  try {
    await pool.query(sql);
    return {
      error: "N",
      mensaje: "",
      objetos: {
        ruc_cliente: ruc_cliente,
        razon_social: razon_social,
        nombre_comercial: nombre_comercial,
        clave: codify(ruc_cliente),
      },
    };
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

export const cambiarClave = async (req, res) => {
  const pool = dbSession(4);
  const { ruc, clave } = req.body;
  const nuevaClave = codify(clave);
  const sql = `UPDATE usuario SET clave = '${nuevaClave}' WHERE ruc_cliente = '${ruc}' RETURNING ruc_cliente`;

  try {
    const { rows } = await pool.query(sql);
    res.send({ error: "N", mensaje: "Clave cambiada exitosamente", objetos: rows[0] });
  } catch (error) {
    return { error: "S", mensaje: deducirMensajeError(error) };
  } finally {
    pool.end();
  }

};

export const resetearClave = async (req, res) => {
  const pool = dbSession(4);
  try {
    const data = req.body;
    const { ruc, email } = data;
    const clave = generateRandomString(10);
    const subject = 'Nueva clave de acceso';
    const message = `
      <p>Estimad@, mediante el presente email le enviamos la nueva clave generada y le recomendamos cambiarla lo antes posible por una personal.</p>
      <p><strong>Nueva clave: </strong>${clave}</p>
      <p><a href='http://apromedfarmaloja-cloud.com:3008/#/resetear_clave/${ruc}'>Cambiar la clave de acceso</a></p>
    `;

    const payload = {
      from: '"LoxaSoluciones" <soporte@loxasoluciones.com>',
      emails: email,
      subject,
      message,
      codigo_empresa: 5,
    };

    const response = await enviarEmail(payload);
    const nueva_clave = codify(clave);
    const sql = `UPDATE usuario SET clave = '${nueva_clave}' WHERE ruc_cliente = '${ruc}' RETURNING ruc_cliente`;

    if (response.ok) {
      // Assuming you have an active database connection/session
      const { rows } = await pool.query(sql);
      res.send({ error: "N", mensaje: "Clave cambiada exitosamente", objetos: rows[0] });
    }
  } catch (error) {
    return { error: "S", mensaje: deducirMensajeError(error) };
  } finally {
    pool.end();
  }
};