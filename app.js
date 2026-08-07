// =====================================
// Galaxy Stacker V8.6 Pro
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
// 全局
// ===============================


let photos=[];


let processing=false;





// ===============================
// 进度显示
// ===============================


function progress(
value,
text
){

bar.style.width =
value+"%";


info.innerHTML =
text;

}






// ===============================
// Canvas
// ===============================


function createCanvas(
w,
h
){


let c =
document.createElement("canvas");


c.width=w;


c.height=h;


return c;


}








// ===============================
// RAW检测
// ===============================


function isRAW(file){


let n =
file.name.toLowerCase();



return(

n.endsWith(".dng")||

n.endsWith(".nef")||

n.endsWith(".arw")||

n.endsWith(".cr2")||

n.endsWith(".cr3")||

n.endsWith(".raf")

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



img.style.width =
"120px";


img.style.margin =
"5px";


img.style.borderRadius =
"10px";



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



img.onload =
()=>{


resolve(img);


};



img.src =
URL.createObjectURL(file);



});


}









// ===============================
// 手机优化缩放
// ===============================


function optimizeCanvasV86(
canvas
){



let maxSize =
2600;



if(
canvas.width<=maxSize
&&
canvas.height<=maxSize
)
return canvas;





let scale =
Math.min(

maxSize/canvas.width,

maxSize/canvas.height

);






let out =
createCanvas(

Math.floor(canvas.width*scale),

Math.floor(canvas.height*scale)

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
// 图片转Canvas
// ===============================


function imageToCanvasV86(
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



return optimizeCanvasV86(
canvas
);


}// =====================================
// Galaxy Stacker V8.6 Pro
// Part 2/5
// Star Align Engine
// =====================================






// ===============================
// 星点检测 V8.6
// ===============================


function detectStarsV86(
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
let y=8;
y<h-8;
y+=3
){



for(
let x=8;
x<w-8;
x+=3
){



let i =
(y*w+x)*4;



let r =
d[i];


let g =
d[i+1];


let b =
d[i+2];



let light =
(r+g+b)/3;






// 星点亮度


if(
light>180
){



let max =
Math.max(
r,
g,
b
);



let min =
Math.min(
r,
g,
b
);





// 排除彩色噪点


if(
max-min<90
){



let peak=true;






// 周围比较


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



let p =
((y+yy)*w+x+xx)*4;



let around =
(
d[p]+
d[p+1]+
d[p+2]
)/3;





if(
around>light
){


peak=false;


}



}


}




if(peak){


stars.push({

x:x,

y:y,

power:light


});


}



}



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
120
);


}









// ===============================
// 星点匹配
// ===============================


function matchStarsV86(
base,
target
){



let result=[];




for(
let i=0;
i<base.length;
i++
){



let best=null;


let distance=999;



for(
let j=0;
j<target.length;
j++
){



let dx =
base[i].x -
target[j].x;



let dy =
base[i].y -
target[j].y;



let d =
Math.sqrt(
dx*dx+
dy*dy
);






if(
d<distance
){


distance=d;


best=target[j];


}



}







if(
best &&
distance<60
){



result.push({

dx:
base[i].x-best.x,


dy:
base[i].y-best.y


});



}



}




return result;


}









// ===============================
// 计算平均偏移
// ===============================


function calculateOffsetV86(
matches
){



if(
matches.length<3
){


return{

x:0,

y:0

};


}





let x=0;

let y=0;




matches.forEach(
m=>{


x+=m.dx;


y+=m.dy;



});





return{


x:x/matches.length,


y:y/matches.length



};


}









// ===============================
// 图像平移
// ===============================


function shiftImageV86(
canvas,
offset
){



let out =
createCanvas(
canvas.width,
canvas.height
);



let ctx =
out.getContext("2d");



ctx.drawImage(
canvas,
offset.x,
offset.y
);




return out;


}









// ===============================
// 全部图片自动对齐
// ===============================


function alignImagesV86(
images
){



let result=[];



let base =
images[0];



let baseCtx =
base.getContext("2d");



let baseData =
baseCtx.getImageData(
0,
0,
base.width,
base.height
);



let baseStars =
detectStarsV86(
baseData
);



result.push(
base
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
detectStarsV86(
data
);






let matches =
matchStarsV86(
baseStars,
stars
);






let offset =
calculateOffsetV86(
matches
);






result.push(

shiftImageV86(
images[i],
offset
)

);



}



return result;


}// =====================================
// Galaxy Stacker V8.6 Pro
// Part 3/5
// Smart Stack Engine
// =====================================






// ===============================
// 平均值
// ===============================


function averageV86(arr){


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


function deviationV86(
arr,
avg
){


let total=0;



for(
let i=0;
i<arr.length;
i++
){


let d =
arr[i]-avg;


total +=
d*d;


}



return Math.sqrt(
total/arr.length
);


}









// ===============================
// Sigma Clipping堆栈
// ===============================


function sigmaStackV86(
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



let ctx =
images[i]
.getContext("2d");



frames.push(

ctx.getImageData(
0,
0,
width,
height
).data

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
let i=0;
i<frames.length;
i++
){



r.push(
frames[i][p]
);



g.push(
frames[i][p+1]
);



b.push(
frames[i][p+2]
);



}







let rAvg =
averageV86(r);


let gAvg =
averageV86(g);


let bAvg =
averageV86(b);






let rDev =
deviationV86(
r,
rAvg
);


let gDev =
deviationV86(
g,
gAvg
);


let bDev =
deviationV86(
b,
bAvg
);






let rr=0;

let gg=0;

let bb=0;

let count=0;







for(
let i=0;
i<r.length;
i++
){



// 过滤异常亮点


if(
Math.abs(
r[i]-rAvg
)
<
rDev*2.2
){


rr+=r[i];


}
else{


rr+=rAvg;


}







if(
Math.abs(
g[i]-gAvg
)
<
gDev*2.2
){


gg+=g[i];


}
else{


gg+=gAvg;


}







if(
Math.abs(
b[i]-bAvg
)
<
bDev*2.2
){


bb+=b[i];


}
else{


bb+=bAvg;


}




count++;


}





output.data[p]=
rr/count;


output.data[p+1]=
gg/count;


output.data[p+2]=
bb/count;


output.data[p+3]=255;



}





return output;


}









// ===============================
// 热噪点去除
// ===============================


function hotPixelFixV86(
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



let i =
(y*w+x)*4;



let light =
(
d[i]+
d[i+1]+
d[i+2]
)/3;






if(
light>245
){



let sum=0;

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



let p =
((y+yy)*w+x+xx)*4;



sum +=
(
d[p]+
d[p+1]+
d[p+2]
)/3;



n++;


}



}







if(
light-(sum/n)>80
){



d[i]=sum/n;


d[i+1]=sum/n;


d[i+2]=sum/n;



}



}



}



}



