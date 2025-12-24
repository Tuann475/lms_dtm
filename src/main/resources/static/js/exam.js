var sizeexam = 4;

async function loadDeThi(page) {
    var url = 'http://localhost:8080/api/exam/public/find-all-page?page=' + page + '&size=' + sizeexam + '&sort=id,desc';
    const response = await fetch(url, {});
    var result = await response.json();
    console.log(result);
    var list = result.content;
    var main = '';
    for (i = 0; i < list.length; i++) {
        main += `<div class="col-sm-3">
        <a href="dethi?id=${list[i].id}" class="singdt"><div class="singdethi">
            <span class="tieudecourse">${list[i].name}</span>
            <span class="testitem-info">
                <i class="fa fa-clock"></i> ${list[i].limitTime} phút
                | <i class="fa fa-user"></i> ${list[i].numUser}
                | ${list[i].numLesson} phần thi
            </span>
            <span class="danhmucexam">
                <span>${list[i].category.name}</span>
                <span>${list[i].skill}</span>
            </span>
            <span class="spchitiet"><button class="btnchitietexam">Chi tiết</button></span>
        </div></a>
    </div>`
    }
    document.getElementById("listdethi").innerHTML += main

    if (result.last == false) {
        document.getElementById("btnxemthemkh").onclick = function () {
            loadDeThi(Number(page) + Number(1));
        }
    } else {
        document.getElementById("btnxemthemdethi").onclick = function () {
            toastr.warning("Đã hết kết quả tìm kiếm");
        }
    }
}

async function loadCtDeThi() {
    try {
        var uls = new URL(document.URL);
        var id = uls.searchParams.get("id");

        var url = 'http://localhost:8080/api/lesson/public/find-by-exam?id=' + id;
        var response = await fetch(url);
        var list = await response.json();
        console.log(list);

        var main = '';
        var arrLess = '';
        var numQuestion = 0;

        for (let i = 0; i < list.length; i++) {
            main += `<tr>
                <td style="width: 20%;"><input type="checkbox" checked readonly onclick="return false;"></td>
                <td>
                    <label for="dt${list[i].id}">
                        ${list[i].name} (${list[i].questions ? list[i].questions.length : 0} câu hỏi) <br>  
                        <span class="danhmucthi">${list[i].category ? list[i].category.name : ''}</span>
                    </label>
                </td>
            </tr>`;
            arrLess += `&lesson=${list[i].id}`;
            numQuestion += list[i].questions ? list[i].questions.length : 0;
        }

        document.getElementById("listlesson").innerHTML = main;

        // Kiểm tra token trước khi thực hiện gọi API
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            alert("Token không tồn tại. Vui lòng đăng nhập lại.");
            return;
        }

        response = await fetch('http://localhost:8080/api/exam/user/find-by-id?id=' + id, {
            method: 'GET',
            headers: new Headers({
                'Authorization': 'Bearer ' + token
            }),
        });

        var result = await response.json();

        // Kiểm tra và thiết lập các giá trị từ `result`
        var urlfulltest = `lambaithi?exam=${id}&limittime=${result.limitTime}` + arrLess;
        document.getElementById("linkfulltest").href = urlfulltest;
        document.getElementById("timedethi").innerHTML = result.limitTime || 'N/A';
        document.getElementById("sophanthi").innerHTML = result.lessons ? result.lessons.length : 0;
        document.getElementById("socauhoi").innerHTML = numQuestion;
        document.getElementById("danhmucdethi").innerHTML = result.course && result.course.category ? result.course.category.name : 'N/A';
        document.getElementById("tenbaithi").innerHTML = result.course ? result.course.name : 'N/A';

    } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        alert("Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.");
    }
}


async function loadThongTinDeThi() {
    var uls = new URL(document.URL)
    var exam = uls.searchParams.get("exam");
    var url = 'http://localhost:8080/api/exam/public/findById?id=' + exam;
    const response = await fetch(url, {});
    var result = await response.json();
    //console.log( result)
    document.getElementById("tenbaithi").innerHTML = result.name
}


