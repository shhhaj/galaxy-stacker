// =====================================
// Galaxy Stacker V5.2
// Star Align + Smart Stack
// Part 1/4
// =====================================


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



let photos=[];





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
"已选择："+photos.length+" 张照片";



preview.innerHTML="";



photos.forEach(file=>{


let img =
document.createElement("img");


img.src =
URL.createObjectURL(file);


img.style.width="120px";

img.style.margin="5px";

img.style.borderRadius="10px";


preview.appendChild(img);



});


});







// =====================================
// 图片读取
// =====================================


function readImage(file){


return new Promise(resolve=>{


let img =
new Image();



img.onload=function(){

resolve(img);

};



img.src =
URL.createObjectURL(file);



});


}








// =====================================
// 手机优化缩放
// =====================================


function resizeImage(img){



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
// 星点检测
// =====================================


function detectStars(image){



let stars=[];



let data =
image.data;


let w =
image.width;


let h =
image.height;



for(
let y=10;
y<h-10;
y+=5
){



for(
let x=10;
x<w-10;
x+=5
){



let p =
(y*w+x)*4;



let r=data[p];

let g=data[p+1];

let b=data[p+2];



let light =
(r+g+b)/3;



if(
light>190 &&
light<255
){



stars.push({

x:x,

y:y,

power:light


});


}



}



}




stars.sort(
(a,b)=>
b.power-a.power
);



return stars.slice(
0,
50
);



}







// =====================================
// 计算星点偏移
// =====================================


function calculateShift(
base,
target
){



if(
base.length===0 ||
target.length===0
){

return {

x:0,

y:0

};


}



let dx=0;

let dy=0;

let count=0;



for(
let i=0;
i<Math.min(base.length,target.length);
i++
){



dx +=
target[i].x -
base[i].x;



dy +=
target[i].y -
base[i].y;



count++;


}



return {


x:
dx/count,


y:
dy/count


};



}







// =====================================
// 平移图片
// =====================================


function shiftImage(
canvas,
x,
y
){


let out =
document.createElement("canvas");



out.width =
canvas.width;


out.height =
canvas.height;



let ctx =
out.getContext("2d");



ctx.drawImage(
canvas,
x,
y
);



return out;


}// =====================================
// Galaxy Stacker V5.2
// Part 2/4
// Star Align + Stack Core
// =====================================




// =====================================
// 获取ImageData
// =====================================


function getImageData(canvas){


let ctx =
canvas.getContext("2d");


return ctx.getImageData(
0,
0,
canvas.width,
canvas.height
);


}








// =====================================
// 自动星点对齐
// =====================================


async function alignImages(images){



let aligned=[];



// 第一张作为基准


let baseCanvas =
images[0];


let baseData =
getImageData(
baseCanvas
);



let baseStars =
detectStars(
baseData
);





aligned.push(
baseCanvas
);






for(
let i=1;
i<images.length;
i++
){



let currentData =
getImageData(
images[i]
);



let stars =
detectStars(
currentData
);



let offset =
calculateShift(
baseStars,
stars
);





let fixed =
shiftImage(
images[i],
-offset.x,
-offset.y
);





aligned.push(
fixed
);



bar.style.width =
(
20+
i/images.length*20
)
+"%";



info.innerHTML =
"星点自动对齐 "+
i+
"/"+
images.length;



}



return aligned;


}








// =====================================
// 智能平均堆栈
// =====================================


async function stackAligned(
images
){



let w =
images[0].width;


let h =
images[0].height;




let total =
new Float64Array(
w*h*4
);





for(
let i=0;
i<images.length;
i++
){



let data =
getImageData(
images[i]
).data;




for(
let p=0;
p<data.length;
p++
){



total[p]+=data[p];


}




bar.style.width =
(
40+
i/images.length*35
)
+"%";



info.innerHTML =
"银河堆栈 "+
(i+1)+
"/"+
images.length;



}






let output =
new ImageData(
w,
h
);





for(
let p=0;
p<total.length;
p+=4
){



output.data[p]=
total[p]/
images.length;



output.data[p+1]=
total[p+1]/
images.length;



output.data[p+2]=
total[p+2]/
images.length;



output.data[p+3]=255;



}




return output;


}








// =====================================
// 暗部降噪
// =====================================


function noiseReduce(data){


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
light<30
){



d[i]*=0.88;

d[i+1]*=0.9;

d[i+2]*=0.94;



}



}



return data;


}// =====================================
// Galaxy Stacker V5.2
// Part 3/4
// Color + Galaxy Enhancement
// =====================================






// =====================================
// 光污染去除
// =====================================


