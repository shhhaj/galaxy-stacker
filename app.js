const input = document.getElementById("photoInput");
const info = document.getElementById("info");
const preview = document.getElementById("preview");
const stackBtn = document.getElementById("stackBtn");


let photos = [];


input.addEventListener("change", function(){

photos = Array.from(this.files);


info.innerHTML =
"已选择 " + photos.length + " 张照片";


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



// 银河堆栈

stackBtn.onclick=async function(){

stackBtn.disabled=true;

stackBtn.innerHTML="处理中...";


if(photos.length<2){

alert("请至少选择2张照片");

return;

}


info.innerHTML="正在银河堆栈处理中...";


let canvas=document.createElement("canvas");

let ctx=canvas.getContext("2d");


let img=new Image();


img.onload=function(){


canvas.width=img.width;
canvas.height=img.height;


// 第一张作为基础

ctx.drawImage(img,0,0);


// 混合模式

ctx.globalAlpha=0.35;


let count=1;


photos.slice(1).forEach(file=>{


let layer=new Image();


layer.onload=function(){


ctx.drawImage(layer,0,0);


count++;


if(count===photos.length){


ctx.globalAlpha=1;


let result=
canvas.toDataURL("image/jpeg",0.95);



let link=document.createElement("a");


link.href=result;

link.download="galaxy_stack.jpg";


link.innerHTML="下载银河堆栈结果";


document.body.appendChild(link);
link.style.display="block";
link.style.margin="20px auto";
link.style.padding="15px";
link.style.background="#2980ff";
link.style.color="white";
link.style.borderRadius="12px";
link.style.textAlign="center";
link.style.textDecoration="none";

info.innerHTML="银河堆栈完成 ✨";


}


};


layer.src=URL.createObjectURL(file);



});


};


img.src=
URL.createObjectURL(photos[0]);


};
