define(function(require) {
    var SerialConnection = require('../libs/SerialConnection');
    var AppAPI = require('AppAPI');
    var Utils = require('../libs/OPOS/OPOS_Utils');

    function BigIITouch(anAlias){

        var alias = anAlias;
        var current_buffer = [];
        this.options = {
            bufferSize: 4096,
            bitrate: 115200,
            dataBits: "eight",
            parityBit: "no",
            stopBits: "one"
        };
        this.connection = new SerialConnection(this.options);
        var serial = this.connection;
        serial.recieveHandler = rHandler;

        var cmd = {
            moveCursorLeft : [8],
            moveCursorRight : [9],
            clearScreen : [12],
            moveCursorLeftMost : [13],
            moveCursorSpecPos : function (aPos){
                if (aPos <= 20 && aPos >= 1){
                    return [31, 36, aPos];
                } else {
                    return [31, 36, 1];
                }
            },
            selectOverwrite : [31, 1],
            selectVerticalScroll : [31, 2],
            selectHorizontalScroll : [31, 3]
        }

        //Обработчики ответов
        function rHandler(buf) {
            var bufView = new Uint8Array(buf);
            for (var i = 0; i < bufView.length; i++) {
                current_buffer[current_buffer.length] = bufView[i];
                console.log(bufView);
            }
            CheckResponce(current_buffer);
        }

        var onConnect = function(){
            var responce = {
                alias : alias,
                result : true
            };
            AppAPI(responce,'connectTo');
        };

        this.connect = function (aPath) {
            if (aPath) {
                this.connection.connect(aPath, onConnect);
            } else {
                this.connection.connect(this.options.devicePath);
            }
        };

        this.disconnect = function (aCallback) {
            if (aCallback){
                this.connection.disconnect(aCallback);
            } else {
                this.connection.disconnect(function(){
                    console.log("Disconnected");
                });
            }
        };

        this.openSession = function (aParams) { //открытие смены
            chrome.storage.local.get("requisites", function(result){
                if (!result.requisites)
                    result.requisites = {};
                result.requisites.cashier = aParams.family;
                chrome.storage.local.set(result, function(){
                    var data = [];
                    data = data.concat([27, 116, 17]);
                    data = data.concat(Utils.printLine("Смена открыта: " + aParams.family, "left", 16));
                    data = data.concat([10, 10, 10, 10, 10]);
                    data = data.concat([27, 109]);
                    data = data.concat([16,4,1]);
                    serial.send(Utils.convertArrayToBuffer(data));
                });
            });


            var responce = {};
            responce.result = false;
            responce.method = "openSession";
            responce.alias = alias;
            AppAPI(responce,'go');
        };

        this.show = function(aMsg){
            ShowMessage(aMsg);
        };

        function ShowMessage(aMsg){
            var data = [];

            data = data.concat(cmd.clearScreen); //Очистить дисплей
            data = data.concat(Utils.stringToBytes(aMsg));

            serial.send(Utils.convertArrayToBuffer(data));
        }


    }

    BigIITouch.information = {
        type : "displays"
    };

    return BigIITouch;
});
