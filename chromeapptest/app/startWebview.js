var webview = document.getElementById('webview');
webview.style.display = 'inline-block';
webview.style.position = 'absolute';
webview.style.height = '100%';
webview.style.width = '100%';
webview.style.top = '50px';

var nextEvent = {
    DeviceType : null,
    Action : null
};

webview.addEventListener('contentload', function() {
        console.log('Guest page loaded');
        webview.addEventListener('consolemessage', function(e) {
            var aMsg;
            console.log(e.message);
            if (/apimsg/.test(e.message)){
                aMsg = JSON.parse(e.message.substr(7));
                modules[aMsg.DeviceType][aMsg.Action](aMsg.Data);
                console.log(aMsg);
            }
        });
    });

function appMsg(msg){
    webview.executeScript({code : 'window.dispatchEvent(new CustomEvent("FromPage", {detail: "' + msg + '"}))'});
}

function Connection() {
    this.connection = new SerialConnection(this.options.serialOptions);
    
    this.connect = function() {
        this.connection.connect(this.options.devicePath);
    };
    
    this.setSerialOptions = function(aOptions) {
        for (var j in aOptions)
            this.options[j] = aOptions[j];
    };
    
    this.getOptions = function() {
        return this.options;
    };
    
    this.getStoredOptions = function() {
        
    };
    
    this.saveCurrentOptions = function() {
        
    };
    
    this.getPorts = function() {
        this.connection.getDevices(function(ports) {
            var dropDown = document.querySelector('#port_list');
            dropDown.innerHTML = "";
            ports.forEach(function (port) {
                var newOption = document.createElement("option");
                newOption.text = port.path;
                newOption.value = port.path;
                dropDown.appendChild(newOption);
            });
        });
    };
}

var modules = {};

function Mercury315(aDevPath) {
    this.options = {
            serialOptions : {
                bitrate : 4800,
                parityBit : "even",
                stopBits : "one"
            }
        };
    
    Connection.bind(this)();
    
    
    this.set_weight = function(buf){
        var bufView = new Uint8Array(buf);
        var a = "";
        for(var i = 5; i>=0; i--){
            a += bufView[i];
        }
        appMsg(parseInt(a));
    };
    this.get_weight = function(){
        var bytes = new Uint8Array(1);
        bytes[0] = 3;
        this.connection.send(bytes.buffer);
    };
    this.connection.recieveHandler = this.set_weight;
}

function CommonProcessor() {
    this.evtName = 'cmn';
    this.drivers = {
        scales  :   {
            display :   'Весы',
            drivers :   ['Mercury315']
        }
    };
    
    this.getDrivers = function() {
        appMsg(this.drivers);
    };
    
    this.addDevice = function(aDevType, aDevName) {
        try {
            var devDrv = null;
            switch (aDevName) {
                case 'Mercury315' : {
                    devDrv = new Mercury315();
                }
            }
            if (devDrv)
                modules[aDevType] = devDrv;
            return true;
        } catch (e) {
            console.log(e);
            return false;
        }
    };
}

var cmn = new CommonProcessor();
document.querySelector('#connect_button').addEventListener('click', function() {
    cmn.addDevice("scales", "Mercury315");
    //modules.scales.getPorts();
});

//new (function ChromeHandler() {
//    var modules = {};
//    var ModulesFunc = getSettings();
//    ModulesFunc.CommonProcessor = CommonProcessor;
//    /*{
//        CommonProcessor :   CommonProcessor,
//        MercuryT100 :   MercuryT100
//    };*/
//    /*
//     * Весы, принтер чеков
//     */
//    
//    this.newModule = function(aModuleName) {
//        var newMod = new ModulesFunc[aModuleName](this);
//    }.bind(this);
//    
//    this.processMsg = function(aMsg) {
//        if (modules[aMsg.evtName]) {
//            modules[aMsg.evtName].processAppMessage(aMsg.evtData);
//        } else {
//            //Error handler
//        }
//    };
//    
//    this.newModule('CommonProcessor');
//    this.consoleListener = new ConsoleListener(this);
//})();
//
//function ConsoleListener(handler) {
//    function readConsoleMessage(aMSG) {
//        //check for tag and parse JSON
//    }
//    
//    this.getMessage = function(aMsgData) {
//        handler.processMsg(aMsgData);
//    };
//}