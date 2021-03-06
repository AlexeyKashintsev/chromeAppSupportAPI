/**
 * Created by Work on 01.06.2015.
 */
define(function (require) {
    var ASCII = require('./ExtendedASCIITable');


    function Utils() {
        var self = this;

        self.stringToBytes = function (aValue, aNeedLength, aType) {
            if (aValue != 'undefined') {
                var value = aValue.toString();
                var len = value.length;
                var data = [];
                for (var i = 0; i < len; i++) {
                    var code = value.charCodeAt(i);
                    if (code >= 0 && code <= 255) {
                        data.push(code);
                    } else if (ASCII.getExtendASCIICodeFromUTF(code)) {
                        data.push(ASCII.getExtendASCIICodeFromUTF(code));
                    } else {
                        data.push(63); //?
                        console.error("Недопустимый символ '" + value.charAt(i) + "'");
                    }
                }
                if (aNeedLength && aType){
                    if (aType == "zero"){
                        return addTheZeros(data, aNeedLength);
                    }
                    if (aType == "symbol"){
                        return completeData(data, aNeedLength);
                    }
                } else {
                    return data;
                }
            } else return 0;
        };

        function completeData(aData, aNeedLength) {
            if (typeof(aData) == "string") {
                while (aData.length < aNeedLength) {
                    aData = "0" + aData;
                }
                return aData;
            } else if (Array.isArray(aData)){
                while (aData.length < aNeedLength) {
                    aData.unshift(48);
                }
                return aData;
            }
            return aData;
        }

        function addTheZeros(aData, aNeedLength) {
            var data = [];
            if (aData) {
                if (Array.isArray(aData)) {
                    data = aData;
                } else {
                    data[0] = aData;
                }
            } else data[0] = 0;
            while (data.length < aNeedLength) {
                data.push(0);
            }
            return data;
        }

        self.checkBCC = function (aData) {
            if (aData && aData.length > 0) {
                var sBCC = "";
                sBCC += aData[aData.length - 3] + aData[aData.length - 2];
                var bcc = parseInt(sBCC, 16);
                var calcedBCC = self.calcBCC(aData, 1, aData.length - 3);
                return bcc == calcedBCC;
            }
            return false;
        };

        self.calcBCC = function (aData, offset, length) {
            if (Array.isArray(aData)) {
                var bcc = 0;
                offset = offset ? offset : 0;
                length = length ? length : aData.length;
                for (var i = offset; i < length; i++) {
                    bcc = (bcc + aData[i]) & 0xFF;
                }
                return bcc;
            }
            return null;
        };

        self.getString = function (aData, aOffset, aLength) {
            var result = "";
            if (aData && aData.length >= (aOffset + aLength)) {
                for (var i = 0; i < aLength; i++) {
                    result += String.fromCharCode(aData[aOffset + i]);
                }
            }
            return result;
        };

        self.getInt = function (aData, aOffset, aLength) {
            return parseInt(self.getString(aData, aOffset, aLength));
        };

        self.getFloat = function (aData, aOffset, aLength) {
            return parseFloat(self.getString(aData, aOffset, aLength));
        };

        self.prepare = function (aData) {
            var stx = 2;
            var etx = 3;
            var bcc = self.calcBCC(aData);
            bcc = bcc.toString(16).toUpperCase();
            aData.unshift(stx);
            aData = aData.concat(self.stringToBytes(bcc));
            aData.push(etx);
            return aData;
        };

        self.print = function (aData) {
            var mes = "";
            console.log("Request");
            aData.forEach(function (elem) {
                mes += elem.toString(16).toUpperCase() + " ";
            });
            console.log(mes);
        };

        self.generateDocumentFlags = function (anAction, anExtendedReport) {
            var result = 0;
            var action = 0;
            var extended = anExtendedReport ? 1 : 0;
            switch (anAction) {
                case "register":
                    action = 0;
                    break;
                case "close":
                    action = 1;
                    break;
                case "cancel":
                    action = 2;
                    break;
                default :
                    action = 0;
            }
            result |= action << 2;
            result |= extended << 4;
            return result;
        };

        self.generateReqFlag = function (aType, aSpec, anUseDefaultFont, aPack, aDiscount, aTaxGroup, aSmallFont, aDoubleWidthFont, aDoubleHeightFont, aNotPrint) {
            var result = 0;
            var specialBits = typeof aSpec === 'number' ? aSpec : 0;
            var defaultFont = anUseDefaultFont ? 1 : 0;                                     //1 - игнорировать настройки и использовать стандартный шрифт
            var pack = aPack && aType == '11' ? 1 : 0;                                      //1 - Если это упаковка(только для "Цена услуги" - 11)
            var discount = typeof aDiscount === 'number' ? aDiscount : 1;                                       //1 - если скидка, 0 - если надбавка
            var taxGroup = aTaxGroup && (aType == '11' || aType == '21') ? aTaxGroup : 0;   //Для реквизита "Цена услуги", "Общая скидка/надбавка на чек" Налоговая группа от 0 до 4
            var font = aSmallFont ? 1 : 0;                                                  //0 - 14x30, 1 - 10x30
            var doubleWidth = aDoubleWidthFont ? 1 : 0;                                     //ДВойная ширина, 1 - вкл
            var doubleHeight = aDoubleHeightFont ? 1 : 0;                                   //Двойная высота, 1 - вкл
            var notPrint = aNotPrint ? 1 : 0;                                               //1 - не печатать в журнале. Игнорируется некоторыми реквизитами.

            result |= specialBits;
            result |= defaultFont << 5;
            result |= pack << 6;
            result |= discount << 7;
            result |= taxGroup << 8;
            result |= font << 12;
            result |= doubleWidth << 13;
            result |= doubleHeight << 14;
            result |= notPrint << 15;

            return result.toString(16);
        };

        self.generateReportFlags = function (aCashierSum, aSectionSum, aFull, aAll, aExtended) {
            var cashierSum = aCashierSum ? 1 : 0;
            var sectionSum = aSectionSum ? 1 : 0;
            var full = aFull ? 1 : 0;
            var all = aAll ? 1 : 0;
            var extended = aExtended ? 1 : 0;

            var result = 0;
            result |= extended << 4;
            result |= all << 3;
            result |= full << 2;
            result |= sectionSum << 1;
            result |= cashierSum;
            return result.toString(16);
        };

        self.convertArrayToBuffer = function (aData) {
            if (aData) {
                if (Array.isArray(aData)) {
                    var result = new ArrayBuffer(aData.length);
                    var buffer = new Uint8Array(result);
                    for (var i = 0, len = aData.length; i < len; i++) {
                        buffer[i] = aData[i];
                    }
                    return result;
                }
            }
        }

        self.bytesToHex = function (aData) {
            if (Array.isArray(aData)) {
                var code = "";
                for (var liter of aData) {
                    code += String.fromCharCode(liter);
                }
                return parseInt(code, 16);
            } else
                return false;
        }

        self.intToString = function(aNumber, aNeedLength) {
            if (aNumber != null && aNeedLength) {
                var value = aNumber.toString();
                while (value.length < aNeedLength){
                    value = "0" + value;
                }
                return value;
            }
            return null;
        };
    }

    return new Utils();
});


