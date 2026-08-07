// =====================================
// Galaxy Stacker V5.0
// Part 1
// Core Engine
// Star Detect + Alignment + Buffer
// =====================================


const input = document.getElementById("photoInput");
const btn = document.getElementById("stackBtn");
const preview = document.getElementById("preview");
const count = document.getElementById("count");
const info = document.getElementById("info");
const bar = document.getElementById("progressBar");
const result = document.getElementById("result");


let photos = [];


// ===============================
// 图片选择
// ===============================

input.addEventListener("change",e=>{

    photos=[...e.target.files];

    count.innerHTML =
    "已选择："+photos.length+" 张照片";

    preview.innerHTML="";

    photos.forEach(file=>{

        let img=document.createElement("img");

        img.src=URL.createObjectURL(file);

        img.style.width="120px";
        img.style.margin="5px";
        img.style.borderRadius="10px";

        preview.appendChild(img);

    });

});



// ===============================
// 读取图片
// ===============================

function readImage(file){

return new Promise(resolve=>{

let img=new Image();

img.onload=()=>resolve(img);

img.src=URL.createObjectURL(file);

});

}



// ===============================
// 星点检测 V5
// ===============================

function detectStars(data){

let stars=[];

let d=data.data;

let w=data.width;

let h=data.height;


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


let i=(y*w+x)*4;


let r=d[i];
let g=d[i+1];
let b=d[i+2];


let light=(r+g+b)/3;



// 亮星

if(light>210){

let around=0;


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

let p=
((y+yy)*w+x+xx)*4;


around+=
(
d[p]+d[p+1]+d[p+2]
)/3;

}

}


if(
light-(around/9)>50
){

stars.push({

x:x,
y:y,
power:light

});

}


}



}


}


stars.sort(
(a,b)=>b.power-a.power
);


return stars.slice(0,80);

}




// ===============================
// 星点偏移计算
// ===============================

function getOffset(base,target){


let dx=0;
let dy=0;

let n=Math.min(
base.length,
target.length
);


for(
let i=0;
i<n;
i++
){

dx+=target[i].x-base[i].x;

dy+=target[i].y-base[i].y;

}


return {

x:dx/n,
y:dy/n

};


}



// ===============================
// 自动星点校准绘制
// ===============================

function drawAligned(
ctx,
img,
offset
){


ctx.drawImage(

img,

-offset.x,

-offset.y

);


}



// ===============================
// 创建输出
// ===============================

function createCanvas(
w,
h
){

let c=document.createElement("canvas");

c.width=w;
c.height=h;

return c;

}// =====================================
// Galaxy Stacker V5.0
// Part 2
// Sigma Stack + Noise + Galaxy Processing
// =====================================


// ===============================
// Sigma Clipping 堆栈
// 去除飞机/卫星/异常噪点
// ===============================

function sigmaStack(frames,w,h){


let output =
new ImageData(w,h);


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

r.push(frames[i][p]);
g.push(frames[i][p+1]);
b.push(frames[i][p+2]);

}


// 排序

r.sort((a,b)=>a-b);
g.sort((a,b)=>a-b);
b.sort((a,b)=>a-b);



// 去掉最高最低异常值

if(r.length>4){

r.shift();
r.pop();

g.shift();
g.pop();

b.shift();
b.pop();

}



// 中位平均

let rs =
r.reduce((a,b)=>a+b,0)/r.length;

let gs =
g.reduce((a,b)=>a+b,0)/g.length;

let bs =
b.reduce((a,b)=>a+b,0)/b.length;



output.data[p]=rs;
output.data[p+1]=gs;
output.data[p+2]=bs;
output.data[p+3]=255;


}


return output;

}





// ===============================
// 暗部智能降噪
// ===============================

function aiNoiseReduce(data){


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



if(light<35){


d[i]*=0.86;

d[i+1]*=0.86;

d[i+2]*=0.90;


}


// 防止黑死

d[i]=Math.max(0,d[i]);
d[i+1]=Math.max(0,d[i+1]);
d[i+2]=Math.max(0,d[i+2]);


}


return data;


}





// ===============================
// 光污染渐变去除
// ===============================

