// =====================================
// Galaxy Stacker V8.5 Pro
// Part 1/5
// Core + Loader
// =====================================



"use strict";



// ===============================
// DOM
// ===============================


const input =
document.getElementById("photoInput");


const count =
document.getElementById("count");


const preview =
document.getElementById("preview");


const btn =
document.getElementById("stackBtn");


const info =
document.getElementById("info");


const bar =
document.getElementById("progressBar");


const result =
document.getElementById("result");



// 调节

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





// ===============================
// 全局变量
// ===============================


let photos=[];


let processing=false;





// ===============================
// 进度
// ===============================


function progress(
value,
text
){


bar.style.width=
value+"%";


info.innerHTML=text;


}








// ===============================
// Canvas创建
// ===============================


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








// ===============================
// RAW检测
// ===============================


function isRAW(file){


let name =
file.name.toLowerCase();


return(

name.endsWith(".dng")||

name.endsWith(".nef")||

name.endsWith(".arw")||

name.endsWith(".cr2")||

name.endsWith(".cr3")||

name.endsWith(".raf")

);


}







// ===============================
// 图片选择
// ===============================


input.addEventListener(
"change",
e=>{


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



img.style.width="120px";


img.style.margin="5px";


img.style.borderRadius="10px";



preview.appendChild(img);


});



info.innerHTML =
"照片加载完成";


});









// ===============================
// 图片读取
// ===============================


async function loadImage(
file
){



// RAW接口

if(
typeof loadRAW==="function"
&&
isRAW(file)
){


try{


let raw =
await loadRAW(file);


if(raw)
return raw;



}
catch(e){


console.log(
"RAW读取失败"
);


}



}






return new Promise(
resolve=>{


let img =
new Image();



img.onload=()=>{


resolve(img);


};



img.src =
URL.createObjectURL(file);



}

);


}







// ===============================
// 手机内存限制
// ===============================


function resizeForMobile(
canvas
){



let max =
2500;



if(
canvas.width<=max
&&
canvas.height<=max
)
return canvas;





let scale =
Math.min(
max/canvas.width,
max/canvas.height
);





let out =
createCanvas(
canvas.width*scale,
canvas.height*scale
);



let ctx =
out.getContext("2d");



ctx.drawImage(
canvas,
0,
0,
out.width,
out.height
);



return out;


}







// ===============================
// Image 转 Canvas
// ===============================


function imageToCanvas(
img
){



let canvas =
createCanvas(
img.width,
img.height
);



let ctx =
canvas.getContext("2d");



ctx.drawImage(
img,
0,
0
);



return resizeForMobile(
canvas
);


}// =====================================
// Galaxy Stacker V8.5 Pro
// Part 2/5
// Star Detection + Alignment
// =====================================






// ===============================
// 星点检测 V8.5
// ===============================


function detectStarsV85(
imageData
){



let stars=[];


let d =
imageData.data;


let w =
imageData.width;


let h =
imageData.height;





for(
let y=5;
y<h-5;
y+=3
){



for(
let x=5;
x<w-5;
x+=3
){



let i=
(y*w+x)*4;



let r=d[i];

let g=d[i+1];

let b=d[i+2];



let light=
(r+g+b)/3;





// 星点条件

if(
light>190
&&
Math.max(r,g,b)-Math.min(r,g,b)<80
){



// 检查周围


let local=true;



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


let p=
((y+yy)*w+x+xx)*4;



let around=
(
d[p]+
d[p+1]+
d[p+2]
)/3;



if(
around>light
){


local=false;


}


}


}



if(local){


stars.push({

x:x,

y:y,

power:light

});


}



}


}


}





stars.sort(
(a,b)=>
b.power-a.power
);



return stars.slice(
0,
150
);


}









// ===============================
// 星点距离匹配
// ===============================


function matchStarsV85(
base,
target
){



let matches=[];



for(
let i=0;
i<base.length;
i++
){



let best=null;


let min=999;



for(
let j=0;
j<target.length;
j++
){



let dx=
target[j].x-base[i].x;


let dy=
target[j].y-base[i].y;



let dist =
Math.sqrt(
dx*dx+
dy*dy
);





if(
dist<min
){


min=dist;


best=target[j];


}


}





if(
best &&
min<80
){



matches.push({

x1:base[i].x,

y1:base[i].y,

x2:best.x,

y2:best.y

});



}



}




return matches;


}









// ===============================
// 计算偏移
// ===============================


