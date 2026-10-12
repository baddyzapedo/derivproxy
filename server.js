const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (clientWs, req) => {
  console.log("Client connected from Qatar");

  // Extract path like /websockets/v3?app_id=1169
  const url = req.url;
  const targetUrl = `wss://ws.derivws.com${url}`;
  
  console.log("Connecting upstream to:", targetUrl);
  
  const derivWs = new WebSocket(targetUrl);

  derivWs.on('open', () => console.log("Upstream OPEN"));

  // Forward client -> Deriv
  clientWs.on('message', (msg) => {
    if (derivWs.readyState === WebSocket.OPEN) derivWs.send(msg);
  });

  // Forward Deriv -> client
  derivWs.on('message', (msg) => {
    if (clientWs.readyState === WebSocket.OPEN) clientWs.send(msg);
  });

  clientWs.on('close', () => {
    console.log("Client closed");
    derivWs.close();
  });

  derivWs.on('close', (code, reason) => {
    console.log(`Upstream closed: ${code} ${reason}`);
    if (clientWs.readyState === WebSocket.OPEN) clientWs.close(code, reason);
  });

  derivWs.on('error', (e) => console.log("Upstream error:", e.message));
  clientWs.on('error', (e) => console.log("Client error:", e.message));
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Proxy listening on ${PORT}`));
