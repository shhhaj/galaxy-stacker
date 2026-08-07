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

input.addEventListener("change", function(e){


    photos = Array.from(e.target.files);


    count.innerHTML =
    "已选择：" + photos.length + " 张照片";


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


    console.log(
        "导入照片:",
        photos
    );


    info.innerHTML =
    "照片已加载";


});




// ==========================
// 读取图片
// ==========================

function readImage(file){

    return new Promise(resolve=>{


        let img =
        new Image();


        img.onload=function(){

            resolve(img);

        };


        img.src =
        URL.createObjectURL(file);


    });

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


        let light =
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
            d[i+2]*=1.12;

        }



        d[i]=Math.min(255,d[i]);
        d[i+1]=Math.min(255,d[i+1]);
        d[i+2]=Math.min(255,d[i+2]);


    }


    return data;

}




// ==========================
// 银河堆栈
// ==========================


btn.onclick = async function(){


    if(photos.length<2){


        alert(
        "请至少选择2张照片"
        );


        return;

    }



    btn.disabled=true;


    info.innerHTML=
    "正在处理...";



    let images=[];



    for(
    let i=0;
    i<photos.length;
    i++
    ){


        let img =
        await readImage(
            photos[i]
        );


        images.push(img);


    }



    let width =
    images[0].width;


    let height =
    images[0].height;



    let canvas =
    document.createElement("canvas");


    canvas.width=width;

    canvas.height=height;



    let ctx =
    canvas.getContext("2d");



    let total =
    new Float32Array(
        width*height*4
    );




    for(
    let i=0;
    i<images.length;
    i++
    ){


        ctx.clearRect(
        0,
        0,
        width,
        height
        );


        ctx.drawImage(
        images[i],
        0,
        0
        );


        let data =
        ctx.getImageData(
        0,
        0,
        width,
        height
        ).data;



        for(
        let p=0;
        p<data.length;
        p++
        ){

            total[p]+=data[p];

        }



        bar.style.width =
        (
        (i+1) /
        images.length *
        80
        )
        +"%";



    }




    let output =
    ctx.createImageData(
        width,
        height
    );



    for(
    let i=0;
    i<total.length;
    i++
    ){

        output.data[i]=
        total[i]/
        images.length;


    }



    output =
    galaxyEnhance(
        output
    );



    ctx.putImageData(
        output,
        0,
        0
    );



    let url =
    canvas.toDataURL(
        "image/png"
    );



    result.innerHTML="";



    let img =
    document.createElement("img");


    img.src=url;

    img.style.width="95%";


    result.appendChild(img);



    let link =
    document.createElement("a");


    link.href=url;

    link.download=
    "Galaxy_Stack.png";


    link.innerHTML=
    "下载银河照片";


    result.appendChild(link);



    bar.style.width="100%";


    info.innerHTML=
    "银河堆栈完成 ✨";


    btn.disabled=false;


};
