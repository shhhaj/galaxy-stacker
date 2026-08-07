const input=document.getElementById("photoInput");
const info=document.getElementById("info");
const preview=document.getElementById("preview");
const stackBtn=document.getElementById("stackBtn");
const bar=document.getElementById("progressBar");
const result=document.getElementById("result");

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



stackBtn.onclick=async function(){

if(photos.length<2){

alert("至少选择2张照片");
return;

}


info.innerHTML="正在银河平均堆栈...";

bar.style.width="10%";



let imgs=[];


for(let i=0;i<photos.length;i++){

let img=new Image();

img.src=URL.createObjectURL(photos[i]);


await new Promise(resolve=>{

img.onload=resolve;

});


imgs.push(img);


bar.style.width=(10+i/photos.length*50)+"%";

}




let canvas=document.createElement("canvas");

let ctx=canvas.getContext("2d");


canvas.width=imgs[0].width;

canvas.height=imgs[0].height;



ctx.globalAlpha=1/photos.length;


imgs.forEach(img=>{

ctx.drawImage(
img,
0,
0,
canvas.width,
canvas.height
);

});



ctx.globalAlpha=1;



let output=canvas.toDataURL(
"image/jpeg",
0.9
);



let image=document.createElement("img");

image.src=output;

image.style.width="95%";


result.innerHTML="";

result.appendChild(image);



let link=document.createElement("a");

link.href=output;

link.download="galaxy_stack.jpg";

link.innerHTML="下载银河堆栈照片";

link.style.display="block";


result.appendChild(link);



bar.style.width="100%";

info.innerHTML="银河堆栈完成 ✨";


};
