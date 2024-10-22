const ffmpeg = require('fluent-ffmpeg');

let imgCache={};

class RawImage{
    constructor(buffer,width,height){
        this.rawData=[...buffer];
        [this.width,this.height]=[width,height];
    }
    getPixel(i){
        return this.rawData.slice(i*3,i*3+3)
    }
    getPixelHex(i){
        let px=this.getPixel(i);
        return ((px[0]<<16)|(px[1]<<8)|px[2]).toString(16).padStart(6,"0");
    }
    getImageHexPart(channel){
        let out="";
        for(let i=0;i<this.width*this.height;i++){
            out+=this.getPixelHex(i)[channel];
        };
        return out;
    }
    getPixelMono(i){
        let px=this.getPixel(i);
        return Math.round((px[0]+px[1]+px[2])/2)
    }
    getImageHexMono(){
        let out=["",""];
        for(let i=0;i<this.width*this.height;i++){
            let px=this.getPixelMono(i).toString(16).padStart(2,"0");
            out[0]+=px[0];
            out[1]+=px[1];
        };
        return out;
    }
    getImage1Bit(){
        let out="";
        for(let i=0;i<this.width*this.height;i++){
            let px=this.getPixelMono(i);
            out+=(+(px>127.5));
        };
        return out;
    }
}

function getImageFileRaw(name,width,height,callback){
    if(!width) width=-1;
    if(!height) height=-1;
    let buffer=Buffer.alloc(width*height*3),bufIdx=0;
    let ffmpegCmd=ffmpeg().input(name).format("rawvideo").outputOptions(["-pix_fmt rgb24","-s "+width+"x"+height]);
    let stream=ffmpegCmd.pipe();
    stream.on("data",function(chunk){
        for(let i=0;i<chunk.length;i++){
            buffer[bufIdx++]=chunk[i];
        }
    })
    ffmpegCmd.on("end",function(){
        callback(buffer);
    })
    ffmpegCmd.on("error",function(err){
        console.error("ffmpeg error occured.",err);
    })
}

function addImageToCache(name,data,folder){
    return new Promise(resolve=>{
        getImageFileRaw(folder+"/"+data.file,data.width,data.height,buffer=>{
            imgCache[name]=new RawImage(buffer,data.width,data.height);
            resolve();
        })
    })
}

async function init(data,folder){
    for(let i in data.images){
        console.log(`    Getting image "${i}"...`);
        await addImageToCache(i,data.images[i],folder);
    };
    //console.log(imgCache);
}

function handleImageCall(imageName,functionName,args,data){
    //console.log(imageName,functionName,args,data);
    function handleIndex(width,height){
        return {operator:"+",left:args[0],right:{operator:"*",left:{operator:"-",left:height,right:args[1]},right:width}}
    }
    function handleSubchannel(sc){
        let img=imgCache[imageName];
        return {operator:"letter",value:{operator:"data",value:img.getImageHexPart(sc)},idx:handleIndex(img.width,img.height)}
    };
    function handleChannel(ch){
        return {operator:"join",left:handleSubchannel(ch*2),right:handleSubchannel(ch*2+1)};
    };
    function handleHex24(){
        return {operator:"join",left:{operator:"join",left:handleChannel(0),right:handleChannel(1)},right:handleChannel(2)};
    }
    function handleMono(){
        let img=imgCache[imageName];
        let data=img.getImageHexMono();
        let idx=handleIndex(img.width,img.height);
        return {operator:"join",
            left:{operator:"letter",value:{operator:"data",value:data[0]},idx},
            right:{operator:"letter",value:{operator:"data",value:data[1]},idx}
        };
    };
    function handle1Bit(){
        let img=imgCache[imageName];
        let idx=handleIndex(img.width,img.height);
        return {operator:"letter",value:{operator:"data",value:img.getImage1Bit()},idx};
    }
    function hex(val){
        return {operator:"join",left:{operator:"data",value:"0x"},right:val};
    }
    if(functionName=="pixelRGB24") return hex(handleHex24());
    if(functionName=="pixelR8") return hex(handleChannel(0));
    if(functionName=="pixelG8") return hex(handleChannel(1));
    if(functionName=="pixelB8") return hex(handleChannel(2));
    if(functionName=="pixelM8") return hex(handleMono());
    if(functionName=="pixelM1") return handle1Bit();

    throw new Error(`Unknown image getter function name "${functionName}".`)
};

module.exports={ handleImageCall, init };