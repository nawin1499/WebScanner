//Rendered after the data transfer is complete
class renderQueue {
    constructor(){
        this.task = [];
        this.running = false;
    }
    addTask(fn){
        this.task.push(fn)
        if(this.task.length > 0 && !this.running){
            this.running = true;
            this.run();
        }
    }
    run(){
        const taskItem = this.task.shift()
        if( taskItem ) {
            taskItem.then(() => {this.run()})
        } else {
            //main purpose
            renderMainPage();
            this.running = false;
        }
    }
}

var DWObject;
// Task renderQueue
const myQueue = new renderQueue();
// Local database
const myStore = localforage.createInstance( { name:"DynamicDatabase" } );
// Record picture location
let template
let fileName;
// on the document page
let fileMode = false;   
let currentImageIds = [];
let isRemove = false;
let isSelected = false;
let fileGroups = {}, fileTimes = {};
//-----------------------------------------------------init-----------------------------------------------------------------------//
function initDwt(){
    Dynamsoft.DWT.UseLocalService=false;
    Dynamsoft.DWT.Containers = [{ ContainerId: 'WasmObj'}];
    Dynamsoft.DWT.RegisterEvent('OnWebTwainReady', function(){
        DWObject = Dynamsoft.DWT.GetWebTwain('WasmObj');
        DWObject.Viewer.background = '#F0EFF4';
        DWObject.RegisterEvent("OnBufferChanged", (e) => bufferChanged(e));
        //Viewer binding template. Currently only supported 'documentScanner'
        template = DWObject.Viewer.createTemplate("documentScanner", showVideoConfigs);

        template.onAddDocumentFunc = () => { onAddDocumentFunc() };
        template.onUploadFunc = () => { initUploadForm() };
        template.onExitFunc = () => { exitFunc() };
        template.onSaveFunc = () => { isMobile() ? showBottomToolBar() : initSaveForm("pdf") };
        template.onRemoveSelectedFunc = () => {
            let title = 'Are you sure to delete the selected image(s)?';
            initConfirmDialog(title, 'removeSelectedImage()');
        };


        DWObject.Viewer.bind(null, template);
        updateViewerCaptureBtnClass();
        // Scan buttons's special behavior within a Viewer page
        DWObject.Viewer.on("click",() => {
            hiddenCaptureBtn();
        })

        DWObject.Addon.Camera.on("video-error",(err) => {
            if(err.code == -4218) initInfoDialog(err.message);
        });

        window.addEventListener("unload",function(){
            Dynamsoft.DWT.Unload()
        })
    });
    Dynamsoft.DWT.Load();
    initModeSelection();
}

