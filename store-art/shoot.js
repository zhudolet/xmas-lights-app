const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const pg=await b.newPage({deviceScaleFactor:1});
 for(const [k,w,h,out] of [['icon',1024,1024,'icon-1024.png'],['feature',1024,500,'play-feature-graphic-1024x500.png'],['fg',1024,1024,'../assets/icon-foreground.png'],['bgonly',1024,1024,'../assets/icon-background.png'],['splash',2732,2732,'../assets/splash.png']]){
  await pg.setViewportSize({width:w,height:h});await pg.goto(`file://${__dirname}/art.html?k=${k}&w=${w}&h=${h}`);
  await pg.waitForFunction(()=>document.title==='done',null,{timeout:10000}).catch(e=>console.log('timeout',k));
  await pg.waitForTimeout(300);await (await pg.$('canvas')).screenshot({path:out,omitBackground:k==='fg'});}
 const errs=[];await b.close();})();
