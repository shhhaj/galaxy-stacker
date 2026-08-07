// =======================================
// Galaxy Stacker V4
// RAW / DNG Decoder Connector
// =======================================


let RAW_ENGINE = null;


// 初始化 RAW

async function initRAW(){


    if(RAW_ENGINE){

        return true;

    }



    if(
    typeof LibRaw === "undefined"
    ){

        console.log(
        "LibRaw WASM 未加载，使用普通模式"
        );

        return false;

    }



    try{


        RAW_ENGINE =
        await LibRaw();


        console.log(
        "LibRaw 初始化成功"
        );


        return true;


    }
    catch(e){


        console.log(
        "RAW初始化失败",
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
        name.endsWith(".cr3") ||
        name.endsWith(".arw") ||
        name.endsWith(".raf")

    );


}






// RAW读取入口


async function loadRAW(file){



    // JPG PNG直接读取

    if(!isRAW(file)){


        return await loadNormal(file);


    }




    let ready=
    await initRAW();



    if(!ready){


        alert(
        "RAW解码模块未安装，暂时无法读取DNG"
        );


        return null;

    }




    return await decodeRAW(file);


}







// 普通图片


function loadNormal(file){


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






// RAW解码核心接口


async function decodeRAW(file){



let buffer=
await file.arrayBuffer();



console.log(
"RAW文件:",
file.name
);



/*

真正 LibRaw 流程：

buffer

↓

libraw_open_buffer()

↓

libraw_unpack()

↓

libraw_dcraw_process()

↓

16bit RGB

↓

Canvas Image


*/


// 等待 libraw.wasm 接入


console.log(
"RAW数据大小:",
buffer.byteLength
);



// 当前返回占位

return null;


}
