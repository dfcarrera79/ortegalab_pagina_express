import {
  deducirMensajeError,
  enviarEmailLab,
} from "../../utils";

export const respuestaLab = async (req, res) => {
  try {
    const data = req.body;
    console.log("[DATA]: ", data);
    const { email, respuesta, asunto } = data;
    const message = respuesta;

    const payload = {
      from: '"Citas OrtegaLab Página Web',
      emails: email,
      subject: asunto,
      message,
    };

    const response = await enviarEmailLab(payload);

    if (response.ok) {
      // Assuming you have an active database connection/session
      res.send({
        error: "N",
        mensaje: "Información enviada correctamente",
        objetos: "",
      });
    }
  } catch (error) {
    return { error: "S", mensaje: deducirMensajeError(error) };
  }
};