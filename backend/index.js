const createServer = require('./server');
const createMainServer = require('./mainServer');


createMainServer(8005);

createServer(1, 8000);
createServer(2, 8001);
createServer(3, 8002);


