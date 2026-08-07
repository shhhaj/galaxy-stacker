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

    preview.innerHTML = "";

    photos.forEach(file=>{

        let img=document.createElement("img");

        img.src = URL.createObjectURL(file);

        img.style.width="120px";
        img.style.margin="5px";
        img.style.borderRadius="10px";

        preview.appendChild(img);

    });

});



// 银河堆栈

stackBtn.onclick = async function(){

    if(photos.length < 2){

        alert("请至少选择2张照片");

        return;
    }


    stackBtn.disabled=true;

    stackBtn.innerHTML="处理中...";


    info.innerHTML="正在银河堆栈处理中...";


    resultBox.innerHTML="";


    bar.style.width="10%";



    try{


        let canvas=document.createElement("canvas");

        let ctx=canvas.getContext("2d");



        let base=new Image();



        base.onload=function(){


            canvas.width=base.width;

            canvas.height=base.height;



            ctx.drawImage(base,0,0);


            let count=1;



            let loadNext=function(index){


                if(index >= photos.length){


                    finish();


                    return;

                }



                let img=new Image();



                img.onload=function(){


                    ctx.globalAlpha=0.35;


                    ctx.drawImage(
                        img,
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    );


                    count++;


                    bar.style.width =
                    (10 + count/photos.length*80)+"%";


                    loadNext(index+1);


                };


                img.src=
                URL.createObjectURL(
                    photos[index]
                );


            };



            loadNext(1);



            function finish(){


                ctx.globalAlpha=1;



                let imageData =
                canvas.toDataURL(
                    "image/jpeg",
                    0.95
                );



                let imgPreview=
                document.createElement("img");


                imgPreview.src=imageData;

                imgPreview.style.width="95%";

                imgPreview.style.borderRadius="15px";


                resultBox.appendChild(
                    imgPreview
                );



                let link=
                document.createElement("a");


                link.href=imageData;

                link.download=
                "galaxy_stack.jpg";


                link.innerHTML=
                "下载银河堆栈结果";


                link.style.display="block";

                link.style.margin="20px auto";

                link.style.padding="15px";

                link.style.background="#2980ff";

                link.style.color="white";

                link.style.borderRadius="12px";

                link.style.textDecoration="none";



                resultBox.appendChild(link);



                bar.style.width="100%";


                info.innerHTML=
                "银河堆栈完成 ✨";



                stackBtn.disabled=false;

                stackBtn.innerHTML=
                "✨ 一键银河堆栈";


            }


        };



        base.src=
        URL.createObjectURL(
            photos[0]
        );


    }

    catch(error){


        console.log(error);


        info.innerHTML=
        "处理失败，请重新尝试";


        stackBtn.disabled=false;

        stackBtn.innerHTML=
        "✨ 一键银河堆栈";


    }


};
