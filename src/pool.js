import { obtenerDataBase } from './utils';

const pg = require('pg');
pg.types.setTypeParser(pg.types.builtins.INT8, (value) => {
    return parseInt(value);
}); 
pg.types.setTypeParser(pg.types.builtins.FLOAT8, (value) => {
    return parseFloat(value);
});
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (value) => {
    return parseFloat(value);
});

const { Pool } = require('pg');
const dbSession = (codigo_empresa) => {   
	const database = obtenerDataBase(codigo_empresa);    
		return new Pool({
				host:database.host,
				user:database.user,
				password:database.password,
				database:database.database,
				port:database.port,
				max:database.max,
				idleTimeoutMillis: 30000,
				connectionTimeoutMillis: 2000,
		});
}

export default dbSession;