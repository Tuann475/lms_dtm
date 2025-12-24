async function loadTaiLieu() {
    $('#example').DataTable().destroy();
    var course = document.getElementById("khoahocselect").value
    var url = 'https://lmsdtm-production.up.railway.app/api/document/all/find-by-course?course=' + course;
    const response = await fetch(url, {
        method: 'GET',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        }),
    });
    var list = await response.json();
    var main = '';
    for (i = 0; i < list.length; i++) {
        main += `<tr>
        <td>${list[i].name}</td>
        <td>${list[i].fileType}</td>
        <td>${list[i].storage}</td>
        <td>${formatdate(list[i].createdDate)}</td>
        <td>${list[i].course.name}</td>
        <td>
            <i onclick="deleteTaiLieu(${list[i].id})" class="fa fa-trash icontable"></i>
            <a href="${list[i].linkFile}" download target="_blank"><i class="fa fa-download icontable"></i></a>
        </td>
    </tr>`
    }
    document.getElementById("listfile").innerHTML = main
    $('#example').DataTable();
}


var linkFile = ''

async function saveTaiLieu() {
    document.getElementById("loading").style.display = 'block';
    var uls = new URL(document.URL);
    var id = uls.searchParams.get("id");
    var khoahoc = uls.searchParams.get("khoahoc");
    var url = 'https://lmsdtm-production.up.railway.app/api/document/teacher/create-update';

    const filePath = document.getElementById('chonfile');

    // Kiểm tra nếu không chọn file
    if (filePath.files.length === 0) {
        toastr.error("Vui lòng chọn file!");
        document.getElementById("loading").style.display = 'none';
        return; // Dừng hàm nếu chưa chọn file
    }

    const fileType = filePath.files[0].type;
    const fileSize = filePath.files[0].size;
    const fileName = filePath.files[0].name;

    var linkFilet = await uploadFile(filePath);
    if (linkFilet != null) {
        linkFile = linkFilet;
    }
    var tailieu = {
        "id": id,
        "name": fileName,
        "fileType": fileType,
        "linkFile": linkFile,
        "storage": chuyenDungLuong(fileSize),
        "course": {
            "id": document.getElementById("khoahocselect").value
        },
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: new Headers({
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify(tailieu)
    });

    if (response.status < 300) {
        swal({
                title: "Thông báo",
                text: "Thêm/sửa tài liệu thành công!",
                type: "success"
            },
            function () {
                if (khoahoc == null) {
                    window.location.replace('tailieu');
                } else {
                    window.location.replace('tailieu?khoahoc=' + khoahoc);
                }
            });
    }
    if (response.status == exceptionCode) {
        var result = await response.json();
        toastr.warning(result.defaultMessage);
    }
    document.getElementById("loading").style.display = 'none';
}


function chuyenDungLuong(fileSizeInBytes) {
    // Chuyển đổi dung lượng file sang đơn vị phù hợp
    var fileSizeDisplay = "";
    if (fileSizeInBytes < 1024) {
        fileSizeDisplay = `${fileSizeInBytes} bytes`;
    } else if (fileSizeInBytes < 1024 * 1024) {
        fileSizeDisplay = `${(fileSizeInBytes / 1024).toFixed(2)} KB`;
    } else if (fileSizeInBytes < 1024 * 1024 * 1024) {
        fileSizeDisplay = `${(fileSizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
    } else {
        fileSizeDisplay = `${(fileSizeInBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    return fileSizeDisplay
}

async function deleteTaiLieu(id) {
    var con = confirm("Bạn chắc chắn muốn xóa tài liệu này?");
    if (con == false) {
        return;
    }
    var url = 'https://lmsdtm-production.up.railway.app/api/document/teacher/delete?id=' + id;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    if (response.status < 300) {
        toastr.success("xóa thành công!");
        loadTaiLieu();
    } else {
        if (response.status == exceptionCode) {
            var result = await response.json()
            toastr.warning(result.defaultMessage);
        } else {
            toastr.success("Xóa thất bại");
        }
    }
}