function solveAlignmentV85(
matches
){



if(
matches.length<3
){


return{

dx:0,

dy:0

};


}




let dx=0;

let dy=0;



matches.forEach(
m=>{


dx +=
m.x1-m.x2;


dy +=
m.y1-m.y2;



});





return{


dx:
dx/matches.length,


dy:
dy/matches.length



};


}









// ===============================
// 图像自动校准
// ===============================


function alignImageV85(
source,
transform
){



let canvas =
createCanvas(
source.width,
source.height
);



let ctx =
canvas.getContext("2d");




ctx.translate(
transform.dx,
transform.dy
);



ctx.drawImage(
source,
0,
0
);



return canvas;


}








// ===============================
// 单张图片星点校准
// ===============================


function alignAllImagesV85(
images
){



let result=[];



let baseCanvas =
images[0];



let baseCtx =
baseCanvas.getContext("2d");



let baseData =
baseCtx.getImageData(
0,
0,
baseCanvas.width,
baseCanvas.height
);



let baseStars =
detectStarsV85(
baseData
);





result.push(
baseCanvas
);






for(
let i=1;
i<images.length;
i++
){



let ctx =
images[i]
.getContext("2d");



let data =
ctx.getImageData(
0,
0,
images[i].width,
images[i].height
);



let stars =
detectStarsV85(
data
);





let matches =
matchStarsV85(
baseStars,
stars
);





let offset =
solveAlignmentV85(
matches
);





result.push(

alignImageV85(
images[i],
offset
)

);



}




return result;


}// =====================================
// Galaxy Stacker V8.5 Pro
// Part 3/5
// Sigma Stack Engine
// =====================================






// ===============================
// 数学工具
// ===============================


function mean(arr){


let sum=0;


for(
let i=0;
i<arr.length;
i++
){

sum+=arr[i];

}


return sum/arr.length;


}






function std(arr,avg){


let sum=0;


for(
let i=0;
i<arr.length;
i++
){


sum+=
(arr[i]-avg)*
(arr[i]-avg);


}


return Math.sqrt(
sum/arr.length
);


}









// ===============================
// Sigma Clipping 堆栈
// ===============================


function sigmaStackV85(
images
){



let w =
images[0].width;


let h =
images[0].height;




let frames=[];




for(
let i=0;
i<images.length;
i++
){



let ctx =
images[i]
.getContext("2d");



frames.push(
ctx.getImageData(
0,
0,
w,
h
).data
);



}





let output =
new ImageData(
w,
h
);






for(
let p=0;
p<w*h*4;
p+=4
){



let rs=[];

let gs=[];

let bs=[];






for(
let f=0;
f<frames.length;
f++
){


rs.push(
frames[f][p]
);



gs.push(
frames[f][p+1]
);



bs.push(
frames[f][p+2]
);



}






let rAvg=
mean(rs);


let gAvg=
mean(gs);


let bAvg=
mean(bs);





let rStd=
std(
rs,
rAvg
);



let gStd=
std(
gs,
gAvg
);



let bStd=
std(
bs,
bAvg
);





let r=0;

let g=0;

let b=0;

let count=0;







for(
let i=0;
i<rs.length;
i++
){





// Sigma 2倍过滤


if(
Math.abs(
rs[i]-rAvg
)
<
rStd*2
){


r+=rs[i];

}


else{


r+=rAvg;


}






if(
Math.abs(
gs[i]-gAvg
)
<
gStd*2
){


g+=gs[i];


}

else{


g+=gAvg;


}






if(
Math.abs(
bs[i]-bAvg
)
<
bStd*2
){


b+=bs[i];


}

else{


b+=bAvg;


}



count++;





}





output.data[p]=
r/count;



output.data[p+1]=
g/count;



output.data[p+2]=
b/count;



output.data[p+3]=255;



}





return output;


}









// ===============================
// 热噪点修复
// ===============================


function removeHotPixelsV85(
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



let i=
(y*w+x)*4;



let light=
(
d[i]+
d[i+1]+
d[i+2]
)/3;





if(
light>250
){



let around=0;



let n=0;




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



let p=
((y+yy)*w+x+xx)*4;



around+=
(
d[p]+
d[p+1]+
d[p+2]
)/3;



n++;



}



}






if(
light-
around/n
>
70
){



d[i]=
around/n;


d[i+1]=
around/n;


d[i+2]=
around/n;



}



}



}



}



return data;


}









