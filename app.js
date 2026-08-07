const input = document.getElementById("photoInput");
const count = document.getElementById("count");
const preview = document.getElementById("preview");
const btn = document.getElementById("stackBtn");
const info = document.getElementById("info");
const bar = document.getElementById("progressBar");
const result = document.getElementById("result");


let photos = [];



// ==========================
// 导入照片
// ==========================

input.addEventListener("change",function(e){


    photos =
    Array.from(e.target.files);


    count.innerHTML =
    "已选择：" +
    photos.length +
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



    info.innerHTML=
    "照片加载完成";


});






// ==========================
// 图片读取
// ==========================

function readImage(file){


return new Promise(resolve=>{


let img=new Image();


img.onload=function(){

resolve(img);

};


img.src=
URL.createObjectURL(file);



});


}






// ==========================
// 星点检测
// ==========================

function detectStars(imageData){


let stars=[];


let d=imageData.data;


let w=imageData.width;


let h=imageData.height;



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


let i=
(y*w+x)*4;



let light=
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



return stars.slice(0,80);



}







// ==========================
// 星点偏移计算
// ==========================

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



let count=
Math.min(
base.length,
target.length
);




for(
let i=0;
i<count;
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

x:dx/count,

y:dy/count

};



}







// ==========================
// 银河增强
// ==========================

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




if(light>200){


d[i]*=1.08;

d[i+1]*=1.08;

d[i
