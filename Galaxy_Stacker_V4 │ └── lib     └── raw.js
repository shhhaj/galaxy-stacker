// =======================================
// Galaxy Stacker V4.0
// RAW / DNG处理模块
// =======================================


// RAW格式检测

function isRAW(file){

    let name =
    file.name.toLowerCase();


    return (

        name.endsWith(".dng") ||
        name.endsWith(".raw") ||
        name.endsWith(".nef") ||
        name.endsWith(".cr2") ||
        name.endsWith(".arw")

    );

}



// =======================================
// RAW读取入口
// =======================================

async function loadRAW(file){


    if(!isRAW(file)){


        return await normalImage(file);


    }



    console.log(
        "检测RAW:",
        file.name
    );



    /*
    
    这里预留 LibRaw WASM 解码接口

    真正RAW流程:

    RAW
     ↓
    Bayer数据
     ↓
    去马赛克
     ↓
    白平衡
     ↓
    16bit RGB


    */


    return await normalImage(file);


}




// =======================================
// 普通图片读取
// =======================================

function normalImage(file){


    return new Promise(resolve=>{


        let img=
        new Image();



        img.onload=function(){

            resolve(img);

        };



        img.src=
        URL.createObjectURL(file);



    });


}




// =======================================
// 白平衡校正
// =======================================

function whiteBalance(imageData){


    let d=
    imageData.data;



    for(
        let i=0;
        i<d.length;
        i+=4
    ){


        d[i]*=1.04;       // 红

        d[i+1]*=1.00;     // 绿

        d[i+2]*=1.08;     // 蓝



        d[i]=
        Math.min(255,d[i]);

        d[i+1]=
        Math.min(255,d[i+1]);

        d[i+2]=
        Math.min(255,d[i+2]);



    }


    return imageData;


}




// =======================================
// 曝光恢复
// =======================================

function exposureRecover(imageData){


    let d=
    imageData.data;



    for(
        let i=0;
        i<d.length;
        i+=4
    ){


        d[i]=
        Math.min(
            255,
            d[i]*1.08
        );


        d[i+1]=
        Math.min(
            255,
            d[i+1]*1.08
        );


        d[i+2]=
        Math.min(
            255,
            d[i+2]*1.1
        );


    }


    return imageData;

}
