const http = require('http');
const WebSocket = require('ws');
const PORT = process.env.PORT || 10000;
const server = http.createServer((req,res)=>{res.writeHead(200);res.end('Proxy Live')});
const wss = new WebSocket.Server({noServer:true});
server.on('upgrade',(req,socket,head)=>{wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req))});
wss.on('connection',(client,req)=>{
  const target=`wss://ws.binaryws.com${req.url}`;
  console.log('[NEW] Forwarding to '+target);
  const deriv=new WebSocket(target,{
    headers:{
      Origin:'https://app.deriv.com',
      'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
    }
  });
  deriv.on('open',()=>console.log('Deriv OPEN - SUCCESS'));
  client.on('message',d=>{if(deriv.readyState===1)deriv.send(d)});
  deriv.on('message',d=>{if(client.readyState===1)client.send(d)});
  deriv.on('close',(c,r)=>{console.log('Deriv close '+c);try{client.close()}catch{}});
  deriv.on('error',e=>{console.log('Deriv error '+e.message)});
  client.on('close',()=>{try{deriv.close()}catch{}});
});
server.listen(PORT,()=>console.log('Proxy listening on '+PORT));
