// =====================================
// Galaxy Stacker V5.1
// Part 1
// Fixed Stack Engine
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
// 图片读取
// =====================================


function readImage(file){


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
// 降低超大图片尺寸
// 手机优化
// =====================================


function resizeImage(img){



let max=3000;



let scale =
Math.min(
1,
max/img.width
);



let canvas =
document.createElement("canvas");



canvas.width =
img.width*scale;


canvas.height =
img.height*scale;



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


function detectStars(data){



let stars=[];


let d=data.data;


let w=data.width;


let h=data.height;



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



let i =
(y*w+x)*4;



let light =
(
d[i]+
d[i+1]+
d[i+2]
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
// 创建Canvas
// =====================================


function createCanvas(w,h){


let c =
document.createElement("canvas");


c.width=w;

c.height=h;


return c;


}// =====================================
// Galaxy Stacker V5.1
// Part 2
// Stack + Noise + Galaxy
// =====================================



// =====================================
// 修正版平均堆栈
// 防止灰图
// =====================================


function stackImages(
images
){



let width =
images[0].width;


let height =
images[0].height;



let canvas =
createCanvas(
width,
height
);



let ctx =
canvas.getContext("2d");



let frames=[];



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
0,
width,
height
);



let data =
ctx.getImageData(
0,
0,
width,
height
);



frames.push(
data.data
);



bar.style.width =
(
(i+1)/
images.length*
60
)
+"%";



info.innerHTML =
"正在堆栈 "+
(i+1)+
"/"+
images.length;



}




// ===============================
// RGB平均
// ===============================


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



let r=0;

let g=0;

let b=0;



for(
let i=0;
i<frames.length;
i++
){


r+=frames[i][p];

g+=frames[i][p+1];

b+=frames[i][p+2];


}



output.data[p]
=
r/frames.length;



output.data[p+1]
=
g/frames.length;



output.data[p+2]
=
b/frames.length;



output.data[p+3]
=
255;



}



return output;


}







// =====================================
// 热噪点去除
// =====================================


function removeNoise(data){


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



if(light<20){



d[i]*=0.9;

d[i+1]*=0.9;

d[i+2]*=0.95;



}



}



return data;


}








// =====================================
// 光污染处理
// =====================================


function removeLight(data){


let d=data.data;


let r=0;

let g=0;

let b=0;

let n=0;



for(
let i=0;
i<d.length;
i+=400
){


r+=d[i];

g+=d[i+1];

b+=d[i+2];

n++;


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


d[i]-=br*0.35;

d[i+1]-=bg*0.35;

d[i+2]-=bb*0.35;




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
// 银河增强
// =====================================


function enhanceGalaxy(data){


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
(r+g+b)/3;



if(
light>40 &&
light<180
){



r*=1.12;

g*=1.06;

b*=1.18;



// 蓝紫星云

b+=8;

r+=3;



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
// 星点保护
// =====================================


function starProtect(data){


let mask=[];


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



mask.push(
light>210
);



}



return mask;


}





function restoreStars(
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


d[p]*=1.08;

d[p+1]*=1.08;

d[p+2]*=1.08;



d[p]=Math.min(255,d[p]);

d[p+1]=Math.min(255,d[p+1]);

d[p+2]=Math.min(255,d[p+2]);


}



}



return data;


}// =====================================
// Galaxy Stacker V5.1
// Part 3
// Main + Export + Slider
// =====================================




// =====================================
// 基础调节
// =====================================


function adjustImage(data){


let d=data.data;



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



let gal =
Number(
galaxy?.value || 100
)/100;



let expFactor =
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

r*=expFactor;

g*=expFactor;

b*=expFactor;





// 对比度

let c =
(con+100)/100;


r =
(r-128)*c+128;


g =
(g-128)*c+128;


b =
(b-128)*c+128;





// 饱和度

let gray =
(r+g+b)/3;


r =
gray+(r-gray)*sat;


g =
gray+(g-gray)*sat;


b =
gray+(b-gray)*sat;





// 银河强度

r*=gal;

g*=gal;

b*=gal;





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
"读取照片...";



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



// 缩小超大照片

let small =
resizeImage(img);


images.push(
small
);



}





info.innerHTML=
"银河堆栈处理中...";



let output =
await stackImages(
images
);





info.innerHTML=
"AI银河优化...";




// 处理流程


let stars =
starProtect(output);



output =
removeLight(
output
);



output =
removeNoise(
output
);



output =
enhanceGalaxy(
output
);



output =
restoreStars(
output,
stars
);



output =
adjustImage(
output
);






// 输出

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


link.download=
"Galaxy_Stack_V5.1.png";


link.innerHTML=
"下载银河高清PNG";



result.appendChild(link);





bar.style.width="100%";



info.innerHTML=
"Galaxy Stacker V5.1 完成 ✨";



btn.disabled=false;



};







// =====================================
// 滑块显示
// =====================================


function bindSlider(
slider,
text,
suffix=""
){


if(
slider &&
text
){



slider.oninput =
()=>{


text.innerHTML =
slider.value+
suffix;



};



}



}



bindSlider(
exposure,
expValue,
" EV"
);


bindSlider(
contrast,
contrastValue
);


bindSlider(
saturation,
satValue,
"%"
);


bindSlider(
galaxy,
galaxyValue,
"%"
);