//Obtain the stored file and image data from indexedDb
function initFileData(){
    myStore.keys().then((key) => {
        for(let i =0;i< key.length; i++){
            //Search file keys
            if(key[i].slice(0,3) === 'dcs'){
                //Get the document data in the indexedDb
                //(fileName) key:"dcs2022-12-12 18:11:10"
                //(imageId) value:"['2022-12-12 16:51:10_TrtNt']"
                myQueue.addTask(myStore.getItem(key[i]).then((value) => {
                    fileGroups[key[i]] = value;
                }))
            }
            ///Get the Image ID in this file 
            if(key[i].slice(0,4) === 'Time'){
                myStore.getItem(key[i]).then((value) => {
                    fileTimes[key[i]] = value;
                })
            }
        }
    })
}
function createDocument() {
    if(!DWObject) return;

    const Date = getFormateDate().currentTime_info;
    fileName = getFormateDate().currentTime_title;
    fileMode = true;

    // Record the time when the file was created
    myStore.setItem('dcs'+ fileName, []);
    myStore.setItem("Time&"+ fileName, Date);
    fileGroups['dcs'+ fileName] = [];
    fileTimes['Time&'+ fileName] = Date;

    DWObject.CreateDocument(fileName);
    DWObject.OpenDocument(fileName);

    DWObject.Viewer.background = '#F0EFF4';
    DWObject.Viewer.show();
    DWObject.Addon.Camera.scanDocument(showVideoConfigs)
    .catch(
        err => { 
            exitFunc();
            initInfoDialog(err);
        }
    );
    
    //avoid emit selectScanMode
    const mainPage = document.getElementById('dcsMainPage');
    mainPage.style.display = "none";
    closeModeSelectionBox();
}
function exitFunc(){
    fileMode = false;
    renderMainPage();
    hiddenCaptureBtn();

    DWObject.Viewer.hide();
    DWObject.RemoveDocument(DWObject.GetCurrentDocumentName());
    document.getElementById('dcsMainPage').style.display = 'block';
}
//-----------------------------------------------------render Main page-----------------------------------------------------------------//
//Render Main Page
async function renderMainPage(){
    const ul = document.getElementById('dcsMainUl');
    ul.innerHTML= '';

    // Iterate over all the document data
    for(key in fileGroups){
        if(fileGroups[key].length > 0){
            // Use the first image in the document as the cover
            // Get the image data from the indexedDB
            const value = await myStore.getItem(fileGroups[key][0]);
            if(!value) continue;

            const item = document.createElement("li");
            item.className = 'dcs-main-content-li';
            item.innerHTML = renderDocumentInfo(value, fileGroups['dcs'+ value.filename].length,'dcs'+ value.filename);
            item.onclick = () => intoDocumentPage(fileGroups['dcs'+ value.filename].length, 'dcs'+ value.filename);

            ul.append(item);
        }else{
            // Delete the document data without images
            myStore.removeItem(key);
            myStore.removeItem("Time&"+ key.slice(3));
        }
    }
}
//Into DocumentPage
async function intoDocumentPage(count, filename) {
    fileName = filename.slice(3);
    document.getElementById("dcsMainPage").style.display = "none";

    if (DWObject.CreateDocument(fileName)) {
        DWObject.OpenDocument(fileName);
        DWObject.Viewer.show();
        for (let i = 0; i < count; i++) {

            //Get Document data 
            const value = await myStore.getItem(fileGroups[filename][i]);
            if(!value) continue;

            // Get imageType
            let imageType = 'image/jpeg'
            // Avoid data as an empty string
            if(value.customData && value.customData.oriBlob && value.customData.oriBlob.blobType){
                if(value.customData.oriBlob.blobType !== "") imageType = value.customData.oriBlob.blobType;
            } else {
                if(value.blobType !== "") imageType = value.blobType;
            }

            const oriData = arrayBufferToBlob(value.oriData, imageType);
            await new Promise((rs,rj)=>{
                DWObject.LoadImageFromBinary(oriData, rs, rj)
                }
            );

            const data = await DWObject.GetImageDataAsync(DWObject.CurrentImageIndexInBuffer);
            const imageData = arrayBufferToBlob(value.customData.oriBlob.imageData, imageType);
            const oriBlob = {
                ...value.customData.oriBlob,
                imageData: imageData
            };
            const newCustomData = {
                ...value.customData,
                oriBlob: oriBlob,
                ...data.customData
            };
            await DWObject.SetCustomDataAsync(DWObject.CurrentImageIndexInBuffer, newCustomData);
        }
    } else {
        DWObject.OpenDocument(fileName);
        DWObject.Viewer.show()
    }

    closeModeSelectionBox();
    fileMode = true;
}
//Render Document Info
function renderDocumentInfo(data,count,filename){
    let str = '';
    let imageType = data.customData.oriBlob.blobType;
    let oriData = arrayBufferToBlob(data.oriData,imageType); 
    let imageUrl = URL.createObjectURL(oriData);
    let name = filename.slice(3);
    str +=[`<img class='dcs-main-content-img' src="${imageUrl}" alt="">`,
            `<div class='dcs-main-content-info'>`,
                    `<p class="dcs-basic-font" style="color: #323234;font-size:18px;">${name}</p>`,
                    `<div style='display: flex; align-items: center; color:#323234;'>`,
                    `<span style="display: flex; align-items: center">`,
                    `<i class="iconfont icon-icon_documents" style="font-size: 20px"></i>`,
                    `<p style="font-family: OpenSans-Regular; font-weight:600">&nbsp${count}</p>`,
                    `<p style="font-family: OpenSans-Regular; font-size:14px">&nbsppages</p>`,
                    `</span></div>`,
            `</div>`,
        `<div onclick="initDelDocumentUI('${filename}',${count})" style='font-size:22px; color:rgba(252, 56, 56)' class="dcs-delete icon-dwt-delete"></div>`,
        `<input onclick="event.stopPropagation();" class='dcs-main-checkbox' type="checkbox" name='ImageFile' value='${filename}'>`
    ].join('');
    return str;
}
//Delete a file data 
function initDelDocumentUI(filename,count){
    window.event.stopPropagation();
    let title = 'Are you sure to remove this item ?';
    let fn = `delDocument('${filename}',${count})`;
    initConfirmDialog(title , fn);
}
function delDocument(filename,count){
    for(let i =0; i<count; i++ ){
        myQueue.addTask(myStore.removeItem(fileGroups[filename][i]));
    }
    delete fileGroups[filename];
    myStore.removeItem(filename);
    myStore.removeItem("Time&"+filename.slice(3));	
    closeDialog();
}
//----------------------------------------------------------------------------------------------------------------------------------------//
// Create new File and into scanDocument mode
async function bufferChanged(e){
    //Add image data to buffer && database
    if(e.action === 'add'){
        let cIndex = DWObject.CurrentImageIndexInBuffer;
        let Index = DWObject.HowManyImagesInBuffer - 1;
        currentImageIds = e.imageIds;
        DWObject.GetImageDataAsync(cIndex).then( data => {
            //The file already exists in the database
            if(data.customData.oriBlob == undefined && fileMode == false) return;
            let imageKey = fileGroups['dcs'+fileName][Index] 
                ? fileGroups['dcs'+fileName][Index] 
                : fileName+'_'+getRandomKey(5);
            if(!fileGroups['dcs'+fileName].includes(imageKey)){
                fileGroups['dcs'+fileName].splice(cIndex,0,imageKey);
            }
            if(data.customData.oriBlob == undefined && fileMode == true){
                saveFullDataToDB(imageKey,data);
            }else{
                saveDataToDB(imageKey,data);
            }
            myStore.setItem('dcs'+fileName,fileGroups['dcs'+fileName]);
        })
    };
    //Modify image data
    if(e.action === 'modify'){
        let pageUid = e.pageUid;
        let imageData = await DWObject.Viewer._webViewer.GetImageData(pageUid);
        let imageId = 239514000 + imageData.customData.imageId;
        let Index = DWObject.ImageIDToIndex(imageId)
        if(Index === -1) return;
        DWObject.GetImageDataAsync(Index).then( data => {
            saveDataToDB(fileGroups['dcs'+fileName][Index],data);
        });
    }
    //Shift image
    if(e.action === 'shift'){
        if(e.currentId == -1) return;
        //Get image moving position
        pos = compareArray(e.currentId,currentImageIds,e.imageIds);
        //Shift db location
        dragArray(fileGroups['dcs'+fileName],pos[0],pos[1]);
        currentImageIds = e.imageIds;
        myStore.setItem('dcs'+fileName,fileGroups['dcs'+fileName]).then(() => renderMainPage());
    }
    if(e.action == 'filter'){
        currentImageIds = e.imageIds;
    }
    if(e.action == 'remove'){
        //remove By selected
        if(isSelected) return;
        //remove By viewer btn
        let index = DWObject.ImageIDToIndex(e.currentId);
        let imageKey;
        if(index === -1 && !isRemove) return;
        if(index === -1 && isRemove) {
            imageKey = fileGroups['dcs'+fileName][0];
        }else {
            imageKey = fileGroups['dcs'+fileName][index];
        }
        myQueue.addTask(myStore.removeItem(imageKey));      
        fileGroups['dcs'+fileName].splice(index,1);
        myQueue.addTask(myStore.setItem('dcs'+fileName,fileGroups['dcs'+fileName]));
        isRemove = false;
    }
};
// Add/Set Image data to database   
function saveDataToDB(imageKey,data){
    // blobToArrayBuffer will return promise
    Promise.all([blobToArrayBuffer(data.customData.oriBlob.imageData),blobToArrayBuffer(data.oriData)]).then(
        (value) => {
            let imageData = value[0];
            let oriData = value[1];
            //Image data in database
            let ImageData = {
                filename:fileName,
                imageKey: imageKey,
                imageTime : getFormateDate().currentTime_info,
                customData : {
                    angle: data.customData.angle,
                    detectArea: data.customData.detectArea,
                    filterValue: data.customData.filterValue,
                    oriBlob: {...data.customData.oriBlob,imageData}
                },
                oriData,
                blobType: data.oriData.type,
                metadata : data.metadata,
            };
            myQueue.addTask(myStore.setItem(imageKey,ImageData).catch(err => alert(err)));
        }
    )
}
function saveFullDataToDB(imageKey,data){
    const type = data.oriData.type === "" ? 'image/jpeg' : data.oriData.type;

    blobToArrayBuffer(data.oriData).then((value) => {
        let ImageData = {
            filename:fileName,
            imageKey: imageKey,
            imageTime : getFormateDate().currentTime_info,
            customData : {
                angle: 0,
                detectArea: data.customData.detectArea,
                filterValue: "original",
                oriBlob : {
                    blobType : type,
                    code : 0,
                    imageBitDepth: 24,
                    imageData : value,
                    imageHeight: data.metadata.height,
                    imageWidth: data.metadata.width,
                    imageXResolution: data.metadata.resolutionX,
                    imageYResolution: data.metadata.resolutionY,
                    message: "Successful."
                }
            },
            oriData : value,
            blobType: type,
            metadata : data.metadata,
        };   
        myQueue.addTask(myStore.setItem(imageKey,ImageData).catch(err => alert(err)));
    })
}
//Delete selected image
function removeSelectedImage(){
    //sort by int
    isSelected = true;
    let selectImage = DWObject.SelectedImagesIndices.sort(function(a, b){return a-b});
    for(let i =0; i<selectImage.length; i++){
        let pos = selectImage.length-1-i;
        let imageKey = fileGroups['dcs'+fileName][selectImage[pos]];
        myQueue.addTask(myStore.removeItem(imageKey));      
        fileGroups['dcs'+fileName].splice(selectImage[pos],1);
    }
    myQueue.addTask(myStore.setItem('dcs'+fileName,fileGroups['dcs'+fileName]));
    // prohibit commit bufferChange
    DWObject.RemoveAllSelectedImages();
    document.getElementById('maskDiv').style.display = 'none';
    Dynamsoft.DWT.CloseDialog();
    isSelected = false;
}
//----------------------------------------------delete selected File--------------------------------------------------------------------------//
//Clear all data
async function clearDbData(){
    myStore.clear().then(() => {
        fileGroups = {};
        fileTimes = {};
        renderMainPage();
    })
}
//initDbByDate('06/30/2022');
async function initDbByDate(date){
    const dateArray = [];
    const key = await myStore.keys()
    for(let i =0;i< key.length; i++){
        if(key[i].slice(0,4) === 'Time'){
            const date = await myStore.getItem(key[i]);
            dateArray.push(date)
        }
    }

    for(let i=0; i<dateArray.length; i++){
        if(dateArray[i] < date) {
            await myStore.clear();
            break;
        }
    }

    initFileData();
}
//----------------------------------------------dwt18.0  Added Android scanning and modified UI--------------------------------------------------------------------------------//
function initModeSelection(){
    const scan = document.getElementById("dcsSelectionScan");
    const camera = document.getElementById("dcsSelectionCamera");

    scan.addEventListener("click",(e) => {
        e.stopPropagation();
        createScanObject();
    });

    camera.addEventListener("click",e => {
        e.stopPropagation();
        createDocument();
    })
}

