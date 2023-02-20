var ScanDWObject;
const currentDeviceList = [];
const deviceType = [
    { id: "dcsTypeTWAIN", text: "TWAIN", enum: 16, checked: 'checked', show: true },
    { id: "dcsTypeWIATWAIN", text: "WIATWAIN", enum: 32, checked: 'checked', show: true },
    { id: "dcsTypeTWAINX64", text: "TWAINX64", enum: 64, checked: 'checked', show: true },
    { id: "dcsTypeICA", text: "ICA", enum: 128, checked: 'checked', show: true },
    { id: "dcsTypeSANE", text: "SANE", enum: 256, checked: 'checked', show: true },
    { id: "dcsTypeESCL", text: "ESCL", enum: 512, checked: '', show: true },
    { id: "dcsTypeWIFIDIRECT", text: "WIFIDIRECT", enum: 1024, checked: '', show: true }
]

let dwtPort = 18622;
let connectServiceCount = 0;
if (location.protocol == "http:") {
    dwtPort = Dynamsoft.DWT.Port;
} else {
    dwtPort = Dynamsoft.DWT.SSLPort;
}

function DWT_Reconnect(callBack) {
    Dynamsoft.DWT.CheckConnectToTheService(Dynamsoft.DWT.Host, dwtPort, function () {
        if (callBack && typeof callBack === "function") {
            callBack();
        }
    }, () => {
        if (connectServiceCount > 3) return;
        DWT_Reconnect(callBack)
        connectServiceCount++
    });
}

function selectScanMode() {
    if (Dynamsoft.navInfo.biPad || Dynamsoft.navInfo.biPhone) {
        createDocument();
    } else {
        const selectionBox = document.getElementById("dcsSelectionBox");
        selectionBox.style.display = selectionBox.style.display === "none" ? "" : "none";
    }
}

function closeModeSelectionBox() {
    const selectionBox = document.getElementById("dcsSelectionBox");
    selectionBox.style.display = "none";
}

function createScanDocument() {
    if (!ScanDWObject || !DWObject) return;
    if (DWObject.GetCurrentDocumentName() != "") return;
    fileMode = true;
    fileName = getFormateDate().currentTime_title;
    DWObject.CreateDocument(fileName);

    const date = getFormateDate().currentTime_info;
    // Record the time when the file was created
    myStore.setItem('dcs' + fileName, []);
    myStore.setItem("Time&" + fileName, date);
    fileGroups['dcs' + fileName] = [];
    fileTimes['Time&' + fileName] = date;

    DWObject.OpenDocument(fileName);
    if (DWObject.Viewer) DWObject.Viewer.background = "#F0EFF4";
}

function createScanObject(callBack) {
    closeModeSelectionBox();

    const scanPage = document.getElementById("dcsAndroidScanPage");
    const mainPage = document.getElementById("dcsMainPage");
    if (ScanDWObject && scanPage) {
        if (callBack && typeof callBack === "function") callBack();
        mainPage.style.display = "none";
        scanPage.style.display = ""
    } else {
        Dynamsoft.DWT.CreateDWTObjectEx({
            WebTwainId: "ServiceObj",
            UseLocalService: true,
        }, function (obj) {
            ScanDWObject = obj;
            if (callBack && typeof callBack === "function") callBack();

            if (Dynamsoft.navInfo.bMobile) {
                deviceType[5].checked = "checked";
                deviceType[6].checked = "checked";
            }

            showAndroidScanPage();
            createScanDocument();

            const sourceDom = document.getElementById("dcsSource")
            ScanDWObject.GetDevicesAsync(getDevicesEnum()).then(function (deviceList) {
                for (var i = 0; i < deviceList.length; i++) {
                    sourceDom.options.add(new Option(deviceList[i].displayName))
                }
                currentDeviceList.push(...deviceList)
                changeShowUIBySelectSource();
                setAcquireBtnDisabled()
            })
        }, function (err) {
            initScanTips(err);
            connectServiceCount = 0;
            DWT_Reconnect(() => {
                createScanObject()
            }
            )
        });

    }
}

function showAndroidScanPage() {
    document.getElementById("dcsMainPage").style.display = "none";

    const page = document.createElement("div");
    page.id = "dcsAndroidScanPage";

    let header = [
        `<div class="dcs-upload-tab">`,
        `<img style="left:15px; position:absolute;" onclick="backToMain()" src="./icon/icon_arrow_white.svg"/>`,
        `<span id="current" style="margin:0 auto">Scan</span>`,
        `</div>`,
    ].join('');

    page.innerHTML = header;
    const container = getScanPageContainer();
    page.append(container);

    document.body.append(page);
}

