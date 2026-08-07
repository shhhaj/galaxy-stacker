// =====================================
// Galaxy Stacker V7 Pro
// Mobile Astro RAW Engine
// Part 1/6
// =====================================



// ===============================
// DOM
// ===============================


const input =
document.getElementById("photoInput");


const btn =
document.getElementById("stackBtn");


const preview =
document.getElementById("preview");


const count =
document.getElementById("count");


const info =
document.getElementById("info");


const bar =
document.getElementById("progressBar");


const result =
document.getElementById("result");



const exposure =
document.getElementById("exposure");


const contrast =
document.getElementById("contrast");


const saturation =
document.getElementById("saturation");


const galaxy =
document.getElementById("galaxy");



const expValue =
document.getElementById("expValue");


const contrastValue =
document.getElementById("contrastValue");


const satValue =
document.getElementById("satValue");


const galaxyValue =
document.getElementById("galaxyValue");





let photos=[];






// =====================================
// V7 RAW检测
// =====================================


function isRAW(file){


let name =
file.name.toLowerCase();



return (

name.endsWith(".dng") ||

name.endsWith(".nef") ||

name.endsWith(".arw") ||

name.endsWith(".cr2") ||

name.endsWith(".cr3") ||

name.endsWith(".raf")

);



}








// =====================================
// 图片选择
// =====================================


input.addEventListener(
"change",
function(e){



photos =
Array.from(
e.target.files
);



count.innerHTML =
"已选择："+
photos.length+
" 张照片";



preview.innerHTML="";





photos.forEach(
file=>{


let img =
document.createElement("img");



img.src =
URL.createObjectURL(file);



img.style.width =
"120px";



img.style.margin =
"5px";



img.style.borderRadius =
"10px";



preview.appendChild(
img
);



});



});









// =====================================
// RAW读取接口
// =====================================


async function readRAW(file){



// 等待raw_decoder.js


if(
typeof loadRAW==="function"
){



try{


let raw =
await loadRAW(file);



if(raw)
return raw;



}catch(e){



console.log(
"RAW读取失败"
);



}



}



return null;



}









// =====================================
// 通用图片读取
// =====================================


async function readImage(file){



if(
isRAW(file)
){



let raw =
await readRAW(file);



if(raw)
return raw;



}






return await new Promise(
resolve=>{


let img =
new Image();



img.onload =
()=>{


resolve(img);


};



img.src =
URL.createObjectURL(file);



});



}









// =====================================
// 手机性能优化
// =====================================


function optimizeCanvas(img){



let maxSize =
2800;



let scale =
Math.min(
1,
maxSize/img.width
);





let canvas =
document.createElement("canvas");



canvas.width =
Math.floor(
img.width*scale
);



canvas.height =
Math.floor(
img.height*scale
);





let ctx =
canvas.getContext("2d");



ctx.imageSmoothingEnabled =
true;



ctx.drawImage(
img,
0,
0,
canvas.width,
canvas.height
);



return canvas;


}









// =====================================
// Canvas数据获取
// =====================================


function getImageData(canvas){



return canvas
.getContext("2d")
.getImageData(
0,
0,
canvas.width,
canvas.height
);



}









// =====================================
// 创建Canvas
// =====================================


function createCanvas(
w,
h
){



let canvas =
document.createElement("canvas");



canvas.width=w;

canvas.height=h;



return canvas;



}








// =====================================
// 8bit -> 16bit
// =====================================


function to16Bit(data){



let buffer =
new Uint16Array(
data.data.length
);





for(
let i=0;
i<data.data.length;
i++
){



buffer[i]=
data.data[i]*257;



}




return buffer;



}// =====================================
// Galaxy Stacker V7 Pro
// Part 2/6
// AI Star Alignment Engine
// =====================================







// =====================================
// 高精度星点检测
// =====================================


