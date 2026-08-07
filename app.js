// =====================================
// Galaxy Stacker V5.3 Pro
// Part 4/4
// Main Engine
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



info.innerHTML =
"读取银河照片...";



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
resizeImage(
img
);



images.push(
canvas
);



}





info.innerHTML =
"星点自动校准...";



bar.style.width="10%";



let aligned =
await astroAlign(
images
);






info.innerHTML =
"银河Sigma堆栈...";



bar.style.width="50%";



let output =
sigmaStack(
aligned
);







// =====================================
// 后期处理链
// =====================================


output =
astroWhiteBalance(
output
);



output =
astroNoise(
output
);



output =
galaxyDetail(
output
);









// =====================================
// 滑块参数
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


d[i]+=
exp*20;


d[i+1]+=
exp*20;


d[i+2]+=
exp*20;





// 对比


d[i]=
(
d[i]-128
)*
(1+con/100)
+128;


d[i+1]=
(
d[i+1]-128
)*
(1+con/100)
+128;


d[i+2]=
(
d[i+2]-128
)*
(1+con/100)
+128;





// 饱和


let avg=
(
d[i]+
d[i+1]+
d[i+2]
)/3;



d[i]=
avg+
(
d[i]-avg
)*sat;


d[i+1]=
avg+
(
d[i+1]-avg
)*sat;


d[i+2]=
avg+
(
d[i+2]-avg
)*sat;




// 银河强度


d[i]*=gal;

d[i+1]*=gal;

d[i+2]*=gal;



// 限制


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




// =====================================
// 显示结果
// =====================================


let canvas =
document.createElement("canvas");



canvas.width =
output.width;


canvas.height =
output.height;



let ctx =
canvas.getContext("2d");



ctx.putImageData(
output,
0,
0
);





let url =
canvas.toDataURL(
"image/png"
);




result.innerHTML="";



let img =
document.createElement("img");



img.src=url;


img.style.width="95%";



result.appendChild(
img
);





let link =
document.createElement("a");



link.href=url;


link.download =
"Galaxy_Stack_V5.3_Pro.png";



link.innerHTML =
"下载 V5.3 Pro 银河PNG";



result.appendChild(
link
);





bar.style.width="100%";



info.innerHTML =
"🌌 Galaxy Stacker V5.3 Pro 完成";



btn.disabled=false;



};









// =====================================
// 实时滑块显示
// =====================================


exposure.oninput =
()=>{

expValue.innerHTML =
exposure.value+" EV";

};



contrast.oninput =
()=>{

contrastValue.innerHTML =
contrast.value;

};



saturation.oninput =
()=>{

satValue.innerHTML =
saturation.value+"%";

};



galaxy.oninput =
()=>{

galaxyValue.innerHTML =
galaxy.value+"%";

};// =====================================
// Galaxy Stacker V6 Pro
// Astro Imaging Engine
// Part 1/5
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
// 图片选择
// =====================================


input.addEventListener(
"change",
e=>{


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
// RAW检测接口
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
// 图片读取
// =====================================


async function readImage(file){



// RAW预留

if(
typeof loadRAW==="function"
&&
isRAW(file)
){


let raw =
await loadRAW(file);



if(raw)
return raw;



}





return new Promise(resolve=>{


let img =
new Image();



img.onload=()=>{


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
3000;



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



ctx.imageSmoothingEnabled=true;



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
// 星点检测 V6
// Local Maximum
// =====================================


function detectStars(data){



let stars=[];



let d =
data.data;



let w =
data.width;



let h =
data.height;






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



let p =
(y*w+x)*4;



let light =
(
d[p]+
d[p+1]+
d[p+2]
)/3;





if(light<180)
continue;






let max=true;



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


let np =
((y+yy)*w+x+xx)*4;



let nl =
(
d[np]+
d[np+1]+
d[np+2]
)/3;



if(
nl>light
){

max=false;

}


}


}




if(max){


stars.push({

x:x,

y:y,

value:light


});


}



}


}




stars.sort(
(a,b)=>
b.value-a.value
);



return stars.slice(
0,
120
);



}








// =====================================
// Canvas工具
// =====================================


function getData(canvas){


return canvas
.getContext("2d")
.getImageData(
0,
0,
canvas.width,
canvas.height
);


}


function makeCanvas(w,h){


let c =
document.createElement("canvas");



c.width=w;

c.height=h;



return c;


}// =====================================
// Galaxy Stacker V6 Pro
// Part 3/5
// Sigma Stack Engine
// =====================================






// =====================================
// Sigma Clip 2.0
// 天文堆栈核心
// =====================================


function sigmaStackV6(
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



let data =
ctx.getImageData(
0,
0,
w,
h
);



frames.push(
data.data
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



// 大于4张启用Sigma裁剪

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
// 热噪点检测
// =====================================


function removeHotPixelsV6(
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
light>245
){



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




let q =
((y+yy)*w+x+xx)*4;




around +=
(
d[q]+
d[q+1]+
d[q+2]
)/3;



count++;



}



}






if(
light-(around/count)>80
){



let avg =
around/count;



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
// 暗部天文降噪
// =====================================


function astroNoiseV6(
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
light<35
){



d[i]*=0.86;


d[i+1]*=0.88;


d[i+2]*=0.92;



}




}



return data;


}









// =====================================
// 8bit转16bit缓存
// =====================================


function convert16Bit(
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
// Galaxy Stacker V6 Pro
// Part 4/5
// Galaxy Processing Engine
// =====================================






// =====================================
// 天文白平衡
// 修复手机夜景偏蓝
// =====================================


function astroWhiteBalanceV6(
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





// 手机夜景蓝偏修正


r*=1.08;

g*=1.04;

b*=0.90;






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
// 银河蒙版
// 分离银河区域
// =====================================


function createGalaxyMask(
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




let weight=0;




// 银河亮度范围


if(
light>30 &&
light<180
){


weight=1;


}



// 蓝紫星云增强


if(
b>r &&
b>g
){


weight+=0.25;


}



mask[i]=
Math.min(
1,
weight
);



}



return mask;


}








// =====================================
// 银河局部增强
// =====================================


function enhanceMilkyWayV6(
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






// 对比增强


r +=
(r-128)*
0.16*
strength;



g +=
(g-128)*
0.12*
strength;



b +=
(b-128)*
0.20*
strength;





// 星云颜色


r+=5*strength;


b+=10*strength;





d[p]=Math.max(
0,
Math.min(255,r)
);



d[p+1]=Math.max(
0,
Math.min(255,g)
);



d[p+2]=Math.max(
0,
Math.min(255,b)
);



}



return data;


}









// =====================================
// 恒星保护
// =====================================


function starProtectV6(
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
light>210
){



mask[i]=1;



}



}




return mask;


}