// ===============================
// 飞机/卫星轨迹减少
// ===============================


function removeSatelliteTrailV85(
data
){



let d =
data.data;



for(
let y=1;
y<data.height-1;
y++
){



for(
let x=1;
x<data.width-1;
x++
){



let i=
(y*data.width+x)*4;



let light=
(
d[i]+
d[i+1]+
d[i+2]
)/3;





let left=
(
d[i-4]+
d[i-3]+
d[i-2]
)/3;



let right=
(
d[i+4]+
d[i+5]+
d[i+6]
)/3;






if(
light-left>90
&&
light-right>90
){



d[i]*=0.65;

d[i+1]*=0.65;

d[i+2]*=0.65;



}



}



}




return data;


}









// ===============================
// 暗部天文降噪
// ===============================


function darkNoiseV85(
data
){



let d =
data.data;



for(
let i=0;
i<d.length;
i+=4
){



let light=
(
d[i]+
d[i+1]+
d[i+2]
)/3;




if(
light<30
){


d[i]*=0.93;


d[i+1]*=0.94;


d[i+2]*=0.96;



}



}



return data;


}// =====================================
// Galaxy Stacker V8.5 Pro
// Part 4/5
// Galaxy Recovery Engine
// =====================================






// ===============================
// 天空背景采样
// ===============================


function sampleSkyBackgroundV85(
data
){


let d =
data.data;


let samples=[];



for(
let y=0;
y<data.height;
y+=50
){



for(
let x=0;
x<data.width;
x+=50
){



let i=
(y*data.width+x)*4;



let r=d[i];

let g=d[i+1];

let b=d[i+2];



let light=
(r+g+b)/3;




// 避开银河亮区


if(
light<70
){



samples.push({

r:r,

g:g,

b:b

});


}



}



}



return samples;


}









// ===============================
// 温和光污染去除
// ===============================