function onAddDocumentFunc(){
    if(Dynamsoft.navInfo.biPad || Dynamsoft.navInfo.biPhone){
        DWObject.Addon.Camera.scanDocument(showVideoConfigs);
        return;
    } 

    const dcsDocumentCapture = document.getElementById('dcsDocumentCapture');
    if(dcsDocumentCapture){
        const display = dcsDocumentCapture.style.display
        if(display === "none") dcsDocumentCapture.style.display = "";
        if(display === "") dcsDocumentCapture.style.display = "none";
    } else {
        document.body.appendChild(createSelectionBox());
    }
}

function createSelectionBox(){
    const scanModeSelection = document.createElement("div");
    scanModeSelection.id = "dcsDocumentCapture";
    scanModeSelection.className = "dcs-main-documentCaptureBtn";

    const box = document.createElement("div");
    box.className = "dcs-main-selectionBox";

    const scanner = document.createElement("div");
    scanner.className = "dcs-main-selectionBox-iconBox";
    scanner.id = "dcsDocumentScanBtn";
    scanner.innerHTML = [
        `<img src="./icon/icon_scanner.svg"></img>`,
        `<span>Scanner</span>`
    ].join("");

    const camera = document.createElement("div");
    camera.className = "dcs-main-selectionBox-iconBox";
    camera.id = "dcsDocumentCameraBtn";
    camera.innerHTML = [
        `<img  style="margin-top:6px" src="./icon/icon_camera.svg"></img>`,
        `<span >Camera</span>`
    ].join("");

    const triangle  = document.createElement("div");
    triangle.className = "triangle";

    box.appendChild(scanner);
    box.appendChild(camera);

    scanModeSelection.appendChild(box);
    scanModeSelection.appendChild(triangle);

    scanner.addEventListener("click",() => {
        hiddenCaptureBtn();
        createScanObject(() => {
            DWObject.Viewer.hide();
        });
     });

    camera.addEventListener("click",() => { 
        hiddenCaptureBtn();
        DWObject.Addon.Camera.scanDocument(showVideoConfigs) 
    });

    return scanModeSelection;
}

function hiddenCaptureBtn(){
    const dcsDocumentCapture = document.getElementById('dcsDocumentCapture');
    if(dcsDocumentCapture) dcsDocumentCapture.style.display = "none";
}

function updateViewerCaptureBtnClass(){
    const btn = document.getElementById("btnCapture"+DWObject.Viewer.idPostfix);
    btn.className = "dynamsoft-dwt-btnCapture";

    const img = document.createElement("img");
    img.style=" margin-left:6px ";
    img.src = './icon/icon_addDoc.svg';

    btn.appendChild(img);
}