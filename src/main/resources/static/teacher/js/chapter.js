async function loadChapter() {
    $('#example').DataTable().destroy(); // Xóa bảng hiện tại
    const course = document.getElementById("khoahocselect").value;
    const url = `https://lmsdtm-production.up.railway.app/api/chapter/all/find-by-course?course=${course}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: new Headers({
                'Authorization': 'Bearer ' + token
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const list = await response.json();
        console.log(list);

        let main = []; // Sử dụng mảng để tối ưu hóa innerHTML
        for (let i = 0; i < list.length; i++) { // Sử dụng let
            main.push(`
            <tr>
                <td>${list[i].name}</td>
                <td>${list[i].course.name}</td>
                <td>
                    <i onclick="deleteChapter(${list[i].id})" class="fa fa-trash icontable"></i>
                    <a onclick="loadAChapter(${list[i].id})" data-bs-toggle="modal" data-bs-target="#addtk">
                        <i class="fa fa-edit icontable"></i>
                    </a>
                </td>
                <td>
                    <a href="baihoc?chapter=${list[i].id}&course=${list[i].course.id}">Xem bài học</a>
                </td>
            </tr>`);
        }

        document.getElementById("listchapter").innerHTML = main.join(''); // Cập nhật innerHTML
        $('#example').DataTable(); // Khởi tạo lại DataTable

    } catch (error) {
        console.error('Error loading chapters:', error); // Xử lý lỗi
        alert('Có lỗi xảy ra khi tải chương. Vui lòng thử lại sau.'); // Thông báo cho người dùng
    }
}


async function loadAChapter(id) {
    var url = 'https://lmsdtm-production.up.railway.app/api/chapter/all/findById?id=' + id;
    const response = await fetch(url, {
        method: 'GET',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    var result = await response.json();
    document.getElementById("idchapter").value = result.id
    document.getElementById("tenchapter").value = result.name
    document.getElementById("khoahocselectadd").value = result.course.id
}

function cleardata() {
    document.getElementById("idchapter").value = ""
    document.getElementById("tenchapter").value = ""
}

async function saveChapter() {
    var url = 'https://lmsdtm-production.up.railway.app/api/chapter/teacher/create-update';
    var chapter = {
        "id": document.getElementById("idchapter").value,
        "name": document.getElementById("tenchapter").value,
        "course": {
            "id": document.getElementById("khoahocselectadd").value
        },
    }
    var tenChapter = document.getElementById("tenchapter").value.trim();
    if (!tenChapter) {
        toastr.error("Vui lòng nhập tên chapter!");
        return;
    }
    const response = await fetch(url, {
        method: 'POST',
        headers: new Headers({
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify(chapter)
    });
    if (response.status < 300) {
        swal({
                title: "Thông báo",
                text: "thêm/sửa tài chapter công!",
                type: "success"
            },
            function () {
                loadChapter();
            });
    }
    if (response.status == exceptionCode) {
        var result = await response.json()
        toastr.warning(result.defaultMessage);
    }
}


async function deleteChapter(id) {
    var con = confirm("Bạn chắc chắn muốn xóa chapter này?");
    if (con == false) {
        return;
    }
    var url = 'https://lmsdtm-production.up.railway.app/api/chapter/teacher/delete?id=' + id;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    if (response.status < 300) {
        toastr.success("xóa thành công!");
        loadChapter();
    } else {
        if (response.status == exceptionCode) {
            var result = await response.json()
            toastr.warning(result.defaultMessage);
        } else {
            toastr.success("Xóa thất bại");
        }
    }
}

async function loadChapterSelect() {
    var uls = new URL(document.URL)
    var course = uls.searchParams.get("course");
    var chapter = uls.searchParams.get("chapter");
    var url = 'https://lmsdtm-production.up.railway.app/api/chapter/all/find-by-course?course=' + course;
    const response = await fetch(url, {
        method: 'GET',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        }),
    });
    var list = await response.json();
    var main = '';
    for (i = 0; i < list.length; i++) {
        main += ` <option ${chapter == list[i].id ? 'selected' : ''} value="${list[i].id}">${list[i].name}</option>`
    }
    document.getElementById("chapterselect").innerHTML = main
}
