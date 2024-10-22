function character(idx,x,y){
    return images.font.pixelM1(x+idx*3,y)
}
function string(str,x,y){
    const length = length(str);
    const strIdx=Math.floor(x/4);
    const char=letterOf(str,strIdx+1);
    const reach=x>=0&&y>=0&&((x-1)%4)<3&&y<4&&x<length*4&&char!=" ";
    const charIdx=charIndexOf("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',.:?",char)-1;
    return reach*character(charIdx,x%4,y);
}
function table(str,x,y,charWidth,charHeight){
    const length = length(str);
    const strIdx=Math.floor(x/4)+Math.floor(charHeight-y/4)*charWidth;
    const char=letterOf(str,strIdx+1);
    const reach=x>=0&&y>=0&&((x-1)%4)<3&&((y-1)%4)<3&&strIdx<length&&strIdx>=0&&char!=" ";
    const charIdx=charIndexOf("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',.:?",char)-1;
    return reach*character(charIdx,x%4,y%4);
}
function monoFloatToRGB24(value){
    return (Math.floor(value*255.5)%256)*0x10101
}
function main(){
    const vx=Math.round((x/480+0.5)*60+1);
    const vy=Math.round((y/360+0.5)*45);
    const charWidth=15;
    const charHeight=11;
    const date=join(join(join(time.hours,":"),join(time.minutes,":")),time.seconds);
    const text=join("hello,world    ",join(join(date,"'"),timer));
    const output=table(text,vx,vy,charWidth,charHeight);
    return monoFloatToRGB24(output);
}