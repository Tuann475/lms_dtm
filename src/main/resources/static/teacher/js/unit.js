async function loadUnit() {
    $('#example').DataTable().destroy();
    var chapter = document.getElementById("chapterselect").value
    var chapter = document.getElementById("chapterselect").value
    var url = 'http://localhost:8080/api/unit/all/find-by-chapter?chapter=' + chapter;
    const response = await fetch(url, {
        method: 'GET',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        }),
    });
    var list = await response.json();
    console.log(list);
    var main = '';
    for (i = 0; i < list.length; i++) {
        main += `<tr>
        <td>${list[i].name}</td>
        <td>${list[i].minStudyTime}</td>
        <td>${formatdate(list[i].updateDate)}</td>
        <td>${list[i].chapter.name}</td>
        <td>
            <i title="Xóa bài học" onclick="deleteUnit(${list[i].id})" class="fa fa-trash icontable"></i>
            <a title="Chỉnh sửa" href="addbaihoc?chapter=${list[i].chapter.id}&course=${list[i].chapter.course.id}&id=${list[i].id}"><i class="fa fa-edit icontable"></i></a>
            <a title="Xem video" href="${list[i].video}" target="_blank"><i class="fa fa-play-circle fa-3x icontable"></i></a>
            <a href="${list[i].learning_material}" target="_blank" title="Xem tài liệu học tập">
    <i class="${list[i].learning_material != null && list[i].learning_material.endsWith('.pdf') ? 'fa fa-file-pdf' :
            list[i].learning_material != null && list[i].learning_material.endsWith('.docx') ? 'fa fa-file-word' :
                'fa fa-file'} fa-3x icontable" aria-hidden="true"></i>
</a>

        </td>
        </td>
    </tr>`
    }
    document.getElementById("listbaihoc").innerHTML = main
    $('#example').DataTable();
}

async function loadAnUnit() {
    var uls = new URL(document.URL)
    var id = uls.searchParams.get("id");
    if (id != null) {
        var url = 'http://localhost:8080/api/unit/all/findById?id=' + id;
        const response = await fetch(url, {
            method: 'GET',
            headers: new Headers({
                'Authorization': 'Bearer ' + token
            }),
        });
        var result = await response.json();
        document.getElementById("tenbaihoc").value = result.name
        document.getElementById("giotoithieu").value = result.minStudyTime
        document.getElementById("chapterselect").value = result.chapter.id
        linkFile = result.video
        tinyMCE.get('editor').setContent(result.content)
    }
}


async function loadTTkhoahoc() {
    var uls = new URL(document.URL)
    var course = uls.searchParams.get("course");
    var url = 'http://localhost:8080/api/course/public/findById?id=' + course;
    const response = await fetch(url, {
        method: 'GET',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        }),
    });
    var result = await response.json();
    document.getElementById("tenkhoahoc").innerHTML = `<a href="chapter?khoahoc=${course}">${result.name}</a>`
}

var linkFile = ''

function validateForm() {
    let isValid = true;

    // Kiểm tra tên bài học
    const tenbaihoc = document.getElementById('tenbaihoc').value.trim();
    if (!tenbaihoc) {
        document.getElementById('error-tenbaihoc').style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('error-tenbaihoc').style.display = 'none';
    }

    // Kiểm tra giờ học tối thiểu
    const giotoithieu = document.getElementById('giotoithieu').value.trim();
    if (!giotoithieu || parseInt(giotoithieu) <= 0) {
        document.getElementById('error-giotoithieu').style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('error-giotoithieu').style.display = 'none';
    }

    // Kiểm tra chọn chương
    const chapterselect = document.getElementById('chapterselect').value.trim();
    if (!chapterselect) {
        document.getElementById('error-chapterselect').style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('error-chapterselect').style.display = 'none';
    }

    return isValid;
}

async function saveUnit() {
    if (!validateForm()) {
        toastr.error('Vui lòng điền đầy đủ thông tin vào các trường bắt buộc.');
        return;
    }
    document.getElementById("loading").style.display = 'block'
    var uls = new URL(document.URL)
    var id = uls.searchParams.get("id");
    var chapter = uls.searchParams.get("chapter");
    var course = uls.searchParams.get("course");
    var url = 'http://localhost:8080/api/unit/teacher/create-update';

    const filePath = document.getElementById('chonfile')
    var linkFilet = await uploadFile(filePath);
    // up tài liệu
    const path_x = document.getElementById('learning_material')
    var learning_material = await uploadFile(path_x);
    if (linkFilet != null) {
        linkFile = linkFilet
    }
    var unit = {
        "id": id,
        "name": document.getElementById("tenbaihoc").value,
        "content": tinyMCE.get('editor').getContent(),
        "video": linkFile,
        "learning_material": learning_material,
        "minStudyTime": document.getElementById("giotoithieu").value,
        "chapter": {
            "id": document.getElementById("chapterselect").value
        },
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: new Headers({
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify(unit)
    });
    if (response.status < 300) {
        swal({
                title: "Thông báo",
                text: "thêm/sửa bài học thành công!",
                type: "success"
            },
            function () {
                window.location.replace('baihoc?chapter=' + chapter + '&course=' + course)
            });
    }
    if (response.status == exceptionCode) {
        var result = await response.json()
        toastr.warning(result.defaultMessage);
    }
    document.getElementById("loading").style.display = 'none'
}

async function deleteUnit(id) {
    var con = confirm("Bạn chắc chắn muốn xóa bài học này?");
    if (con == false) {
        return;
    }
    var url = 'http://localhost:8080/api/unit/teacher/delete?id=' + id;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    if (response.status < 300) {
        toastr.success("xóa thành công!");
        loadUnit();
    } else {
        if (response.status == exceptionCode) {
            var result = await response.json()
            toastr.warning(result.defaultMessage);
        } else {
            toastr.success("Xóa thất bại");
        }
    }
}