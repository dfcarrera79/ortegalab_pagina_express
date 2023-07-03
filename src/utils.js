const fs = require('fs');
const rawdata = fs.readFileSync('localconf.json');
const configApp = JSON.parse(rawdata);
const nodemailer = require("nodemailer");

export function deducirMensajeError(o_error){    
    let mensaje = '';
    let hubo = false;
    if(o_error.message){
        mensaje = o_error.message === 'Network Error' ? 'La aplicación no logra conectarse con el servidor, revise si su dispositivo esta con internet o si el servidor esta disponible.' : o_error.message;
        hubo = true;        
    }
    if(o_error.config){
        if(o_error.config.url){
            mensaje = mensaje + "<br><span style='color:red'>" + o_error.config.url + "</span>";
            hubo = true;
        }
    }
    if(hubo === false){
        mensaje = JSON.stringify(o_error);
    }
    return mensaje;
}

export function generateRandomString(num) {
    const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result1= ' ';
    const charactersLength = characters.length;
    for ( let i = 0; i < num; i++ ) {
        result1 += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result1;
}

export function validarEmail(email) {
    if(email.trim().length === 0){
        return false;
    }    
    const emailRegex = /^[-\w.%+]{1,64}@(?:[A-Z0-9-]{1,63}\.){1,125}[A-Z]{2,63}$/i;;
    return emailRegex.test(email);
}

export function obtenerDataBase(codigo_empresa){
    return configApp.databases.find(e => e.codigo_empresa === parseInt(codigo_empresa));
}

export const enviarEmail = async (payload) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'loxacloud.soporte@gmail.com',
        pass: 'fzacuagyvlrknbkv'
      },
      tls: {                    
        rejectUnauthorized: false,
      },
    });     
    
    const sendMailPromise = new Promise((resolve, reject) => {
      transporter.sendMail({
        from: payload.from,
        to: payload.emails,
        subject: payload.subject,
        html: payload.message
      }, (error, info) => {
        if (error) {
          reject(error);
        } else {
          resolve(info);
        }
      });
    });

    await sendMailPromise;
    return { ok: true, mensaje: '' };        
  } catch (error) {
    return { ok: false, id: undefined, mensaje: deducirMensajeError(error) };        
  }    
}

export function codify(_value) {
    _value = _value.trim();
    let posicionRecorrido = 0;
    let longitudCadena = _value.length;
    let valorLetraenCurso = 0;
    let claveEncriptada = "";
    while (posicionRecorrido < longitudCadena) {
        valorLetraenCurso = _value.charCodeAt(posicionRecorrido);
        valorLetraenCurso = (valorLetraenCurso * 2) - 5;
        let letraCHR = String.fromCharCode(valorLetraenCurso);
        claveEncriptada = claveEncriptada + letraCHR;
        posicionRecorrido++;
    }
    return claveEncriptada;
}

export function deCodify(_value) {
    _value = _value.trim();
    let posicionRecorrido = 0;
    let longitudCadena = _value.length;
    let valorLetraenCurso = 0;
    let claveDesencriptada = "";
    while (posicionRecorrido < longitudCadena) {
        valorLetraenCurso = _value.charCodeAt(posicionRecorrido);
        valorLetraenCurso = (valorLetraenCurso + 5) / 2;
        let letraCHR = String.fromCharCode(valorLetraenCurso);
        claveDesencriptada = claveDesencriptada + letraCHR;
        posicionRecorrido++;
    }
    return claveDesencriptada;
}

export function formatoFecha(date) {
  let d = new Date(date),
		mes = '' + (d.getMonth() + 1),
		dia = '' + d.getDate(),
		anio = d.getFullYear();
	if (mes.length < 2) 
		mes = '0' + mes;
	if (dia.length < 2) 
		dia = '0' + dia;

	return [anio, mes, dia].join('-');
} 