// =====================================
// 恒星增强
// =====================================


function restoreStarsV6(
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



d[p]*=1.05;


d[p+1]*=1.05;


d[p+2]*=1.05;




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
// 最终电影级色彩
// =====================================


function cinematicColorV6(
data
){



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




// 保护暗部


if(
light<25
){


r*=0.95;

g*=0.95;

b*=0.98;


}




// 银河暖冷平衡


if(
light>40 &&
light<170
){



r*=1.04;


b*=1.06;



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


}// =====================================
// Galaxy Stacker V6 Pro
// Part 5/5
// Main Pipeline + Output
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



info.innerHTML =
"读取照片...";



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
resizeImage(
img
);



images.push(
canvas
);



}







// ===============================
// 星点校准
// ===============================


info.innerHTML =
"V6 星点自动配准...";



let aligned =
await astroAlignment(
images
);






// ===============================
// Sigma堆栈
// ===============================


info.innerHTML =
"银河多帧堆栈...";


bar.style.width="50%";



let output =
sigmaStackV6(
aligned
);








// ===============================
// 后期天文处理
// ===============================


info.innerHTML =
"银河AI增强...";



output =
astroWhiteBalanceV6(
output
);



output =
removeHotPixelsV6(
output
);



output =
astroNoiseV6(
output
);






let starMask =
starProtectV6(
output
);




let galaxyMask =
createGalaxyMask(
output
);





output =
enhanceMilkyWayV6(
output,
galaxyMask
);





output =
cinematicColorV6(
output
);






output =
restoreStarsV6(
output,
starMask
);









// ===============================
// 手动调节
// ===============================


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

d[i]+=exp*18;

d[i+1]+=exp*18;

d[i+2]+=exp*18;





// 对比


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







// 饱和


let avg =
(
d[i]+
d[i+1]+
d[i+2]
)/3;



d[i]=
avg+
(d[i]-avg)
*sat;



d[i+1]=
avg+
(d[i+1]-avg)
*sat;



d[i+2]=
avg+
(d[i+2]-avg)
*sat;








// 银河强度


d[i]*=
gal;



d[i+1]*=
gal;



d[i+2]*=
gal;






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









// ===============================
// 输出
// ===============================



let canvas =
makeCanvas(
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
"image/png"
);






result.innerHTML="";



let img =
document.createElement("img");



img.src=url;


img.style.width="95%";


img.style.borderRadius="18px";



result.appendChild(
img
);







let link =
document.createElement("a");



link.href=url;



link.download =
"Galaxy_Stacker_V6_Pro.png";



link.innerHTML =
"🌌 下载 V6 Pro 银河高清PNG";



result.appendChild(
link
);







bar.style.width="100%";



info.innerHTML =
"✨ Galaxy Stacker V6 Pro 完成";



btn.disabled=false;



};









// =====================================
// 滑块显示
// =====================================


exposure.oninput =
()=>{

expValue.innerHTML =
exposure.value+" EV";

};



contrast.oninput =
()=>{

contrastValue.innerHTML =
contrast.value;

};



saturation.oninput =
()=>{

satValue.innerHTML =
saturation.value+"%";

};



galaxy.oninput =
()=>{

galaxyValue.innerHTML =
galaxy.value+"%";

};
