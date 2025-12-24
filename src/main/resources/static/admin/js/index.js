var token = localStorage.getItem("token");

function formatDollar(num) {
    var p = num.toFixed(2).split(".");
    return p[0].split("").reverse().reduce(function (acc, num, i, orig) {
        return num + (num != "-" && i && !(i % 3) ? "," : "") + acc;
    }, "") + "." + p[1];
}

function getDateTime() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    var day = now.getDate();
    var hour = now.getHours();
    var minute = now.getMinutes();
    var second = now.getSeconds(); //
    var a = 0;
    //
    if (month.toString().length == 1) {
        month = '0' + month;
    }
    if (day.toString().length == 1) {
        day = '0' + day;
    }
    if (hour.toString().length == 1) {
        hour = '0' + hour;
    }
    if (minute.toString().length == 1) {
        minute = '0' + minute;
    }
    if (second.toString().length == 1) {
        second = '0' + second;
    }
    var dateTime = year + '/' + month + '/' + day + ' ' + hour + ':' +
        minute + ':' + second;
    return dateTime;
}

setInterval(function () {
    currentTime = getDateTime();
    document.getElementById("digital-clock").innerHTML = currentTime;
}, 1000);

var date = new Date();

var current_day = date.getDay();

var day_name = '';

switch (current_day) {
    case 0:
        day_name = "Chủ nhật";
        break;
    case 1:
        day_name = "Thứ hai";
        break;
    case 2:
        day_name = "Thứ ba";
        break;
    case 3:
        day_name = "Thứ tư";
        break;
    case 4:
        day_name = "Thứ năm";
        break;
    case 5:
        day_name = "Thứ sáu";
        break;
    case 6:
        day_name = "Thứ bảy";
}

async function thongke() {
    var url = 'https://lmsdtm-production.up.railway.app/api/statistic/admin/revenue-this-month';
    const response = await fetch(url, {
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    var result = await response.text();
    document.getElementById("doanhThu").innerHTML = formatmoney(result)

    var url = 'https://lmsdtm-production.up.railway.app/api/statistic/admin/number-user';
    const res = await fetch(url, {
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    var result = await res.text();
    document.getElementById("soLuongNV").innerHTML = result


    var url = 'https://lmsdtm-production.up.railway.app/api/statistic/admin/number-course';
    const resp = await fetch(url, {
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    var result = await resp.text();
    document.getElementById("soLuongMH").innerHTML = result


    var url = 'https://lmsdtm-production.up.railway.app/api/statistic/admin/number-exam';
    const respo = await fetch(url, {
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    var result = await respo.text();
    document.getElementById("doanhThuNgay").innerHTML = result

    var url = 'https://lmsdtm-production.up.railway.app/api/statistic/admin/number-teacher';
    const respon = await fetch(url, {
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    var result = await respon.text();
    document.getElementById("donhoanthanh").innerHTML = (result)

    var url = 'https://lmsdtm-production.up.railway.app/api/statistic/admin/number-user-this-month';
    const respons = await fetch(url, {
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    var result = await respons.text();
    document.getElementById("numnewuser").innerHTML = (result)
}