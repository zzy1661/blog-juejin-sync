const ids = require("./ids");
// const ids = ['6996918972251635749']
const puppeteer = require('puppeteer');
const TurndownService = require('turndown');
var fs = require("fs-extra");
const cheerio = require("cheerio");
const ProgressBar = require('progress');
const sharp = require('sharp');
const path = require('path');
const axios = require('axios');
const bar = new ProgressBar(':bar :percent :etas', {
  complete: '=',
  incomplete: ' ',
  width: 50,
  total: ids.length
});

const turndownService = new TurndownService({ codeBlockStyle: 'fenced' });
(async () => {
  // 启动一个无头浏览器实例
  const browser = await puppeteer.launch({defaultViewport:{width:1920,height:1080},headless:false,});

  // 打开一个新页面
  const page = await browser.newPage();

  ids.forEach(async (id, i) => {
    setTimeout(async () => {
      // 导航到目标网页
      await page.goto('https://juejin.cn/post/' + id);
      try {
       // 等待一些动态内容加载完成
       await page.waitForSelector('#article-root',{timeout:100000});
       let markdown = `---
 title: {{ title }}
 date: {{ date }}
 tags: {{ tags }}
 categories: {{ categories }}
---\n\n`
       // $('time').innerText
       // $('.tag-list-container').innerText
       await page.waitForSelector('.article-title', { timeout: 100000 });
 
       const contentTitle = await page.evaluate(() => {
         return document.querySelector('.article-title').innerText;
       });
       const contentDate = await page.evaluate(() => {
         return document.querySelector('time').innerText;
       });
       const contentTags = await page.evaluate(() => {
         return document.querySelector('.tag-list-container')?.innerText;
       });
       const contentCategories = await page.evaluate(() => {
         return document.querySelector('.meta-box .first-column .title')?.innerText;
       });
       markdown = markdown.replace('{{ categories }}',contentCategories? '['+contentCategories.trim()+']':'');
       markdown = markdown.replace('{{ title }}', `"${contentTitle}"`);
       markdown = markdown.replace('{{ date }}', contentDate);
       if (contentTags) {
         markdown = markdown.replace('{{ tags }}', '[' + contentTags.replace(/\n/g, ',') + ']');
       } else {
         markdown = markdown.replace('{{ tags }}', '');
       }
       // markdown+='# '+contentTitle+'\n' ;
       // 在页面上执行JavaScript代码
       const contentBody = await page.evaluate(() => {
         return document.querySelector('#article-root').innerHTML;
       });
 
       const $ = cheerio.load(contentBody);
 
       $('style').remove();
       $('.code-block-extension-header').remove()
       $('img').each( (i, el) => {
         let src = $(el).attr('src');
         const saveDir = './imgs';
         const name = src.match(/tos-cn-i-k3u1fbpfcp\/(\S+)~/)?.[1];
         if(name){
           $(el).attr('src',`../imgs/${name}.png`);
           (async ()=>{
             const imageName = `${name}.png`;
             const savePath = path.join(saveDir, imageName);
             const response = await axios.get(src, {
               responseType: 'stream',
             });
             const writer = fs.createWriteStream(savePath);
             response.data.pipe(writer);
             new Promise((resolve, reject) => {
               writer.on('finish', resolve);
               writer.on('error', reject);
             }).catch(e=>{
               console.error('Error downloading image:', error);
             });
           })()
         }
       })
       
       markdown += turndownService.turndown($.html());
       let filePath = './blogs/' + contentTitle.replace(/[\\\/\:\*\?\"<>]/g, ' ') + '.md';
       markdown = markdown.replace(/https:\/\/link.juejin.cn\?target=(https?)%3A%2F%2F/g,(m,p1)=>{
         return p1+'://'
       })
       fs.writeFile(filePath, markdown, (err) => {
         if (!err) {
           bar.tick(1);
         } else {
           console.log(err)
         }
       })
       if(i==ids.length-1){
         await browser.close();
       }
      } catch (error) {
        console.log('error',id)
        page.reload()
        // throw error  
      }
   
    }, i * (Math.random()*10000))
  })

 
})()

