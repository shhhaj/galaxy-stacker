// =====================================
// Galaxy Stacker V8 Pro
// Part 1/8
// Mobile Astro Processing Engine
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





// ===============================
// V8 Parameters
// ===============================


const V8_CONFIG={


maxMemoryMB:900,


maxPreview:12,


starLimit:250,


stackMode:"weightedSigma",


enableRAW:true,


enableGradient:true,


enableStarProtect:true


};








// ===============================
// Storage
// ===============================


let photos=[];


let imageCache=[];


let processing=false;







// ===============================
// Memory Cleaner
// ===============================


function releaseMemory(){


imageCache.forEach(img=>{


if(img.src){

URL.revokeObjectURL(img.src);

}


});


imageCache=[];


}








// ===============================
// RAW Detect
// ===============================


function isRAW(file){


let n=
file.name.toLowerCase();



return (

n.endsWith(".dng") ||

n.endsWith(".cr2") ||

n.endsWith(".cr3") ||

n.endsWith(".nef") ||

n.endsWith(".arw") ||

n.endsWith(".raf")

);


}








// ===============================
// Safe Image Load
// ===============================


function loadImage(file){


return new Promise(
(resolve,reject)=>{


let img =
new Image();


img.onload=()=>{


resolve(img);


};



img.onerror=reject;



img.src=
URL.createObjectURL(file);



imageCache.push(img);



});


}








// ===============================
// Import
// ===============================


input.addEventListener(
"change",
async function(e){



releaseMemory();



photos =
Array.from(
e.target.files
);



count.innerHTML=
"已选择："+
photos.length+
" 张照片";



preview.innerHTML="";




photos
.slice(
0,
V8_CONFIG.maxPreview
)
.forEach(file=>{


let img=
document.createElement("img");



img.src=
URL.createObjectURL(file);



img.style.width=
"120px";


img.style.margin=
"5px";


img.style.borderRadius=
"10px";



preview.appendChild(img);



});



info.innerHTML=
"照片加载完成，等待V8处理";



});








// ===============================
// Canvas Factory
// ===============================


function createCanvas(
w,
h
){


let c=
document.createElement("canvas");


c.width=w;


c.height=h;


return c;


}








// ===============================
// Progress
// ===============================


function progress(
value,
text
){


bar.style.width=
value+"%";


info.innerHTML=text;


}








console.log(
"Galaxy Stacker V8 Pro Loaded"
);// =====================================
// Galaxy Stacker V8 Pro
// Part 2/8
// Star Detection Engine
// =====================================



// ===============================
// 灰度计算
// ===============================


function getGray(
r,
g,
b
){

return (
r*0.299+
g*0.587+
b*0.114
);

}







// ===============================
// 星点检测 V8
// ===============================


function detectStarsV8(
imageData
){


let stars=[];


let d=
imageData.data;


let w=
imageData.width;


let h=
imageData.height;





// 降采样检测
// 手机性能优化


for(
let y=8;
y<h-8;
y+=4
){


for(
let x=8;
x<w-8;
x+=4
){



let p=
(y*w+x)*4;



let center=
getGray(
d[p],
d[p+1],
d[p+2]
);




if(center<160)
continue;





let around=0;


let count=0;




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



let i=
((y+yy)*w+x+xx)*4;



around+=
getGray(
d[i],
d[i+1],
d[i+2]
);


count++;


}


}



let average=
around/count;






// 星点判断


let strength=
center-average;



if(
strength>45
){



stars.push({

x:x,

y:y,

brightness:center,

strength:strength

});


}



}



}





// 强星优先


stars.sort(
(a,b)=>
b.strength-
a.strength
);





return stars.slice(
0,
V8_CONFIG.starLimit
);


}








// ===============================
// 星点距离描述
// Descriptor
// ===============================


function createDescriptor(
stars
){



let desc=[];



for(
let i=0;
i<stars.length;
i++
){


let s=
stars[i];



desc.push({


x:s.x,


y:s.y,


value:
Math.round(
s.brightness
)



});


}



return desc;


}








// ===============================
// 星点匹配
// ===============================


