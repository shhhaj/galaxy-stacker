// =======================================
// Galaxy Stacker V4
// Android RAW Decoder Interface
// =======================================


let RAW_READY = false;



// 初始化 LibRaw WASM

async function initRAW(){


    if(RAW_READY){

        return true;

    }



    if(
    typeof LibRaw === "undefined"
    ){

        console.error(
        "LibRaw.js 未加载"
        );

        return false;

    }



    try{


        window.rawEngine =
        await LibRaw();



        RAW_READY=true;


        console.log(
        "LibRaw WASM加载成功"
        );


        return true;


    }
    catch(e){


        console.error(
        "LibRaw加载失败",
        e
        );


        return false;

    }


}






// 判断RAW格式


function isRAW(file){


    let name=
    file.name.toLowerCase();



    return (

        name.endsWith(".dng") ||
        name.endsWith(".raw") ||
        name.endsWith(".nef") ||
        name.endsWith(".cr2") ||
        name.endsWith(".arw")

    );


}







// RAW读取入口


async function decodeRAW(file){


    let ready=
    await initRAW();



    if(!ready){


        alert(
        "RAW引擎未加载，请检查libraw文件"
        );


        return null;

    }





    console.log(
    "开始读取RAW:",
    file.name
    );



    let buffer=
    await file.arrayBuffer();




    /*
    
    正式流程:

    buffer
      |
      ↓
    libraw_open_buffer
      |
      ↓
    libraw_unpack
      |
      ↓
    libraw_dcraw_process
      |
      ↓
    RGB数据


    */


    /*
    
    这里返回Canvas图片对象

    后续连接app.js堆栈


    */



    return await convertRAWToImage(
        buffer
    );

}







// RAW转换为网页图片


async function convertRAWToImage(buffer){


    /*
    
    这里调用libraw.wasm

    输出:

    width
    height
    RGB8/RGB16


    */


    console.log(
    "RAW数据长度:",
    buffer.byteLength
    );



    return null;


}






// 普通图片读取


function loadNormalImage(file){


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






// 统一入口


async function loadRAW(file){



    if(
    isRAW(file)
    ){


        let img=
        await decodeRAW(file);


        return img;


    }



    return await loadNormalImage(file);



}
