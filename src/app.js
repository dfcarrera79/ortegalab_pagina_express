import express from 'express';
import cors from 'cors';
import path from 'path';

// Imports para la app de reclamos
import CorreoRoutes from './modules/enviarCorreo/correo.routes';

const morgan = require('morgan');
// const formidable = require('formidable');
const app = express();

// Cargar configuraciones del servidor
const fs = require('fs');
const rawdata = fs.readFileSync('localconf.json');
const configApp = JSON.parse(rawdata);

// middlewares
app.use(morgan('tiny'));
app.use(cors());
app.use(express.json());

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json({limit:1024*1024*20, type:'application/json'});
var urlencodedParser = bodyParser.urlencoded({ extended:true,limit:1024*1024*20,type:'application/x-www-form-urlencoded' })
app.use(jsonParser);
app.use(urlencodedParser);
app.use(express.urlencoded({extended:true}));

// routes para la app de reclamos Apromed
app.use('/enviar_correo', CorreoRoutes);

// Init app
const port = process.env.PORT || configApp.port_http;
const version = 'v1.04 RC';
app.listen(port, () => {
    console.log(`EMILIA APIS JSExpress v1${version} esta corriendo sobre el puerto ${port}`);
});

// Configurar el servidor para trabajar con ssl
if(configApp.ssl === "true"){        
    fs.stat(configApp.dir_cert, function(err) {        
        if (!err) {
            const puerto_ssl = configApp.port_ssl;
            const https = require('https');
            https.createServer({
                key: fs.readFileSync(path.join(configApp.dir_cert, configApp.filename_key),'utf8'),
                cert: fs.readFileSync(path.join(configApp.dir_cert, configApp.filename_cert),'utf8'),              
                ca: [
                    fs.readFileSync(path.join(configApp.dir_cert, configApp.filename_ca),'utf8')
                ]
            }, app).listen(puerto_ssl, () => {                
                console.log(`EMILIA APIS JSExpress v1${version} SSL esta escuchando por el puerto: ${puerto_ssl}`);
            });
        }    
    });
}