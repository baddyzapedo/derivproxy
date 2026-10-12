const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Deriv Proxy is Live - use wss://'+req.headers.host+'/websockets/v3?app_id=1169');
});

const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (clientWs, req) => {
  const targetUrl = `wss://ws.derivws.com${req.url}`;
  console.log(`[NEW] Client connected -> Forwarding to ${targetUrl}`);
  
  const derivWs = new WebSocket(targetUrl);

  derivWs.on('open', () => {
    console.log('[UPSTREAM] Connected to Deriv');
  });

  clientWs.on('message', (data) => {
    if (derivWs.readyState === WebSocket.OPEN) derivWs.send(data);
  });

  derivWs.on('message', (data) => {
    if (clientWs.readyState === WebSocket.OPEN) clientWs.send(data);
  });

  const closeBoth = () => {
    try { clientWs.close(); } catch(e){}
    try { derivWs.close(); } catch(e){}
  };

  clientWs.on('close', closeBoth);
  derivWs.on('close', closeBoth);
  clientWs.on('error', (e) => console.log('Client error', e.message));
  derivWs.on('error', (e) => console.log('Upstream error', e.message));
});

server.listen(PORT, () => {
  console.log(`Proxy listening on ${PORT}`);
});
