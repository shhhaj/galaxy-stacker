const input = document.getElementById("photoInput");

const info = document.getElementById("info");

const preview = document.getElementById("preview");


let photos = [];


input.addEventListener("change", function(){

photos = Array.from(this.files);


info.innerHTML =
"已选择 " + photos.length + " 张照片";


preview.innerHTML="";


photos.forEach(file=>{


let img=document.createElement("img");


img.src = URL.createObjectURL(file);


img.style.width="120px";

img.style.margin="5px";

img.style.borderRadius="10px";


preview.appendChild(img);


});


});