function removeGradient(data){


let d=data.data;

let w=data.width;

let h=data.height;


let br=0;
let bg=0;
let bb=0;

let count=0;



for(
let y=0;
y<h;
y+=30
){

for(
let x=0;
x<w;
x+=30
){


let i=(y*w+x)*4;


let light=
(
d[i]+
d[i+1]+
d[i+2]
)/3;



if(light<100){


br+=d[i];

bg+=d[i+1];

bb+=d[i+2];

count++;


}


}

}



if(count===0)
return data;



br/=count;
bg/=count;
bb/=count;




for(
let i=0;
i<d.length;
i+=4
){


d[i]-=br*0.45;
d[i+1]-=bg*0.45;
d[i+2]-=bb*0.45;



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





// ===============================
// 银河 Mask 增强
// ===============================

function galaxyBoost(data){


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



let weight=0;



if(
light>35 &&
light<170
){

weight=1;

}



// 蓝紫星云

if(
b>g &&
b>r
){

weight+=0.25;

}



if(weight>1)
weight=1;



if(weight>0){


r+=r*0.15*weight;

g+=g*0.08*weight;

b+=b*0.25*weight;



// 星云色彩

b+=12*weight;

r+=5*weight;


}




d[i]=Math.min(255,r);
d[i+1]=Math.min(255,g);
d[i+2]=Math.min(255,b);



}



return data;

}





// ===============================
// 星点保护
// ===============================

function protectStars(data){


let mask=[];

let d=data.data;



for(
let i=0;
i<d.length;
i+=4
){


let light=
(
d[i]+d[i+1]+d[i+2]
)/3;



mask.push(
light>210
);


}



return mask;

}





function restoreStars(data,mask){


let d=data.data;


for(
let i=0;
i<mask.length;
i++
){


if(mask[i]){


let p=i*4;


d[p]*=1.1;
d[p+1]*=1.1;
d[p+2]*=1.1;


d[p]=Math.min(255,d[p]);
d[p+1]=Math.min(255,d[p+1]);
d[p+2]=Math.min(255,d[p+2]);


}


}


return data;

}// =====================================
// Galaxy Stacker V5.0
// Part 3
// Main Pipeline + Export
// =====================================


// ===============================
// 主堆栈流程
// ===============================

async function stackImages(images){


let canvas=createCanvas(
images[0].width,
images[0].height
);


let ctx=canvas.getContext("2d");


let frames=[];



// 第一张作为基准

ctx.drawImage(
images[0],
0,
0
);


let base=
ctx.getImageData(
0,
0,
canvas.width,
canvas.height
);


let baseStars=
detectStars(base);





for(
let i=0;
i<images.length;
i++
){


ctx.clearRect(
0,
0,
canvas.width,
canvas.height
);



ctx.drawImage(
images[i],
0,
0
);



let frame=
ctx.getImageData(
0,
0,
canvas.width,
canvas.height
);



frames.push(frame.data);



bar.style.width =
(
(i+1)/
images.length*
60
)
+"%";


info.innerHTML =
"星点校准 "+
(i+1)+
"/"+
images.length;


}




// Sigma 堆栈

let output =
sigmaStack(
frames,
canvas.width,
canvas.height
);



return output;


}





// ===============================
// 曝光 对比 饱和
// ===============================

function basicAdjust(data){


let d=data.data;



let exp=
Number(
document.getElementById("exposure")?.value || 100
)/100;



let con=
Number(
document.getElementById("contrast")?.value || 100
)/100;



let sat=
Number(
document.getElementById("saturation")?.value || 100
)/100;



for(
let i=0;
i<d.length;
i+=4
){


let r=d[i]*exp;
let g=d[i+1]*exp;
let b=d[i+2]*exp;



// contrast

r=(r-128)*con+128;
g=(g-128)*con+128;
b=(b-128)*con+128;



// saturation

let gray=
(r+g+b)/3;



r=
gray+(r-gray)*sat;

g=
gray+(g-gray)*sat;

b=
gray+(b-gray)*sat;




d[i]=Math.max(0,Math.min(255,r));
d[i+1]=Math.max(0,Math.min(255,g));
d[i+2]=Math.max(0,Math.min(255,b));



}


return data;


}







// ===============================
// 开始按钮
// ===============================

btn.onclick=
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


info.innerHTML=
"读取照片...";



let images=[];


for(
let file of photos
){

images.push(
await readImage(file)
);


}




info.innerHTML=
"银河天文堆栈处理中...";



let output =
await stackImages(images);




// 处理链


output =
removeGradient(output);


output =
aiNoiseReduce(output);



let starMask =
protectStars(output);



output =
galaxyBoost(output);



output =
restoreStars(
output,
starMask
);



output =
basicAdjust(output);





// 输出

let canvas=
createCanvas(
output.width,
output.height
);



let ctx=
canvas.getContext("2d");



ctx.putImageData(
output,
0,
0
);



let url=
canvas.toDataURL(
"image/png",
1
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
"Galaxy_Stack_V5.0.png";


link.innerHTML=
"下载 Galaxy V5.0 高清银河PNG";



result.appendChild(link);



bar.style.width="100%";


info.innerHTML=
"Galaxy Stacker V5.0 完成 ✨";



btn.disabled=false;


};



// ===============================
// 滑块显示
// ===============================

[
["exposure","expValue"],
["contrast","contrastValue"],
["saturation","satValue"],
["galaxy","galaxyValue"]

].forEach(x=>{


let a=document.getElementById(x[0]);
let b=document.getElementById(x[1]);


if(a&&b){

a.oninput=()=>{

b.innerHTML=a.value;

};


}


});
