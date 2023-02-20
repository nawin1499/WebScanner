//-------------------------------------------------global variable -------------------------------------------------//
//Document scanner config
let tipSuccessCount = 0;
let tipFailCount = 0;
let showVideoConfigs = {
    //element: document.getElementById("divImageEditor"),
    scannerViewer: {
        //deviceId: string,
        continuousScan: false,   
        maxDocuments: 50,
        enableBorderDetector: true, //Default:true			
        fullScreen: false,
        polygonStyle: {
            stroke: "#fe8e14",            //default: "#fe8e14"
            strokeWidth: "2px",       //default: "2px"
            dash: "solid " //    "solid ", "dashed"    default: "solid "
        },
        resolution: {
            visibility: true,
            valueList: [{
                label: "720P",
                value: { width: 1280, height: 720 }
            },
            {
                label: "1080P",
                value: { width: 1920, height: 1080 }
            },
            {
                label: "1440P",
                value: { width: 2560, height: 1440 }
            },
            {
                label: "2160P",
                value: { width: 3840, height: 2160 }
            }
            ],
            defaultValue: { width: 1280, height: 720 }
        },
        autoScan: {
            visibility: true,
            enableAutoScan: true
        },
        autoDetect: {
            visibility: true,
            enableAutoDetect: true,
            acceptedPolygonConfidence: 80,
            fpsLimit: 3,

            acceptedBlurryScore: 0,
            autoCaptureDelay: 1000,
            processFrame: function (result, context) {
                let c = result.confidence;
                let confidence = (c[1] * 0.3 + Math.min(1, c[2] * 2) * 0.3 + c[3] * 0.3 + 0.1) * 100;

                if ((confidence >= context.acceptedPolygonConfidence) && (result.blurryScore >= context.acceptedBlurryScore)) {
                    tipSuccessCount ++;
                    if( tipSuccessCount > 5 ) {
                        initScanTips("Don't move");
                    }
                    if( tipSuccessCount === 5 || tipSuccessCount > 20 ){
                        closeScanTips();
                    }
                    return true;
                }

                if ((c[1] * 0.45 + c[3] * 0.45 + 0.1) * 100 >= context.acceptedPolygonConfidence) {
                    // initScanTips("The document is too small. Try moving closer.");
                    tipSuccessCount = 0;
                    tipFailCount = 0;
                    initScanTips("Move closer");
                } else if ((c[1] * 0.45 + Math.min(1, c[2] * 2) * 0.45 + 0.1) * 100 >= context.acceptedPolygonConfidence) {
                    // initScanTips("Try holding the device at the center of the document.");
                    tipSuccessCount = 0;
                    tipFailCount = 0;
                    initScanTips("Center the Doc");
                } else if ((Math.min(1, c[2] * 2) * 0.45 + c[3] * 0.45 + 0.1) * 100 >= context.acceptedPolygonConfidence) {
                    // initScanTips("This is a bad camera angle. Hold the device straight over the document.");
                    tipSuccessCount = 0;
                    tipFailCount = 0;
                    initScanTips("Hold Device over the Doc");
                } else {
                    tipFailCount++
                }

                if( tipFailCount > 5 ) {
                    closeScanTips();
                    tipSuccessCount = 0;
                    tipFailCount = 0;
                };
                return false;
            }
        },
        switchCamera: {
            visibility: true
        },

        loadLocalFile: {
            visibility: true
        },
        'funcConfirmExit': funcConfirmExit,
    },
    documentEditorSettings:{
        defaultViewerName: "",
        insert: {
            visibility: true,   //Default：true
            position: "before"  //“before” “after”, default: “before”
        },
        remove: {
            visibility: true,   //Default：true
            'funcConfirmRemove':funcConfirmRemove
        },
        rotateLeft: { 
            visibility: true   //Default：true
        },
        filter: {
            visibility: true,
            valueList: [{
                label: "Original",
                value: "original",
                option: {
                    level: 1   //1,2,3  
                }
            }, {
                label: "B&W",  //"blackAndWhite",
                value: "blackAndWhite",
                option: {
                    level: 1
                }
            }, {
                label: "Grayscale",
                value: "grayscale",
                option: {
                    level: 1
                }
            }, {
                label: "Clean",  //removeShadow->clean
                value: "clean",
                option: {
                    level: 1
                }
            }, {
                label: "Brightening",
                value: "brightening",
                option: {
                    level: 1
                }
            }, {
                label: "Save Toner",
                value: "saveToner",
                option: {
                    level: 1
                }
            }],
            defaultValue: "original"
        },
        'funcConfirmExit': funcConfirmMainViewerExit,  
    }
};
function funcConfirmExit(bExistImage) {
    let msg = "Are you sure you want to exit without saving?";
    closeScanTips();
    if (bExistImage) {
      return initConfirmDialogAsync(msg, true, false)
    } else {
      return Promise.resolve(true);
    }
}

function funcConfirmMainViewerExit(bChanged, previousViewerName) {
    if (previousViewerName == "" && bChanged) {
      let msg = "Are you sure you want to exit without saving?";
      return initConfirmDialogAsync(msg, Dynamsoft.DWT.EnumDWT_ConfirmExitType.Exit, Dynamsoft.DWT.EnumDWT_ConfirmExitType.Cancel)
    } else if (previousViewerName == "cropViewer" && bChanged) {
      return Promise.resolve(Dynamsoft.DWT.EnumDWT_ConfirmExitType.SaveAndExit);
    }
    return Promise.resolve(Dynamsoft.DWT.EnumDWT_ConfirmExitType.Exit);
};

function funcConfirmRemove() {
    let msg = "Are you sure you want to delete this image?";
    return initConfirmDialogAsync(msg, true, false, true);
}