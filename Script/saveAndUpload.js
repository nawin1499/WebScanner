Array.prototype.getArrayIndex = function(obj) {
    for(var i=0;i<this.length;i++){
        if(this[i] === obj) {
            return i;
        }
    }
    return -1;
}

let currentPathName = unescape(location.pathname);
let currentPath = currentPathName.substring(0, currentPathName.lastIndexOf("/") + 1);
let strUploadForm, selectImageCount, currentSelected, temSelectArray, uploadFileRecord;
let bFullScreen = true;
let bPadViewer = false;
let bMobile = false;
//------------------------------------Init/Close Save/Upload Page-------------------------------------------------------//
function initUploadForm() {
    if (DWObject.SelectedImagesIndices.length > 0) {
        bMobile = Dynamsoft.Lib.env.bMobile;
        bPadViewer = Dynamsoft.Lib.env.isPadViewer();
        initUploadFormUI()
    }

    document.getElementById('imgTypepdf').checked = true;
    selectFileType("pdf");
}
function initSaveForm(fileType) {
    if (DWObject.SelectedImagesIndices.length > 0) {
        bMobile = Dynamsoft.Lib.env.bMobile;
        bPadViewer = Dynamsoft.Lib.env.isPadViewer();
        Dynamsoft.DWT.CloseDialog();
        initSaveFormUI(fileType);
    }
    if (bMobile) {
        
        if (document.getElementById("maskDiv")) {
            document.getElementById("maskDiv").style.display = 'none';
        }

        if (fileType == "pdf") {
            selectFileType("pdf");
        }
        closeBottomToolBar();
    }
}
function closeForm(str) {
    if(str == "upload"){
        uploadFileRecord = document.getElementById('div-uploadedFile');
        document.getElementById("dcsUploadDialog").remove();
    }
    if(str == "image"){
        document.getElementById("dcsSaveImageDialog").remove();
    }
    if(str == "pdf"){
        document.getElementById("dcsSavePdfDialog").remove();
    }

    const divArea = document.querySelector('.dvs-showImageArea');
    if (divArea.style.display == '') {
        divArea.style.display = 'block';
    } else {
        divArea.style.display = '';
    }
}
//------------------------------------Save/Upload button Click----------------------------------------------------//
function uploadToServer() {
    if (!checkViewerBuffer()) {
        return;
    }

    const _txtFileName = document.getElementById("txt_fileName");
    let strHTTPServer, strActionPage, strImageType, strUlr;
    let strPort = location.port == "" ? 80 : location.port;

    if (_txtFileName)
        _txtFileName.className = "";

    strHTTPServer = location.hostname;
    DWObject.IfSSL = Dynamsoft.Lib.detect.ssl;
    strUlr = "http://";

    if (Dynamsoft.Lib.detect.ssl == true) {
        strPort = location.port == "" ? 443 : location.port;
        strUlr = "https://";
    }

    strUlr = strUlr + strHTTPServer + ":" + strPort;
    DWObject.HTTPPort = strPort;

    strActionPage = strUlr + currentPath + "SaveToFile_Binary.aspx";    //Downloaded Sample

    let i;
    for (i = 0; i < 4; i++) {
        if (document.getElementsByName("ImageType").item(i).checked == true) {
            if (bMobile) {
                if (i == 1)
                    strImageType = 4; //PDF
                else
                    strImageType = i + 1;
            } else
                strImageType = i + 1;
            break;
        }
    }

    let fileName = _txtFileName.value.replace(new RegExp("<", 'gm'), '&lt;');
    let uploadFilename = getFileName(fileName, document.getElementsByName("ImageType").item(i).value);

    const OnSuccess = function (httpResponse) {};
    const OnFailure = function (errorCode, errorString, httpResponse) {
        if (errorCode != 0 && errorCode != -2003)
            initInfoDialog('Only 24-bit true color bmp and 8-bit gray-scaled image are supported for JPEG compression.');
        else {
            printUploadInfo(httpResponse);
        }
    };
    const customInfo = document.getElementById("txt_CustomInfo");
    DWObject.SetHTTPFormField("CustomInfo", customInfo.value);
    DWObject.SetHTTPFormField("SessionID", vSessionID);

    const multiPageTIFF = document.getElementById("MultiPageTIFF");
    const multiPagePDF = document.getElementById("MultiPagePDF");
    let aryIndex = [];
    
    if (strImageType == 2 && multiPageTIFF && multiPageTIFF.checked) {
        aryIndex = DWObject.SelectedImagesIndices;
        //Problem may happened here
        DWObject.HTTPUpload(
            strActionPage + '?filename=' + uploadFilename,
            aryIndex, Dynamsoft.DWT.EnumDWT_ImageType.IT_TIF,
            Dynamsoft.DWT.EnumDWT_UploadDataFormat.Binary,
            uploadFilename,
            OnSuccess,
            OnFailure
        );
    } else if (strImageType == 4 && multiPagePDF && multiPagePDF.checked) {
        setPageSize();
        setFileSize();
        aryIndex = DWObject.SelectedImagesIndices;
        DWObject.HTTPUpload(
            strActionPage + '?filename=' + uploadFilename,
            aryIndex,
            Dynamsoft.DWT.EnumDWT_ImageType.IT_PDF,
            Dynamsoft.DWT.EnumDWT_UploadDataFormat.Binary,
            uploadFilename,
            OnSuccess,
            OnFailure
        );
    } else {
        if (strImageType == Dynamsoft.DWT.EnumDWT_ImageType.IT_PDF) {
            setPageSize();
            setFileSize();
        } else if (strImageType == Dynamsoft.DWT.EnumDWT_ImageType.IT_JPG) {
            setFileSize();
        }
        for (let i = 0; i < DWObject.SelectedImagesIndices.length; i++) {
            let newUploadFilename = uploadFilename.slice(0, -4) + "(" + i + ")" + uploadFilename.slice(-4);
            DWObject.HTTPUpload(
                strActionPage + '?filename=' + newUploadFilename,
                [DWObject.SelectedImagesIndices[i]],
                strImageType,
                Dynamsoft.DWT.EnumDWT_UploadDataFormat.Binary,
                uploadFilename,
                OnSuccess,
                OnFailure
            );
        }
    }
}
async function saveToLocal(fileType) {
    if (!checkViewerBuffer()) return;

    const txtFileNameForSave = document.getElementById("txt_fileName");
    const ImageType = document.getElementsByName("ImageType");
    const OnSuccess = function () { };
    const OnFailure = function (errorCode, errorString) {
        initInfoDialog('Only 24-bit true color bmp and 8-bit gray-scaled image are supported for JPEG compression.');
    };

    let strImgType_save, strImageType;

    if (!bMobile) {
        for (let i = 0; i < 5; i++) {
            if (ImageType.item(i).checked == true) {
                strImgType_save = ImageType.item(i).value;
                strImageType = i + 1;
                break;
            }
        }
    } else {
        if (fileType == "pdf") {
            strImgType_save = "pdf";
            strImageType = 4
        } else {
            strImgType_save = "jpeg";
            strImageType = 1;
        }
    }

    DWObject.IfShowFileDialog = true;

    if (txtFileNameForSave) txtFileNameForSave.className = "";

    let bSave = false;
    let strFilePath = txtFileNameForSave.value + "." + strImgType_save;

    const multiPageTIFF = document.getElementById("MultiPageTIFF");
    const multiPagePDF = document.getElementById("MultiPagePDF");
    const saveOriginal = document.getElementById("SaveOriginal");

    if (strImgType_save == "tif" && multiPageTIFF && multiPageTIFF.checked) {
        setPageSize();
        setFileSize();
        if ((DWObject.SelectedImagesIndices.length == DWObject.HowManyImagesInBuffer)) {
            bSave = DWObject.SaveAllAsMultiPageTIFF(strFilePath, OnSuccess, OnFailure);
        }
        else {
            bSave = DWObject.SaveSelectedImagesAsMultiPageTIFF(strFilePath, OnSuccess, OnFailure);
        }
    } else if (strImgType_save == "pdf" && multiPagePDF && multiPagePDF.checked) {
        setPageSize();
        setFileSize();
        if ((DWObject.SelectedImagesIndices.length == DWObject.HowManyImagesInBuffer)) {
            bSave = DWObject.SaveAllAsPDF(strFilePath, OnSuccess, OnFailure);
        }
        else {
            bSave = DWObject.SaveSelectedImagesAsMultiPagePDF(strFilePath, OnSuccess, OnFailure);
        }
    } else {
        setPageSize();
        setFileSize();
        switch (strImageType) {
            case 0: bSave = DWObject.SaveAsBMP(strFilePath, DWObject.CurrentImageIndexInBuffer);
                break;
            case 1:
                bSave = DWObject.SaveAsJPEG(strFilePath, DWObject.CurrentImageIndexInBuffer, OnSuccess, OnFailure);

                if(saveOriginal && saveOriginal.checked){
                    DWObject.RegisterEvent("OnBufferChanged", () => {});
                    let image = await DWObject.GetImageDataAsync(DWObject.CurrentImageIndexInBuffer);
                    let oriImage = image.customData.oriBlob.imageData;
                    let oriImageName = txtFileNameForSave.value + "-Original." + strImgType_save
                    await new Promise((rs,rj)=>{
                        DWObject.LoadImageFromBinary(oriImage, rs, rj)
                    })
                    bSave = DWObject.SaveAsJPEG(oriImageName, DWObject.CurrentImageIndexInBuffer, OnSuccess, OnFailure);
                    DWObject.RemoveImage(DWObject.CurrentImageIndexInBuffer)
                    DWObject.RegisterEvent("OnBufferChanged", (e) => bufferChanged(e));
                }
                break;
            case 2:
                bSave = DWObject.SaveAsTIFF(strFilePath, DWObject.CurrentImageIndexInBuffer);

                break;
            case 3:
                bSave = DWObject.SaveAsPNG(strFilePath, DWObject.CurrentImageIndexInBuffer);

                break;
            case 4:
                bSave = DWObject.SaveAsPDF(strFilePath, DWObject.CurrentImageIndexInBuffer);
                break;
        }
    }
}
//------------------------------------Save------------------------------------------------------------------------//
function initSaveFormUI(fileType) {
    const divSave = document.getElementById("divSave");
    if (!divSave) {
        let div = document.createElement("div");
        div.innerHTML = initSaveFormHeader(fileType);
        div.className = "dcs-fullDialog";
        div.id = fileType === "image" ? 'dcsSaveImageDialog' : 'dcsSavePdfDialog';

        document.body.appendChild(div);
        initCommonFormUI(fileType);
    }
}
function initCommonFormUI(fileType) {
    setFromDefaultValue(fileType);
    const divResultWrap = document.getElementById("resultWrap");

    if (divResultWrap) {
        if (bFullScreen) {
            divResultWrap.style.height = (document.body.offsetHeight - 430) + "px";
        } else{
            divResultWrap.style.height = (parseInt(document.body.offsetHeight * 0.9) - 430) + "px";
        }

        if (uploadFileRecord) {
            document.getElementById('div-uploadedFile').remove();
            divResultWrap.appendChild(uploadFileRecord);
            //Scroll Bottom
            divResultWrap.scrollTop = divResultWrap.scrollHeight;
        }
    }
}
function initSaveFormHeader(fileType) {
    let divId, divTitle;

    if (!bMobile) {
         divId = 'divSave';
         divTitle = 'Save to local';
    } else {
        if (fileType == "image") {
             divId = 'divSaveImage';
             divTitle = 'Save As Image';
        } else {
             divId = 'divSavePdf';
             divTitle = 'Save As PDF';
        }
    }

    let strSave = '<div id="' + divId + '" class="divinput" > ' +
        '<ul>' +
        `<li class="toggle"><img src="./icon/icon_arrow_white.svg" id="btnClose" onclick ="closeForm('${fileType}');"></span>${divTitle}</li>` +
        initSaveFormContainer(`${fileType}`) +
        '</ul>' +
        '</div>';

    return strSave;
}
function initSaveFormContainer(fileType) {
    let btnOnClick;

    if (!bMobile) {
        btnOnClick = "saveToLocal();";
    } else {
        if (fileType == "image") {
            btnOnClick = "saveToLocal('image');";
        } else {
            btnOnClick = "saveToLocal('pdf');";
        }
    }

    let strSaveAsImageOrPdfInner =
        '<ul class="content-ul">' +
        '<li >' +
        '   <p style="font-family: Oswald-Regular ;font-size: 16px;">Document Name:</p>' +
        '   <input type="text" size="20" id="txt_fileName" />' +
        '</li>';
        
    if (!bMobile) {
        strSaveAsImageOrPdfInner +=
            '<li class="dcs-inputLi">'+
            '	<label for="imgTypejpeg"><input type="radio" value="jpg" name="ImageType" id="imgTypejpeg" onclick ="selectFileType();"/>JPEG</label>' +
            '   <label for="imgTypetiff"><input type="radio" value="tif" name="ImageType" id="imgTypetiff" onclick ="selectTiff();"/>TIFF</label>' +
            '   <label for="imgTypePng"><input type="radio" value="png" name="ImageType" id="imgTypePng" onclick ="selectFileType();"/>PNG</label>' +
            '	<label for="imgTypepdf"><input type="radio" value="pdf" name="ImageType" id="imgTypepdf" onclick ="selectPdf();"/>PDF</label>' +
            '</li>' 
    }
    if (!bMobile) {
        strSaveAsImageOrPdfInner +=
            '<li class="dcs-inputLi">'+
            '   <label for="MultiPageTIFF"><input type="checkbox" id="MultiPageTIFF"/>Multi-Page TIFF</label>'+
            '   <label for="MultiPagePDF"><input type="checkbox" id="MultiPagePDF"/>Multi-Page PDF</label>' +
            '</li>'
    }
    if(fileType =="pdf" && bMobile){
        strSaveAsImageOrPdfInner +=
            '<li>'+
            '   <label for="MultiPagePDF"><input type="checkbox" id="MultiPagePDF"/>Multi-Page PDF</label>' +
            '</li>';
    }

    //save origin
    if(fileType =="image" && bMobile){
        strSaveAsImageOrPdfInner +=
            '<li>'+
            '   <label for="SaveOriginal"><input type="checkbox" id="SaveOriginal"/>Also Save The Original Image</label>' +
            '</li>';
    }

    if (fileType == "pdf" || !bMobile) {
        strSaveAsImageOrPdfInner +=
            '<li id="liPageSize" style="display:none">' +
            '   <label for="pageSize">' +
            '       <p>Page Size:</p>' +
            '   </label>' +
            '   <select size="1" id="pageSize">' +
            '       <option value = "0">A4</option>' +
            '       <option value = "1">Letter</option>' +
            '       <option value = "2">Legal</option>' +
            '   </select>' +
            '</li>';
    }
    strSaveAsImageOrPdfInner +=
        '<li id="liFileSize" style="display:none">' +
        '   <label for="fileSize">' +
        '       <p>File Size:</p>' +
        '   </label>' +
        '   <select size="1" id="fileSize">' +
        '       <option value = "0">Original Size</option>' +
        '       <option value = "1">Median Size</option>' +
        '       <option value = "2">Small Size</option>' +
        '   </select>' +
        '</li>';
    strSaveAsImageOrPdfInner +=
        '<li style="display:flex;justify-content: center;">' +
        '   <input class="btnOrg" type="button" value="SAVE" onclick ="' + btnOnClick + '"/>' +
        '</li>';
    return strSaveAsImageOrPdfInner;
}
//------------------------------------Upload----------------------------------------------------------------------//
function initUploadFormUI() {
    divUpload = document.getElementById("divUpload");
    if (!divUpload) {
        const div = document.createElement("div");
        div.innerHTML = initUploadFormHeader();
        div.className = "dcs-fullDialog";
        div.id = 'dcsUploadDialog'
        
        document.body.appendChild(div);
        initCommonFormUI();
    }
}
function initUploadFormHeader() {
    if (strUploadForm && strUploadForm.length > 0) return strUploadForm;

    let divId = "divUpload";
    let divTitle = "Upload Documents";
    let strSaveAndUpload = 
        `<div id="${divId}" class="divinput" >` +
        `	<ul style="height:100%">` +
        `		<li class="toggle">
                    <img src="./icon/icon_arrow_white.svg" id="btnClose" onclick="closeForm('upload')">
                    ${divTitle}` +
        `           <span></span>` +
        `       </li>` +
        initUploadFormContainer() +
        `	</ul>` +
        `</div>`;

    return strSaveAndUpload;
}
function initUploadFormContainer() {
    if(strUploadForm && strUploadForm.length > 0) return strUploadForm;
    
    let btnOnClick = "uploadToServer()"
    let strSaveAndUploadInner =
        '<ul class="content-ul">' +
        '   <li>' +
        '       <p style="font-family: Oswald-Regular; font-size: 16px;">Document Name:</p>' +
        '       <input type="text" size="20" id="txt_fileName" />' +
        '   </li>' +
        '   <li>';
    strSaveAndUploadInner +=
        '<label for="imgTypejpeg"><input type="radio" value="jpg" name="ImageType" id="imgTypejpeg" onclick ="selectFileType();"/>JPEG</label>';

    if(!bMobile) {
        strSaveAndUploadInner +=
        '<label for="imgTypetiff"><input type="radio" value="tif" name="ImageType" id="imgTypetiff" onclick ="selectTiff();"/>TIFF</label>' +
        '<label for="imgTypePng"><input type="radio" value="png" name="ImageType" id="imgTypePng" onclick ="selectFileType();"/>PNG</label>';
    }
    
    strSaveAndUploadInner +=
        '<label for="imgTypepdf"><input type="radio" value="pdf" name="ImageType" id="imgTypepdf" onclick ="selectPdf();"/>PDF</label>' +
        '<label for="MultiPagePDF" style="height:46px;padding-left:25px;border-left:1px solid #EEEEEE;"><input type="checkbox" id="MultiPagePDF"/>Multi-Page PDF</label>';

    if(!bMobile) {
        strSaveAndUploadInner +=
        '<label for="MultiPageTIFF"><input type="checkbox" id="MultiPageTIFF"/>Multi-Page TIFF</label>';
    }

    strSaveAndUploadInner +=
        '</li>';

    strSaveAndUploadInner +=
        '<li id="liPageSize" style="display:none">' +
        '    <label style="width:80px" for="pageSize">' +
        '        <p>Page Size:</p>' +
        '    </label>' +
        '    <select size="1" id="pageSize">' +
        '        <option value = "0">A4</option>' +
        '        <option value = "1">Letter</option>' +
        '        <option value = "2">Legal</option>' +
        '    </select>' +
        '</li>' +
        '<li id="liFileSize" style="display:none">' +
        '    <label style="width:80px" for="fileSize">' +
        '        <p>File Size:</p>' +
        '    </label>' +
        '        <select size="1" id="fileSize">' +
        '            <option value = "0">Original Size</option>' +
        '            <option value = "1">Median Size</option>' +
        '            <option value = "2">Small Size</option>' +
        '        </select>' +
        '</li>';
    strSaveAndUploadInner +=
        '<li style="position:relative; display:flex; flex-direction:column; align-items:flex-start">' +
        '   <p style="display:flex; font-family: OpenSans-Regular ">Optional Custom Info' +
        '   <span style="display:flex;justify-content:center;align-items:center;margin-left:5px;">' +
        '   <i class="iconfont icon-icon_info" onmouseover="showCustomInfo()" onmouseout="closeCustomInfo()"></i>'+
        '   </span>' +
        '   </p>' +
        '   <div id="uploadCustomInfo" class="uploadInfo">' +
        '       You can input any custom info to be uploaded with your images.' +
        '   </div>' +
        '   <input style="font-size:14px" type="text" id="txt_CustomInfo" value="">' +
        '</li>';
    strSaveAndUploadInner +=
        '<li style="display:flex;justify-content: center;">' +
        '   <input class="btnOrg" type="button" value="UPLOAD" onclick ="' + btnOnClick + '"/>' +
        '</li>'+
        '</ul>';
    strSaveAndUploadInner +=
        '<div class="section" style="box-sizing: border-box; width:100%;">' +
        '   <div style="font-family: Oswald-Regular ;font-size: 16px;">Uploaded Documents:</div>' +
        '   <div id="resultWrap" style="overflow-y: scroll;">' +
        '       <table id="div-uploadedFile" style="width: 100%;"></table>' +
        '   </div>' +
        '</div>';
    return strSaveAndUploadInner;
}
function getFileName(fileName, fileExtName) {
    const divUploadedFile = document.getElementById("div-uploadedFile");
    let strFileName = fileName + "." + fileExtName;

    if (divUploadedFile) {
        let i, newFileName;
        for (i = 0; i < divUploadedFile.childElementCount; i++) {
            if (divUploadedFile.children[0].innerText.split("	Del|Download|View")[0] == strFileName) {
                var Digital = new Date();
                newFileName = fileName + "_" + Digital.getMilliseconds();
                strFileName = newFileName + "." + fileExtName;
                break;
            }
        }

        if (i < divUploadedFile.childElementCount) {
            strFileName = getFileName(newFileName, fileExtName);
        }
    }

    return strFileName;
}
function printUploadInfo(info) {
    if (info.indexOf('DWTUploadFileName') != -1) {
        let url = 'http://' + location.hostname + ':' + location.port;
        let _strPort = location.port == "" ? 80 : location.port;

        DWObject.IfSSL = Dynamsoft.Lib.detect.ssl;

        if (Dynamsoft.Lib.detect.ssl == true) {
            _strPort = location.port == "" ? 443 : location.port;
            url = 'https://' + location.hostname + ':' + location.port;
        }

        let customInfo = info.substring(info.indexOf('FieldsTrue') + 11, info.indexOf('DWTUploadFileName'));
        let realFileName = info.substr(info.indexOf('UploadedRealFileName') + 21);
        let fileName = info.substring(info.indexOf('DWTUploadFileName') + 18, info.indexOf('UploadedRealFileName'));

        url += currentPath + '../UploadedImages/' + vSessionID + '/' + encodeURI(fileName);
        // url += currentPath + '../UploadedImages/' + encodeURI(fileName);

        let strImageName, strImageExtName, strCustomInfo;
        if (fileName.length > 25) {
            strImageName = fileName.substring(0, 10) + "..." + fileName.substring(fileName.length - 14, fileName.length);
        } else{
            strImageName = fileName;
        }

        if (customInfo.length > 25) {
            strCustomInfo = customInfo.substring(0, 10) + "..." + customInfo.substring(customInfo.length - 14, customInfo.length);
        } else{
            strCustomInfo = customInfo;
        }

        strImageExtName = "";

        if (fileName.length > 3) {
            strImageExtName = fileName.substring(fileName.length - 3, fileName.length);
        }
        else {
            strImageExtName = "tif";
        }

        try {
            const newTR = document.createElement('tr');
            newTR.style = "display: flex; flex-direction: column; align-items: flex-start; border-bottom: solid 1px #ccc";

            const newTD = document.createElement('td');
            newTD.innerHTML = "FileName: " + strImageName;

            const newTD2 = document.createElement('td');
            newTD2.style = "max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
            newTD2.innerHTML = "Custom Info: " + strCustomInfo;
            
            const _chkMultiPagePDF_upload = document.getElementById("MultiPagePDF");
            const _chkMultiPageTIFF_upload = document.getElementById("MultiPageTIFF");

            const newTD3 = document.createElement('td');

            newTR.appendChild(newTD);
            newTR.appendChild(newTD2);

            let realfileName1 = realFileName.replace("\\", "\\\\");
            let multi;
            if (_chkMultiPagePDF_upload && _chkMultiPagePDF_upload.checked) {
                multi = true;
            } else if (_chkMultiPageTIFF_upload && _chkMultiPageTIFF_upload.checked) {
                multi = true;
            } else {
                multi = false;
            }
            _str = 
                "<a href = '#' onclick='delUploadInfo(this, \"" + realfileName1 + "\");'>Delete</a>" +
                "<span> | </span><a  target='_blank' href = 'online_demo_download.aspx?ImageName=" + realFileName + "&ImageExtName=" + strImageExtName + "'>Download</a>" +
                "<span> | </span><a href = '#' data-count=" + DWObject.SelectedImagesIndices.length + " data-multi=" + multi + " onclick='viewUploadInto(\"" + realfileName1 + "\");'>View</a>";
            
            newTD3.innerHTML = _str;
            newTR.appendChild(newTD3);

            document.getElementById('div-uploadedFile').appendChild(newTR);
        } catch (exp) {
            console.log(exp.message);
        }
    }
    //Scroll Bottom
    const resultWrap = document.getElementById("resultWrap")
    resultWrap.scrollTop = resultWrap.scrollHeight;
}
function showCustomInfo() {
    document.getElementById('uploadCustomInfo').style.display = "block";
}
function closeCustomInfo() {
    document.getElementById('uploadCustomInfo').style.display = "none";
}
function delUploadInfo(Obj, fileName) {
    let ajax = new XMLHttpRequest();
    Obj.parentNode.parentNode.parentNode.removeChild(Obj.parentNode.parentNode);
    ajax.open('get', "DeleteFile.aspx?ImageName=" + fileName);
    ajax.send();
}
function viewUploadInto(fileName) {
    if (location.port == '') {
        DWObject.HTTPPort = Dynamsoft.Lib.detect.ssl ? 443 : 80;
    } else {
        DWObject.HTTPPort = location.port;
    }

    DWObject.IfSSL = Dynamsoft.Lib.detect.ssl;

    // get current PathName in plain ASCII	
    let currentPathName = unescape(location.pathname);	
    let currentPath = currentPathName.substring(0, currentPathName.lastIndexOf("/") + 1);
    //the ActionPage's file path
    let strHTTPServer = location.hostname;
    let type = fileName.slice(-3);

    initViewFrom(type);
    DWObject.HTTPDownload(strHTTPServer, currentPath + '/UploadedImages/' + vSessionID + '/' + fileName, () =>{}, (code, string) => {console.log(string)});
}
function initViewFrom(type) {
    selectImageCount = event.target.dataset.count;
    currentSelected = selectImageCount;
    temSelectArray = DWObject.SelectedImagesIndices;
    DWObject.Viewer.unbind();
    //Unbind bufferChanged
    DWObject.RegisterEvent("OnBufferChanged", (e) => {
        if (e.action == "shift") {
            currentSelected = e.imageIds.getArrayIndex(e.currentId) + 1;
            document.getElementById('current').innerHTML = `${currentSelected}/${selectImageCount}`;
        }
    });

    const div = document.getElementById('dcsUploadViewPage');
    div.style.position = "absolute";
    div.style.zIndex = "999";

    let preview = [
        `<div id="uploadPageTab" class="dcs-upload-tab">`,
        `<img style="left:15px; position:absolute;" onclick="closeViewForm()" src="./icon/icon_arrow_white.svg"/>`
    ].join('');
    
    if ((type == 'pdf' || type == 'tif') &&  event.target.dataset.multi == 'true') {
        preview += `<span id="current" style="margin:0 auto">${currentSelected}/${selectImageCount}</span>`;
    }else if(type == 'pdf' && event.target.dataset.multi == 'false') {
        preview += `<span id="current" style="margin:0 auto">PDF</span>`
    }else if(type == 'tif' && event.target.dataset.multi == 'false') {
        preview += `<span id="current" style="margin:0 auto">TIFF</span>`
    }else {
        preview += `<span id="current" style="margin:0 auto">Image</span>`
    }
    preview += `</div>` + `<div id="uploadViewer"></div>`;

    div.innerHTML = preview;
    DWObject.Viewer.bind(document.getElementById('uploadViewer'));
    DWObject.Viewer.width = document.documentElement.clientWidth;
    DWObject.Viewer.height = document.documentElement.clientHeight - 48;
    DWObject.CreateDocument('tmpFile');
    DWObject.OpenDocument('tmpFile');
    if (bMobile) {
        DWObject.Viewer.setViewMode(-1, -1);
    } else {
        DWObject.Viewer.setViewMode(1, 1);
        DWObject.Viewer.cursor = "pointer";
    }
    document.getElementById('dcsUploadViewPage').style.display = 'block';
    DWObject.Viewer.show();
}
function closeViewForm() {
    //Rebind viewer bufferChanged
    DWObject.Viewer.unbind();
    DWObject.Viewer.bind(null, template);
    DWObject.Viewer.setViewMode(2, 2);
    DWObject.RemoveDocument('tmpFile');
    DWObject.OpenDocument(fileName);
    DWObject.RegisterEvent("OnBufferChanged", (e) => bufferChanged(e));
    DWObject.Viewer.selectionMode = 0;

    document.getElementById('uploadPageTab').style.display = 'none';
    DWObject.Viewer.show();
}
//-----------------------------Save/Upload common function-----------------------------------------------------------------------//
function setFromDefaultValue() {
    const imgTypePng = document.getElementById("imgTypePng");
    const txtFileName = document.getElementById("txt_fileName");
    const multiPageTIFF = document.getElementById("MultiPageTIFF");
    const multiPagePDF = document.getElementById("MultiPagePDF");

    if (bMobile) {
        setPageAndFileSizeDisplay(false, true);
    } else {
        if (imgTypePng){
            setPageAndFileSizeDisplay(false, true);
            imgTypePng.checked = true;
        }
    }

    if (txtFileName) txtFileName.value = checkFileName(fileName);
    if (multiPageTIFF) multiPageTIFF.disabled = true;
    if (multiPagePDF) multiPagePDF.disabled = true;
}
function selectFileType(fileType = "") {
    const multiPageTIFF = document.getElementById("MultiPageTIFF");
    const multiPagePDF = document.getElementById("MultiPagePDF");
    
    if(multiPageTIFF) {
        multiPageTIFF.checked = false
        multiPageTIFF.disabled = (fileType === "tiff") ? false : true;
    }

    if(multiPagePDF) {
        multiPagePDF.checked = (fileType === "pdf") ? true : false;
        multiPagePDF.disabled = (fileType === "pdf") ? false : true;
    }


    if(fileType === "pdf") {
        setPageAndFileSizeDisplay(true,false);
    } else {
        setPageAndFileSizeDisplay(false,true);
    }
}
function selectTiff() {
    selectFileType("tiff");
}
function selectPdf() {
    selectFileType("pdf");
}
function setPageSize() {
    const pageSize = document.getElementById("pageSize");
    if (pageSize) {

        let iPageType = 0;
        switch (pageSize.item(pageSize.selectedIndex).value) {
            case "0":
                iPageType = 2;
                break;
            case "1":
                iPageType = 6;
                break;
            case "2":
                iPageType = 8;
                break;
            default:
                iPageType = 2;
                break;
        }
        DWObject.Addon.PDF.Write.Setup({ pageType: iPageType });
    }
}
function setFileSize() {
    const fileSize = document.getElementById("fileSize");
    if (fileSize) {
        let iScaleDownThreshold = 0;
        switch (fileSize.item(fileSize.selectedIndex).value) {
            case "0":
                iScaleDownThreshold = 0;
                break;
            case "1":
                iScaleDownThreshold = 2200;
                break;
            case "2":
                iScaleDownThreshold = 1100;
                break;
            default:
                iScaleDownThreshold = 0;
                break;
        }
        DWObject.ScaleDownThreshold = iScaleDownThreshold;
    }
}
function checkViewerBuffer() {
    if (DWObject.HowManyImagesInBuffer == 0) {
        console.log("There is no image in buffer.")
        return false;
    }
    return true;
}
function setPageAndFileSizeDisplay(bShowPageSize, bShowFileSize) {
    const liPageSize = document.getElementById("liPageSize");
    const liFileSize = document.getElementById("liFileSize");
    if (liPageSize) {
        liPageSize.style.display = bShowPageSize ? "" : "none"
    }
    if (liFileSize) {
        liFileSize.style.display = bShowFileSize ? "" : "none"
    }
}