var token = localStorage.getItem("token");

async function loadExam() {
    if ($.fn.DataTable.isDataTable('#example')) {
        $('#example').DataTable().destroy();
    }
    var course = document.getElementById("khoahocbaithi").value;
    var url = 'http://localhost:8080/api/exam/public/findAll';
    if (course != -1) {
        url += '?course=' + course
    }
    const response = await fetch(url, {
        method: 'GET'
    });
    var list = await response.json();
    var main = '';
    if (list.length === 0) {
        main = `<tr><td colspan="9" class="text-center">Không có bài thi nào</td></tr>`;
        document.getElementById("listexam").innerHTML = main;
        return;
    }
    for (i = 0; i < list.length; i++) {
        main += `<tr>
                    <td>${list[i].id}</td>
                    <td>${list[i].name}</td>
                    <td>${list[i].limitTime} phút</td>
                    <td>${list[i].examDate}</td>
                    <td>${list[i].examTime}</td>
                    <td>id: ${list[i].course.id}- ${list[i].course.name}</td>
                    <td>${list[i].lessons.length}</td>
                    <td>
                        <select onchange="updateTrangThai(this,${list[i].id})" class="form-control form-select form-select-sm">
                            <option ${list[i].trangThai == 'CHUA_THI' ? 'selected' : ''} value="CHUA_THI">Chưa thi</option>
                            <option ${list[i].trangThai == 'DANG_THI' ? 'selected' : ''} value="DANG_THI">Đang thi</option>
                            <option ${list[i].trangThai == 'DA_KET_THUC' ? 'selected' : ''} value="DA_KET_THUC">Đã kết thúc</option>
                        </select>
                    </td>
                    <td class="sticky-col">
                        <div class="d-flex flex-column">
                            <div class="d-flex align-items-center gap-2 mb-2">
                                <button onclick="xoaBaiThi(${list[i].id})" class="btn btn-sm btn-danger" title="Xóa"><i class='fa fa-trash'></i></button>
                                <button onclick="window.location.href='addbaithi?id=${list[i].id}'" class="btn btn-sm btn-warning" title="Sửa"><i class='fa fa-edit'></i></button>
                            </div>
                            <button onclick="loadDsLesson(${list[i].id})" data-bs-toggle="modal" data-bs-target="#phanthimodal" class="btn btn-sm btn-primary w-100 text-center mb-2">Phần thi</button>
                            <a href="ketqua?exam=${list[i].id}" class="btn btn-sm btn-primary w-100 text-center mb-2">Kết quả</a>
                            <button onclick="openPracticeResultAdmin(${list[i].id})" class="btn btn-sm btn-primary w-100 text-center">KQ ôn luyện</button>
                        </div>
                    </td>
                </tr>`
    }
    document.getElementById("listexam").innerHTML = main;
    $('#example').DataTable();
}

