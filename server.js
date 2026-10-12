const http=require('http');const WebSocket=require('ws');
const server=http.createServer((req,res)=>{res.end('Proxy OK')});
const wss=new WebSocket.Server({server});
wss.on('connection',(client,req)=>{
 const upstream=new WebSocket('wss://ws.derivws.com'+req.url);
 upstream.on('message',d=>client.send(d));
 upstream.on('close',(c,r)=>client.close(c,r));
 client.on('message',d=>{if(upstream.readyState===1)upstream.send(d)});
 client.on('close',()=>{try{upstream.close()}catch{}});
});
server.listen(process.env.PORT||10000);