return data;


}









// ===============================
// 飞机/卫星轨迹抑制
// ===============================


function trailRemoveV86(
data
){



let d =
data.data;


let w =
data.width;



for(
let y=1;
y<data.height-1;
y++
){



for(
let x=1;
x<w-1;
x++
){



let i =
(y*w+x)*4;



let current =
(
d[i]+
d[i+1]+
d[i+2]
)/3;





let left =
(
d[i-4]+
d[i-3]+
d[i-2]
)/3;



let right =
(
d[i+4]+
d[i+5]+
d[i+6]
)/3;






if(
current-left>100
&&
current-right>100
){



d[i]*=0.7;


d[i+1]*=0.7;


d[i+2]*=0.7;



}



}



}



return data;


}









// ===============================
// 银河暗部降噪
// ===============================


function astroNoiseV86(
data
){



let d =
data.data;



for(
let i=0;
i<d.length;
i+=4
){



let light =
(
d[i]+
d[i+1]+
d[i+2]
)/3;






if(
light<28
){



d[i]*=0.95;


d[i+1]*=0.96;


d[i+2]*=0.97;



}



}



return data;


}// =====================================
// Galaxy Stacker V8.6 Pro
// Part 4/5
// Galaxy Recovery Engine
// =====================================






// ===============================
// 自动白平衡
// ===============================


function autoWhiteBalanceV86(
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
i+=4
){



let light =
(
d[i]+
d[i+1]+
d[i+2]
)/3;





// 只采样暗天空


if(
light>20 &&
light<100
){



r+=d[i];

g+=d[i+1];

b+=d[i+2];

count++;



}



}





if(count===0)
return data;





r/=count;

g/=count;

b/=count;





let avg =
(r+g+b)/3;






let rGain =
avg/r;


let gGain =
avg/g;


