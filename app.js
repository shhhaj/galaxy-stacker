const fileInput = document.getElementById("fileInput");
const count = document.getElementById("count");
const runBtn = document.getElementById("runBtn");

let images = [];

fileInput.addEventListener("change", async function () {
    images = [];

    for (let file of this.files) {
        const img = new Image();
        img.src = URL.createObjectURL(file);

        await new Promise(resolve => {
            img.onload = resolve;
        });

        images.push(img);
    }

    count.innerHTML = "已导入：" + images.length + " 张照片";
});


runBtn.onclick = async function(){

    if(images.length < 2){
        alert("请至少选择2张照片");
        return;
    }

    runBtn.innerHTML="正在银河堆栈，请等待...";


    let canvas=document.createElement("canvas");
    let ctx=canvas.getContext("2d");


    canvas.width=images[0].width;
    canvas.height=images[0].height;


    let data=new Float32Array(
        canvas.width*canvas.height*4
    );


    for(let img of images){

        ctx.drawImage(
            img,
            0,
            0,
            canvas.width,
            canvas.height
        );


        let pixels=ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        ).data;


        for(let i=0;i<pixels.length;i++){
            data[i]+=pixels[i];
        }
    }


    let result=ctx.createImageData(
        canvas.width,
        canvas.height
    );


    for(let i=0;i<data.length;i++){

        result.data[i]=
        Math.min(
            255,
            data[i]/images.length*1.15
        );
    }


    ctx.putImageData(result,0,0);


    let link=document.createElement("a");
    link.download="银河堆栈大师.jpg";
    link.href=canvas.toDataURL(
        "image/jpeg",
        0.95
    );

    link.click();


    runBtn.innerHTML="一键银河完成";
};