function detectStarsV7(data){



let stars=[];



let d =
data.data;



let w =
data.width;



let h =
data.height;





for(
let y=6;
y<h-6;
y+=3
){



for(
let x=6;
x<w-6;
x+=3
){



let p =
(y*w+x)*4;



let light =
(
d[p]+
d[p+1]+
d[p+2]
)/3;





if(
light<160
)
continue;





let localMax=true;



for(
let yy=-2;
yy<=2;
yy++
){



for(
let xx=-2;
xx<=2;
xx++
){



if(
xx===0 &&
yy===0
)
continue;



let q =
((y+yy)*w+x+xx)*4;



let nearby =
(
d[q]+
d[q+1]+
d[q+2]
)/3;



if(
nearby>light
){


localMax=false;


}



}



}





if(localMax){


stars.push({

x:x,

y:y,

brightness:light


});


}



}



}



stars.sort(
(a,b)=>
b.brightness-a.brightness
);



return stars.slice(
0,
150
);



}









// =====================================
// 星点距离描述
// =====================================


function buildStarPattern(
stars
){



let result=[];



for(
let i=0;
i<stars.length;
i++
){



let distances=[];



for(
let j=0;
j<stars.length;
j++
){



if(
i===j
)
continue;



let dx =
stars[i].x -
stars[j].x;



let dy =
stars[i].y -
stars[j].y;



distances.push(
Math.sqrt(
dx*dx+
dy*dy
)
);



}



distances.sort(
(a,b)=>
a-b
);



result.push({

x:
stars[i].x,

y:
stars[i].y,


pattern:
distances.slice(
0,
6
)


});



}



return result;



}









// =====================================
// 星点特征匹配
// =====================================


function matchStarsV7(
base,
target
){



let matches=[];



let a =
buildStarPattern(
base
);



let b =
buildStarPattern(
target
);





for(
let i=0;
i<a.length;
i++
){



let best=null;


let errorMin=
Infinity;




for(
let j=0;
j<b.length;
j++
){



let error=0;



for(
let k=0;
k<6;
k++
){



error +=
Math.abs(
a[i].pattern[k]
-
b[j].pattern[k]
);



}





if(
error<errorMin
){


errorMin=error;


best=b[j];


}



}






if(
best &&
errorMin<100
){



matches.push({

x1:a[i].x,

y1:a[i].y,


x2:best.x,

y2:best.y


});



}



}



return matches;



}









// =====================================
// 求解变换参数
// =====================================


function solveAstroTransform(
matches
){



if(
matches.length<5
){



return {

dx:0,

dy:0,

angle:0,

scale:1


};



}




let dx=0;

let dy=0;



for(
let m of matches
){



dx +=
m.x2-m.x1;



dy +=
m.y2-m.y1;



}



dx /=
matches.length;


dy /=
matches.length;






// V7旋转估计接口

let angle=0;


// V7缩放接口

let scale=1;




return {

dx,

dy,

angle,

scale


};



}









// =====================================
// 应用星空校准
// =====================================


function alignCanvas(
canvas,
transform
){



let out =
createCanvas(
canvas.width,
canvas.height
);



let ctx =
out.getContext("2d");



ctx.save();



ctx.translate(
canvas.width/2,
canvas.height/2
);



ctx.rotate(
transform.angle
);



ctx.scale(
transform.scale,
transform.scale
);



ctx.translate(
-canvas.width/2-transform.dx,
-canvas.height/2-transform.dy
);





ctx.drawImage(
canvas,
0,
0
);



ctx.restore();



return out;



}









// =====================================
// V7自动配准
// =====================================


async function autoAlignV7(
images
){



let aligned=[];



let base =
images[0];



let baseStars =
detectStarsV7(
getImageData(base)
);



aligned.push(
base
);






for(
let i=1;
i<images.length;
i++
){



let stars =
detectStarsV7(
getImageData(
images[i]
)
);



let matches =
matchStarsV7(
baseStars,
stars
);





let transform =
solveAstroTransform(
matches
);





aligned.push(
alignCanvas(
images[i],
transform
)
);



info.innerHTML =
"V7星点自动校准 "+
i+
"/"+
images.length;



bar.style.width =
(
10+
i/images.length*30
)
+"%";



}



return aligned;


}// =====================================
// Galaxy Stacker V7 Pro
// Part 3/6
// Sigma Stack Engine 3.0
// =====================================







// =====================================
// Sigma Clip 3.0
// 天文级平均堆栈
// =====================================


