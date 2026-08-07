// =======================================
// Galaxy Stacker V4.0
// 银河堆栈核心程序
// =======================================


const input =
document.getElementById("photoInput");


const info =
document.getElementById("info");


const preview =
document.getElementById("preview");


const stackBtn =
document.getElementById("stackBtn");


const bar =
document.getElementById("progressBar");


const resultBox =
document.getElementById("result");



let photos=[];




// =======================================
// 图片选择
// =======================================


input.onchange=function(){


    photos=[...this.files];


    info.innerHTML=
    "已选择 "+
    photos.length+
    " 张照片";


    preview.innerHTML="";


    photos.forEach(file=>{


        let img=
        document.createElement("img");


        img.src=
        URL.createObjectURL(file);


        img.style.width="120px";

        img.style.margin="5px";

        img.style.borderRadius="10px";


        preview.appendChild(img);


    });


};





// =======================================
// 图片读取（支持RAW入口）
// =======================================


async function getImage(file){


    if(
    typeof loadRAW==="function"
    ){

        return await loadRAW(file);

    }


}





// =======================================
// 星点检测
// =======================================


function detectStars(data){


    let stars=[];


    let pixels=
    data.data;


    let w=
    data.width;


    let h=
    data.height;



    for(
        let y=5;
        y<h-5;
        y+=3
    ){


        for(
            let x=5;
            x<w-5;
            x+=3
        ){



            let i=
            (y*w+x)*4;



            let light=
            (
            pixels[i]+
            pixels[i+1]+
            pixels[i+2]
            )/3;



            if(light>220){


                stars.push({

                    x:x,

                    y:y,

                    power:light

                });


            }



        }

    }



    stars.sort(
        (a,b)=>
        b.power-a.power
    );


    return stars.slice(0,80);


}




// =======================================
// 星点偏移
// =======================================


function starOffset(a,b){


    if(
    !a.length ||
    !b.length
    ){

        return {
            x:0,
            y:0
        };

    }



    let dx=0;

    let dy=0;


    let count=
    Math.min(
    a.length,
    b.length
    );



    for(
    let i=0;
    i<count;
    i++
    ){


        dx+=
        b[i].x-a[i].x;


        dy+=
        b[i].y-a[i].y;


    }



    return {

        x:dx/count,

        y:dy/count

    };


}






// =======================================
// 降噪
// =======================================


function noiseReduce(data){


    let d=
    data.data;



    for(
    let i=0;
    i<d.length;
    i+=4
    ){


        let l=
        (
        d[i]+
        d[i+1]+
        d[i+2]
        )/3;



        if(l<30){


            d[i]*=.9;

            d[i+1]*=.9;

            d[i+2]*=.95;


        }


    }



    return data;


}





// =======================================
// 去光害
// =======================================


function lightPollution(data){


    let d=data.data;


   
