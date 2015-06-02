define(function(requery){


    function MandatoryReq(){
        var Reqs = [];
        Reqs.push({
            code : "00",
            description : "����� ���",
            required : true,
            from : "memory"
        });
        Reqs.push({
            code : "01",
            description : "������������ ����������. ������ 1",
            required : false,
            from : "memory"
        });
        Reqs.push({
            code : "02",
            description : "������������ ����������. ������ 2",
            required : false,
            from : "memory"
        });
        Reqs.push({
            code : "03",
            description : "������������ ����������. ������ 3",
            required : false,
            from : "memory"
        });
        Reqs.push({
            code : "04",
            description : "������������ ����������. ������ 4",
            required : false,
            from : "memory"
        });
        Reqs.push({
            code : "05",
            description : "���� � ����� ���������� ��������",
            required : true,
            from : "memory"
        });
        Reqs.push({
            code : "06",
            description : "����� �������",
            required : true,
            from : "memory"
        });
        Reqs.push({
            code : "07",
            description : "����� ���������",
            required : true,
            from : "memory"
        });
        Reqs.push({
            code : "08",
            description : "����� ����",
            required : true,
            from : "memory"
        });
        Reqs.push({
            code : "09",
            description : "����� �����",
            required : false,
            from : "user"
        });
        Reqs.push({
            code : "10",
            description : "���",
            required : true,
            from : "memory"
        });
        Reqs.push({
            code : "11",
            description : "���� ������",
            required : true,
            from : "user"
        });
        Reqs.push({
            code : "12",
            description : "�������� �����",
            required : true,
            from : "memory"
        });
        Reqs.push({
            code : "13",
            description : "���������� �����",
            required : true,
            from : "user"
        });
        Reqs.push({
            code : "14",
            description : "����� �����",
            required : true,
            from : "memory"
        });
        Reqs.push({
            code : "15",
            description : "����� ������� �� ��������� ������ 0",
            required : false,
            from : "memory"
        });
        Reqs.push({
            code : "16",
            description : "����� ������� �� ��������� ������ 1",
            required : false,
            from : "memory"
        });
        Reqs.push({
            code : "17",
            description : "����� ������� �� ��������� ������ 2",
            required : false,
            from : "memory"
        });
        Reqs.push({
            code : "18",
            description : "����� ������� �� ��������� ������ 3",
            required : false,
            from : "memory"
        });
        Reqs.push({
            code : "19",
            description : "����� ������� �� ��������� ������ 4",
            required : false,
            from : "memory"
        });
        Reqs.push({
            code : "21",
            description : "����� ������ ��� �������� �� ���",
            required : false,
            from : "user"
        });
        Reqs.push({
            code : "99",
            description : "��� ��������",
            required : false,
            from : "user"
        });

        this.getAllReqs = function(){
            return Reqs;
        }
        this.getRequiredReqs = function(){
            var result = [];
            for (req of Reqs){
                if (req.required)
                    result.push(req);
            }
            return result;
        }
        this.getReqs = function(property, value){
            if (property){
                var result = [];
                for (req of Reqs){
                    if (req[property] == value){
                        result.push(req);
                    }
                }
                return result;
            } else {
                return Reqs;
            }
        }
    }

    return new MandatoryReq();
})