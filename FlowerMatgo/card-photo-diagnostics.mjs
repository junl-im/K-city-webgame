/** Read-only detection of red Hanafuda card borders in reference photos.
 * Does NOT crop, retouch or overwrite original art.
 */
import { createRequire } from 'node:module';
const sharp=createRequire(import.meta.url)('sharp');

export async function findCards(path) {
  const {data,info}=await sharp(path).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const {width,height,channels}=info;
  const mark=new Uint8Array(width*height);
  for(let p=0;p<width*height;p++) {
    const i=p*channels,r=data[i],g=data[i+1],b=data[i+2];
    if(r>130 && g<155 && b<145 && r>g*1.55 && r>b*1.55)mark[p]=1;
  }
  const queue=new Int32Array(width*height),components=[];
  for(let seed=0;seed<mark.length;seed++) {
    if(mark[seed]!==1)continue;
    let head=0,tail=1;queue[0]=seed;mark[seed]=2;
    let minX=width,maxX=0,minY=height,maxY=0,sumX=0,sumY=0;
    while(head<tail) {
      const pos=queue[head++],x=pos%width,y=(pos-x)/width;
      minX=Math.min(minX,x);maxX=Math.max(maxX,x);
      minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      sumX+=x;sumY+=y;
      if(x>0 && mark[pos-1]===1){mark[pos-1]=2;queue[tail++]=pos-1;}
      if(x<width-1 && mark[pos+1]===1){mark[pos+1]=2;queue[tail++]=pos+1;}
      if(y>0 && mark[pos-width]===1){mark[pos-width]=2;queue[tail++]=pos-width;}
      if(y<height-1 && mark[pos+width]===1){mark[pos+width]=2;queue[tail++]=pos+width;}
    }
    if(tail>650)components.push({pixels:tail,rect:[minX,minY,maxX,maxY],center:[Math.round(sumX/tail),Math.round(sumY/tail)]});
  }
  return components.sort((a,b)=>b.pixels-a.pixels);
}

if(import.meta.url===new URL(`file://${process.argv[1]}`).href) {
  for(const path of process.argv.slice(2)) {
    const cards=await findCards(path);
    console.log(path);
    console.log(JSON.stringify(cards.slice(0,18)));
  }
}
