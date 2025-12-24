async function loadChapter() {
    var uls = new URL(document.URL)
    var khoahoc = uls.searchParams.get("khoahoc");

    var url = 'http://localhost:8080/api/course/public/findById?id=' + khoahoc;
    var response = await fetch(url, {});
    var result = await response.json();
    //console.log(result)
    document.getElementById("tenkhoahoc").innerHTML = result.name
    document.getElementById("danhmuckh").innerHTML = result.category.name
    document.getElementById("imgctblog").src = result.image

    var url = 'http://localhost:8080/api/chapter/user/find-by-course?course=' + khoahoc;
    var response = await fetch(url, {
        method: 'GET',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        }),
    });
    var list = await response.json();
    console.log(list);
    var main = '';
    for (i = 0; i < list.length; i++) {
        var chuong = '';
        var listunit = list[i].units
        for (j = 0; j < listunit.length; j++) {
            if (listunit[j].locked == false) {
                chuong += `<li><a onclick="loadUnitById(${listunit[j].id})" class="pointer">${listunit[j].name}</a></li>`
            } else {
                chuong += `<li><a>${listunit[j].name}</a> <i class="fa fa-lock"></i></li>`
            }
        }
        main += `<div class="sesctiondethi" style="margin-top: 20px;">
        <h5>${list[i].name}</h5>
        <ul>${chuong}</ul>
    </div>`
    }
    document.getElementById("listchapter").innerHTML = main
}


async function loadUnitById(id) {
    var url = 'http://localhost:8080/api/unit/all/findById?id=' + id;
    var response = await fetch(url, {
        method: 'GET',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        }),
    });
    var result = await response.json();
    console.log(result);
    document.getElementById("danhmuckh").innerHTML = result.name
    document.getElementById("tieudechao").style.display = 'none'
    document.getElementById("noidungbaihoc").style.display = 'block'
    document.getElementById("linkvideo").innerHTML = `<source id="linkvideos" src="${result.video}" type="video/mp4">`
    let iconClass = 'fa fa-file'; // Mặc định là biểu tượng tệp
    let linkHtml = ''; // Khởi tạo biến cho liên kết tài liệu học

// Kiểm tra xem learning_material có null hoặc là chuỗi rỗng không
    if (result.learning_material && result.learning_material.trim() !== '') {
        // Xác định lớp biểu tượng dựa trên loại tài liệu
        if (result.learning_material.endsWith('.pdf')) {
            iconClass = 'fa fa-file-pdf';
        } else if (result.learning_material.endsWith('.docx')) {
            iconClass = 'fa fa-file-word';
        }

        // Tạo HTML cho liên kết tài liệu học
        linkHtml = `<a href="${result.learning_material}" target="_blank" title="Xem tài liệu học tập">
        <i class="${iconClass} fa-3x icontable" aria-hidden="true"></i> Tải tài liệu học
    </a>`;
    }

// Cập nhật nội dung tài liệu học, nếu có
    if (linkHtml) {
        document.getElementById("tailiauhoc").innerHTML = linkHtml;
    } else {
        // Nếu không có tài liệu, bạn có thể ẩn hoặc giữ nội dung trống
        document.getElementById("tailiauhoc").innerHTML = ''; // Hoặc thực hiện thao tác khác nếu cần
    }

    document.getElementById("contentbaihoc").innerHTML = `<h4 style="margin-top:40px">Nội dung bài học</h4><br>` + result.content
    var milisecond = result.minStudyTime * 60 * 1000;

    let intervalID = setInterval(async function () {
        var url = 'http://localhost:8080/api/user-unit/user/create?id=' + id;
        var response = await fetch(url, {
            method: 'POST',
            headers: new Headers({
                'Authorization': 'Bearer ' + token
            }),
        });
        if (response.status < 300) {
            loadChapter();
            alert('Đã mở khóa bài học tiếp theo')
        }
        clearInterval(intervalID);
    }, milisecond);
}