function matchStarsV8(
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


let distance=99999;



for(
let j=0;
j<target.length;
j++
){



let dx=
base[i].x-
target[j].x;



let dy=
base[i].y-
target[j].y;



let d=
Math.sqrt(
dx*dx+
dy*dy
);





if(
d<distance
){


distance=d;


best=
target[j];


}



}




if(
best &&
distance<80
){


matches.push({

base:base[i],

target:best,

error:distance


});


}



}



return matches;


}








// ===============================
// 偏移计算
// ===============================


function calculateTransformV8(
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



matches.forEach(
m=>{


dx+=
m.target.x-
m.base.x;


dy+=
m.target.y-
m.base.y;


});




return {


dx:
dx/matches.length,


dy:
dy/matches.length,


angle:0,


scale:1



};



}// =====================================
// Galaxy Stacker V8 Pro
// Part 3/8
// RANSAC Alignment Engine
// =====================================





// ===============================
// 计算两点角度
// ===============================


function pointAngle(
a,
b
){


return Math.atan2(
b.y-a.y,
b.x-a.x
);


}






// ===============================
// 计算距离
// ===============================


function pointDistance(
a,
b
){


let dx=
b.x-a.x;


let dy=
b.y-a.y;


return Math.sqrt(
dx*dx+
dy*dy
);


}








// ===============================
// RANSAC星点筛选
// ===============================


function ransacFilter(
matches
){



if(
matches.length<5
){

return matches;

}




let best=[];


let iterations=200;



for(
let i=0;
i<iterations;
i++
){



let sample=
matches[
Math.floor(
Math.random()
*
matches.length
)
];





let dx=
sample.target.x-
sample.base.x;



let dy=
sample.target.y-
sample.base.y;





let current=[];



for(
let j=0;
j<matches.length;
j++
){



let m=
matches[j];



let mdx=
m.target.x-
m.base.x;



let mdy=
m.target.y-
m.base.y;



let error=
Math.sqrt(
Math.pow(mdx-dx,2)
+
Math.pow(mdy-dy,2)
);





if(
error<8
){


current.push(m);


}



}




if(
current.length>
best.length
){


best=current;


}



}



return best;


}









// ===============================
// 旋转角度计算
// ===============================


function calculateRotation(
matches
){



if(
matches.length<2
)
return 0;



let a=
matches[0];


let b=
matches[1];



let baseAngle=
pointAngle(
a.base,
b.base
);



let targetAngle=
pointAngle(
a.target,
b.target
);



return targetAngle-baseAngle;



}









// ===============================
// 缩放计算
// ===============================


function calculateScale(
matches
){



if(
matches.length<2
)
return 1;



let a=
matches[0];


let b=
matches[1];



let baseDistance=
pointDistance(
a.base,
b.base
);



let targetDistance=
pointDistance(
a.target,
b.target
);



if(
baseDistance===0
)
return 1;




return targetDistance/baseDistance;


}









// ===============================
// 完整星空变换参数
// ===============================


function solveAlignmentV8(
matches
){



let good=
ransacFilter(
matches
);




if(
good.length<5
){


return {

x:0,

y:0,

rotation:0,

scale:1,

quality:0


};


}





let dx=0;

let dy=0;



good.forEach(
m=>{


dx+=
m.target.x-
m.base.x;


dy+=
m.target.y-
m.base.y;



});





return {


x:
dx/good.length,


y:
dy/good.length,


rotation:
calculateRotation(
good
),


scale:
calculateScale(
good
),


quality:
good.length/matches.length



};



}








// ===============================
// Canvas 仿射校准
// ===============================


function alignImageV8(
ctx,
image,
transform,
w,
h
){



ctx.save();



ctx.translate(
w/2+
transform.x,
h/2+
transform.y
);



ctx.rotate(
-transform.rotation
);



ctx.scale(
1/transform.scale,
1/transform.scale
);



ctx.drawImage(
image,
-w/2,
-h/2
);



ctx.restore();



}// =====================================
// Galaxy Stacker V8 Pro
// Part 4/8
// Gradient Removal + Color Calibration
// =====================================






// ===============================
// 计算天空背景模型
// ===============================


