let times;
// ----------------------------------------------------Mask-----------------------------------------------------------------//
function initMask(){
    //Mask
    if(!document.getElementById('maskDiv')){
        let div = document.createElement("div");
        div.id = "maskDiv";
        div.className = "dcs-mobile-mask";
        document.body.appendChild(div);
    }else{
        document.getElementById('maskDiv').style.display = 'block';
    }
}
//-------------------------------------------------Confirm Dialog-----------------------------------------------------------//
//--------------------------------------------------------------------------------------------------------------------------//
function initConfirmDialog(title,fn){
    initMask();
    let boxStyle = 'position:fixed;top:50%;left:50%;width:260px;' +
    'transform:translate(-50%,-50%);background:#fff;z-index:999;border-radius: 5px;' +
    'overflow: hidden;';
    let btnStyle = 'flex:1;height:100%;display:flex;align-items:center;justify-content: center;font-size:14px';

    let ObjString = [
        '<div style=' + boxStyle + '>',
        '<div style="padding:20px;font-size: 16px; color:black;height:70%;text-align:center;display:flex;align-items:center">',
        title,
        '</div>',
        '<div style="height:40px;background:#f5f5f5;display:flex;border-top: solid 1px #cdcccc" >',
        '<span style="' + btnStyle + ';color:#fe8e14;border-right: solid 1px #cdcccc" onclick ="' + fn + '">OK</span>',
        '<span style="' + btnStyle + '" onclick ="closeDialog()">Cancel</span></div>',
        '</div>'
    ];
    Dynamsoft.DWT.ShowDialog(500, 0, ObjString.join(''), true, true);
}
function initInfoDialog(text){
    initMask();
    let boxStyle = 'position:fixed;top:50%;left:50%;width:260px;' +
    'transform:translate(-50%,-50%);background:#fff;z-index:999;border-radius: 5px;' +
    'overflow: hidden;';
    let btnStyle = 'height:100%;display:flex;align-items:center;justify-content: center;font-size:14px';

    let ObjString = [
        '<div style=' + boxStyle + '>',
        '<div style="padding:20px;font-size: 16px; color:black;height:70%;text-align:center;display:flex;align-items:center">',
        text,
        '</div>',
        '<div style="height:40px;background:#f5f5f5;border-top: solid 1px #cdcccc" >',
        '<span style="' + btnStyle + ';color:#fe8e14;" onclick ="closeDialog()">OK</span>',
        '</div>'
    ];
    Dynamsoft.DWT.ShowDialog(500, 0, ObjString.join(''), true, true);
}
function closeDialog(){
    document.getElementById('maskDiv').style.display = 'none';
    Dynamsoft.DWT.CloseDialog();
}
function initConfirmDialogAsync(title, OK, Cancel, removeConfirm = false) {
    let boxStyle = 'position:fixed;top:50%;left:50%;width:260px;' +
    'transform:translate(-50%,-50%);background:#fff;z-index:999;border-radius: 5px;' +
    'overflow: hidden;';
    let btnStyle = 'flex:1;height:100%;display:flex;align-items:center;justify-content: center;font-size:14px';

    let ObjString = [
        '<div style=' + boxStyle + '>',
        '<div style="padding:20px;font-size: 16px; color:black;height:70%;text-align:center;display:flex;align-items:center">',
        title,
        '</div>',
        '<div style="height:40px;background:#f5f5f5;display:flex;border-top: solid 1px #cdcccc" >',
        '<span id="dynamsoft-confirm-dialog-yes" style="' + btnStyle + ';color:#fe8e14;border-right: solid 1px #cdcccc">OK</span>',
        '<span id="dynamsoft-confirm-dialog-no" style="' + btnStyle + '">Cancel</span></div>',
        '</div>'
    ];

    Dynamsoft.DWT.ShowDialog(500, 0, ObjString.join(''), true, true);

    return new Promise(function (resolve) {
        document.getElementById('dynamsoft-confirm-dialog-yes').addEventListener('click', function () {
            if(removeConfirm) isRemove = true;
            Dynamsoft.DWT.CloseDialog();
            resolve(OK); //Exit
        });
        document.getElementById('dynamsoft-confirm-dialog-no').addEventListener('click', function () {
            if(removeConfirm) isRemove = false;
            Dynamsoft.DWT.CloseDialog();
            resolve(Cancel);   //Cancel
        })
    })
}
function initScanTips(title){
    if(!document.getElementById('dcsScanTips')){
        const box = document.createElement('div');
        const tip = document.createElement('span');
        box.className = 'dcs-scanTip-box'
        box.id = 'dcsScanTips';
        tip.innerHTML = title;
        box.appendChild(tip);
        document.body.appendChild(box);
    } else {
        document.getElementById('dcsScanTips').firstChild.innerHTML = title
    }

    if(!times){
        times = setTimeout(closeScanTips,5000)
    } else {
        clearTimeout(times);
        times = setTimeout(() => {
            closeScanTips();
        }
        ,2000);
    }
}
function closeScanTips(){
    const el = document.getElementById('dcsScanTips');
    if(el){
        document.body.removeChild(el)
    }
}
//---------------------------------------------Save and Share Tab-------------------------------------------------------------//
//----------------------------------------------------------------------------------------------------------------------------//
function showBottomToolBar(){
    if(!document.getElementById('bottomDialogDiv')){
        initBottomToolBarUI();
        // The browser does not support sharing
        let share = canShare();
        if(!share[0]){
            document.getElementById('btnShareImage').style.pointerEvents = 'none';
            document.getElementById('btnShareImage').style.color = '#dbd7d7a1';
        }
        if(!share[1]){
            document.getElementById('btnSharePdf').style.pointerEvents = 'none';
            document.getElementById('btnSharePdf').style.color = '#dbd7d7a1';
        }
    } else {
        if (document.getElementById('bottomDialogDiv')) {
        document.getElementById('bottomDialogDiv').style.bottom = '0';
        }
        document.getElementById("maskDiv").style.display = 'block';
    };
}
function closeBottomToolBar() {
    if (document.getElementById('bottomDialogDiv')) {
        document.getElementById('bottomDialogDiv').style.bottom = '-35vh';
    }
    setTimeout(() => {
        if (document.getElementById("maskDiv")) {
            document.getElementById("maskDiv").style.display = 'none';
        }
    }, 500);
}
function initBottomToolBarUI(){
    initMask();
    //footer tab
    let footerTabDiv = document.createElement("div");
    footerTabDiv.id = "bottomDialogDiv";
    footerTabDiv.className = "dcs-bottom-dialog";
    footerTabDiv.innerHTML = getBottomToolBarContainer();
    document.body.appendChild(footerTabDiv);
}
function getBottomToolBarContainer(){
    let str = "";
    str +=[`<ul class='dcs-bottom-dialog-ul'>`,
        `<li onClick="initSaveForm('pdf')">Save PDF</li>`,
        `<li id='btnSaveImage' onClick="initSaveForm('image')">Save IMAGE</li>`,
        `<li id='btnSharePdf' onClick='sharePdfFile()'>Share PDF</li>`,
        `<li id='btnShareImage' onClick='shareImageFile()'>Share IMAGE</li>`,
        `</ul>`].join('');
    str +=[`<div class='dcs-bottom-cancel' onClick='closeBottomToolBar()'>Cancel</div>`]
    return str;
}
//---------------------------------------------File Share---------------------------------------------------------------------//
function canShare() {
    // chorme Version > '93.0.4570.0';
    let info = Dynamsoft.navInfo;
    let version = info.strBrowserVersion;
    let pos = version.indexOf('.');
    if(info.bChrome || info.bChromeOS) {
        if(version.substring(0, pos) == '93') {
            version = version.substr(pos+1);
            pos = version.indexOf('.');
            if(version.substring(0, pos) == '0') {
                version = version.substr(pos+1);
                pos = version.indexOf('.');
                if(version.substring(0, pos) >= '4570') {
                    return [true, true];
                }else {
                    return [true, false];
                }
            }else {
                return [true, true];
            }
        }else if(version.substring(0, pos) > '93') {
            return [true, true];
        }else {
            return [true, false];
        }
    }
    if(info.bEdge || info.bSafari) {
        return [true, true];
    }
    return [false, false];
}
async function shareImageFile(){
    let cIndexArray = DWObject.SelectedImagesIndices.sort(function(a, b){return a-b});
    let imageArray = [];
    if(cIndexArray.length > 0){
        for(let i =0; i < cIndexArray.length; i++){
            let data = await DWObject.GetImageDataAsync(cIndexArray[i]);
            imageArray.push(new File([data.oriData],'imageFile'+i+'.jpeg',{type:data.oriData.type}));
        }
        if (navigator.canShare && navigator.canShare({ files: imageArray })) {
            navigator.share({
                files: imageArray,
                title: 'IMAGE File',
                text: getFormateDate(fileName).currentTime_info,
            })
        } else {
            alert(`Your system doesn't support sharing IMAGE files.`);
        }
    }
    closeBottomToolBar();
}
function sharePdfFile(){
    let cIndexArray = DWObject.SelectedImagesIndices.sort(function(a, b){return a-b});;
    if(cIndexArray.length > 0){
        DWObject.ConvertToBlob(cIndexArray, Dynamsoft.DWT.EnumDWT_ImageType.IT_PDF,
            function (result, indices, type) {
            let pdf = new File([result], "Document.pdf",{type:'application/pdf'});
            let file = [pdf];
            if (navigator.canShare && navigator.canShare({ files: file })) {
                navigator.share({
                    files: file,
                    title: 'PDF File',
                    text: getFormateDate(fileName).currentTime_info,
                })
            } else {
                alert(`Your system doesn't support sharing PDF files.`);
            }
        },function(){});
    }
    closeBottomToolBar();
}
//---------------------------------------------Ie-----------------------------------------------------------------------------////IE
function ieInfo() {
    let boxStyle = 'position:absolute;top:50%;left:50%;width:400px;transform:translate(-50%,-50%);background:#fff;z-index:999;border-radius: 5px;overflow: hidden;';
    let btnStyle = 'height:100%;display:flex;align-items:center;justify-content: center;font-size:14px';
    let ieText = 'Unfortunately, Internet Explorer does not support WebAssembly technology. Please try again with a different browser.';
    let ObjString = [
        '<div style=' + boxStyle + '>',
        '<div style="padding:20px;font-size: 18px; color:black;height:70%;text-align:center;">',
        ieText,
        '</div>',
        '<div style="line-height:40px;height:40px;background:#f5f5f5;border-top: solid 1px #cdcccc;text-align:center;" >',
        '<span style="' + btnStyle + ';color:#fe8e14;" onclick ="closeIeInfo()">OK</span>',
        '</div>'
    ];
    Dynamsoft.DWT.ShowDialog(500, 0, ObjString.join(''), true, true);
}
function closeIeInfo() {
    Dynamsoft.DWT.CloseDialog();
}