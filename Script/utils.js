function checkHttps(){
    if (document.location.protocol != 'https:'){
        initInfoDialog("Failed to access camera on the HTTP website. Please instead host this web application on a HTTPS server and try again.");
    }
}
function resizeBody(){
    //Browser size
    const convertStyle = () => {
        document.body.style.setProperty('height', `${window.innerHeight}px`);
    }
    window.addEventListener("resize", convertStyle);
    window.addEventListener("DOMContentLoaded", convertStyle);
}
function isMobile(){
    return Dynamsoft.Lib.env.bMobile;
}
function getFormateDate(){
    let nowTime = new Date();
    let year = nowTime.getFullYear();
    let month = nowTime.getMonth()+1;
    let date = nowTime.getDate();
    let hours = nowTime.getHours();
    let minutes = nowTime.getMinutes();
    let seconds = nowTime.getSeconds();
    if(month<=9){month = '0'+ month;}
    if(date<=9){date = '0'+ date;}
    if( hours<=9 ) hours = '0' + hours;
    if( minutes<=9 ) minutes = '0' + minutes;
    if( seconds<=9 ) seconds = '0' + seconds;

    let currentTime_info = month+ "/" + date + "/" + year + " " + hours + ":" + minutes + ":" + seconds;
    let currentTime_title = year+"-"+month+"-"+date+" "+hours+":"+minutes+":"+seconds;
    let timeDate = {
        currentTime_title,
        currentTime_info,
    }
    return timeDate
}
function getRandomKey(length) {
    if (length > 0) {
        let data = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
        let num = "";
        for (let i = 0; i < length; i++) {
            let r = parseInt(Math.random() * 61);
            num += data[r];
        }
        return num;
    } else {
        return false;
    }   
}
function compareArray(item,arr1,arr2){
    let diff = []
    for(let i =0;i< arr1.length; i++){
        if(arr1[i] == item){
            diff.push(i)
        }
    }
    for(let i =0;i< arr2.length; i++){
        if(arr2[i] == item){
            diff.push(i)
        }
    }
    return diff
}
function dragArray(arr,index,newIndex){
    if(index > newIndex){
        arr.splice(newIndex, 0, arr[index]);
        arr.splice(index+1,1);
    }else{
        arr.splice(newIndex+1, 0, arr[index]);
        arr.splice(index,1)
    }
}
function arrayBufferToBlob(buffer, type) {
    return new Blob([buffer], {type: type});
}
function blobToArrayBuffer(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener('loadend', (e) => {
            resolve(reader.result);
        });
        reader.addEventListener('error', reject);
        reader.readAsArrayBuffer(blob);
    });
}
function checkFileName(str) {
    str = str.replace(/[\\\/:\*\?\!"<>\|\.\-]/g, "");
    return str;
}