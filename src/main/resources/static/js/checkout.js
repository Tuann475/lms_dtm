async function requestPayMentMomo() {
    window.localStorage.setItem('ghichu', document.getElementById("ghichu").value);
    window.localStorage.setItem('course', window.location.search.split('=')[1]);

    var returnurl = 'http://localhost:8080/thanhcong';
    var urlinit = 'http://localhost:8080/api/urlpayment';
    var paymentDto = {
        "courseId": window.location.search.split('=')[1],
        "content": "Thanh toán khóa học",
        "returnUrl": returnurl,
        "notifyUrl": returnurl,
    }
    console.log(paymentDto)
    const res = await fetch(urlinit, {
        method: 'POST',
        headers: new Headers({
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify(paymentDto)
    });
    if (res.status < 300) {
        try {
            var result = await res.json();
            window.open(result.url, '_blank');
        } catch (e) {
            swal({
                title: "Thông báo",
                text: "Đã đăng ký khóa học miễn phí thành công!",
                type: "success"
            }, function () {
                window.location.href = 'taikhoan#mycourse'
            });
        }
    }
    if (res.status == exceptionCode) {
        var result = await res.json();
        toastr.warning(result.defaultMessage);
    }

}


async function paymentMomo() {
    var uls = new URL(document.URL)
    var orderId = uls.searchParams.get("orderId");
    var requestId = uls.searchParams.get("requestId");
    var note = window.localStorage.getItem("ghichu");
    var course = window.localStorage.getItem("course");
    var orderDto = {
        "note": note,
        "requestIdMomo": requestId,
        "orderIdMomo": orderId,
        "courseId": course,
    }
    var url = 'http://localhost:8080/api/course-user/user/create';
    var token = localStorage.getItem("token");
    const res = await fetch(url, {
        method: 'POST',
        headers: new Headers({
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify(orderDto)
    });
    var result = await res.json();
    if (res.status < 300) {
        document.getElementById("thanhcong").style.display = 'block'
    }
    if (res.status == exceptionCode) {
        document.getElementById("thatbai").style.display = 'block'
        document.getElementById("thanhcong").style.display = 'none'
        document.getElementById("errormess").innerHTML = result.defaultMessage
    }

}

