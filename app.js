const input=document.getElementById("photoInput");
const info=document.getElementById("info");
const preview=document.getElementById("preview");
const stackBtn=document.getElementById("stackBtn");
const bar=document.getElementById("progressBar");
const resultBox=document.getElementById("result");


let photos=[];


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



stackBtn.onclick=async function(){


if(photos.length<2){

alert("请至少选择2张照片");

return;

}


stackBtn.disabled=true;

info.innerHTML=
"正在原像素银河堆栈...";


let first=
await readImage(photos[0]);


let width=first.width;
let height=first.height;



let canvas=
document.createElement("canvas");


canvas.width=width;
canvas.height=height;



let ctx=
canvas.getContext("2d");



let imageData=
ctx.createImageData(
width,
height
);



let pixels=
new Float64Array(
width*height*4
);



for(let i=0;i<photos.length;i++){


let img;


if(i===0){

img=first;

}else{

img=
await readImage(
photos[i]
);

}



ctx.clearRect(
0,
0,
width,
height
);



ctx.drawImage(
img,
0,
0
);



let data=
ctx.getImageData(
0,
0,
width,
height
).data;



for(let p=0;p<data.length;p++){

pixels[p]+=data[p];

}



bar.style.width=
((i+1)/
photos.length*
80)+"%";

info.innerHTML=
"正在处理第 "+
(i+1)+"/"+
photos.length+
" 张";


}



for(let i=0;i<pixels.length;i++){

imageData.data[i]=
pixels[i]/photos.length;

}



ctx.putImageData(
imageData,
0,
0
);



let result=
canvas.toDataURL(
"image/jpeg",
0.98
);



let output=
document.createElement("img");

output.src=result;

output.style.width="95%";



resultBox.innerHTML="";

resultBox.appendChild(output);



let link=
document.createElement("a");


link.href=result;

link.download=
"Galaxy_Stack_Original.jpg";


link.innerHTML=
"下载原像素银河照片";


document.body.appendChild(link);


link.style.display="block";
link.style.margin="20px auto";


info.innerHTML=
"银河堆栈完成 ✨";


bar.style.width="100%";


stackBtn.disabled=false;


};