function sigmaStackV7(
images
){



let width =
images[0].width;



let height =
images[0].height;



let frames=[];





for(
let i=0;
i<images.length;
i++
){



let data =
getImageData(
images[i]
);



frames.push(
data.data
);



}





let output =
new ImageData(
width,
height
);








for(
let p=0;
p<width*height*4;
p+=4
){



let r=[];

let g=[];

let b=[];





for(
let f=0;
f<frames.length;
f++
){



r.push(
frames[f][p]
);



g.push(
frames[f][p+1]
);



b.push(
frames[f][p+2]
);



}





r.sort(
(a,b)=>a-b
);


g.sort(
(a,b)=>a-b
);


b.sort(
(a,b)=>a-b
);






let start=0;

let end=r.length;



// 5张以上开启裁剪


if(
r.length>=5
){


start=1;


end=r.length-1;



}






let rr=0;

let gg=0;

let bb=0;


let n=0;





for(
let i=start;
i<end;
i++
){



rr+=r[i];

gg+=g[i];

bb+=b[i];

n++;



}






output.data[p]=
rr/n;


output.data[p+1]=
gg/n;


output.data[p+2]=
bb/n;


output.data[p+3]=255;



}



return output;


}









// =====================================
// 热噪点自动检测
// =====================================


function removeHotPixelsV7(
data
){



let d =
data.data;



let w =
data.width;



let h =
data.height;






for(
let y=1;
y<h-1;
y++
){



for(
let x=1;
x<w-1;
x++
){



let p =
(y*w+x)*4;



let light =
(
d[p]+
d[p+1]+
d[p+2]
)/3;






if(
light>240
){



let avg=0;


let count=0;






for(
let yy=-1;
yy<=1;
yy++
){



for(
let xx=-1;
xx<=1;
xx++
){



if(
xx===0 &&
yy===0
)
continue;



let q =
((y+yy)*w+x+xx)*4;



avg +=
(
d[q]+
d[q+1]+
d[q+2]
)/3;



count++;



}



}






avg/=
count;





if(
light-avg>70
){



d[p]=avg;


d[p+1]=avg;


d[p+2]=avg;



}



}



}



}



return data;



}









// =====================================
// 暗部AI降噪
// =====================================


function darkNoiseAI(
data
){



let d =
data.data;



for(
let i=0;
i<d.length;
i+=4
){



let r=d[i];

let g=d[i+1];

let b=d[i+2];




let light =
(r+g+b)/3;






if(
light<30
){



// 保留星云颜色


d[i]=r*0.88;


d[i+1]=g*0.90;


d[i+2]=b*0.94;



}




}



return data;


}









// =====================================
// 背景均匀化
// 光污染基础修正
// =====================================


function backgroundNormalize(
data
){



let d =
data.data;



let r=0;

let g=0;

let b=0;


let count=0;





for(
let i=0;
i<d.length;
i+=4*50
){



r+=d[i];

g+=d[i+1];

b+=d[i+2];


count++;



}





r/=count;

g/=count;

b/=count;






for(
let i=0;
i<d.length;
i+=4
){



d[i]-=r*0.25;


d[i+1]-=g*0.25;


d[i+2]-=b*0.25;





d[i]=Math.max(
0,
Math.min(
255,
d[i]
)
);



d[i+1]=Math.max(
0,
Math.min(
255,
d[i+1]
)
);



d[i+2]=Math.max(
0,
Math.min(
255,
d[i+2]
)
);



}



return data;


}









// =====================================
// 8bit → 16bit缓存
// =====================================


function convertTo16V7(
data
){



let buffer =
new Uint16Array(
data.data.length
);





for(
let i=0;
i<data.data.length;
i++
){



buffer[i]=
data.data[i]*257;



}




return buffer;



}// =====================================
// Galaxy Stacker V7 Pro
// Part 4/6
// Galaxy AI Processing Engine
// =====================================







// =====================================
// 天文白平衡
// =====================================