function removeLightGradientV85(
data
){



let d=
data.data;



let samples =
sampleSkyBackgroundV85(
data
);





if(
samples.length===0
)
return data;






let r=0;

let g=0;

let b=0;





samples.forEach(
s=>{


r+=s.r;

g+=s.g;

b+=s.b;


});





r/=samples.length;

g/=samples.length;

b/=samples.length;







// V8.5降低扣除比例


let removeR=
r*0.18;


let removeG=
g*0.18;


let removeB=
b*0.12;







for(
let i=0;
i<d.length;
i+=4
){



d[i]-=
removeR;


d[i+1]-=
removeG;


d[i+2]-=
removeB;





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









// ===============================
// 暗角修复
// ===============================


function fixVignettingV85(
data
){



let d=
data.data;


let w=
data.width;


let h=
data.height;



let cx=
w/2;


let cy=
h/2;



let max=
Math.sqrt(
cx*cx+
cy*cy
);






for(
let y=0;
y<h;
y++
){



for(
let x=0;
x<w;
x++
){



let i=
(y*w+x)*4;



let dx=
x-cx;


let dy=
y-cy;



let distance=
Math.sqrt(
dx*dx+
dy*dy
)
/max;





// 边缘轻微补偿


let gain=
1+
distance*0.18;





d[i]*=
gain;


d[i+1]*=
gain;


d[i+2]*=
gain;



}



}



return data;


}









// ===============================
// 银河Mask
// ===============================


function createMilkyWayMaskV85(
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



let light=
(r+g+b)/3;



let value=0;






// 银河弱信号区域


if(
light>18
&&
light<150
){


value=1;


}






// 蓝紫星云


if(
b>g &&
b>r
){


value+=0.15;


}







mask[i]=
Math.min(
1,
value
);



}



return mask;


}









// ===============================
// 银河结构增强
// ===============================


function enhanceMilkyWayV85(
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



let w=
mask[i];



if(
w<=0
)
continue;





let p=i*4;



let r=d[p];

let g=d[p+1];

let b=d[p+2];






// 局部对比


r+=
(r-128)
*
0.12
*
w;



g+=
(g-128)
*
0.10
*
w;



b+=
(b-128)
*
0.16
*
w;







// 自然银河色


b+=
5*w;


r+=
3*w;







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









// ===============================
// 恒星保护
// ===============================


function protectStarsV85(
data
){



let d=
data.data;



for(
let i=0;
i<d.length;
i+=4
){



let light=
(
d[i]+
d[i+1]+
d[i+2]
)/3;






if(
light>220
){



// 防止星星爆白


d[i]*=0.96;

d[i+1]*=0.96;

d[i+2]*=0.96;



}



}



return data;


}









// ===============================
// 天文色彩
// ===============================


function astroColorV85(
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



let light=
(r+g+b)/3;





// 暗天空保持黑色


if(
light<35
){


b*=1.02;


}





// 银河轻微暖蓝


if(
light>35 &&
light<160
){


r*=1.03;


b*=1.05;


}





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


}// =====================================
// Galaxy Stacker V8.5 Pro
// Part 5/5
// Main Pipeline + Output
// =====================================






// ===============================
// 输出图片
// ===============================


function outputResultV85(
data
){


let canvas =
createCanvas(
data.width,
data.height
);



let ctx =
canvas.getContext("2d");



ctx.putImageData(
data,
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



result.appendChild(img);






let link =
document.createElement("a");


link.href=url;


link.download =
"Galaxy_Stacker_V8.5_Pro.png";



link.innerHTML =
"⬇ 下载 Galaxy V8.5 Pro 高清PNG";



result.appendChild(link);



}









// ===============================
// 最终调节
// ===============================


function finalAdjustV85(
data
){



let d =
data.data;



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





let exposureGain =
Math.pow(
2,
exp
);





for(
let i=0;
i<d.length;
i+=4
){



let r=d[i];

let g=d[i+1];

let b=d[i+2];






// 曝光


r*=exposureGain;

g*=exposureGain;

b*=exposureGain;






// 对比度


r =
(r-128)
*
(1+con/100)
+
128;


g =
(g-128)
*
(1+con/100)
+
128;


b =
(b-128)
*
(1+con/100)
+
128;






// 饱和度


let gray =
(r+g+b)/3;



r =
gray+
(r-gray)*sat;


g =
gray+
(g-gray)*sat;


b =
gray+
(b-gray)*sat;






// 银河强度


r*=gal;

g*=gal;

b*=gal;






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


}









// ===============================
// V8.5 主程序
// ===============================


async function startGalaxyV85(){



if(
photos.length<2
){


alert(
"请至少选择2张银河照片"
);


return;


}




if(
processing
)
return;



processing=true;


btn.disabled=true;





try{



progress(
5,
"读取银河照片..."
);





let canvases=[];





for(
let i=0;
i<photos.length;
i++
){



let img =
await loadImage(
photos[i]
);



canvases.push(
imageToCanvas(
img
)
);



progress(
10+
i/photos.length*10,
"加载 "+
(i+1)+"/"+
photos.length
);



}








// ===============================
// 星点校准
// ===============================


progress(
25,
"星点自动校准..."
);



let aligned =
alignAllImagesV85(
canvases
);







// ===============================
// Sigma堆栈
// ===============================


progress(
45,
"智能银河堆栈..."
);



let output =
sigmaStackV85(
aligned
);







// ===============================
// 清理
// ===============================


progress(
60,
"去除噪点..."
);



output =
removeHotPixelsV85(
output
);



output =
removeSatelliteTrailV85(
output
);



output =
darkNoiseV85(
output
);







// ===============================
// 银河恢复
// ===============================


progress(
75,
"恢复银河结构..."
);



output =
removeLightGradientV85(
output
);



output =
fixVignettingV85(
output
);




let mask =
createMilkyWayMaskV85(
output
);



output =
enhanceMilkyWayV85(
output,
mask
);



output =
protectStarsV85(
output
);



output =
astroColorV85(
output
);






// ===============================
// 用户调节
// ===============================


progress(
90,
"最终调色..."
);



output =
finalAdjustV85(
output
);







progress(
100,
"✨ Galaxy Stacker V8.5 完成"
);



outputResultV85(
output
);





}

catch(e){



console.error(e);



info.innerHTML =
"处理失败："+e.message;



}



processing=false;


btn.disabled=false;



}









// ===============================
// 按钮绑定
// ===============================


btn.onclick =
()=>{


startGalaxyV85();


};









// ===============================
// 滑块显示
// ===============================


exposure.oninput =
()=>{


expValue.innerHTML =
exposure.value+
" EV";


};



contrast.oninput =
()=>{


contrastValue.innerHTML =
contrast.value;


};



saturation.oninput =
()=>{


satValue.innerHTML =
saturation.value+
"%";


};



galaxy.oninput =
()=>{


galaxyValue.innerHTML =
galaxy.value+
"%";


};



// =====================================
// Galaxy Stacker V8.5 Pro END
// =====================================