let bGain =
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



}



return data;


}









// ===============================
// 蓝色偏移修复
// ===============================


function removeBlueCastV86(
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







// 天空蓝雾控制


if(
b>
r*1.35 &&
b>
g*1.25 &&
light<120
){



b*=0.88;


g*=1.03;



}






d[i]=
Math.min(
255,
r
);



d[i+1]=
Math.min(
255,
g
);



d[i+2]=
Math.min(
255,
b
);



}




return data;


}









// ===============================
// 银河区域 Mask
// ===============================


function createGalaxyMaskV86(
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
(r+g+b)/3;



let value=0;







// 银河弱信号


if(
light>25 &&
light<140
){


value=1;


}





// 红氢区


if(
r>g &&
r>b
){


value+=0.15;


}






// 蓝紫星云


if(
b>g &&
b>r
){


value+=0.12;


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


function enhanceGalaxyV86(
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



let power =
mask[i];



if(
power<=0
)
continue;





let p=i*4;



let r=d[p];

let g=d[p+1];

let b=d[p+2];







// 局部对比


r +=
(r-128)
*
0.10
*
power;



g +=
(g-128)
*
0.08
*
power;



b +=
(b-128)
*
0.12
*
power;







// 轻微银河色彩


r+=
2*
power;


b+=
3*
power;







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


function starProtectV86(
data
){



let d =
data.data;




for(
let i=0;
i<d.length;
i+=4
){



let light =
(
d[i]+
d[i+1]+
d[i+2]
)/3;





if(
light>210
){



// 防止白星爆炸


d[i]*=0.97;


d[i+1]*=0.97;


d[i+2]*=0.97;



}



}



return data;


}









// ===============================
// 天文自然色彩
// ===============================


function astroGradeV86(
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





// 暗部保持黑


if(
light<35
){


b*=1.01;


}






// 银河轻微冷暖层次


if(
light>=35 &&
light<160
){



r*=1.015;


b*=1.02;



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
// Galaxy Stacker V8.6 Pro
// Part 5/5
// Main + Output
// =====================================






// ===============================
// 输出结果
// ===============================


function showResultV86(
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
"Galaxy_Stacker_V8.6_Pro.png";



link.innerHTML =
"⬇ 下载 Galaxy V8.6 高清PNG";



result.appendChild(link);



}









// ===============================
// 最终调节
// ===============================


function finalAdjustV86(
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
)
/100;



let gal =
Number(
galaxy.value
)
/100;






let expGain =
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


r*=expGain;


g*=expGain;


b*=expGain;






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
// 主程序
// ===============================


async function runGalaxyV86(){



if(
photos.length<2
){


alert(
"请至少选择2张照片"
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
"读取照片..."
);






let images=[];






for(
let i=0;
i<photos.length;
i++
){



let img =
await loadImage(
photos[i]
);



images.push(
imageToCanvasV86(
img
)
);



progress(
10+
i/photos.length*10,
"加载照片 "+
(i+1)+"/"+
photos.length
);



}








// 对齐


progress(
30,
"星点自动对齐..."
);



let aligned =
alignImagesV86(
images
);







// 堆栈


progress(
50,
"智能银河堆栈..."
);



let output =
sigmaStackV86(
aligned
);









// 清理


progress(
65,
"清理噪点..."
);



output =
hotPixelFixV86(
output
);



output =
trailRemoveV86(
output
);



output =
astroNoiseV86(
output
);









// 银河处理


progress(
75,
"恢复银河..."
);





output =
autoWhiteBalanceV86(
output
);



output =
removeBlueCastV86(
output
);






let galaxyMask =
createGalaxyMaskV86(
output
);



output =
enhanceGalaxyV86(
output,
galaxyMask
);



output =
starProtectV86(
output
);



output =
astroGradeV86(
output
);








// 调节


progress(
90,
"最终处理..."
);



output =
finalAdjustV86(
output
);






showResultV86(
output
);



progress(
100,
"✨ Galaxy Stacker V8.6 完成"
);





}
catch(e){


console.error(e);


info.innerHTML =
"错误："+e.message;


}



processing=false;


btn.disabled=false;


}









// ===============================
// 按钮
// ===============================


btn.onclick =
()=>{


runGalaxyV86();


};









// ===============================
// 滑块
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
// Galaxy Stacker V8.6 Pro END
// =====================================
