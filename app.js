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

input.onchange = function(){rawSupport(photos);

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
resultData =
removeNoise(
resultData
);


resultData =
colorBalance(
resultData
);


resultData =
protectGalaxyCore(
resultData
);


resultData =
galaxyEnhance(
resultData
);


resultData =
starSharpen(
resultData
);
let skyMask =
detectSky(
resultData
);


resultData =
darkSky(
resultData,
skyMask
);


resultData =
enhanceMilkyWay(
resultData,
skyMask
);    

resultData =
astroHDR(
resultData
);


resultData =
cinematicColor(
resultData
);
resultData =
microContrast(
resultData
);


resultData =
blackPoint(
resultData
);


resultData =
colorRecover(
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



// ==========================
// V2.0 输出前精修
// ==========================


// 局部对比增强

function microContrast(imageData){

let data=imageData.data;


for(let i=0;i<data.length;i+=4){


let r=data[i];
let g=data[i+1];
let b=data[i+2];


let avg=
(r+g+b)/3;



let factor=1.15;



data[i]=
avg+(r-avg)*factor;


data[i+1]=
avg+(g-avg)*factor;


data[i+2]=
avg+(b-avg)*factor;



data[i]=Math.min(255,data[i]);
data[i+1]=Math.min(255,data[i+1]);
data[i+2]=Math.min(255,data[i+2]);


}


return imageData;

}




// 黑位优化

function blackPoint(imageData){

let data=imageData.data;


for(let i=0;i<data.length;i+=4){


if(
data[i]<15 &&
data[i+1]<15 &&
data[i+2]<15
){

data[i]=5;
data[i+1]=5;
data[i+2]=8;

}


}


return imageData;

}





// 色彩细节恢复

function colorRecover(imageData){

let data=imageData.data;


for(let i=0;i<data.length;i+=4){


let r=data[i];
let g=data[i+1];
let b=data[i+2];



// 星云蓝紫增强

data[i]=
Math.min(255,r*1.04);


data[i+1]=
Math.min(255,g*1.02);


data[i+2]=
Math.min(255,b*1.08);



}


return imageData;

}
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
// ==========================
// V1.5 天文降噪
// ==========================


function removeNoise(imageData){

let data=imageData.data;

for(let y=1;y<imageData.height-1;y++){

for(let x=1;x<imageData.width-1;x++){


let i=(y*imageData.width+x)*4;


let r=data[i];
let g=data[i+1];
let b=data[i+2];


// 简单热像素检测

if(
r>245 &&
g>245 &&
b>245
){

let sumR=0;
let sumG=0;
let sumB=0;


let count=0;


for(let dy=-1;dy<=1;dy++){

for(let dx=-1;dx<=1;dx++){


let p=
((y+dy)*imageData.width+x+dx)*4;


sumR+=data[p];
sumG+=data[p+1];
sumB+=data[p+2];

count++;

}

}


data[i]=sumR/count;
data[i+1]=sumG/count;
data[i+2]=sumB/count;


}


}

}


return imageData;

}



// ==========================
// 色彩校准
// ==========================

function colorBalance(imageData){

let data=imageData.data;


for(let i=0;i<data.length;i+=4){


data[i]*=1.05;      // 红色增强银河暖色

data[i+1]*=1.00;

data[i+2]*=1.08;    // 蓝色增强星空



data[i]=Math.min(255,data[i]);
data[i+1]=Math.min(255,data[i+1]);
data[i+2]=Math.min(255,data[i+2]);


}


return imageData;

}// ==========================
// V1.5 银河核心保护
// ==========================

function protectGalaxyCore(imageData){

let data=imageData.data;


for(let i=0;i<data.length;i+=4){


let r=data[i];
let g=data[i+1];
let b=data[i+2];


let light=
(r+g+b)/3;



// 银河核心高光保护

if(light>180){

let factor=0.85;


data[i]=r*factor;
data[i+1]=g*factor;
data[i+2]=b*factor;


}



// 暗星提升

if(light>25 && light<80){


data[i]=r*1.08;
data[i+1]=g*1.08;
data[i+2]=b*1.12;


}



}


return imageData;

}




// ==========================
// 星空锐化
// ==========================

function starSharpen(imageData){

let data=imageData.data;


for(let i=0;i<data.length;i+=4){


let r=data[i];
let g=data[i+1];
let b=data[i+2];


let light=
(r+g+b)/3;



if(light>170){

data[i]=Math.min(255,r*1.15);

data[i+1]=Math.min(255,g*1.15);

data[i+2]=Math.min(255,b*1.15);


}


}


return imageData;

}
// ==========================
// V1.6 天空检测
// ==========================

function detectSky(imageData){

let data=imageData.data;

let mask=new Uint8Array(
imageData.width*
imageData.height
);


for(
let y=0;
y<imageData.height;
y++
){

for(
let x=0;
x<imageData.width;
x++
){

let i=
(y*imageData.width+x)*4;


let r=data[i];
let g=data[i+1];
let b=data[i+2];


// 蓝色天空判断

if(
b>r*1.05 &&
b>g*0.95
){

mask[
y*imageData.width+x
]=1;

}


}

}


return mask;

}



// ==========================
// 银河区域增强
// ==========================

function enhanceMilkyWay(
imageData,
mask
){

let data=imageData.data;


for(
let i=0;
i<mask.length;
i++
){


if(mask[i]){


let p=i*4;


data[p]*=1.18;

data[p+1]*=1.12;

data[p+2]*=1.25;



data[p]=
Math.min(255,data[p]);

data[p+1]=
Math.min(255,data[p+1]);

data[p+2]=
Math.min(255,data[p+2]);


}



}


return imageData;

}



// ==========================
// 背景压暗
// ==========================

function darkSky(
imageData,
mask
){

let data=imageData.data;


for(
let i=0;
i<mask.length;
i++
){


if(mask[i]){


let p=i*4;


let l=
(
data[p]+
data[p+1]+
data[p+2]
)/3;



if(l<60){


data[p]*=0.88;
data[p+1]*=0.88;
data[p+2]*=0.92;


}



}


}


return imageData;

}
// ==========================
// V1.7 天文HDR
// ==========================

function astroHDR(imageData){

let data=imageData.data;


for(let i=0;i<data.length;i+=4){


let r=data[i];
let g=data[i+1];
let b=data[i+2];


let l=
(r+g+b)/3;



// 暗部提升

if(l<80){

r*=1.12;
g*=1.12;
b*=1.15;

}



// 中间调增强

if(l>=80 && l<180){

r*=1.08;
g*=1.06;
b*=1.12;

}



// 高光压制

if(l>210){

r*=0.92;
g*=0.92;
b*=0.95;

}



data[i]=Math.min(255,r);
data[i+1]=Math.min(255,g);
data[i+2]=Math.min(255,b);



}


return imageData;

}




// ==========================
// V1.7 电影色彩
// ==========================

function cinematicColor(imageData){

let data=imageData.data;
    // ==========================
// V1.8 RAW/DNG检测
// ==========================

function checkRAW(file){

let name=file.name.toLowerCase();


return (
name.endsWith(".dng") ||
name.endsWith(".raw") ||
name.endsWith(".nef") ||
name.endsWith(".cr2")
);

}



// ==========================
// RAW提示
// ==========================

function rawSupport(files){

let rawCount=0;


files.forEach(file=>{

if(checkRAW(file)){

rawCount++;

}

});


if(rawCount>0){

info.innerHTML=
"检测到 RAW 文件，准备高质量处理...";
// ==========================
// 16bit高精度缓存
// ==========================

function create16BitBuffer(width,height){

return new Uint32Array(
width*
height*
3
);

}



function normalize16Bit(buffer){


let max=65535;


for(let i=0;i<buffer.length;i++){


if(buffer[i]>max){

buffer[i]=max;

}


}


return buffer;

}
}


}
    // ==========================
// V1.9 智能降噪
// ==========================

function aiNoiseReduction(imageData){

let data=imageData.data;

let w=imageData.width;
let h=imageData.height;


let copy=new Uint8ClampedArray(data);



for(let y=1;y<h-1;y++){

for(let x=1;x<w-1;x++){


let i=(y*w+x)*4;


let r=0;
let g=0;
let b=0;


for(let dy=-1;dy<=1;dy++){

for(let dx=-1;dx<=1;dx++){


let p=
((y+dy)*w+x+dx)*4;


r+=copy[p];
g+=copy[p+1];
b+=copy[p+2];


}

}


r/=9;
g/=9;
b/=9;



// 保留星点

let brightness=
(
copy[i]+
copy[i+1]+
copy[i+2]
)/3;



if(brightness<60){


data[i]=
data[i]*0.7+r*0.3;


data[i+1]=
data[i+1]*0.7+g*0.3;


data[i+2]=
data[i+2]*0.7+b*0.3;


}



}


}


return imageData;

}




// ==========================
// 银河细节恢复
// ==========================

function galaxyDetail(imageData){

let data=imageData.data;


for(let i=0;i<data.length;i+=4){


let r=data[i];
let g=data[i+1];
let b=data[i+2];


let l=
(r+g+b)/3;



if(l>40 && l<160){


data[i]=
Math.min(255,r*1.12);


data[i+1]=
Math.min(255,g*1.10);


data[i+2]=
Math.min(255,b*1.15);


}



}


return imageData;

}
