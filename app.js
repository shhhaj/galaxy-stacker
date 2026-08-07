const input = document.getElementById("photoInput");
const info = document.getElementById("info");
const preview = document.getElementById("preview");
const stackBtn = document.getElementById("stackBtn");

const bar = document.getElementById("progressBar");
const resultBox = document.getElementById("result");

let photos = [];


// 选择照片

input.addEventListener("change", function(){

    photos = Array.from(this.files);

    info.innerHTML =
    "已选择 " + photos.length + " 张照片";

    preview.innerHTML="";

    photos.forEach(file=>{

        let img=document.createElement("img");

        img.src=URL.createObjectURL(file);

        img.style.width="120px";
        img.style.margin="5px";
        img.style.borderRadius="10px";

        preview.appendChild(img);

    });

});



// 平均堆栈

stackBtn.onclick=function(){

    if(photos.length<2){

        alert("请至少选择2张照片");

        return;

    }


    stackBtn.disabled=true;

    stackBtn.innerHTML="平均堆栈处理中...";


    info.innerHTML="正在计算像素平均...";

    resultBox.innerHTML="";

    bar.style.width="5%";



    let canvas=document.createElement("canvas");

    let ctx=canvas.getContext("2d");



    let first=new Image();



    first.onload=function(){


        canvas.width=first.width;

        canvas.height=first.height;



        let width=canvas.width;

        let height=canvas.height;



        let pixelCount=width*height;



        let rSum=new Float32Array(pixelCount);

        let gSum=new Float32Array(pixelCount);

        let bSum=new Float32Array(pixelCount);



        processImage(0);



        function processImage(index){


            if(index>=photos.length){

                createResult();

                return;

            }


            let img=new Image();


            img.onload=function(){


                ctx.clearRect(
                    0,
                    0,
                    width,
                    height
                );


                ctx.drawImage(
                    img,
                    0,
                    0,
                    width,
                    height
                );


                let data =
                ctx.getImageData(
                    0,
                    0,
                    width,
                    height
                ).data;



                for(
                    let i=0, p=0;
                    i<data.length;
                    i+=4,p++
                ){

                    rSum[p]+=data[i];

                    gSum[p]+=data[i+1];

                    bSum[p]+=data[i+2];

                }



                bar.style.width =
                ((index+1)/photos.length*80+10)
                +"%";


                info.innerHTML=
                "正在处理第 "
                +(index+1)
                +" / "
                +photos.length
                +" 张";


                processImage(index+1);


            };


            img.src=
            URL.createObjectURL(
                photos[index]
            );


        };        function createResult(){


            let output =
            ctx.createImageData(
                width,
                height
            );


            for(
                let i=0,p=0;
                i<output.data.length;
                i+=4,p++
            ){

                output.data[i] =
                rSum[p] / photos.length;


                output.data[i+1] =
                gSum[p] / photos.length;


                output.data[i+2] =
                bSum[p] / photos.length;


                output.data[i+3] = 255;

            }



            ctx.putImageData(
                output,
                0,
                0
            );



            let imageData =
            canvas.toDataURL(
                "image/jpeg",
                0.95
            );



            let previewImg =
            document.createElement("img");


            previewImg.src=imageData;

            previewImg.style.width="95%";

            previewImg.style.borderRadius="15px";


            resultBox.appendChild(
                previewImg
            );



            let link =
            document.createElement("a");


            link.href=imageData;


            link.download=
            "galaxy_average_stack.jpg";


            link.innerHTML=
            "下载平均堆栈结果";


            link.style.display="block";

            link.style.margin="20px auto";

            link.style.padding="15px";

            link.style.background="#2980ff";

            link.style.color="white";

            link.style.borderRadius="12px";

            link.style.textDecoration="none";


            resultBox.appendChild(
                link
            );



            bar.style.width="100%";


            info.innerHTML=
            "平均堆栈完成 ✨";



            stackBtn.disabled=false;


            stackBtn.innerHTML=
            "✨ 一键银河堆栈";


        }



        first.src =
        URL.createObjectURL(
            photos[0]
        );


    };



};
