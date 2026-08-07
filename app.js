const input=document.getElementById("photoInput");
const info=document.getElementById("info");
const preview=document.getElementById("preview");
const stackBtn=document.getElementById("stackBtn");
const bar=document.getElementById("progressBar");
const resultBox=document.getElementById("result");

let photos=[];


input.onchange=function(){

photos=[...this.files];

info.innerHTML="已选择 "+photos.length+" 张照片";

preview.innerHTML="";

photos.forEach(file=>{

let img=document.createElement("img");

img.src=URL.createObjectURL(file);

img.style.width="120px";
img.style.margin="5px";

preview.appendChild(img);

});

};



function loadImage(file){

return new Promise(resolve=>{

let img=new Image();

img.onload=()=>resolve(img);

img.src=URL.createObjectURL(file);

});

}



stackBtn.onclick=async()=>{


if(photos.length<2){

alert("至少选择2张照片");

return;

}


stackBtn.disabled=true;

info.innerHTML="正在平均堆栈...";


let images=[];


for(let i=0;i<photos.length;i++){

let img=await loadImage(photos[i]);

images.push(img);

bar.style.width=((i+1)/photos.length*50)+"%";

}



let max=2000;


let w=images[0].width;
let h=images[0].height;


if(w>max){

let scale=max/w;

w*=scale;
h*=scale;

}



let canvas=document.createElement("canvas");

canvas.width=w;
canvas.height=h;


let ctx=canvas.getContext("2d");


ctx.globalAlpha=1/photos.length;



for(let i=0;i<images.length;i++){


ctx.drawImage(
images[i],
0,
0,
w,
h
);


bar.style.width=
(50+i/photos.length*50)+"%";


}



ctx.globalAlpha=1;



let result=canvas.toDataURL(
"image/jpeg",
0.95
);



let img=document.createElement("img");

img.src=result;

img.style.width="95%";


resultBox.innerHTML="";

resultBox.appendChild(img);



let link=document.createElement("a");

link.href=result;

link.download="Galaxy_Stack.jpg";

link.innerHTML="下载银河堆栈照片";

document.body.appendChild(link);



info.innerHTML="完成 ✨";

bar.style.width="100%";


stackBtn.disabled=false;


};