function removeLightPollution(data){


let d =
data.data;



let r=0;

let g=0;

let b=0;

let n=0;



// 采样背景

for(
let i=0;
i<d.length;
i+=400
){



let light =
(
d[i]+
d[i+1]+
d[i+2]
)/3;



if(light<120){


r+=d[i];

g+=d[i+1];

b+=d[i+2];

n++;


}



}



if(n===0)
return data;



let br=r/n;

let bg=g/n;

let bb=b/n;




for(
let i=0;
i<d.length;
i+=4
){



d[i]-=
br*0.25;



d[i+1]-=
bg*0.25;



d[i+2]-=
bb*0.25;



d[i]=Math.max(
0,
Math.min(255,d[i])
);



d[i+1]=Math.max(
0,
Math.min(255,d[i+1])
);



d[i+2]=Math.max(
0,
Math.min(255,d[i+2])
);



}



return data;


}










// =====================================
// 银河自然色彩恢复
// =====================================


function galaxyColor(data){


let d=data.data;



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
light>35 &&
light<170
){



// 自然银河色


r*=1.06;


g*=1.03;


b*=1.08;




// 微弱紫蓝


b+=5;

r+=2;



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


}










// =====================================
// 银河局部增强
// =====================================


function enhanceMilkyWay(data){



let d=data.data;



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
light>45 &&
light<160
){



let strength =
0.18;



r +=
(r-128)*
strength;



g +=
(g-128)*
strength;



b +=
(b-128)*
0.22;



}




d[i]=Math.max(
0,
Math.min(255,r)
);



d[i+1]=Math.max(
0,
Math.min(255,g)
);



d[i+2]=Math.max(
0,
Math.min(255,b)
);



}



return data;


}









// =====================================
// 星点保护
// =====================================


function createStarMask(data){


let mask=[];


let d=data.data;



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



mask.push(
light>210
);



}



return mask;


}








function sharpenStars(
data,
mask
){



let d=data.data;



for(
let i=0;
i<mask.length;
i++
){



if(mask[i]){



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


}// =====================================
// Galaxy Stacker V5.2
// Part 4/4
// Main Pipeline + Export
// =====================================




// =====================================
// 曝光/对比/饱和调整
// =====================================


function adjustImage(data){


let d =
data.data;



let exp =
Number(
exposure?.value || 0
);



let con =
Number(
contrast?.value || 0
);



let sat =
Number(
saturation?.value || 100
)/100;



let expPower =
Math.pow(
2,
exp
);



let contrastPower =
(con+100)/100;





for(
let i=0;
i<d.length;
i+=4
){



let r=d[i];

let g=d[i+1];

let b=d[i+2];




// 曝光

r*=expPower;

g*=expPower;

b*=expPower;





// 对比

r =
(r-128)*contrastPower+128;


g =
(g-128)*contrastPower+128;


b =
(b-128)*contrastPower+128;





// 饱和

let gray =
(r+g+b)/3;



r =
gray+(r-gray)*sat;


g =
gray+(g-gray)*sat;


b =
gray+(b-gray)*sat;






d[i]=Math.max(
0,
Math.min(255,r)
);


d[i+1]=Math.max(
0,
Math.min(255,g)
);


d[i+2]=Math.max(
0,
Math.min(255,b)
);



}



return data;


}








// =====================================
// 主按钮
// =====================================


btn.onclick =
async function(){



if(
photos.length<2
){

alert(
"请至少选择2张照片"
);


return;


}




btn.disabled=true;



info.innerHTML=
"正在读取照片...";



let images=[];




for(
let i=0;
i<photos.length;
i++
){



info.innerHTML=
"读取照片 "+
(i+1)+
"/"+
photos.length;



let img =
await readImage(
photos[i]
);



let canvas =
resizeImage(
img
);



images.push(
canvas
);



}





info.innerHTML=
"星点自动对齐...";



// 自动星点校准

let aligned =
await alignImages(
images
);







info.innerHTML=
"银河堆栈中...";



// 堆栈

let output =
await stackAligned(
aligned
);







info.innerHTML=
"银河智能优化...";





// 处理流程


let starMask =
createStarMask(
output
);



output =
removeLightPollution(
output
);



output =
noiseReduce(
output
);



output =
galaxyColor(
output
);



output =
enhanceMilkyWay(
output
);



output =
sharpenStars(
output,
starMask
);



output =
adjustImage(
output
);







// =====================================
// 输出
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
1
);



result.innerHTML="";



let img =
document.createElement("img");



img.src=url;


img.style.width="95%";



result.appendChild(img);







let link =
document.createElement("a");



link.href=url;


link.download =
"Galaxy_Stack_V5.2.png";



link.innerHTML =
"下载 Galaxy V5.2 高清PNG";



result.appendChild(link);






bar.style.width="100%";



info.innerHTML =
"Galaxy Stacker V5.2 完成 ✨";



btn.disabled=false;



};








// =====================================
// 滑块显示
// =====================================


function sliderText(
slider,
text,
unit=""
){



if(
slider &&
text
){



slider.oninput=function(){


text.innerHTML =
slider.value+
unit;



};


}



}



sliderText(
exposure,
expValue,
" EV"
);



sliderText(
contrast,
contrastValue
);



sliderText(
saturation,
satValue,
"%"
);



sliderText(
galaxy,
galaxyValue,
"%"
);
