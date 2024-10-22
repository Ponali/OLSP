function distance(x,y){
    /*
        NOTE: the "**" operator is not supported, nor does the Math.pow equivalent, as it is not natively supported.
        The only way to circumvent this is to multiply the variable to how much you would like.
    */
    return Math.sqrt((x*x)+(y*y));
}

function multiplexer(a,b,choose){
    return a*choose+b*(1-choose);
}

/*
    NOTE: The "min" and "max" functions use their arguments more than its amount.
    This behaviour should not happen if you aim for optimised code.
    If someone have better solutions for a min and max redefinition, please let me know!
*/

function min(a,b){
    return multiplexer(a,b,a<b);
}

function max(a,b){
    return multiplexer(a,b,a>b);
}

function circle(){
    const sizeX=20+Math.sin(timer*140)*10;
    const sizeY=20+Math.cos(timer*120)*10;
    const uncapped = (6-distance(x/sizeX,y/sizeY))
    // NOTE: There is no native support "min" and "max" functions, so custom functions for this are made.
    return min(max(uncapped,0),1);
}

function monoFloatToRGB24(value){
    return (Math.floor(value*255.5)%256)*0x10101
}

function concatRGB(r,g,b){
    // converts three R, G and B values into one final RGB one.
    // R, G, and B values must be from 0 to 255.
    return Math.round(r)*0x10000+Math.round(g)*0x100+Math.round(b);
}

function myImage(x,y,invert){
    const vx=Math.round(Math.abs(((x*60/(135-1))+timer/135*16)%2-1)*(135-1)+0.5);
    const vy=Math.round(y*45);
    const r=images.clouds.pixelR8(vx,vy);
    const g=images.clouds.pixelG8(vx,vy);
    const b=images.clouds.pixelB8(vx,vy);
    const vr=(((r/255*2-1)*(invert*2-1))/2+.5)*255;
    const vg=(((g/255*2-1)*(invert*2-1))/2+.5)*255;
    const vb=(((b/255*2-1)*(invert*2-1))/2+.5)*255;
    return concatRGB(vr,vg,vb);
}

function main(){
    const xFloat=x/480+.5;
    const yFloat=y/360+.5;
    const myCircle = circle();
    return myImage(xFloat,yFloat,1-myCircle);
}