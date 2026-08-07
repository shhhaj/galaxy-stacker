// =====================================
// Galaxy Stacker V4.4
// Star Alignment + Stack + LP Removal
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





// =====================================
// 图片导入
// =====================================


input.addEventListener(
"change",
function(e){


photos =
Array.from(e.target.files);



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



info.innerHTML =
"照片加载完成";



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


}








// =====================================
// 热噪点去除
// =====================================


function removeHotPixels(data){


let d =
data.data;


let w =
data.width;


let h =// =====================================
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
// Light Pollution Removal
// =====================================


function removeLightPollution(data){



let d=data.data;


let w=data.width;


let h=data.height;



let rSum=0;

let gSum=0;

let bSum=0;


let count=0;



// 采样天空背景


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



let r=d[i];

let g=d[i+1];

let b=d[i+2];



let light=
(r+g+b)/3;



// 排除亮星


if(light<120){


rSum+=r;

gSum+=g;

bSum+=b;


count++;


}



}


}



if(count===0){

return data;

}



let bgR=
rSum/count;


let bgG=
gSum/count;


let bgB=
bSum/count;




// 去除天空色偏


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
(r+g+b)/3;



// 银河尘埃区域


if(
light>35 &&
light<170
){



// 蓝紫色增强


b*=1.12;


r*=1.06;



// 红色星云增强


if(r>g){


r*=1.08;


}



}




// 暗星云细节


if(
light>20 &&
light<80
){


b*=1.05;

r*=1.04;


}





// 保持星点白色


if(light>200){



let avg=
(r+g+b)/3;



r =
r*0.7+
avg*0.3;



g =
g*0.7+
avg*0.3;



b =
b*0.7+
avg*0.3;



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
// 主处理
// 银河堆栈 V4.4
// =====================================


btn.onclick =
async function(){



if(photos.length<2){


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
new Float32Array(
width*height*4
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






// 自动对齐堆栈


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
"自动对齐堆栈 "+
(i+1)+
"/"+
images.length;



}








// 平均合成


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






// V4.4处理链


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


output =
galaxyEnhance(
output
);







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
"Galaxy_Stack_V4.4.png";



link.innerHTML=
"下载银河高清PNG";



result.appendChild(link);






bar.style.width="100%";



info.innerHTML=
"银河堆栈 V4.4 完成 ✨";



btn.disabled=false;



};