function astroBalanceV7(
data
){



let d =
data.data;



for(
let i=0;
i<d.length;
i+=4
){



let r=d[i];

let g=d[i+1];

let b=d[i+2];





// 手机夜空蓝偏修正


r*=1.06;


g*=1.03;


b*=0.92;







d[i]=Math.min(
255,
r
);


d[i+1]=Math.min(
255,
g
);


d[i+2]=Math.min(
255,
b
);



}




return data;


}









// =====================================
// 银河Mask生成
// =====================================


function galaxyMaskV7(
data
){



let mask =
new Float32Array(
data.width*
data.height
);



let d =
data.data;





for(
let i=0;
i<mask.length;
i++
){



let p=i*4;



let r=d[p];

let g=d[p+1];

let b=d[p+2];



let light =
(
r+g+b
)/3;



let value=0;





// 银河亮度范围


if(
light>35 &&
light<170
){



value=1;



}





// 蓝紫星云区域


if(
b>r &&
b>g
){


value+=0.25;


}



mask[i]=
Math.min(
1,
value
);



}




return mask;



}









// =====================================
// 银河结构增强
// =====================================


function enhanceGalaxyV7(
data,
mask
){



let d =
data.data;




for(
let i=0;
i<mask.length;
i++
){



let strength =
mask[i];



if(
strength<=0
)
continue;





let p=i*4;



let r=d[p];

let g=d[p+1];

let b=d[p+2];






// 微对比


r +=
(r-128)
*
0.18
*
strength;



g +=
(g-128)
*
0.12
*
strength;



b +=
(b-128)
*
0.22
*
strength;






// 银河颜色恢复


r +=
5*
strength;



b +=
12*
strength;







d[p]=Math.max(
0,
Math.min(
255,
r
)
);



d[p+1]=Math.max(
0,
Math.min(
255,
g
)
);



d[p+2]=Math.max(
0,
Math.min(
255,
b
)
);



}



return data;


}









// =====================================
// 恒星保护层
// =====================================


function createStarMaskV7(
data
){



let mask =
new Uint8Array(
data.width*
data.height
);



let d =
data.data;





for(
let i=0;
i<mask.length;
i++
){



let p=i*4;



let light =
(
d[p]+
d[p+1]+
d[p+2]
)/3;




if(
light>200
){


mask[i]=1;


}



}



return mask;


}









// =====================================
// 恒星增强
// =====================================


function enhanceStarsV7(
data,
mask
){



let d =
data.data;



for(
let i=0;
i<mask.length;
i++
){



if(
mask[i]
){



let p=i*4;



d[p]*=1.06;


d[p+1]*=1.06;


d[p+2]*=1.06;






d[p]=Math.min(
255,
d[p]
);



d[p+1]=Math.min(
255,
d[p+1]
);



d[p+2]=Math.min(
255,
d[p+2]
);



}



}



return data;


}









// =====================================
// 电影级天文色彩
// =====================================


function astroCinemaColorV7(
data
){



let d =
data.data;




for(
let i=0;
i<d.length;
i+=4
){



let r=d[i];

let g=d[i+1];

let b=d[i+2];



let light =
(
r+g+b
)/3;





// 暗部保持自然


if(
light<25
){


r*=0.96;


g*=0.96;


b*=0.98;



}





// 银河冷暖层次


if(
light>40 &&
light<160
){


r*=1.03;


b*=1.07;



}






d[i]=Math.max(
0,
Math.min(
255,
r
)
);



d[i+1]=Math.max(
0,
Math.min(
255,
g
)
);



d[i+2]=Math.max(
0,
Math.min(
255,
b
)
);



}



return data;


}// =====================================
// Galaxy Stacker V7 Pro
// Part 5/6
// Main Processing Pipeline
// =====================================