async function updateTrangThai(e, id) {
    const response = await fetch('http://localhost:8080/api/exam/admin/update-trangthai?id=' + id + '&trangthai=' + e.value, {
        method: 'POST',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    if (response.status < 300) {
        toastr.success("Cập nhật thành công");
    }
    if (response.status == exceptionCode) {
        var result = await response.json()
        toastr.warning(result.defaultMessage);
    }
}

async function loadAExam() {
    var id = window.location.search.split('=')[1];

    if (id != null) {
        document.getElementById("btnthemdethi").innerHTML = `<i class="fa fa-edit"></i> Cập nhật đề thi`
        var url = 'http://localhost:8080/api/exam/public/findById?id=' + id;
        var response = await fetch(url, {});
        var result = await response.json();
        console.log(result);
        document.getElementById("tenbaithi").value = result.name
        document.getElementById("limittime").value = result.limitTime
        document.getElementById("ngaythi").value = result.examDate
        document.getElementById("giothi").value = result.examTime.split(":")[0] + ":" + result.examTime.split(":")[1]
        await loadCourseSelectAddBaiThi();
        document.getElementById("khoahocbaithi").value = result.course.id

        var url = 'http://localhost:8080/api/lesson/public/find-by-exam?id=' + id;
        var response = await fetch(url, {});
        var list = await response.json();
        var main = '';
        for (i = 0; i < list.length; i++) {
            // Show part name instead of ID; keep category and skill
            main += `<div class="singlebonho d-flex flex-wrap align-items-center gap-2">
                <span>Tên phần thi: ${list[i].name}</span>
                <span>${list[i].category.name}</span>
                <span class='badge bg-secondary'>${list[i].skill}</span>
                <i onclick="xoaPhanThi(${list[i].id})" class="fa fa-trash iconxoabn" title='Xóa'></i>
                <i onclick="loadALesson(${list[i].id})" data-bs-toggle="modal" data-bs-target="#suaphanthi" class="fa fa-edit iconedit" title='Sửa'></i>
            </div>`
        }
        document.getElementById("listphanthidathem").innerHTML = main
    }
}


var lessonLink = '';
function renderFilePreview(skill, link){
    var previewDiv = document.getElementById('filePreviewUpdate');
    if(!previewDiv) return;
    if(!link){ previewDiv.style.display='none'; previewDiv.innerHTML=''; return; }
    let html='';
    const lower = link.toLowerCase();
    if(skill === 'LISTENING' || skill === 'SPEAKING'){
        if(lower.endsWith('.mp4')){
            html = `<video controls style="max-width:420px;width:100%"><source src="${link}" type="video/mp4">Trình duyệt không hỗ trợ video.</video>`;
        } else if(lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.ogg')){
            html = `<audio controls style="width:100%;max-width:420px"><source src="${link}">Trình duyệt không hỗ trợ audio.</audio>`;
        } else {
            html = `<a href="${link}" target="_blank">File hiện tại</a>`;
        }
    } else {
        // READING/WRITING không preview file
        previewDiv.style.display='none';
        previewDiv.innerHTML='';
        return;
    }
    previewDiv.innerHTML = html;
    previewDiv.style.display='block';
}
async function loadALesson(id) {
    var url = 'http://localhost:8080/api/lesson/public/findById?id=' + id;
    var response = await fetch(url, {});
    var result = await response.json();
    document.getElementById("idlesson").value = result.id
    document.getElementById("tenphanthiupdate").value = result.name
    document.getElementById("danhmucphanthiupdate").value = result.category.id
    lessonLink = result.linkFile
    tinyMCE.get('editorupdate').setContent(result.content)
    document.getElementById("kynangupdate").value = result.skill
    // ADDED: re-apply skill layout so modal reflects correct format (avoid default LISTENING view)
    if (typeof applySkillLayout === 'function') {
        applySkillLayout('kynangupdate','wrapFileUpdate','wrapEditorUpdate');
    }
    renderFilePreview(result.skill, lessonLink);
}

async function updateLesson() {
    // Hiển thị loading
    document.getElementById("loadingupdate").style.display = 'block';

    // Lấy các giá trị từ form
    var uls = new URL(document.URL);
    var id = uls.searchParams.get("id");
    const filePath = document.getElementById('chonfilenngheupdate');
    const tenphanthi = document.getElementById("tenphanthiupdate").value;
    const danhmucphanthi = document.getElementById("danhmucphanthiupdate").value;
    const kynang = document.getElementById("kynangupdate").value;

    // Validate các trường nhập
    let errorMessages = '';
    if (!tenphanthi) {
        errorMessages += 'Tên phần thi không được để trống. <br>';
    }
    if (!danhmucphanthi) {
        errorMessages += 'Danh mục không được để trống. <br>';
    }
    if (!kynang) {
        errorMessages += 'Kỹ năng không được chọn. <br>';
    }
    if (kynang === 'LISTENING' && filePath.files.length===0 && !lessonLink){
        errorMessages += 'Vui lòng chọn file MP4 nếu là bài nghe. <br>';
    }
    // WRITING không bắt buộc file, READING cũng không

    if (errorMessages) {
        // Hiển thị thông báo lỗi nếu có
        swal({
            title: "Lỗi",
            text: errorMessages,
            type: "error"
        });
        document.getElementById("loadingupdate").style.display = 'none';
        return;  // Dừng hàm nếu có lỗi
    }

    let finalLink = lessonLink; // giữ link cũ nếu không upload mới
    if (filePath.files.length > 0) {
        try {
            const formData = new FormData();
            formData.append('file', filePath.files[0]);
            const res = await fetch('http://localhost:8080/api/public/upload-file', { method:'POST', body: formData });
            if(res.ok){ finalLink = await res.text(); }
        } catch(e){ toastr.error('Lỗi upload file mới'); }
    }

    // Tạo đối tượng dữ liệu cho phần thi
    var phanthi = {
        "id": document.getElementById("idlesson").value,
        "name": tenphanthi,
        "content": tinyMCE.get('editorupdate').getContent(),
        "linkFile": finalLink,
        "skill": kynang,
        "exam": {
            "id": id
        },
        "category": {
            "id": danhmucphanthi
        },
    };

    // Gửi yêu cầu cập nhật phần thi
    const response = await fetch('http://localhost:8080/api/lesson/admin/update', {
        method: 'POST',
        headers: new Headers({
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify(phanthi)
    });

    if (response.status < 300) {
        swal({
            title: "Thông báo",
            text: "Thêm/sửa phần thi thành công!",
            type: "success"
        }, function () {
            // Đóng modal sửa phần thi thay vì reload toàn trang
            var modalEl = document.getElementById('suaphanthi');
            if (modalEl) {
                if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                    var instance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                    instance.hide();
                } else if (window.$) {
                    $('#suaphanthi').modal('hide');
                }
            }
            // Chỉ load lại danh sách phần thi cho bài thi hiện tại để không mất dữ liệu form
            var uls = new URL(document.URL);
            var examId = uls.searchParams.get("id");
            if (examId && typeof loadAExam === 'function') {
                loadAExam();
            }
        });
    } else if (response.status === exceptionCode) {
        var result = await response.json();
        toastr.warning(result.defaultMessage);
    }

    // Ẩn loading sau khi hoàn thành
    document.getElementById("loadingupdate").style.display = 'none';
}


async function saveExam() {
    var uls = new URL(document.URL);
    var id = uls.searchParams.get("id");

    // Lấy giá trị từ các input
    var tenBaithi = document.getElementById("tenbaithi").value;
    var limitTime = document.getElementById("limittime").value;
    var examDate = document.getElementById("ngaythi").value;
    var examTime = document.getElementById("giothi").value;
    var courseId = document.getElementById("khoahocbaithi").value;

    // Ẩn tất cả thông báo lỗi
    document.getElementById("error-tenbaithi").style.display = "none";
    document.getElementById("error-limittime").style.display = "none";
    document.getElementById("error-ngaythi").style.display = "none";
    document.getElementById("error-giothi").style.display = "none";
    // removed: document.getElementById("error-heso").style.display = "none";
    document.getElementById("error-khoahoc").style.display = "none";

    // Kiểm tra dữ liệu nhập vào
    var errorMessages = false;

    // Kiểm tra tên bài thi
    if (!tenBaithi) {
        document.getElementById("error-tenbaithi").style.display = "block";
        errorMessages = true;
    }
    // Kiểm tra thời gian giới hạn
    if (!limitTime || limitTime <= 0) {
        document.getElementById("error-limittime").style.display = "block";
        errorMessages = true;
    }

    // removed: hệ số điểm range check

    // Kiểm tra ngày thi
    if (!examDate) {
        document.getElementById("error-ngaythi").style.display = "block";
        errorMessages = true;
    }

    // Kiểm tra khóa học
    if (!courseId) {
        document.getElementById("error-khoahoc").style.display = "block";
        errorMessages = true;
    }
    if (id === null && listPhanThi.length === 0) {
        document.getElementById("error-phanthi").style.display = "block";
        errorMessages = true;
    }
    // Nếu có lỗi, dừng và hiển thị thông báo
    if (errorMessages) {
        toastr.error("Vui lòng kiểm tra các trường thông tin bắt buộc.");
        return; // Dừng không gửi dữ liệu nếu có lỗi
    }

    // Tạo đối tượng baithi
    var baithi = {
        "id": id,
        "name": tenBaithi,
        "limitTime": limitTime,
        "examDate": examDate,
        "examTime": examTime,
        "lessonDtos": listPhanThi,
        "course": {
            "id": courseId
        },
    }

    // Gửi yêu cầu POST để thêm/sửa bài thi
    const response = await fetch('http://localhost:8080/api/exam/admin/create-update', {
        method: 'POST',
        headers: new Headers({
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify(baithi)
    });

    if (response.status < 300) {
        swal({
                title: "Thông báo",
                text: "Thêm/sửa bài thi thành công!",
                type: "success"
            },
            function () {
                window.location.replace('baithi');
            });
    } else if (response.status == exceptionCode) {
        var result = await response.json();
        toastr.warning(result.defaultMessage);
    }
}


var listPhanThi = [];

async function addPhanThi() {
    document.getElementById("loading").style.display = 'block';
    var tenphanthi = document.getElementById("tenphanthi").value;
    var kynang = document.getElementById("kynang").value;
    var linkFile = '';
    var fileInput = document.getElementById('chonfilennghe');
    var content = tinyMCE.get('editor').getContent();
    var danhmuc = document.getElementById("danhmucphanthi").value;

    if (!tenphanthi || !kynang || !danhmuc) {
        toastr.warning("Vui lòng điền đầy đủ thông tin các trường bắt buộc!");
        document.getElementById("loading").style.display = 'none';
        return;
    }

    // Upload file nếu có (LISTENING/SPEAKING)
    if ((kynang === 'LISTENING' || kynang === 'SPEAKING') && fileInput.files && fileInput.files.length > 0) {
        try {
            const formData = new FormData();
            formData.append("file", fileInput.files[0]);
            const res = await fetch('http://localhost:8080/api/public/upload-file', { method: 'POST', body: formData });
            if (res.ok) { linkFile = await res.text(); } else { toastr.warning('Upload file thất bại'); }
        } catch(e){ toastr.error('Lỗi upload file'); }
    } else if(kynang === 'SPEAKING') {
        // Tự động tạo audio bằng AI nếu SPEAKING mà chưa chọn file
        try {
            const aiRes = await fetch('/api/ai/speech/generate', { method:'POST', body: new URLSearchParams({ text: content || tenphanthi }) });
            if(aiRes.ok){
                const blob = await aiRes.blob();
                // re-upload blob để lấy linkFile
                const fd = new FormData();
                fd.append('file', new File([blob], 'speaking.mp3', { type: 'audio/mpeg' }));
                const upRes = await fetch('http://localhost:8080/api/public/upload-file', { method:'POST', body: fd });
                if(upRes.ok){ linkFile = await upRes.text(); toastr.success('Đã tạo audio SPEAKING bằng AI'); } else { toastr.warning('Upload audio AI thất bại'); }
            } else {
                const errText = await aiRes.text();
                toastr.warning('AI speech thất bại: '+ errText);
            }
        } catch(e){ toastr.error('Lỗi gọi AI Speech'); }
    }

    var phanthi = {
        "name": tenphanthi,
        "skill": kynang,
        "content": content,
        "linkFile": linkFile,
        "category": { "id": danhmuc },
    }
    listPhanThi.push(phanthi);
    document.getElementById("loading").style.display = 'none';
    toastr.success("Đã thêm vào bộ nhớ tạm");
    setPreviewPhanThi();
}


function setPreviewPhanThi() {
    var main = '';
    console.log(listPhanThi);
    for (i = 0; i < listPhanThi.length; i++) {
        // Replace index + separate name with unified 'Tên phần thi: name'
        main += `
        <div class="singlebonho d-flex flex-wrap align-items-center gap-2">
            <span>Tên phần thi: ${listPhanThi[i].name}</span>
            <span>DM ${listPhanThi[i].category.id}</span>
            <span class='badge bg-secondary'>${listPhanThi[i].skill}</span>
            <i onclick="deletePhanThiTam(${i})" class="fa fa-trash iconxoabn" title='Xóa khỏi tạm'></i>
        </div>
        `
    }
    document.getElementById("listphanthitam").innerHTML = main;
}

function deletePhanThiTam(id) {
    listPhanThi.splice(id, 1);
    toastr.success("Đã xóa phần thi khỏi bộ nhớ tạm");
    setPreviewPhanThi();
}

async function xoaPhanThi(id) {
    var con = confirm("Xác nhận xóa phần thi này?")
    if (con == false) {
        return;
    }
    var url = 'http://localhost:8080/api/lesson/admin/delete?id=' + id;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    if (response.status < 300) {
        toastr.success("xóa phần thi thành công!");
        loadAExam();
        return;
    }
    if (response.status == exceptionCode) {
        var result = await response.json();
        toastr.warning(result.defaultMessage);
        return;
    }
    // Các trường hợp lỗi khác: hiển thị chi tiết để dễ debug
    let msg = '';
    try { msg = await response.text(); } catch(e) { msg = ''; }
    toastr.error('Xóa phần thi thất bại (mã ' + response.status + '): ' + (msg || 'Không rõ lỗi'));
}

async function xoaBaiThi(id) {
    var con = confirm("Xác nhận xóa bài thi này?")
    if (con == false) {
        return;
    }
    var url = 'http://localhost:8080/api/exam/admin/delete?id=' + id;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    if (response.status < 300) {
        toastr.success("xóa bài thi thành công!");
        loadExam();
    }
    if (response.status == exceptionCode) {
        var result = await response.json()
        toastr.warning(result.defaultMessage);
    }
}

async function loadDsLesson(id) {
    var url = 'http://localhost:8080/api/lesson/public/find-by-exam?id=' + id;
    var response = await fetch(url, {});
    var list = await response.json();
    var main = '';
    for (i = 0; i < list.length; i++) {
        const l = list[i];
        let fileCell = '';
        if(l.skill === 'LISTENING' && l.linkFile){ fileCell = `<a href="${l.linkFile}" target="_blank">File nghe</a>`; }
        else if(l.skill === 'SPEAKING' && l.linkFile){ fileCell = `<a href="${l.linkFile}" target="_blank">Audio speaking</a>`; }
        else if(l.skill === 'WRITING'){ fileCell = 'Đề bài Writing'; }
        const htmlContent = (l.content||'');
        const hasLongSequence = /[_A-Za-z0-9]{50,}/.test(htmlContent);
        const wideClass = hasLongSequence ? ' wide' : '';
        const contentCell = `<div class="noidunglesson${wideClass}">${htmlContent}</div>`;
        main += `<tr>
            <td>${l.id}</td>
            <td>${l.name}</td>
            <td>${l.category.name}</td>
            <td>${fileCell}</td>
            <td class="tdcol">${contentCell}</td>
            <td>${l.questions.length}</td>
            <td><a target="_blank" href="cauhoi?exam=${l.id}" class="btn btn-primary">Danh sách câu hỏi</a></td>
        </tr>`
    }
    document.getElementById("listlesson").innerHTML = main
}

function openPracticeResultAdmin(examId){
    // Navigate to the dedicated practice-results page (admin route)
    if(!examId){ toastr.warning('Không tìm thấy exam'); return; }
    window.location.href = '/admin/ketquaonluyen?exam=' + examId;
}

document.addEventListener('DOMContentLoaded', function(){
  var fu = document.getElementById('chonfilenngheupdate');
  if(fu){
    fu.addEventListener('change', function(){
      var skill = document.getElementById('kynangupdate')? document.getElementById('kynangupdate').value : '';
      if(this.files && this.files.length>0){
        var tempUrl = URL.createObjectURL(this.files[0]);
        if(typeof renderFilePreview === 'function'){ renderFilePreview(skill, tempUrl); }
      } else if(typeof renderFilePreview === 'function'){ renderFilePreview(skill, lessonLink); }
    });
  }
});
