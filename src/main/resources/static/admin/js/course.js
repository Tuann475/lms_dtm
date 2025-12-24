async function loadCourse() {
    $('#example').DataTable().destroy();
    var url = 'http://localhost:8080/api/course/public/find-all';
    const response = await fetch(url, {
        method: 'GET'
    });
    var list = await response.json();
    var main = '';
    for (i = 0; i < list.length; i++) {
        main += `<tr>
                    <td>${list[i].id}</td>
                    <td><img src="${list[i].image}" style="width:100px"></td>
                    <td>${list[i].name}</td>
                    <td>${list[i].category.name}</td>
                    <td>${formatmoney(list[i].price)}</td>
                    <td>${list[i].startDate}</td>
                    <td>${list[i].studyTime}</td>
                    <td class="sticky-col">
                        <i onclick="xoaKhoaHoc(${list[i].id})" class="fa fa-trash-alt iconaction"></i>
                        <a href="addkhoahoc?id=${list[i].id}" onclick="loadACategory(${list[i].id})"><i class="fa fa-edit iconaction"></i></a>
                        <i onclick="loadDanhSachHocVien(${list[i].id})" data-bs-toggle="modal" data-bs-target="#addtk" class="fa fa-eye iconaction"></i>
                       <a title="Add thêm thành viên" href="addthanhvien?id=${list[i].id}"><i class="fa fa-user-plus iconaction"></i></a>

                    </td>
                </tr>`
    }
    document.getElementById("listcourse").innerHTML = main
    $('#example').DataTable();
}

