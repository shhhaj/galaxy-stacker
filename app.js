const input=document.getElementById("photoInput");
const info=document.getElementById("info");
const preview=document.getElementById("preview");
const stackBtn=document.getElementById("stackBtn");
const bar=document.getElementById("progressBar");
const resultBox=document.getElementById("result");


let photos=[];
// ==========================
// V1.3 星点检测核心
// ==========================


// 转灰度
function gray(data){

let result=[];

for(let i=0;i<data.length;i+=4){

let v=
data[i]*0.299+
data[i+1]*0.587+
data[i+2]*0.114;


result.push(v);

}

return result;

}



// 寻找亮星
function detectStars(imageData){


let stars=[];

let pixels=
gray(imageData.data);



let w=imageData.width;
let h=imageData.height;



// 跳过边缘

for(let y=5;y<h-5;y+=2){

for(let x=5;x<w-5;x+=2){


let index=
y*w+x;


let value=
pixels[index];


// 银河照片星点阈值

if(value>220){



let max=true;


for(let dy=-2;dy<=2;dy++){

for(let dx=-2;dx<=2;dx++){


if(
pixels[(y+dy)*w+x+dx]
>
value
){

max=false;

}

}

}



if(max){

stars.push({

x:x,
y:y,
brightness:value

});


}


}


}

}



// 保留最亮100颗星

stars.sort(
(a,b)=>
b.brightness-a.brightness
);


return stars.slice(0,100);


}





// 计算两张图片偏移

function calculateOffset(
base,
target
){


let dx=0;
let dy=0;


let count=0;


for(let i=0;i<
Math.min(base.length,target.length);
i++){


dx+=
target[i].x-base[i].x;


dy+=
target[i].y-base[i].y;


count++;

}



if(count===0){

return {
x:0,
y:0
};

}


return{

x:dx/count,
y:dy/count

};


}

input.onchange=function(){

photos=[...this.files];

info.innerHTML=
"已选择 "+photos.length+" 张照片";


preview.innerHTML="";


photos.forEach(file=>{

let img=document.createElement("img");

img.src=URL.createObjectURL(file);

img.style.width="120px";
img.style.margin="5px";
img.style.borderRadius="10px";

preview.appendChild(img);

});


};



function readImage(file){

return new Promise(resolve=>{

let img=new Image();

img.onload=function(){

resolve(img);

};

img.src=URL.createObjectURL(file);


});


}
// ==========================
// V1.3 自动对齐银河堆栈
// ==========================


stackBtn.onclick=async function(){


if(photos.length<2){

alert("请至少选择2张照片");

return;

}


stackBtn.disabled=true;


info.innerHTML=
"正在检测星点...";



let images=[];


// 读取所有照片

for(let i=0;i<photos.length;i++){


let img=
await readImage(photos[i]);


images.push(img);


bar.style.width=
(i/photos.length*20)+"%";


}




// 基准照片

let baseCanvas=
document.createElement("canvas");


baseCanvas.width=
images[0].width;


baseCanvas.height=
images[0].height;



let baseCtx=
baseCanvas.getContext("2d");


baseCtx.drawImage(
images[0],
0,
0
);



let baseData=
baseCtx.getImageData(
0,
0,
baseCanvas.width,
baseCanvas.height
);



let baseStars=
detectStars(baseData);




info.innerHTML=
"星点匹配中...";



// 创建输出

let canvas=
document.createElement("canvas");


canvas.width=
baseCanvas.width;


canvas.height=
baseCanvas.height;


let ctx=
canvas.getContext("2d");



ctx.globalAlpha=
1/photos.length;



// 第一张

ctx.drawImage(
images[0],
0,
0
);




// 后续照片

for(let i=1;i<images.length;i++){



let temp=
document.createElement("canvas");


temp.width=
canvas.width;


temp.height=
canvas.height;



let tctx=
temp.getContext("2d");



tctx.drawImage(
images[i],
0,
0
);



let data=
tctx.getImageData(
0,
0,
temp.width,
temp.height
);



let stars=
detectStars(data);



let offset=
calculateOffset(
baseStars,
stars
);



info.innerHTML=
"正在对齐第 "+
(i+1)+
"/"+
images.length+
" 张";



// 平移校正

ctx.drawImage(
images[i],
-offset.x,
-offset.y
);



bar.style.width=
(
20+
i/images.length*60
)
+"%";



}



ctx.globalAlpha=1;



info.innerHTML=
"正在生成高清结果...";




// 输出 PNG

let png=
canvas.toDataURL(
"image/png"
);



let output=
document.createElement("img");


output.src=png;

output.style.width="95%";



resultBox.innerHTML="";

resultBox.appendChild(output);




let link=
document.createElement("a");


link.href=png;


link.download=
"Galaxy_Stack_V1.3.png";


link.innerHTML=
"下载无损银河照片";


link.style.display=
"block";


resultBox.appendChild(link);



bar.style.width="100%";


info.innerHTML=
"银河自动对齐完成 ✨";


stackBtn.disabled=false;


};