function createSkyModel(
data
){


let d=
data.data;


let w=
data.width;


let h=
data.height;



let samples=[];



for(
let y=0;
y<h;
y+=40
){


for(
let x=0;
x<w;
x+=40
){



let i=
(y*w+x)*4;



let r=d[i];

let g=d[i+1];

let b=d[i+2];



let light=
(r+g+b)/3;



// 排除亮星和银河核心


if(
light<90
){


samples.push({

x:x,

y:y,

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
// 二次曲面光污染模型
// ===============================


function estimateGradient(
samples,
w,
h
){



let model={


r:0,

g:0,

b:0


};



if(
samples.length===0
)
return model;




samples.forEach(
s=>{


model.r+=s.r;

model.g+=s.g;

model.b+=s.b;


});





model.r/=samples.length;

model.g/=samples.length;

model.b/=samples.length;



return model;


}









// ===============================
// V8 光污染去除
// ===============================


function removeGradientV8(
data
){



let d=
data.data;



let samples=
createSkyModel(
data
);



let bg=
estimateGradient(
samples,
data.width,
data.height
);





for(
let i=0;
i<d.length;
i+=4
){



// 柔性扣除


d[i]-=
bg.r*0.65;


d[i+1]-=
bg.g*0.65;


d[i+2]-=
bg.b*0.65;




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
// 自动白平衡
// ===============================


function autoWhiteBalanceV8(
data
){



let d=
data.data;



let r=0;

let g=0;

let b=0;

let n=0;




for(
let i=0;
i<d.length;
i+=16
){



r+=d[i];

g+=d[i+1];

b+=d[i+2];


n++;


}



r/=n;

g/=n;

b/=n;




let avg=
(r+g+b)/3;




let rGain=
avg/r;


let gGain=
avg/g;


let bGain=
avg/b;





for(
let i=0;
i<d.length;
i+=4
){



d[i]*=
rGain;


d[i+1]*=
gGain;


d[i+2]*=
bGain;



d[i]=Math.min(
255,
d[i]
);


d[i+1]=Math.min(
255,
d[i+1]
);


d[i+2]=Math.min(
255,
d[i+2]
);



}



return data;


}








// ===============================
// 镜头暗角修复
// ===============================


function flatFieldCorrection(
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



let maxDist=
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



let index=
(y*w+x)*4;



let dx=
x-cx;


let dy=
y-cy;



let dist=
Math.sqrt(
dx*dx+
dy*dy
)/maxDist;



let gain=
1+
dist*0.25;





d[index]*=
gain;


d[index+1]*=
gain;


d[index+2]*=
gain;




}



}




return data;


}// =====================================
// Galaxy Stacker V8 Pro
// Part 5/8
// Weighted Sigma Stack Engine
// =====================================






// ===============================
// 计算像素平均
// ===============================


function average(
arr
){


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








// ===============================
// 标准差
// ===============================


function deviation(
arr,
avg
){



let sum=0;



for(
let i=0;
i<arr.length;
i++
){



sum+=
Math.pow(
arr[i]-avg,
2
);



}



return Math.sqrt(
sum/arr.length
);


}









// ===============================
// Weighted Sigma Stack V8
// ===============================


function weightedSigmaStackV8(
images
){



let w=
images[0].width;



let h=
images[0].height;



let frames=[];




// 读取所有帧


for(
let i=0;
i<images.length;
i++
){



frames.push(
images[i]
.getContext("2d")
.getImageData(
0,
0,
w,
h
).data
);



}






let output=
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
average(rs);


let gAvg=
average(gs);


let bAvg=
average(bs);





let rDev=
deviation(
rs,
rAvg
);


let gDev=
deviation(
gs,
gAvg
);


let bDev=
deviation(
bs,
bAvg
);







let r=0;

let g=0;

let b=0;


let weight=0;






for(
let i=0;
i<rs.length;
i++
){



// Sigma过滤


let rw=
Math.abs(
rs[i]-rAvg
)
<
rDev*2
?
1:
0;



let gw=
Math.abs(
gs[i]-gAvg
)
<
gDev*2
?
1:
0;



let bw=
Math.abs(
bs[i]-bAvg
)
<
bDev*2
?
1:
0;







let wgt=
(
rw+
gw+
bw
)/3;





// 高信噪权重


if(
rs[i]+gs[i]+bs[i]>180
){

wgt*=1.15;


}






r+=
rs[i]*wgt;


g+=
gs[i]*wgt;


b+=
bs[i]*wgt;



weight+=wgt;



}







if(weight>0){


r/=weight;

g/=weight;

b/=weight;



}else{


r=rAvg;

g=gAvg;

b=bAvg;



}








output.data[p]=
Math.max(
0,
Math.min(
255,
r
)
);



output.data[p+1]=
Math.max(
0,
Math.min(
255,
g
)
);



output.data[p+2]=
Math.max(
0,
Math.min(
255,
b
)
);



output.data[p+3]=255;



}





return output;


}









// ===============================
// 亮线检测
// 飞机/卫星轨迹
// ===============================


function removeTrailV8(
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





// 极亮单像素异常


if(
light>245
){



let avg=
(
d[i-4]||
d[i]
+
d[i+4]||
d[i]
)/2;





if(
light-avg>80
){



d[i]*=0.6;


d[i+1]*=0.6;


d[i+2]*=0.6;



}



}



}



return data;


}









// ===============================
// 天文降噪 V8
// ===============================


function astroNoiseReduceV8(
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
light<35
){



// 暗部平滑

d[i]*=0.90;

d[i+1]*=0.92;

d[i+2]*=0.95;



}




}



return data;


}// =====================================
// Galaxy Stacker V8 Pro
// Part 6/8
// Galaxy Enhancement Engine
// =====================================






// ===============================
// 银河区域 Mask
// ===============================


function createGalaxyMaskV8(
data
){



let mask =
new Float32Array(
data.width*
data.height
);



let d=
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
(
r+
g+
b
)/3;




let value=0;





// 银河尘埃亮度范围


if(
light>30 &&
light<150
){


value=1;


}





// 蓝紫星云


if(
b>r &&
b>g
){


value+=0.25;


}




// 红色氢区


if(
r>g &&
r>b
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
// 银河结构恢复
// ===============================


function enhanceGalaxyStructureV8(
data,
mask
){



let d=
data.data;




for(
let i=0;
i<mask.length;
i++
){



let strength=
mask[i];



if(
strength<=0
)
continue;





let p=i*4;



let r=d[p];

let g=d[p+1];

let b=d[p+2];






// 微对比增强


r +=
(r-128)
*
0.20
*
strength;



g +=
(g-128)
*
0.16
*
strength;



b +=
(b-128)
*
0.28
*
strength;






// 星云颜色恢复


b +=
15*
strength;



r +=
6*
strength;






d[p]=Math.min(
255,
Math.max(
0,
r
)
);



d[p+1]=Math.min(
255,
Math.max(
0,
g
)
);



d[p+2]=Math.min(
255,
Math.max(
0,
b
)
);



}




return data;


}









// ===============================
// 恒星保护
// ===============================


function createStarProtectionMaskV8(
data
){



let mask =
new Uint8Array(
data.width*
data.height
);



let d=
data.data;



for(
let i=0;
i<mask.length;
i++
){



let p=i*4;



let light=
(
d[p]+
d[p+1]+
d[p+2]
)/3;





if(
light>180
){


mask[i]=1;


}



}




return mask;


}









// ===============================
// 恒星颜色恢复
// ===============================


function restoreStarColorV8(
data,
mask
){



let d=
data.data;



for(
let i=0;
i<mask.length;
i++
){



if(
mask[i]===0
)
continue;



let p=i*4;



let r=d[p];

let g=d[p+1];

let b=d[p+2];





// 避免白星过曝


let max=
Math.max(
r,
g,
b
);





if(
max>220
){


let ratio=
220/max;


d[p]*=ratio;

d[p+1]*=ratio;

d[p+2]*=ratio;


}






// 星色轻微增强


d[p]+=3;


d[p+2]+=5;






}



return data;


}









// ===============================
// V8 天文电影色彩
// ===============================


function astroFilmGradeV8(
data
){



let d=
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
(
r+
g+
b
)/3;






// 暗部冷色


if(
light<40
){


b*=1.03;


g*=0.98;



}






// 银河暖色层次


if(
light>40 &&
light<170
){


r*=1.04;


b*=1.08;



}







// 高光保护


if(
light>220
){


r*=0.96;


g*=0.96;


b*=0.96;



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
// Galaxy Stacker V8 Pro
// Part 7/8
// Main Pipeline Controller
// =====================================






async function processGalaxyV8(){



if(
processing
)
return;



processing=true;



btn.disabled=true;






try{



progress(
5,
"V8读取照片..."
);






let images=[];






// ===============================
// 加载图片
// ===============================


for(
let i=0;
i<photos.length;
i++
){



let img =
await loadImage(
photos[i]
);



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



images.push(
canvas
);



progress(
10+
i/photos.length*10,
"加载照片 "+
(i+1)+"/"+
photos.length
);



}








// ===============================
// 星点校准
// ===============================


progress(
25,
"AI星点自动配准..."
);



let baseData =
images[0]
.getContext("2d")
.getImageData(
0,
0,
images[0].width,
images[0].height
);



let baseStars =
detectStarsV8(
baseData
);





let aligned=[];


aligned.push(
images[0]
);






for(
let i=1;
i<images.length;
i++
){



let data =
images[i]
.getContext("2d")
.getImageData(
0,
0,
images[i].width,
images[i].height
);



let stars =
detectStarsV8(
data
);





let matches =
matchStarsV8(
baseStars,
stars
);






let transform =
solveAlignmentV8(
matches
);






let canvas =
createCanvas(
images[i].width,
images[i].height
);



let ctx =
canvas.getContext("2d");



alignImageV8(
ctx,
images[i],
transform,
canvas.width,
canvas.height
);



aligned.push(
canvas
);



}









// ===============================
// 堆栈
// ===============================


progress(
45,
"Weighted Sigma堆栈..."
);



let output =
weightedSigmaStackV8(
aligned
);







// ===============================
// 基础校正
// ===============================


progress(
60,
"去除光污染..."
);



output =
removeGradientV8(
output
);



output =
autoWhiteBalanceV8(
output
);



output =
flatFieldCorrection(
output
);








// ===============================
// 降噪
// ===============================


progress(
70,
"天文降噪..."
);



output =
removeTrailV8(
output
);



output =
astroNoiseReduceV8(
output
);








// ===============================
// 银河增强
// ===============================


progress(
80,
"恢复银河结构..."
);



let galaxyMask =
createGalaxyMaskV8(
output
);



let starMask =
createStarProtectionMaskV8(
output
);






output =
enhanceGalaxyStructureV8(
output,
galaxyMask
);



output =
restoreStarColorV8(
output,
starMask
);



output =
astroFilmGradeV8(
output
);







progress(
95,
"生成最终图片..."
);



showResultV8(
output
);





progress(
100,
"✨ Galaxy Stacker V8 Pro 完成"
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
// 绑定按钮
// ===============================


btn.onclick =
()=>{


if(
photos.length<2
){


alert(
"请至少选择2张照片"
);


return;


}



processGalaxyV8();



};// =====================================
// Galaxy Stacker V8 Pro
// Part 8/8
// Output + Controls
// =====================================





// ===============================
// 显示结果
// ===============================


function showResultV8(
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
"Galaxy_Stacker_V8_Pro.png";



link.innerHTML =
"⬇ 下载 Galaxy V8 Pro 高清PNG";



result.appendChild(link);



}









// ===============================
// 图像调节系统
// ===============================


function adjustImageV8(
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





for(
let i=0;
i<d.length;
i+=4
){



let r=d[i];

let g=d[i+1];

let b=d[i+2];






// 曝光


let factor =
Math.pow(
2,
exp
);



r*=factor;

g*=factor;

b*=factor;






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
(r-gray)
*
sat;


g =
gray+
(g-gray)
*
sat;


b =
gray+
(b-gray)
*
sat;







// 银河增强


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
// 滑块显示
// ===============================



exposure.oninput=
()=>{


expValue.innerHTML =
exposure.value+
" EV";


};



contrast.oninput=
()=>{


contrastValue.innerHTML =
contrast.value;


};



saturation.oninput=
()=>{


satValue.innerHTML =
saturation.value+
"%";


};



galaxy.oninput=
()=>{


galaxyValue.innerHTML =
galaxy.value+
"%";


};