async function getInforKhoaHoc() {
    var id = window.location.search.split('=')[1];
    if (id != null) {
        var url = 'http://localhost:8080/api/course/public/findById?id=' + id;
        try {
            var response = await fetch(url);

            if (!response.ok) {
                if (response.status === 404) {
                    window.location.href = '/notfound'; // Điều hướng đến trang 404
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            var result = await response.json();
            console.log(result)
            document.getElementById("tenkhoahoc").value = result.name

        } catch (error) {
            console.error('An error occurred:', error.message);
        }
    }
}

function toggleSelectAll(selectAllCheckbox) {
    // Lấy tất cả các checkbox trong bảng (trừ checkbox chính)
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:not(#selectAllCheckbox)');

    // Đặt trạng thái của các checkbox theo trạng thái của checkbox chính
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
}

function checkFree(e) {
    if (e.checked == true) {
        document.getElementById("hocphi").value = "";
        document.getElementById("hocphi").readOnly = true;
        document.getElementById("hocphicu").value = "";
        document.getElementById("hocphicu").readOnly = true;

    } else {
        document.getElementById("hocphi").readOnly = false;
        document.getElementById("hocphicu").readOnly = false;
    }
}

var linkImage = '';
var linkBanner = '';

function formatCurrency(input) {
    var value = input.value;
    value = value.replace(/[^\d]/g, '');
    value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    input.value = value + " VNĐ";
}

// Hàm lấy giá trị và loại bỏ dấu phẩy, VNĐ
function getFormattedValue(id) {
    var value = document.getElementById(id).value;
    value = value.replace(/ VNĐ/g, '').replace(/,/g, '');

    return parseFloat(value);
}

async function saveCourse() {
    document.getElementById("loading").style.display = 'block';

    // Lấy ID từ URL
    var uls = new URL(document.URL);
    var id = uls.searchParams.get("id");

    // Validate các trường
    // Kiểm tra tên khóa học
    var courseName = document.getElementById("tenkh").value.trim();
    if (courseName === '') {
        document.getElementById("error-tenkh").innerText = 'Tên khóa học không được để trống.';
    } else {
        document.getElementById("error-tenkh").innerText = ''; // Xóa thông báo lỗi nếu có
    }

// Kiểm tra học phí
    var hocphi = document.getElementById("hocphi").value;
    if (hocphi < 0) {
        document.getElementById("error-hocphi").innerText = 'Học phí phải lớn hơn 0.';
    } else {
        document.getElementById("error-hocphi").innerText = ''; // Xóa thông báo lỗi nếu có
    }

// Kiểm tra ngày bắt đầu và ngày kết thúc
    var startDate = document.getElementById("tungay").value;
    var endDate = document.getElementById("denngay").value;
    if (startDate === '') {
        document.getElementById("error-tungay").innerText = 'Ngày bắt đầu không được để trống.';
    } else {
        document.getElementById("error-tungay").innerText = ''; // Xóa thông báo lỗi nếu có
    }
    if (endDate === '') {
        document.getElementById("error-denngay").innerText = 'Ngày kết thúc không được để trống.';
    } else {
        document.getElementById("error-denngay").innerText = ''; // Xóa thông báo lỗi nếu có
    }

// Kiểm tra giảng viên
    var teacherId = document.getElementById("giangvien").value;
    if (teacherId === '') {
        document.getElementById("error-giangvien").innerText = 'Chưa chọn giảng viên.';
    } else {
        document.getElementById("error-giangvien").innerText = ''; // Xóa thông báo lỗi nếu có
    }

// Kiểm tra danh mục
    var categoryId = document.getElementById("danhmuckhoahoc").value;
    if (categoryId === '') {
        document.getElementById("error-danhmuckhoahoc").innerText = 'Chưa chọn danh mục.';
    } else {
        document.getElementById("error-danhmuckhoahoc").innerText = ''; // Xóa thông báo lỗi nếu có
    }


    var hasError = false;

    document.querySelectorAll('.error-message').forEach(function (errorDiv) {
        if (errorDiv.innerText.trim() !== '') {
            hasError = true;
        }
    });

    if (hasError) {
        toastr.warning('Vui lòng kiểm tra lại các thông tin đã nhập.');
        document.getElementById("loading").style.display = 'none';
        return;  // Dừng lại nếu có lỗi
    }

    // Lấy các giá trị cần thiết từ DOM một lần để tránh lặp lại
    var courseName = document.getElementById("tenkh").value.trim();
    var hocphi = document.getElementById("hocphi").value;
    var hocphicu = document.getElementById("hocphicu").value;
    var description = tinyMCE.get('editor').getContent();
    var instruct = tinyMCE.get('editorch').getContent();
    var dayOfWeek = $("#thutrongtuan").val().toString();
    var studyTime = document.getElementById("giohoc").value;
    var startDate = document.getElementById("tungay").value;
    var endDate = document.getElementById("denngay").value;
    var isFree = document.getElementById("isFree").checked;
    var teacherId = document.getElementById("giangvien").value;
    var categoryId = document.getElementById("danhmuckhoahoc").value;

    // Upload ảnh đại diện và banner
    var linkImagecheck = await uploadAnh(document.getElementById("anhdaidien"));
    var linkBannercheck = await uploadAnh(document.getElementById("imagebanner"));
    var linkImage = linkImagecheck ? linkImagecheck : "";
    var linkBanner = linkBannercheck ? linkBannercheck : "";

    // Tạo object `course`
    var course = {
        "id": id,
        "name": courseName,
        "image": linkImage,
        "banner": linkBanner,
        "price": hocphi.replace(/ VNĐ|,/g, ''),  // Xử lý học phí (loại bỏ dấu phẩy và VNĐ)
        "oldPrice": hocphicu.replace(/ VNĐ|,/g, ''),  // Xử lý học phí cũ
        "description": description,
        "instruct": instruct,
        "dayOfWeek": dayOfWeek,
        "studyTime": studyTime,
        "startDate": startDate,
        "endDate": endDate,
        "isfree": isFree,
        "teacher": {
            "id": teacherId
        },
        "category": {
            "id": categoryId
        },
        "promises": listCamKet,
    };
    console.log(course);

    // Gửi yêu cầu tới API
    try {
        const response = await fetch('http://localhost:8080/api/course/admin/create-update', {
            method: 'POST',
            headers: new Headers({
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify(course)
        });

        // Xử lý phản hồi từ API
        if (response.status < 300) {
            swal({
                title: "Thông báo",
                text: "Thêm/Sửa khóa học thành công!",
                icon: "success",
                button: "OK",
            }).then(() => {
                window.location.replace('khoahoc');
            });
        } else if (response.status == exceptionCode) {
            var result = await response.json();
            toastr.warning(result.defaultMessage);
        } else {
            toastr.error("Đã xảy ra lỗi khi lưu khóa học.");
        }
    } catch (error) {
        console.error("Lỗi:", error);
        toastr.error("Không thể kết nối tới máy chủ.");
    } finally {
        // Ẩn loader
        document.getElementById("loading").style.display = 'none';
    }
}


async function loadACourse() {
    var id = window.location.search.split('=')[1];
    if (id != null) {
        document.getElementById("btnthemkhoahoc").innerHTML = `<i class="fa fa-edit"></i> Cập nhật khóa học`
        var url = 'http://localhost:8080/api/course/public/findById?id=' + id;
        var response = await fetch(url, {});
        var result = await response.json();

        console.log(result);
        if (result.isfree == true) {
            console.log("ABC");
        }

        document.getElementById("tenkh").value = result.name
        document.getElementById("tungay").value = result.startDate
        linkBanner = result.banner
        linkImage = result.image
        document.getElementById("imgpreview").src = result.image

        document.getElementById("denngay").value = result.endDate
        document.getElementById("giangvien").value = result.teacher.id
        if (result.price !== null && result.price !== undefined) {
            document.getElementById("hocphi").value = result.price.toLocaleString('vi-VN');
        } else {
            document.getElementById("hocphi").value = 0;  // Hoặc gán giá trị mặc định nào đó nếu cần
        }

        if (result.oldPrice !== null && result.oldPrice !== undefined) {
            document.getElementById("hocphicu").value = result.oldPrice.toLocaleString('vi-VN');
        } else {
            document.getElementById("hocphicu").value = 0;  // Hoặc gán giá trị mặc định nào đó nếu cần
        }

        document.getElementById("isFree").checked = result.isfree;

        if (result.isfree === "true" || result.isfree === true) {
            document.getElementById("hocphi").readOnly = true;
            document.getElementById("hocphicu").readOnly = true;
            document.getElementById("isFree").checked = true;
        }


        $("#thutrongtuan").val(result.dayOfWeek.split(",")).change()
        document.getElementById("giohoc").value = result.studyTime
        tinyMCE.get('editor').setContent(result.description)
        tinyMCE.get('editorch').setContent(result.instruct)
        await loadCategoryKhoaHoc();
        document.getElementById("danhmuckhoahoc").value = result.category.id


        var main = '';
        for (i = 0; i < result.promises.length; i++) {
            main += `<div class="singlebonho">
            Cam kết: ${result.promises[i].content} 
            <i onclick="xoaCamKet(${result.promises[i].id})" class="fa fa-trash iconxoabn"></i>
            <i onclick="loadACamKet(${result.promises[i].id})" data-bs-toggle="modal" data-bs-target="#capnhatmodal" class="fa fa-edit iconedit"></i>
        </div>`
        }
        document.getElementById("listcamketdathem").innerHTML = main
    }
}

async function loadACamKet(id) {
    var url = 'http://localhost:8080/api/promise/public/findById?id=' + id;
    var response = await fetch(url, {});
    var result = await response.json();
    document.getElementById("idcamketupdate").value = result.id
    document.getElementById("camketupdate").value = result.content
}

async function updateCamKet() {
    var prom = {
        "id": document.getElementById("idcamketupdate").value,
        "content": document.getElementById("camketupdate").value,
    }
    const response = await fetch('http://localhost:8080/api/promise/admin/update', {
        method: 'POST',
        headers: new Headers({
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify(prom)
    });
    if (response.status < 300) {
        toastr.success("Cập nhật thành công");
        loadACourse();
    }
    if (response.status == exceptionCode) {
        var result = await response.json()
        toastr.warning(result.defaultMessage);
    }
    document.getElementById("loadingupdate").style.display = 'none'
}


async function uploadAnh(filePath) {
    const formData = new FormData()
    formData.append("file", filePath.files[0])
    var urlUpload = 'http://localhost:8080/api/public/upload-file';
    const res = await fetch(urlUpload, {
        method: 'POST',
        body: formData
    });
    if (res.status < 300) {
        var linkImage = await res.text();
        return linkImage
    } else {
        return null;
    }
}

var listCamKet = [];

function addCamKet() {
    var obj = {
        "content": document.getElementById("camket").value
    }
    listCamKet.push(obj);
    setPreviewCamKet();
}

function setPreviewCamKet() {
    var main = '';
    for (i = 0; i < listCamKet.length; i++) {
        main += `
        <div class="singlebonho">
            Nội dung cam kết: ${listCamKet[i].content} <i onclick="deleteCamKetTam(${i})" class="fa fa-trash iconxoabn"></i>
        </div>
        `
    }
    document.getElementById("listcamket").innerHTML = main;
}

function deleteCamKetTam(id) {
    listCamKet.splice(id, 1);
    toastr.success("Đã xóa cam kết khỏi bộ nhớ tạm");
    setPreviewCamKet();
}


async function xoaKhoaHoc(id) {
    var con = confirm("Xác nhận xóa khóa học này?")
    if (con == false) {
        return;
    }
    var url = 'http://localhost:8080/api/course/admin/delete?id=' + id;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    if (response.status < 300) {
        toastr.success("xóa thành công!");
        loadCourse();
    }
    if (response.status == exceptionCode) {
        var result = await response.json()
        toastr.warning(result.defaultMessage);
    }
}

async function xoaCamKet(id) {
    var con = confirm("Xác nhận xóa?")
    if (con == false) {
        return;
    }
    var url = 'http://localhost:8080/api/promise/admin/delete?id=' + id;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    if (response.status < 300) {
        toastr.success("xóa thành công!");
        loadACourse();
    }
    if (response.status == exceptionCode) {
        var result = await response.json()
        toastr.warning(result.defaultMessage);
    }
}


async function loadCourseSelectAddBaiThi() {
    $('#example').DataTable().destroy();
    var url = 'http://localhost:8080/api/course/public/find-all';
    const response = await fetch(url, {
        method: 'GET'
    });
    var list = await response.json();

    var main = '';
    for (i = 0; i < list.length; i++) {
        main += `<option value="${list[i].id}">${list[i].name}</option>`
    }
    document.getElementById("khoahocbaithi").innerHTML = main
}

async function loadDanhSachHocVien(id) {
    $('#exampletr').DataTable().destroy();
    var url = 'http://localhost:8080/api/course-user/admin/find-by-course?id=' + id;
    var response = await fetch(url, {
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    var list = await response.json();
    var main = '';
    for (i = 0; i < list.length; i++) {
        main += `<tr>
        <td>${list[i].id}</td>
        <td>${list[i].fullName}</td>
        <td>${list[i].phone}</td>
        <td>${list[i].email}</td>
        <td>${list[i].createdDate}</td>
        <td>${list[i].note}</td>
        <td class="sticky-col">
            <i onclick="xoaKhoaHocUser(${list[i].id}, ${id})" class="fa fa-trash-alt iconaction"></i>
            <a href="hocvien?id=${list[i].user.id}&course=${id}" target="_blank"><i class="fa fa-edit iconaction"></i></a>
        </td>
    </tr>`
    }
    document.getElementById("listcourseuser").innerHTML = main
    $('#exampletr').DataTable();
}


async function xoaKhoaHocUser(id, idcourse) {
    var con = confirm("Xác nhận xóa học viên này?")
    if (con == false) {
        return;
    }
    var url = 'http://localhost:8080/api/course-user/admin/delete?id=' + id;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    if (response.status < 300) {
        toastr.success("xóa thành công!");
        loadDanhSachHocVien(idcourse);
    }
    if (response.status == exceptionCode) {
        var result = await response.json()
        toastr.warning(result.defaultMessage);
    }
}


async function loadCourseSelectBaiThi() {
    try { if($.fn.DataTable.isDataTable('#example')){ $('#example').DataTable().destroy(); } } catch(e){}
    var u = new URL(document.URL);
    var id = u.searchParams.get('id'); // allow direct id param
    var url = 'http://localhost:8080/api/course/public/find-all';
    const response = await fetch(url, { method: 'GET' });
    if(!response.ok){ console.warn('Không tải danh sách khóa học'); return; }
    var list = await response.json();
    var main = '<option value="-1">Tất cả</option>';
    for (let i = 0; i < list.length; i++) {
        var selected = (id && (list[i].id+'' === id+'')) ? ' selected' : '';
        main += `<option value="${list[i].id}"${selected}>${list[i].name}</option>`;
    }
    var sel = document.getElementById('khoahocbaithi');
    if(sel){ sel.innerHTML = main; if(!id){ sel.value='-1'; } }
}

async function selectedonchang() {
    $('#example').DataTable().destroy();
    var courseId = document.getElementById("khoahocbaithi").value // Lấy id từ URL
    var url = `http://localhost:8080/admin/addthanhvien?id=${courseId}`;
    window.location.href = url;
}


async function loadThongTinHocVien() {
    var uls = new URL(document.URL)
    var id = uls.searchParams.get("id");
    var course = uls.searchParams.get("course");
    var url = 'http://localhost:8080/api/exam/admin/thong-tin-hoc-vien?course=' + course + '&user=' + id;
    const response = await fetch(url, {
        method: 'GET',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    var hocvien = await response.json();
    console.log(hocvien);
    document.getElementById("imageuser").src = hocvien.user.avatar
    document.getElementById("hotenhv").innerHTML = hocvien.user.fullName
    document.getElementById("email").innerHTML = hocvien.user.email
    document.getElementById("tenkhoahoc").innerHTML = hocvien.course.name
    document.getElementById("level").value = hocvien.courseUser.level
    document.getElementById("level").dataset.initialLevel = hocvien.courseUser.level || '';
    document.getElementById("ngaydki").innerHTML = formatdate(hocvien.courseUser.createdDate)
    var main = '';
    for (i = 0; i < hocvien.exams.length; i++) {
        main += `<tr>
        <td>${hocvien.exams[i].id}</td>
        <td>${hocvien.exams[i].name}</td>
        <td>${hocvien.exams[i].limitTime}</td>
        <td>${hocvien.exams[i].examTime}, ${hocvien.exams[i].examDate}</td>
        <td>${hocvien.exams[i].lessons.length}</td>
    </tr>`
    }
    document.getElementById("listdethi").innerHTML = main

    var main = '';
    for (i = 0; i < hocvien.results.length; i++) {
        var r = hocvien.results[i];
        var tong = (r.tongCauHoi != null ? r.tongCauHoi : r.totalQuestions);
        var dung = (r.soTLDung != null ? r.soTLDung : r.correctCount);
        var phanTram = (typeof r.phanTram === 'number' ? r.phanTram : (tong ? (dung / tong * 100) : 0));
        var diemText;
        if (r.manualScore !== null && r.manualScore !== undefined) {
            var formattedManual = Number(r.manualScore).toFixed(1);
            diemText = formattedManual.replace(/\.0$/, '');
        } else if (tong != null && dung != null) {
            diemText = `${dung}/${tong} (${phanTram.toFixed(2)}%)`;
        } else {
            diemText = `${phanTram.toFixed(2)} %`;
        }
        main += `<tr>
        <td>${r.result.exam.id}</td>
        <td>${r.result.exam.name}</td>
        <td>${r.result.finishTime} giây</td>
        <td>${diemText}</td>
    </tr>`
    }
    document.getElementById("baithidalam").innerHTML = main
}


async function loadThongTinHocVienChungChi() {
    var uls = new URL(document.URL)
    var id = uls.searchParams.get("id");
    var course = uls.searchParams.get("course");
    var url = 'http://localhost:8080/api/exam/admin/thong-tin-hoc-vien?course=' + course + '&user=' + id;
    const response = await fetch(url, {
        method: 'GET',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    var hocvien = await response.json();
    console.log(hocvien);
    document.getElementById("tenhocvien").innerHTML = hocvien.user.fullName
    document.getElementById("tenkhoahoc").innerHTML = hocvien.course.name
    document.getElementById("loaicc").innerHTML = hocvien.courseUser.level
}


async function thongKe() {
    var uls = new URL(document.URL)
    var id = uls.searchParams.get("id");
    var course = uls.searchParams.get("course");
    var url = 'http://localhost:8080/api/chapter/all/find-by-course?course=' + course;
    var response = await fetch(url, {
        method: 'GET',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        }),
    });
    var list = await response.json();
    var main = `<tr>`;
    for (i = 0; i < list.length; i++) {
        main += `<th class="text-center" colspan="${list[i].units.length}">${list[i].name}</th>`
    }
    main += `<th class="sticky-col">Tổng</th>
    </tr>`;
    document.getElementById("chuongtk").innerHTML = main
    document.getElementById("listthongke").innerHTML = ""

    main = '<tr>';
    for (i = 0; i < list.length; i++) {
        var listUnit = list[i].units;
        for (j = 0; j < listUnit.length; j++) {
            main += `<td class="text-center small-text">${listUnit[j].name}</td>`
        }
    }
    main += `<td class="sticky-col"></td>
    </tr>`;
    document.getElementById("chuongtk").innerHTML += main


    var url = 'http://localhost:8080/api/user-unit/admin/thong-ke?course=' + course + '&userId=' + id;
    var response = await fetch(url, {
        method: 'GET',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        }),
    });
    var list = await response.json();
    console.log(list);

    for (i = 0; i < list.length; i++) {
        var main = `<tr>`;
        var listUnit = list[i].units;

        var tonghoc = 0;
        for (j = 0; j < listUnit.length; j++) {
            if (listUnit[j].daHoc == true) {
                main += `<td>${listUnit[j].createdDate}</td>`
                tonghoc += Number(1)
            } else {
                main += `<td><span class="text-red">x</span></td>`
            }
        }

        main += `<td class="sticky-col">${tonghoc}/ ${listUnit.length}</td>
        </tr>`;
        document.getElementById("listthongke").innerHTML += main
    }

}


async function updateCC() {
    var con = confirm("Xác nhận cập nhật chứng chỉ?");
    if (con == false) {
        return;
    }

    var uls = new URL(document.URL)
    var id = uls.searchParams.get("id");
    var course = uls.searchParams.get("course");
    var level = document.getElementById("level").value
    var url = 'http://localhost:8080/api/course-user/admin/update-cc?courseId=' + course + "&userId=" + id + '&level=' + level;
    const response = await fetch(url, {
        method: 'POST',
        headers: new Headers({
            'Authorization': 'Bearer ' + token,
        })
    });
    if (response.status < 300) {
        document.getElementById("level").dataset.initialLevel = level;
        toastr.success("Cập nhật thành công!");
    }
    if (response.status == exceptionCode) {
        var result = await response.json()
        toastr.warning(result.defaultMessage);
    }
}


async function taoChungChi(el, event) {
    if (event) {
        event.preventDefault();
    }
    const levelSelect = document.getElementById('level');
    if (!levelSelect || !levelSelect.value) {
        toastr.warning('Vui lòng chọn xếp loại trước khi tạo chứng chỉ');
        return;
    }

    var uls = new URL(document.URL);
    var id = uls.searchParams.get('id');
    var course = uls.searchParams.get('course');
    const targetUrl = 'taochungchi?id=' + id + '&course=' + course;
    const initialLevel = levelSelect.dataset.initialLevel || '';

    // Nếu level đã được lưu và không thay đổi, mở trực tiếp
    if (initialLevel && initialLevel === levelSelect.value) {
        window.open(targetUrl, '_blank');
        return;
    }

    try {
        var url = 'http://localhost:8080/api/course-user/admin/update-cc?courseId=' + course + '&userId=' + id + '&level=' + encodeURIComponent(levelSelect.value);
        const response = await fetch(url, {
            method: 'POST',
            headers: new Headers({
                'Authorization': 'Bearer ' + token,
            })
        });
        if (response.status < 300) {
            levelSelect.dataset.initialLevel = levelSelect.value;
            toastr.success('Đã cập nhật xếp loại. Đang mở trang chứng chỉ...');
            window.open(targetUrl, '_blank');
        } else {
            let message = 'Không thể cập nhật chứng chỉ';
            try {
                const result = await response.json();
                if (result && result.defaultMessage) {
                    message = result.defaultMessage;
                }
            } catch (_) {}
            toastr.warning(message);
        }
    } catch (error) {
        console.error('Tao chung chi error', error);
        toastr.error('Không thể cập nhật chứng chỉ');
    }
}

// c��c hàm add nhiều user cùng lúc vào

function getCheckedCheckboxes() {
    // Lấy tất cả các checkbox đã được chọn
    const checkedCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked:not(#selectAllCheckbox)');

    // Tạo một mảng để lưu giá trị của các checkbox đã chọn (nếu cần)
    let checkedValues = [];
    checkedCheckboxes.forEach(checkbox => {
        checkedValues.push(checkbox.value); // Hoặc dùng checkbox.id để lấy ID
    });

    // In ra console hoặc xử lý dữ liệu theo nhu cầu của bạn
    console.log('Các checkbox đã chọn:', checkedValues);
}

function submitSelectedUsers() {
    var courseId = window.location.search.split('=')[1];
    const selectedCheckboxes = document.querySelectorAll('.userCheckbox:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(checkbox => checkbox.value);

    if (selectedIds.length === 0) {
        alert('Vui lòng chọn ít nhất một người dùng.');
        return;
    }

    // Lấy token từ localStorage hoặc sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    // Gửi dữ liệu tới API
    fetch('/api/course/admin/add-list-user-to-course/' + selectedIds.join(',') + "?courseId=" + courseId, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token // Gửi token trong header
        }
    })
        .then(response => {
            console.log(response);
            if (response.status === 200) {
                // Sử dụng SweetAlert2
                return Swal.fire({
                    title: "Thông báo",
                    text: "Add user vào khóa học thành công",
                    icon: "success"
                }).then(() => {
                    // Chuyển hướng hoặc tải lại trang sau khi thông báo hoàn tất
                    window.location.reload();
                });
            } else {
                console.error('Response status:', response.status);
                alert('Có lỗi xảy ra khi thêm thành viên.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Có lỗi xảy ra: ' + error.message);
        });
}
