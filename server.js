const http = require('http');
const WebSocket = require('ws');
const PORT = process.env.PORT || 10000;

const server = http.createServer((req,res)=>{
  res.writeHead(200,{'Content-Type':'text/plain'});
  res.end('Proxy v4 Fixed WS - BinaryWS - ' + new Date().toISOString());
});

const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (req,socket,head) => {
  wss.handleUpgrade(req,socket,head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

wss.on('connection', (client, req) => {
  const url = req.url || '/?app_id=1169';

  // Try binaryws first - derivws blocked with 520
  const targets = [
    `wss://ws.binaryws.com/websockets/v3${url}`,
    `wss://ws.derivws.com/websockets/v3${url}`
  ];

  let targetIndex = 0;
  function connectDeriv() {
    const target = targets[targetIndex];
    console.log('v4 Trying: ' + target);

    const deriv = new WebSocket(target, {
      headers: {
        'Origin': 'https://bot.deriv.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      },
      handshakeTimeout: 15000
    });

    let isOpen = false;

    deriv.on('open', () => {
      isOpen=true;
      console.log('✅ Connected to Deriv via ' + target);
    });

    deriv.on('message', (data) => {
      if(client.readyState === 1) client.send(data.toString());
    });

    client.on('message', (data) => {
      if(deriv.readyState === 1) deriv.send(data.toString());
    });

    deriv.on('error', (e) => {
      console.log('Deriv error: ' + e.message);
      if(targetIndex < targets.length - 1 &&!isOpen){
        targetIndex++;
        console.log('Trying next endpoint...');
        setTimeout(connectDeriv, 1000);
      }
    });

    deriv.on('close', (c,r) => {
      console.log('Deriv closed ' + c);
      if(!isOpen && targetIndex < targets.length - 1){
        targetIndex++;
        connectDeriv();
      } else {
        try{ client.close(); }catch(e){}
      }
    });

    client.on('close', () => {
      try{ deriv.close(); }catch(e){}
    });
  }

  connectDeriv();
});

server.listen(PORT, () => console.log('Proxy v4 running on ' + PORT));
