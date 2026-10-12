const http = require('http');
const WebSocket = require('ws');
const PORT = process.env.PORT || 10000;
const server = http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/plain'});res.end('Proxy v3 Fixed')});
const wss = new WebSocket.Server({ noServer: true });
server.on('upgrade', (req,socket,head) => { wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req)); });
wss.on('connection', (client, req) => {
  const url = req.url || '/?app_id=1089';
  const target = `wss://ws.derivws.com${url}`;
  console.log('v3 Trying: ' + target);
  const deriv = new WebSocket(target, {
    headers: {
      'Origin': 'https://app.deriv.com',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache'
    },
    handshakeTimeout: 10000
  });
  let isOpen = false;
  deriv.on('open', () => { isOpen=true; console.log('SUCCESS Deriv OPEN'); });
  deriv.on('message', (data) => { if(client.readyState===1) client.send(data); });
  client.on('message', (data) => { if(deriv.readyState===1) deriv.send(data); });
  deriv.on('error', (e) => { console.log('Deriv error ' + e.message); if(!isOpen){ try{ const fallback = new WebSocket(`wss://ws.binaryws.com${url}`, { headers: { Origin:'https://app.deriv.com', 'User-Agent':'Mozilla/5.0' } }); fallback.on('open',()=>console.log('Fallback OPEN')); fallback.on('message',d=>client.readyState===1&&client.send(d)); client.on('message',d=>fallback.readyState===1&&fallback.send(d)); }catch{} } });
  deriv.on('close', (c,r) => { console.log('Deriv close '+c); try{client.close();}catch{} });
  client.on('close', () => { try{deriv.close();}catch{} });
});
server.listen(PORT, ()=>console.log('Proxy listening on '+PORT+' v3'));
