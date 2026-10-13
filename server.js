const express=require('express');
const http=require('http');
const WebSocket=require('ws');
const app=express();
const server=http.createServer(app);
const PORT=process.env.PORT||10000;

const TARGETS=[
  'wss://ws.binaryws.com/websockets/v3?app_id=1169',
  'wss://ws.derivws.com/websockets/v3?app_id=1169'
];

app.get('/',(req,res)=>res.send('Proxy v4.1 FIXED - '+new Date().toISOString()));
const wss=new WebSocket.Server({server});

wss.on('connection',(clientWs)=>{
  let idx=0;
  function connectDeriv(){
    if(idx>=TARGETS.length){client