async function searchDeThi(page) {
    var uls = new URL(document.URL)
    var category = uls.searchParams.get("category");
    var search = uls.searchParams.get("search");
    var url = 'http://localhost:8080/api/exam/public/find-by-param?page=' + page + '&size=' + sizeexam + '&sort=id,desc';
    if (category != null && category != -1) {
        url += '&category=' + category
    }
    if (search != null) {
        url += '&search=' + search
    }
    const response = await fetch(url, {});
    var result = await response.json();
    console.log(result);
    var list = result.content;
    var main = '';
    for (i = 0; i < list.length; i++) {
        main += `<div class="col-sm-3">
        <a href="dethi?id=${list[i].id}" class="singdt"><div class="singdethi">
            <span class="tieudecourse">${list[i].name}</span>
            <span class="testitem-info">
                <i class="fa fa-clock"></i> ${list[i].limitTime} phút
                | <i class="fa fa-user"></i> ${list[i].numUser}
                | ${list[i].numLesson} phần thi
            </span>
            <span class="danhmucexam">
                <span>${list[i].category.name}</span>
                <span>${list[i].skill}</span>
            </span>
            <span class="spchitiet"><button class="btnchitietexam">Chi tiết</button></span>
        </div></a>
    </div>`
    }
    document.getElementById("listdethi").innerHTML += main

    if (result.last == false) {
        document.getElementById("btnxemthemkh").onclick = function () {
            loadDeThi(Number(page) + Number(1));
        }
    } else {
        document.getElementById("btnxemthemdethi").onclick = function () {
            toastr.warning("Đã hết kết quả tìm kiếm");
        }
    }
}


async function loadDeThiByCourse() {
    $('#example').DataTable().destroy();
    var uls = new URL(document.URL)
    var khoahoc = uls.searchParams.get("khoahoc");
    var tenkhoahoc = uls.searchParams.get("tenkhoahoc");
    var url = 'http://localhost:8080/api/exam/user/find-by-course-and-user?course=' + khoahoc;
    const response = await fetch(url, {
        method: 'GET',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        }),
    });
    var list = await response.json();
    var main = '';
    for (i = 0; i < list.length; i++) {
        var btn = `Đang chờ`
        if (list[i].trangThai == "DA_KET_THUC") {
            btn = `<a href="ketqua?exam=${list[i].id}" class="btn btn-primary form-control">Xem kết quả</button>`
        }
        if (list[i].trangThai == "DANG_THI") {
            btn = ` <a href="dethi?id=${list[i].id}" class="btn btn-primary form-control">Vào thi</button>`
        }
        main += `<tr>
                    <td>${list[i].id}</td>
                    <td>${list[i].name}</td>
                    <td>${list[i].limitTime}</td>
                    <td>${list[i].examTime}, ${list[i].examDate}</td>
                    <td>${list[i].lessons.length}</td>
                    <td class="sticky-col">
                        ${btn}
                    </td>
                </tr>`
    }
    document.getElementById("listdethi").innerHTML = main
    document.getElementById("tenkhoahoc").innerHTML = tenkhoahoc
    $('#example').DataTable();
}

async function submitExamWithFills(examId, timeStr){
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if(!token){ toastr.error('Vui lòng đăng nhập'); return; }
    // Collect MCQ selected answer IDs
    const answerIds = Array.from(document.querySelectorAll('input[type=radio]:checked'))
        .map(r=> parseInt(r.value)).filter(v=> !isNaN(v));
    // Collect FILL answers: textareas with class 'fill-answer' and data-question-id
    const fills = Array.from(document.querySelectorAll('textarea.fill-answer'))
        .map(inp=>({ questionId: parseInt(inp.getAttribute('data-question-id')), answerText: (inp.value||'').trim() }))
        .filter(x=> x.questionId && x.answerText.length>0);
    // Optionally collect writing answers if present
    const writings = Array.from(document.querySelectorAll('textarea.writing-answer'))
        .map(t=>({ questionId: parseInt(t.getAttribute('data-question-id')), answerText: (t.value||'').trim() }))
        .filter(x=> x.questionId && x.answerText.length>0);
    const body = { examId: examId, time: timeStr, answerIds: answerIds, writings: writings, fills: fills };
    const resp = await fetch('/api/result/user/create-with-fills',{
        method:'POST',
        headers: new Headers({ 'Content-Type':'application/json', 'Authorization':'Bearer '+token }),
        body: JSON.stringify(body)
    });
    if(resp.ok){ const json = await resp.json(); toastr.success('Đã lưu bài làm'); window.location.href = 'ketqua?exam='+examId; }
    else { toastr.error('Lưu bài làm thất bại'); }
}
