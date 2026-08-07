// Galaxy Stacker Core
// 多张星空照片平均堆栈算法

export async function stackImages(files) {

    const images = [];

    for (const file of files) {

        const bitmap = await createImageBitmap(file);

        images.push(bitmap);
    }


    const width = images[0].width;
    const height = images[0].height;


    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;


    const ctx = canvas.getContext("2d");


    const imageData =
        ctx.createImageData(width,height);


    const pixels =
        new Array(width*height*4).fill(0);



    for(const img of images){

        ctx.clearRect(
            0,
            0,
            width,
            height
        );


        ctx.drawImage(
            img,
            0,
            0
        );


        const data =
            ctx.getImageData(
                0,
                0,
                width,
                height
            ).data;



        for(
            let i=0;
            i<data.length;
            i++
        ){

            pixels[i]+=data[i];

        }

    }



    for(
        let i=0;
        i<pixels.length;
        i++
    ){

        imageData.data[i]
        =
        pixels[i]/images.length;

    }



    ctx.putImageData(
        imageData,
        0,
        0
    );


    return canvas;

}
