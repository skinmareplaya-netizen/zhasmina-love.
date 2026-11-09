const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'public');
const port=Number(process.env.PORT||3000);
const hits=new Map();
function json(res,status,obj){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(obj));}
const server=http.createServer(async(req,res)=>{
  if(req.method==='POST' && req.url==='/api/meeting'){
    const ip=(req.socket.remoteAddress||'unknown');const now=Date.now();const recent=(hits.get(ip)||[]).filter(t=>now-t<60000);if(recent.length>=5)return json(res,429,{error:'Слишком много запросов. Попробуйте позже.'});recent.push(now);hits.set(ip,recent);
    let body='';try{for await(const chunk of req){body+=chunk;if(body.length>4096)throw Error('large');}const data=JSON.parse(body);
      if(data.accepted!==true || typeof data.time!=='string'||typeof data.place!=='string'||typeof data.date!=='string')return json(res,400,{error:'Заполните данные встречи.'});
      if(!/^\d{4}-\d{2}-\d{2}$/.test(data.date)|| !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.time)||data.place.trim().length<2||data.place.length>150)return json(res,400,{error:'Проверьте дату, время и место.'});
      const d=new Date(data.date+'T12:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==data.date||d.getUTCDay()!==3)return json(res,400,{error:'Выберите среду.'});
      if(!process.env.TELEGRAM_BOT_TOKEN||!process.env.TELEGRAM_CHAT_ID)return json(res,503,{error:'Telegram-бот ещё не настроен владельцем сайта.'});
      const message=`💌 Жасмина ответила!\n\n❤️ Встреча: ${data.date}\n🕔 Время: ${data.time}\n📍 Место: ${data.place.trim()}\n\n💗 Жасмина подтвердила встречу!`;
      const response=await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:process.env.TELEGRAM_CHAT_ID,text:message}),signal:AbortSignal.timeout(10000)});
      const result=await response.json();if(!response.ok||!result.ok)throw Error('Telegram failed');return json(res,200,{ok:true});
    }catch(err){return json(res,err.message==='large'?413:502,{error:err.message==='large'?'Слишком большой запрос.':'Не удалось отправить сообщение. Попробуйте снова.'});}
  }
  if(req.method!=='GET')return json(res,405,{error:'Метод не поддерживается.'});
  const file=req.url==='/'?'/index.html':req.url.split('?')[0];const full=path.resolve(root,'.'+file);if(!full.startsWith(root+path.sep))return json(res,403,{error:'Доступ запрещён.'});
  fs.readFile(full,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found');}const ext=path.extname(full);res.writeHead(200,{'Content-Type':ext==='.html'?'text/html; charset=utf-8':ext==='.css'?'text/css; charset=utf-8':ext==='.js'?'application/javascript; charset=utf-8':'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(data);});
});server.listen(port,()=>console.log(`Открытка: http://localhost:${port}`));
