// =====================================
// Galaxy Stacker V4.7
// RAW Ready + Star Align + Stack
// Part 1
// =====================================


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



let photos=[];


// RAW预留

let rawImages=[];





// =====================================
// 16bit Buffer
// =====================================


function create16BitBuffer(
width,
height
){

return new Uint16Array(
width*
height*
4
);

}





// =====================================
// RAW格式检测
// =====================================


function isRAW(file){


let name =
file.name.toLowerCase();


return (

name.endsWith(".dng") ||
name.endsWith(".cr2") ||
name.endsWith(".cr3") ||
name.endsWith(".nef") ||
name.endsWith(".arw") ||
name.endsWith(".raf")

);


}







// =====================================
// 图片导入
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



info.innerHTML =
"照片加载完成";



});









// =====================================
// 图片读取
// =====================================


async function readImage(file){



// RAW接口预留

if(
typeof loadRAW==="function" &&
isRAW(file)
){


let raw =
await loadRAW(file);



if(raw){

return raw;

}


}




return await new Promise(resolve=>{


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
// 星点检测
// =====================================


function detectStars(imageData){


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
y+=4
){


for(
let x=5;
x<w-5;
x+=4
){



let p =
(y*w+x)*4;



let light =
(
d[p]+
d[p+1]+
d[p+2]
)/3;




if(light>220){


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
100
);



}









// =====================================
// 星点偏移计算
// =====================================


function calculateOffset(
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



let n =
Math.min(
base.length,
target.length
);



for(
let i=0;
i<n;
i++
){



dx +=
target[i].x -
base[i].x;



dy +=
target[i].y -
base[i].y;



}




return {


x:dx/n,


y:dy/n


};


}// =====================================
// Galaxy Stacker V4.7
// Part 2
// Stack + LP Remove + Noise + Color
// =====================================





// =====================================
// 热噪点去除
// =====================================


function removeHotPixels(data){


let d=data.data;

let w=data.width;

let h=data.height;



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



if(light>245){


let around=0;

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



let p=
((y+yy)*w+x+xx)*4;



around +=
(
d[p]+
d[p+1]+
d[p+2]
)/3;



count++;


}



}



if(
light-(around/count)>90
){


let avg=
around/count;


d[i]=avg;

d[i+1]=avg;

d[i+2]=avg;



}



}



}



}



return data;


}







// =====================================
// 暗部降噪
// =====================================


function darkNoiseReduce(data){


let d=data.data;



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



if(light<25){


d[i]*=0.88;

d[i+1]*=0.88;

d[i+2]*=0.92;


}



}



return data;


}







// =====================================
// 光污染去除
// =====================================


function removeLightPollution(data){


let d=data.data;


let w=data.width;

let h=data.height;



let r=0;

let g=0;

let b=0;

let n=0;




for(
let y=0;
y<h;
y+=20
){


for(
let x=0;
x<w;
x+=20
){



let i=
(y*w+x)*4;



let light=
(
d[i]+
d[i+1]+
d[i+2]
)/3;



// 只采样天空背景


if(light<120){



r+=d[i];

g+=d[i+1];

b+=d[i+2];


n++;


}



}



}




if(n===0){

return data;

}




let bgR=r/n;

let bgG=g/n;

let bgB=b/n;





for(
let i=0;
i<d.length;
i+=4
){



d[i]-=
bgR*0.55;


d[i+1]-=
bgG*0.55;


d[i+2]-=
bgB*0.55;




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
)
;



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
// 银河色彩恢复
// =====================================


function recoverGalaxyColor(data){


let d=data.data;



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




// 银河区域


if(
light>35 &&
light<170
){


b*=1.12;


r*=1.06;



if(r>g){

r*=1.08;


}


}





// 暗星云


if(
light>20 &&
light<80
){


b*=1.05;


r*=1.04;


}





d[i]=Math.min(255,r);

d[i+1]=Math.min(255,g);

d[i+2]=Math.min(255,b);



}



return data;


}









// =====================================
// 银河增强
// =====================================


function galaxyEnhance(data){



let d=data.data;



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
light>50 &&
light<180
){


d[i]*=1.12;

d[i+1]*=1.08;

d[i+2]*=1.18;



}



d[i]=Math.min(255,d[i]);

d[i+1]=Math.min(255,d[i+1]);

d[i+2]=Math.min(255,d[i+2]);



}



