const input = document.getElementById("photoInput");
const info = document.getElementById("info");
const preview = document.getElementById("preview");
const stackBtn = document.getElementById("stackBtn");
const bar = document.getElementById("progressBar");
const resultBox = document.getElementById("result");


let photos = [];


// ==========================
// 图片选择
// ==========================

input.onchange = function(){

    photos = [...this.files];

    info.innerHTML =
    "已选择 " + photos.length + " 张照片";


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



// ==========================
// 图片读取
// ==========================

function readImage(file){

    return new Promise(resolve=>{


        let img=new Image();


        img.onload=function(){

            resolve(img);

        };


        img.src=
        URL.createObjectURL(file);



    });


}



// ==========================
// 灰度转换
// ==========================

function toGray(data){


    let gray=[];


    for(
        let i=0;
        i<data.length;
        i+=4
    ){


        gray.push(

            data[i]*0.299+
            data[i+1]*0.587+
            data[i+2]*0.114

        );


    }


    return gray;

}




// ==========================
// 星点检测
// ==========================

function detectStars(imageData){


    let stars=[];


    let pixels=
    toGray(imageData.data);



    let width=
    imageData.width;


    let height=
    imageData.height;



    for(
        let y=5;
        y<height-5;
        y+=3
    ){


        for(
            let x=5;
            x<width-5;
            x+=3
        ){



            let index=
            y*width+x;


            let value=
            pixels[index];



            // 星点亮度阈值

            if(value>220){


                let isMax=true;



                for(
                    let dy=-2;
                    dy<=2;
                    dy++
                ){


                    for(
                        let dx=-2;
                        dx<=2;
                        dx++
                    ){


                        if(
                        pixels[
                        (y+dy)*width+x+dx
                        ]>value
                        ){

                            isMax=false;

                        }


                    }


                }



                if(isMax){


                    stars.push({

                        x:x,
                        y:y,
                        brightness:value

                    });


                }



            }



        }


    }



    stars.sort(
        (a,b)=>
        b.brightness-a.brightness
    );


    return stars.slice(0,80);


}// ==========================
// 星点偏移计算
// ==========================

function calculateOffset(
    baseStars,
    targetStars
){

    let dx=0;
    let dy=0;

    let count=
    Math.min(
        baseStars.length,
        targetStars.length
    );


    if(count===0){

        return {
            x:0,
            y:0
        };

    }



    for(
        let i=0;
        i<count;
        i++
    ){

        dx +=
        targetStars[i].x -
        baseStars[i].x;


        dy +=
        targetStars[i].y -
        baseStars[i].y;


    }



    return {

        x:dx/count,
        y:dy/count

    };

}




// ==========================
// 原像素平均堆栈
// ==========================

async function averageStack(
    images,
    width,
    height
){


    let total=
    new Float64Array(
        width*
        height*
        4
    );



    let tempCanvas=
    document.createElement("canvas");


    tempCanvas.width=width;
    tempCanvas.height=height;


    let tempCtx=
    tempCanvas.getContext("2d");




    // 第一张作为基准

    tempCtx.drawImage(
        images[0],
        0,
        0
    );


    let baseData=
    tempCtx.getImageData(
        0,
        0,
        width,
        height
    );


    let baseStars=
    detectStars(
        baseData
    );





    for(
        let i=0;
        i<images.length;
        i++
    ){



        tempCtx.clearRect(
            0,
            0,
            width,
            height
        );



        tempCtx.drawImage(
            images[i],
            0,
            0
        );



        let currentData=
        tempCtx.getImageData(
            0,
            0,
            width,
            height
        );



        let stars=
        detectStars(
            currentData
        );



        let offset=
        calculateOffset(
            baseStars,
            stars
        );



        tempCtx.clearRect(
            0,
            0,
            width,
            height
        );



        // 星点校正

        tempCtx.drawImage(
            images[i],
            -offset.x,
            -offset.y
        );



        let pixels=
        tempCtx.getImageData(
            0,
            0,
            width,
            height
        ).data;



        for(
            let p=0;
            p<pixels.length;
            p++
        ){

            total[p]+=pixels[p];

        }



        bar.style.width =
        (
        20+
        (i+1)/
        images.length*
        60
        )
        +"%";



        info.innerHTML=
        "正在平均堆栈 "+
        (i+1)+
        "/"+
        images.length;



    }




    let output=
    new ImageData(
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



    return output;


}// ==========================
// 银河增强算法
// ==========================

function galaxyEnhance(imageData){


    let data=imageData.data;


    for(
        let i=0;
        i<data.length;
        i+=4
    ){


        let r=data[i];
        let g=data[i+1];
        let b=data[i+2];



        let light=
        (r+g+b)/3;



        // 压暗天空背景

        if(light<40){

            r*=0.9;
            g*=0.9;
            b*=0.95;

        }



        // 银河区域增强

        if(
        light>50 &&
        light<180
        ){

            r*=1.15;
            g*=1.10;
            b*=1.18;

        }



        // 星点增强

        if(light>200){

            r*=1.12;
            g*=1.12;
            b*=1.18;

        }



        data[i]=
        Math.min(255,r);

        data[i+1]=
        Math.min(255,g);

        data[i+2]=
        Math.min(255,b);



    }



    return imageData;

}





// ==========================
// 主处理按钮
// ==========================

stackBtn.onclick=async function(){



    if(photos.length<2){

        alert(
        "请至少选择2张照片"
        );

        return;

    }



    stackBtn.disabled=true;


    info.innerHTML=
    "正在读取照片...";



    let images=[];



    for(
        let i=0;
        i<photos.length;
        i++
    ){

        let img=
        await readImage(
            photos[i]
        );


        images.push(img);

    }




    let width=
    images[0].width;


    let height=
    images[0].height;



    info.innerHTML=
    "正在星点对齐和平均堆栈...";



    let resultData=
    await averageStack(
        images,
        width,
        height
    );




    // 银河增强

    resultData=
    galaxyEnhance(
        resultData
    );





    let canvas=
    document.createElement("canvas");


    canvas.width=width;
    canvas.height=height;



    let ctx=
    canvas.getContext("2d");



    ctx.putImageData(
        resultData,
        0,
        0
    );




    info.innerHTML=
    "正在生成高清图片...";




    let png=
    canvas.toDataURL(
        "image/png"
    );




    let img=
    document.createElement("img");


    img.src=png;


    img.style.width="95%";



    resultBox.innerHTML="";


    resultBox.appendChild(
        img
    );




    let link=
    document.createElement("a");



    link.href=png;


    link.download=
    "Galaxy_Stack_Pro_V1.4.png";



    link.innerHTML=
    "下载无损银河照片";



    link.style.display=
    "block";


    link.style.margin=
    "20px auto";



    resultBox.appendChild(
        link
    );




    bar.style.width=
    "100%";



    info.innerHTML=
    "银河堆栈完成 ✨";



    stackBtn.disabled=false;



};