function acquireImage() {
    const sourceIndex = document.getElementById("dcsSource").selectedIndex;
    const device = currentDeviceList[sourceIndex];
    const Resolution = parseInt(document.getElementById("dcsResolution").value);
    const PixelType = parseInt(document.getElementById("dcsPixelType").value);
    const IfFeederEnabled = document.getElementById("dcsFeeder").checked;
    const IfShowUI = document.getElementById("dcsShowUI").checked;
    const IfDuplexEnabled = document.getElementById("dcsDuplex").checked;
    // const Brightness = parseInt(document.getElementById("dcsBrightness").value);

    device.acquireImage({
        Resolution,
        PixelType,
        IfFeederEnabled,
        IfShowUI,
        IfDuplexEnabled,
        // Brightness
    }, DWObject)
        .then(() => { backToMain() })
        .catch((err) => initInfoDialog(err.message));
}

function setAcquireBtnDisabled() {
    const sourceDom = document.getElementById("dcsSource")
    const btn = document.getElementById("dcs-androidPage-acquireBtn");

    if (sourceDom.length > 0) {
        btn.style.background = "#FE8E14";
        btn.removeAttribute("disabled")
    } else {
        btn.style.background = "gray";
        btn.disabled = "disabled";
    }

}

function refreshDevice() {
    const sourceDom = document.getElementById("dcsSource");
    const showUI = document.getElementById("dcsShowUI");
    sourceDom.options.length = 0;
    currentDeviceList.length = 0;

    const deviceEnum = getDevicesEnum();
    ScanDWObject.GetDevicesAsync(deviceEnum, true).then(function (deviceList) {
        for (var i = 0; i < deviceList.length; i++) {
            sourceDom.options.add(new Option(deviceList[i].displayName))
        }
        currentDeviceList.push(...deviceList)

        if (Dynamsoft.navInfo.bMobile || !bShowUIBySource(sourceDom.value)) {
            showUI.style.display = "none";
        }

        setAcquireBtnDisabled()
    })
}

function getScanPageContainer() {
    const controlBox = document.createElement("div");
    controlBox.className = "dcs-androidPage-configBox";
    const ulMenu = document.createElement("ul");
    const lis = [];

    const strTemplate = [
        getSourceUI(),
        getCheckBoxUI(),
        getResolutionUI(),
        getPixelTypeUI(),
        // getBrightNessUI(),
        getButtonUI(),
    ]

    for (let i = 0; i < 5; i++) {
        let item = document.createElement("li");
        //Bind the template to each li
        if (1 < i && i < 4) item.className = "dcs-androidPage-commonLi";
        item.innerHTML = strTemplate[i]
        lis.push(item)
    }

    // Construct the entire dom tree By appendChild
    controlBox.appendChild(ulMenu)
    for (let i = 0; i < lis.length; i++) {
        ulMenu.appendChild(lis[i])
    }

    return controlBox;
}

function changeShowUIBySelectSource() {

    const showUI = document.getElementById("dcsShowUILabel");
    const showUiInput = document.getElementById("dcsShowUI");
    const sourceBox = document.getElementById("dcsSource");

    if (!showUI) return;
    if (Dynamsoft.navInfo.bMobile || !bShowUIBySource(sourceBox.value)) {
        showUI.style.display = "none";
    }

    sourceBox.onchange = () => {
        if (Dynamsoft.navInfo.bMobile) return;

        if (!bShowUIBySource(sourceBox.value)) {
            showUiInput.checked = false;
            showUI.style.display = "none";
        } else {
            showUI.style.display = "";
        }
    }
}

function bShowUIBySource(name) {
    const str = name.toLowerCase();

    const Ica = str.slice(0, 3);
    const esclAndSane = str.slice(0, 4);
    const wifiDirect = str.slice(0, 10);

    if (Ica === "ica") return false;
    if (esclAndSane === "escl" || esclAndSane === "sane") return false;
    if (wifiDirect === "wifidirect") return false;

    return true;
}

function backToMain() {

    if (DWObject.HowManyImagesInBuffer > 0) {
        DWObject.Viewer.show();
    } else {
        fileMode = false;
        document.getElementById("dcsMainPage").style.display = "block";
    }

    const scanPage = document.getElementById("dcsAndroidScanPage");
    scanPage.style.display = "none";
}
//UI
function getSourceUI() {
    const id = "dcsSource";
    const title = "Select Source"

    let sourceStr = [
        `<div style = "display: flex; align-items: center; justify-content: space-between">`,
        `<p style="font-family: Oswald-Regular; font-size: 16px">${title}:`,
        `<i onclick = "refreshDevice()" style="margin-left:5px; font-size:18px; cursor: pointer" `,
        `class="iconfont icon-refresh"></i> </p>`,
        `<i onclick = "setDeviceType()" style="font-size:18px; cursor: pointer;" class="iconfont icon-moreSetting"></i>`,
        `</div>`,
        `<select id="${id}" style="margin-top:10px">`,
        `</select>`,
    ].join('');

    return sourceStr
}

