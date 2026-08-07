// =====================================
// Galaxy Stacker V5.3 Pro
// Astro Alignment Engine
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


});









// =====================================
// 读取图片
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
// 手机分辨率优化
// =====================================


function resizeImage(img){


let max =
2600;



let scale =
Math.min(
1,
max/img.width
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
// 星点检测 V5.3
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
let y=8;
y<h-8;
y+=4
){



for(
let x=8;
x<w-8;
x+=4
){



let p =
(y*w+x)*4;



let r=d[p];

let g=d[p+1];

let b=d[p+2];



let light =
(r+g+b)/3;



// 星点

if(
light>180
){



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
80
);



}








// =====================================
// 星点距离特征
// =====================================


function starDescriptor(
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



if(i===j)
continue;



let dx =
stars[i].x-stars[j].x;


let dy =
stars[i].y-stars[j].y;


let d =
Math.sqrt(
dx*dx+dy*dy
);



distances.push(d);


}



distances.sort(
(a,b)=>a-b
);



result.push({

x:stars[i].x,

y:stars[i].y,

feature:
distances.slice(0,5)

});


}



return result;


}// =====================================
// Galaxy Stacker V5.3 Pro
// Part 2/4
// Astro Star Matching
// =====================================






// =====================================
// 星点匹配
// =====================================


function matchStars(
baseStars,
targetStars
){



let matches=[];



let baseDesc =
starDescriptor(
baseStars
);



let targetDesc =
starDescriptor(
targetStars
);





for(
let i=0;
i<baseDesc.length;
i++
){



let best=null;

let score=999999;



for(
let j=0;
j<targetDesc.length;
j++
){



let error=0;



for(
let k=0;
k<5;
k++
){



error += Math.abs(
baseDesc[i].feature[k] -
targetDesc[j].feature[k]
);



}



if(
error<score
){


score=error;


best=targetDesc[j];


}



}



if(
best &&
score<80
){


matches.push({

x1:
baseDesc[i].x,

y1:
baseDesc[i].y,


x2:
best.x,

y2:
best.y


});


}



}



return matches;


}









// =====================================
// 计算仿射参数
// 平移 + 旋转 + 缩放
// =====================================


function calculateTransform(
matches
){



if(
matches.length<3
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
let i=0;
i<matches.length;
i++
){



dx +=
matches[i].x2 -
matches[i].x1;



dy +=
matches[i].y2 -
matches[i].y1;



}



dx /=
matches.length;



dy /=
matches.length;





return {


dx:dx,

dy:dy,

// 旋转预留

angle:0,


scale:1



};



}









// =====================================
// 应用变换
// =====================================


function applyTransform(
canvas,
transform
){



let out =
document.createElement("canvas");



out.width =
canvas.width;


out.height =
canvas.height;



let ctx =
out.getContext("2d");



ctx.save();





ctx.translate(
-transform.dx,
-transform.dy
);



ctx.rotate(
-transform.angle
);



ctx.scale(
transform.scale,
transform.scale
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
// 自动星点校准
// =====================================


async function astroAlign(
images
){



let aligned=[];



let base =
images[0];



let baseData =
base
.getContext("2d")
.getImageData(
0,
0,
base.width,
base.height
);



let baseStars =
detectStars(
baseData
);



aligned.push(
base
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
detectStars(
data
);



let matches =
matchStars(
baseStars,
stars
);





let transform =
calculateTransform(
matches
);



let fixed =
applyTransform(
images[i],
transform
);




aligned.push(
fixed
);



info.innerHTML =
"天文星点校准 "+
i+
"/"+
images.length;



bar.style.width =
(
20+
i/images.length*25
)
+"%";



}



return aligned;


}// =====================================
// Galaxy Stacker V5.3 Pro
// Part 3/4
// Astro Stack + Color Science
// =====================================






// =====================================
// Sigma Clip 堆栈
// 去除热噪点/异常像素
// =====================================


function sigmaStack(
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



let rs=[];

let gs=[];

let bs=[];




for(
let i=0;
i<frames.length;
i++
){



rs.push(
frames[i][p]
);


gs.push(
frames[i][p+1]
);


bs.push(
frames[i][p+2]
);



}




rs.sort(
(a,b)=>a-b
);


gs.sort(
(a,b)=>a-b
);


bs.sort(
(a,b)=>a-b
);






// 去掉最高最低


let start=0;

let end=rs.length;



if(
rs.length>=5
){

start=1;

end=rs.length-1;


}





let r=0;

let g=0;

let b=0;

let n=0;



for(
let i=start;
i<end;
i++
){


r+=rs[i];

g+=gs[i];

b+=bs[i];

n++;


}




output.data[p]=
r/n;



output.data[p+1]=
g/n;



output.data[p+2]=
b/n;



output.data[p+3]=255;



}



return output;


}









// =====================================
// 天文白平衡
// =====================================


function astroWhiteBalance(
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




// 降低手机夜景蓝偏


b*=0.88;



// 恢复银河暖色


r*=1.08;


g*=1.04;




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
// 银河结构增强
// =====================================


function galaxyDetail(
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



if(
light>35 &&
light<170
){



// 云气增强


r +=
(r-128)*0.12;


g +=
(g-128)*0.10;


b +=
(b-128)*0.16;



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
// 暗部降噪
// =====================================


function astroNoise(
data
){


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



if(
light<25
){



d[i]*=0.85;

d[i+1]*=0.88;

d[i+2]*=0.92;



}



}



return data;


}// =====================================
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

};