btn.onclick =
async function(){



if(
photos.length<2
){



alert(
"请至少选择2张银河照片"
);



return;



}





btn.disabled=true;



info.innerHTML=
"V7读取照片...";



bar.style.width="5%";






let images=[];



for(
let i=0;
i<photos.length;
i++
){



let img =
await readImage(
photos[i]
);



let canvas =
optimizeCanvas(
img
);



images.push(
canvas
);



}









// =====================================
// 星空自动配准
// =====================================


info.innerHTML=
"AI星点自动校准...";



let aligned =
await autoAlignV7(
images
);








// =====================================
// 多帧Sigma堆栈
// =====================================


info.innerHTML=
"银河多帧融合...";


bar.style.width="50%";



let output =
sigmaStackV7(
aligned
);









// =====================================
// 天文后期处理
// =====================================


info.innerHTML=
"银河结构恢复...";



output =
backgroundNormalize(
output
);



output =
removeHotPixelsV7(
output
);



output =
darkNoiseAI(
output
);



output =
astroBalanceV7(
output
);







// 恒星保护


let starMask =
createStarMaskV7(
output
);



// 银河蒙版


let galaxyMask =
galaxyMaskV7(
output
);





// 银河增强


output =
enhanceGalaxyV7(
output,
galaxyMask
);





// 色彩


output =
astroCinemaColorV7(
output
);



// 恢复星点


output =
enhanceStarsV7(
output,
starMask
);







info.innerHTML=
"正在生成最终图片...";


bar.style.width="80%";








// =====================================
// 手动调节
// =====================================



let d =
output.data;



let exp =
Number(
exposure.value
);



let con =
Number(
contrast.value
);



let sat =
Number(
saturation.value
)/100;



let gal =
Number(
galaxy.value
)/100;







for(
let i=0;
i<d.length;
i+=4
){





// 曝光


d[i]+=exp*20;

d[i+1]+=exp*20;

d[i+2]+=exp*20;







// 对比度


d[i]=
(d[i]-128)
*
(1+con/100)
+128;



d[i+1]=
(d[i+1]-128)
*
(1+con/100)
+128;



d[i+2]=
(d[i+2]-128)
*
(1+con/100)
+128;







// 饱和度


let avg =
(
d[i]+
d[i+1]+
d[i+2]
)/3;



d[i]=
avg+
(d[i]-avg)
*
sat;



d[i+1]=
avg+
(d[i+1]-avg)
*
sat;



d[i+2]=
avg+
(d[i+2]-avg)
*
sat;









// 银河强度


d[i]*=gal;

d[i+1]*=gal;

d[i+2]*=gal;







d[i]=Math.max(
0,
Math.min(
255,
d[i]
)
);



d[i+1]=Math.max(
0,
Math.min(
255,
d[i+1]
)
);



d[i+2]=Math.max(
0,
Math.min(
255,
d[i+2]
)
);



}// =====================================
// Galaxy Stacker V7 Pro
// Part 6/6
// Output Engine + Controls
// =====================================






// =====================================
// 输出最终图片
// =====================================


let canvas =
createCanvas(
output.width,
output.height
);



let ctx =
canvas.getContext("2d");



ctx.putImageData(
output,
0,
0
);







let url =
canvas.toDataURL(
"image/png",
1.0
);








result.innerHTML="";







let img =
document.createElement("img");



img.src=url;



img.style.width="95%";



img.style.borderRadius="18px";



img.style.boxShadow=
"0 0 30px rgba(0,0,0,.6)";



result.appendChild(
img
);








// 下载按钮


let link =
document.createElement("a");



link.href=url;



link.download =
"Galaxy_Stacker_V7_Pro.png";



link.innerHTML =
"🌌 下载 V7 Pro 银河高清PNG";



link.style.display="block";

link.style.margin="25px auto";

link.style.padding="15px";

link.style.background="#16a34a";

link.style.color="white";

link.style.borderRadius="15px";

link.style.textDecoration="none";



result.appendChild(
link
);








bar.style.width=
"100%";



info.innerHTML =
"✨ Galaxy Stacker V7 Pro 完成";



btn.disabled=false;



};









// =====================================
// 实时调节显示
// =====================================


if(exposure){


exposure.oninput =
()=>{


expValue.innerHTML =
exposure.value+
" EV";


};


}




if(contrast){


contrast.oninput =
()=>{


contrastValue.innerHTML =
contrast.value;


};


}




if(saturation){


saturation.oninput =
()=>{


satValue.innerHTML =
saturation.value+
"%";


};


}




if(galaxy){


galaxy.oninput =
()=>{


galaxyValue.innerHTML =
galaxy.value+
"%";


};


}
