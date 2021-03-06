/* global chrome */
define(function(require) {
    var SerialConnection = require('../SerialConnection');
    var AppAPI = require('AppAPI');
    var Utils = require('./OPOS_Utils');

    function OPOS_Prototype(anAlias){
        var self = this;
        var alias = anAlias;
        var current_buffer = [];
        this.options = {
            bufferSize: 4096,
            bitrate: 115200,
            dataBits: "eight",
            parityBit: "no",
            stopBits: "one"
        };
        self.textAreaOptions = {
            first : 42,
            firstDouble : 21,
            second : 54,
            secondDouble : 26
        };
        this.connection = new SerialConnection(this.options);
        var serial = this.connection;
        serial.recieveHandler = rHandler;

        var cmd = {
            paperFeed   : [10, 10, 10, 10, 10],
            getStatus   : [16,4,1],
            paperCut    : [27, 109],
            setCharTable: [27, 116, 17]
        };

        //Обработчики ответов
        function rHandler(buf) {
            var bufView = new Uint8Array(buf);
            for (var i = 0; i < bufView.length; i++) {
                current_buffer[current_buffer.length] = bufView[i];
                console.log(bufView);
            }
            CheckSellResponce(current_buffer);
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
                    data = data.concat(cmd.setCharTable);
                    data = data.concat(Utils.printLine("Смена открыта: " + aParams.family, "left", 16));
                    data = data.concat(getFooter());
                    serial.send(Utils.convertArrayToBuffer(data));
                });
            });


            var responce = {};
            responce.result = false;
            responce.method = "openSession";
            responce.alias = alias;
            AppAPI(responce,'go');
        };

        this.closeSession = function (aFlags, aCallback) {//Закрытие смены
            var responce = {};
            responce.result = false;
            responce.method = "closeSession";
            responce.alias = alias;
            AppAPI(responce,'go');
        };

        this.getCashierReport = function (aFlags, aCashier, aCallback) {
            var responce = {};
            var data = [];
            responce.result = false;
            responce.method = "getCashierReport";
            responce.alias = alias;
            AppAPI(responce,'go');

            data = data.concat(Utils.printLine("Принтер не поддерживает печать отчетов", "left", 16));
            data = data.concat(getFooter());
            serial.send(Utils.convertArrayToBuffer(data));
        };

        this.getSummaryReport = function (anInfo){
            var responce = {};
            var data = [];
            responce.result = false;
            responce.method = "getSummaryReport";
            responce.alias = alias;
            AppAPI(responce,'go');
            var reqs = {};
            function print(aObj){
                if (aObj.length == 2){
                    if (typeof aObj[0] == "array" && typeof aObj[1] != "array"){
                        print(aObj[0]);
                        data = data.concat(Utils.printLine(aObj[1]));
                    } 
                    if (typeof aObj[1] == "array" && typeof aObj[0] != "array"){
                        data = data.concat(Utils.printLine(aObj[0]));
                        print(aObj[1]);
                    } 
                    if (typeof aObj[0] != "array" && typeof aObj[1] != "array") {
                        data = data.concat(Utils.printBundle(self.textAreaOptions, aObj[0], aObj[1]));
                    }
                } else {
                    aObj.forEach(function(element) {
                    if (typeof element !== "array"){
                        data = data.concat(Utils.printLine(element));
                    } else {
                        print(element);
                    }
                }, this);
                }
                
            }
            
            chrome.storage.local.get("requisites", function(result){
                reqs.firm = result.requisites && result.requisites.firm ? result.requisites.firm : "Не задано";
                reqs.INN = result.requisites && result.requisites.INN ? result.requisites.INN : "Не задано";
                reqs.cashier = result.requisites && result.requisites.cashier ? result.requisites.cashier : "Не задано";
                data = data.concat(getHeader(reqs));
                anInfo.forEach(function(aItem){
                    print(aItem);
                });
                data = data.concat(getFooter());
                serial.send(Utils.convertArrayToBuffer(data));
            });
        };

        this.refund = function(anOrder){
            var data = [];
            var reqs = {};
            chrome.storage.local.get("requisites", function(result){
                reqs.firm = result.requisites.firm ? result.requisites.firm : "Не задано";
                reqs.INN = result.requisites.INN ? result.requisites.INN : "Не задано";
                reqs.cashier = result.requisites.cashier ? result.requisites.cashier : "Не задано";

                data = data.concat(getHeader(reqs));
                data = data.concat(createBodyRefund(anOrder));
                data = data.concat(getFooter());
                serial.send(Utils.convertArrayToBuffer(data));
            });
        };

        this.sell = function (anOrder) {
            var data = [];
            var reqs = {};
            chrome.storage.local.get("requisites", function(result){
                reqs.firm = result.requisites && result.requisites.firm ? result.requisites.firm : "Не задано";
                reqs.INN = result.requisites && result.requisites.INN ? result.requisites.INN : "Не задано";
                reqs.cashier = result.requisites && result.requisites.cashier ? result.requisites.cashier : "Не задано";

                data = data.concat(getHeader(reqs));
                data = data.concat(self.createBodySell(anOrder));
                data = data.concat(getFooter());
                serial.send(Utils.convertArrayToBuffer(data));
            });
        };

        this.printBalance = function(anItems){
            var data = [];
            var reqs = {};
            chrome.storage.local.get("requisites", function(result){
                reqs.firm = result.requisites && result.requisites.firm ? result.requisites.firm : "Не задано";
                reqs.INN = result.requisites && result.requisites.INN ? result.requisites.INN : "Не задано";
                reqs.cashier = result.requisites && result.requisites.cashier ? result.requisites.cashier : "Не задано";

                data = data.concat(getHeader(reqs));
                data = data.concat(createBodyBalance(anItems));
                data = data.concat(getFooter());
                serial.send(Utils.convertArrayToBuffer(data));
            });
        };

        //Временное решение
        this.setRequisites = function(aReqs){
            var Reqs = {};
            Reqs.requisites = aReqs;
            chrome.storage.local.set(Reqs, function(){
                var responce = {};
                responce.result = false;
                responce.method = "setRequisites";
                responce.alias = alias;
                AppAPI(responce,'go');
            });
        };

        function CheckSellResponce(buf) {
            var responce = {};
            responce.method = "sell";
            responce.alias = alias;
            AppAPI(responce,'go');
        }

        this.createBodySell = function(anOrder){
            var sum = 0;
            var data = [];
            data = data.concat(Utils.printLine("ПРОДАЖА", "center", 16));
            data = data.concat(Utils.printHR(self.textAreaOptions));

            //Обработка товаров
            for(var item of anOrder.items){
                data = data.concat(addItem(item));
                sum += item.cost * item.quantity;
                if (item.discount) {
                    sum -= item.cost * item.quantity * item.discount / 100;
                }
            }

            //Скидка на весь чек
            if (anOrder.total_discount) {
                data = data.concat(Utils.printBundle(self.textAreaOptions, "Общая скидка на чек", (-anOrder.total_discount).toFixed(2)));
                sum -= +anOrder.total_discount;
            }

            data = data.concat(Utils.printHR(self.textAreaOptions))

            //Итоговая сумма
            data = data.concat(Utils.printBundle(self.textAreaOptions, "ИТОГ", (+sum).toFixed(2), 176));


            //Оплаченная сумма и сдача
            data = data.concat(Utils.printBundle(self.textAreaOptions, "Наличными", (+anOrder.money).toFixed(2), 17));
            data = data.concat(Utils.printBundle(self.textAreaOptions, "Сдача", (+sum - +anOrder.money).toFixed(2), 16));
            return data;
        };

        function createBodyRefund(anOrder){
            var sum = 0;
            var data = [];
            data = data.concat(Utils.printLine("ВОЗВРАТ", "center", 16));
            data = data.concat(Utils.printHR(self.textAreaOptions));

            //Обработка товаров
            for(var item of anOrder.items){
                data = data.concat(addItem(item));
                sum += item.cost * item.quantity;
                if (item.discount) {
                    sum -= item.cost * item.quantity * item.discount / 100;
                }
            }

            //Скидка на весь чек
            if (anOrder.total_discount) {
                data = data.concat(Utils.printBundle(self.textAreaOptions, "Общая скидка на чек", (-anOrder.total_discount).toFixed(2)));
                sum -= +anOrder.total_discount;
            }

            data = data.concat(Utils.printHR(self.textAreaOptions));

            //Итоговая сумма
            data = data.concat(Utils.printBundle(self.textAreaOptions, "ВОЗВРАТ", (+sum).toFixed(2), 176));

            return data;
        }

        function createBodyBalance(anItems){
            var sum = 0;
            var data = [];
            data = data.concat(Utils.printLine("ОСТАТКИ", "center", 16));
            data = data.concat(Utils.printHR(self.textAreaOptions));

            for (var item of anItems){
                data = data.concat(Utils.printBundle(self.textAreaOptions, item.caption, item.quantity + " " + item.measure));
            }

            return data;
        }

        function addItem(anItem) {
            var data;
            data = Utils.printBundle(self.textAreaOptions, anItem.caption, (+anItem.cost).toFixed(2) + " x " + anItem.quantity + " " + anItem.measure + "  =" + (+anItem.cost * +anItem.quantity).toFixed(2));
            if (anItem.discount){
                data = data.concat(Utils.printBundle(self.textAreaOptions, "Скидка " + anItem.discount + "% ",  "  -" + (+anItem.cost * +anItem.quantity * +anItem.discount / 100).toFixed(2)));
            }
            return data;
        }

        function getHeader(reqs){
            var data = [];
            data = data.concat(Utils.printLine(reqs.firm, "center", 16));
            data = data.concat([9, 10]);
            data = data.concat(Utils.printBundle(self.textAreaOptions, new Date().toLocaleDateString("ru", {year: 'numeric',month: 'numeric',day: 'numeric',hour: 'numeric',minute: 'numeric'}),"Кассир " + reqs.cashier));
            data = data.concat(Utils.printLine("ИНН " + reqs.INN, "right"));
            return data;
        }

        function getFooter(){
            var data = [];
            data = data.concat(cmd.paperFeed);
            data = data.concat(cmd.paperCut);
            data = data.concat(cmd.getStatus);
            return data;
        }






    }

    OPOS_Prototype.information = {
        type : "printers"
    };

    return OPOS_Prototype;
});
