const input=document.getElementById("photoInput");
const count=document.getElementById("count");
const preview=document.getElementById("preview");
const btn=document.getElementById("stackBtn");
const info=document.getElementById("info");
const bar=document.getElementById("progressBar");
const result=document.getElementById("result");

let photos=[];


// 选择照片

input.onchange=function(){

photos=[...this.files];

count.innerHTML=
"已选择："+photos.length+" 张照片";


preview.innerHTML="";


photos.forEach(file=>{

let img=document.createElement("img");

img.src=
URL.createObjectURL(file);

img.style.width="120px";
img.style.margin="5px";
img.style.borderRadius="10px";

preview.appendChild(img);

});


};




// 普通图片读取

function readImage(file){

return new Promise(resolve=>{

let img=new Image();

img.onload=()=>resolve(img);

img.src=
URL.createObjectURL(file);

});

}




// 银河增强

function galaxyEnhance(data){

let d=data.data;


for(let i=0;i<d.length;i+=4){


let r=d[i];
let g=d[i+1];
let b=d[i+2];


let light=
(r+g+b)/3;


// 暗部降噪

if(light<40){

r*=0.9;
g*=0.9;
b*=0.95;

}


// 银河增强

if(
light>50 &&
light<180
){

r*=1.15;
g*=1.08;
b*=1.2;

}


// 星点增强

if(light>210){

r*=1.1;
g*=1.1;
b*=1.15;

}


d[i]=Math.min(255,r);
d[i+1]=Math.min(255,g);
d[i+2]=Math.min(255,b);


}


return data;

}




// 降噪

function noiseReduce(data){

let d=data.data;


for(let i=0;i<d.length;i+=4){

let l=
(d[i]+d[i+1]+d[i+2])/3;


if(l<35){

d[i]*=.9;
d[i+1]*=.9;
d[i+2]*=.92;

}

}


return data;

}






// 开始堆栈


btn.onclick=async function(){


if(photos.length<2){

alert("至少选择2张照片");

return;

}



btn.disabled=true;


info.innerHTML=
"正在读取照片...";


let images=[];


for(let i=0;i<photos.length;i++){


let img;


if(
typeof loadRAW==="function"
){

img=
await loadRAW(photos[i]);

}
else{

img=
await readImage(photos[i]);

}



images.push(img);


}



let w=images[0].width;

let h=images[0].height;



let canvas=
document.createElement("canvas");


canvas.width=w;
canvas.height=h;



let ctx=
canvas.getContext("2d");



let total=
new Float64Array(
w*h*4
);




// 平均堆栈


for(let i=0;i<images.length;i++){


ctx.clearRect(
0,
0,
w,
h
);



ctx.drawImage(
images[i],
0,
0
);



let pixels=
ctx.getImageData(
0,
0,
w,
h
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
20+
(i+1)/images.length*60
)
+"%";



info.innerHTML=
"正在堆栈 "+
(i+1)+
"/"+
images.length;


}
