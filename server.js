const http = require('http');
const WebSocket = require('ws');
const PORT = process.env.PORT || 10000;

const server = http.createServer((req,res)=>{
  res.writeHead(200,{'Content-Type':'text/plain'});
  res.end('Proxy v4 Fixed BinaryWS - ' + new Date().toISOString());
});

const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (req,socket,head) => {
  wss.handleUpgrade(req,socket,head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

wss.on('connection', (client, req) => {
  const url = req.url || '/?app_id=1169';
  const targets = [
    `wss://ws.binaryws.com/websockets/v3${url}`,
    `wss://ws.derivws.com/websockets/v3${url}`
  ];
  let i = 0;
  function connect(){
    const target = targets[i];
    console.log('Trying: ' + target);
    const deriv = new WebSocket(target, {
      headers: { 'Origin': 'https://bot.deriv.com', 'User-Agent': 'Mozilla/5.0' },
      handshakeTimeout: 15000
    });
    let opened = false;
    deriv.on('open', ()=>{ opened=true; console.log('✅ Connected: '+target); });
    deriv.on('message', d=>{ if(client.readyState===1) client.send(d.toString()); });
    client.on('message', d=>{ if(deriv.readyState===1) deriv.send(d.toString()); });
    deriv.on('error', e=>{
      console.log('Error: '+e.message);
      if(!opened && i < targets.length-1){ i++; setTimeout(connect,1000); }
    });
    deriv.on('close', (c)=>{
      if(!opened && i < targets.length-1){ i++; connect(); }
      else { try{ client.close(); }catch(e){} }
    });
    client.on('close', ()=>{ try{ deriv.close(); }catch(e){} });
  }
  connect();
});

server.listen(PORT, ()=>console.log('Proxy v4 running '+PORT));