function getResolutionUI() {
    const title = "Resolution";
    const id = "dcsResolution"
    const resolution = [
        { value: '100', text: '100', select: '' },
        { value: '200', text: '200', select: 'selected' },
        { value: '300', text: '300', select: '' },
        { value: '600', text: '600', select: '' },
    ]

    const str = getCommonLiUI(title, id, resolution);

    return str
}

function getPixelTypeUI() {
    const title = "PixelType";
    const id = "dcsPixelType"
    const resolution = [
        { value: '0', select: '', text: 'BW' },
        { value: '1', select: '', text: 'Gray' },
        { value: '2', select: 'selected', text: 'Color' },
    ]

    const str = getCommonLiUI(title, id, resolution);

    return str
}

function getCheckBoxUI() {
    let str = "";

    const config = [
        { id: "dcsShowUI", text: "ShowUI", checked: '', show: true },
        { id: "dcsFeeder", text: "Feeder", style: "", checked: '', show: true },
        { id: "dcsDuplex", text: "Duplex", style: "", checked: '', show: true }
    ]

    config.forEach(item => {
        if (item.show == true) {
            str += [`<label id="${item.id}Label" for="${item.id}">`,
            `<p>${item.text}:</p>`,
            `<input type="checkbox" id="${item.id}" ${item.checked}>`,
                `</label>`].join('')
        }
    })

    return str;
}

function getBrightNessUI() {
    const id = "dcsBrightness";
    const title = "Brightness"

    let str = [
        `<p >${title}:</p>`,
        `<input type="text" id="${id}" value="1000">`,
        `</select>`,
    ].join('');

    return str
}

function getButtonUI() {
    let str = "";

    str += [
        `<input id="dcs-androidPage-acquireBtn" class="btnOrg" type="button"`,
        ` value="Scan" onclick="acquireImage()">`
    ].join("")

    return str
}

function getCommonLiUI(title, id, config) {
    let str = ""

    str += [
        `<label for="${title}">`,
        `<p>${title}:</p>`,
        `</label>`,
        `<select size="1" id="${id}">`
    ].join('')
    config.forEach(option => {
        str += `<option value="${option.value}" ${option.select}>${option.text}</option>`
    })
    str += `</select>`

    return str
}

// Device Type
function setDeviceType() {
    const DeviceTypeBox = document.createElement("div");
    DeviceTypeBox.id = "dcsDeviceTypeBox";
    DeviceTypeBox.className = "dcs-androidPage-deviceBox";

    const header = document.createElement("div");
    header.innerHTML = [
        `<span>Device Type</span>`
    ]
    DeviceTypeBox.appendChild(header)

    const devicesCheckbox = getDevicesCheckbox();
    DeviceTypeBox.appendChild(devicesCheckbox)

    const footer = document.createElement("div");
    footer.innerHTML = [
        `<span onclick="selectDeviceType()" style="color:#FE8E14">OK</span>`,
        `<span onclick="hideDeviceTypeBox()" style="border-left:solid 2px #F0EFF4">Cancel</span>`
    ].join("")
    DeviceTypeBox.appendChild(footer)

    initMask();
    document.body.appendChild(DeviceTypeBox)
}

function selectDeviceType() {
    deviceType.forEach(item => {
        const input = document.getElementById(item.id);
        if (input && item.show) {
            item.checked = input.checked ? "checked" : "";
        }
    })

    refreshDevice();
    hideDeviceTypeBox();
}

function hideDeviceTypeBox() {
    const mask = document.getElementById('maskDiv');
    const deviceTypeBox = document.getElementById("dcsDeviceTypeBox");

    if (mask) mask.style.display = "none";
    if (deviceTypeBox) deviceTypeBox.remove();
}

function getDevicesCheckbox() {
    const div = document.createElement("div");
    const ul = document.createElement("ul");

    if (Dynamsoft && Dynamsoft.navInfo.bMobile) {
        deviceType.forEach(item => {
            if (
                item.text !== "ESCL"
                && item.text !== "WIFIDIRECT"
            ) {
                item.show = false;
            }
        })
    }

    deviceType.forEach(item => {
        if (!item.show) return;
        const li = document.createElement("li");
        li.innerHTML = [
            `<label id="${item.id}Label" for="${item.id}">`,
            `<p>${item.text}:</p>`,
            `<input type="checkbox" id="${item.id}" ${item.checked}>`,
            `</label>`
        ].join('')
        ul.appendChild(li);
    })
    div.appendChild(ul);

    return div
}

function getDevicesEnum() {
    let total = 0;
    deviceType.forEach(item => {
        if (item.show && item.checked === "checked") {
            total += item.enum;
        }
    })

    return total;
}