return data;


}







// =====================================
// 16bit平均堆栈核心
// =====================================


async function stackImages(images){



let width=
images[0].width;



let height=
images[0].height;



let canvas=
document.createElement("canvas");


canvas.width=width;

canvas.height=height;



let ctx=
canvas.getContext("2d");




let total=
new Float64Array(
width*
height*
4
);





// 基准星点


ctx.drawImage(
images[0],
0,
0
);



let baseData=
ctx.getImageData(
0,
0,
width,
height
);



let baseStars=
detectStars(
baseData
);






for(
let i=0;
i<images.length;
i++
){



ctx.clearRect(
0,
0,
width,
height
);



ctx.drawImage(
images[i],
0,
0
);



let current=
ctx.getImageData(
0,
0,
width,
height
);



let stars=
detectStars(
current
);



let offset=
calculateOffset(
baseStars,
stars
);




// 自动校正


ctx.clearRect(
0,
0,
width,
height
);



ctx.drawImage(
images[i],
-offset.x,
-offset.y
);





let pixels=
ctx.getImageData(
0,
0,
width,
height
).data;




for(
let p=0;
p<pixels.length;
p++
){


total[p]+=pixels[p];


}




bar.style.width=
(
(i+1)/
images.length*
70
)
+"%";



info.innerHTML=
"银河自动对齐 "+
(i+1)+
"/"+
images.length;



}






let output=
ctx.createImageData(
width,
height
);



for(
let i=0;
i<total.length;
i++
){


output.data[i]=
total[i]/
images.length;



}




return output;


}// =====================================
// Galaxy Stacker V4.7
// Part 3
// Local Galaxy + Star Protection
// Output
// =====================================





// =====================================
// 银河局部增强
// Milky Way Local Mask
// =====================================


function localGalaxyEnhance(data){


let d=data.data;



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



let weight=0;



// 银河亮度区域


if(
light>45 &&
light<160
){


weight=1;


}



// 蓝紫区域加强


if(
b>r &&
b>g
){


weight+=0.3;


}



if(weight>1){

weight=1;

}





if(weight>0){



// 局部对比


r +=
(r-128)*
0.18*
weight;



g +=
(g-128)*
0.12*
weight;



b +=
(b-128)*
0.22*
weight;




// 银河蓝紫恢复


b +=
18*
weight;


r +=
6*
weight;



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
// 星点保护 Mask
// =====================================


function starProtection(data){



let d=data.data;



let mask=
new Uint8Array(
d.length/4
);



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



// 记录亮星


if(light>210){


mask[i/4]=1;


}



}



return mask;


}








// =====================================
// 星点锐化
// =====================================


function enhanceStars(data,mask){


let d=data.data;



for(
let i=0;
i<d.length;
i+=4
){



if(
mask[i/4]
){


d[i]*=1.08;

d[i+1]*=1.08;

d[i+2]*=1.08;



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



}



return data;


}









// =====================================
// 8bit -> 16bit预留
// =====================================


function convertTo16Bit(data){


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



images.push(
await readImage(
photos[i]
));


}







info.innerHTML=
"银河堆栈处理中...";




let output=
await stackImages(
images
);







// V4.7完整处理链


output =
removeLightPollution(
output
);



output =
removeHotPixels(
output
);



output =
darkNoiseReduce(
output
);



output =
recoverGalaxyColor(
output
);




// 保存星点

let starMask =
starProtection(
output
);




// 银河局部增强

output =
localGalaxyEnhance(
output
);




// 银河最终增强

output =
galaxyEnhance(
output
);




// 恢复星点

output =
enhanceStars(
output,
starMask
);







let canvas=
document.createElement("canvas");



canvas.width=
output.width;


canvas.height=
output.height;



let ctx=
canvas.getContext("2d");



ctx.putImageData(
output,
0,
0
);






let url=
canvas.toDataURL(
"image/png"
);



result.innerHTML="";



let img=
document.createElement("img");



img.src=url;


img.style.width="95%";



result.appendChild(img);






let link=
document.createElement("a");



link.href=url;


link.download=
"Galaxy_Stack_V4.7.png";



link.innerHTML=
"下载 V4.7 银河高清PNG";



result.appendChild(link);






bar.style.width="100%";



info.innerHTML=
"银河堆栈 V4.7 完成 ✨";



btn.disabled=false;



};
