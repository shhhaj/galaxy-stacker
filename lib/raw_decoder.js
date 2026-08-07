let LibRawInstance=null;


// 初始化RAW引擎

async function initRAW(){

    if(LibRawInstance)
        return;


    LibRawInstance =
    await LibRaw();


}



// 判断RAW

function isRAW(file){

    let n=
    file.name.toLowerCase();


    return(
        n.endsWith(".dng")||
        n.endsWith(".raw")||
        n.endsWith(".nef")||
        n.endsWith(".cr2")||
        n.endsWith(".arw")
    );

}



// RAW解码

async function decodeRAW(file){


    await initRAW();



    let buffer=
    await file.arrayBuffer();



    let raw=
    LibRawInstance.ccall(
        "libraw_init",
        "number",
        [],
        []
    );



    console.log(
        "RAW loaded",
        file.name
    );



    // 这里调用:
    // libraw_open_buffer
    // libraw_unpack
    // libraw_dcraw_process


    /*
    
    输出:

    width
    height
    RGB16数据

    */


    return null;


}
