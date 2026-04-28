require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const routes = require('./routes/index');
const { iniciarSocket } = require('./socket/index');
const { iniciarMonitorPresenca } = require('./services/presencaMonitor');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());

// Torna io disponível nos controllers via req.app.get('io')
app.set('io', io);

app.use('/api', routes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

iniciarSocket(io);
iniciarMonitorPresenca(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = { app, server };
