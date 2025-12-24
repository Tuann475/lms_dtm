var size = 9;

async function loadKhoaHoc(page) {
    var url = 'https://lmsdtm-production.up.railway.app/api/course/public/courses?type=' + '&page=' + page + '&size=' + size + '&sort=id,desc';
    const response = await fetch(url, {});
    var result = await response.json();
    console.log(result);
    var list = result.content;
    // var list = result;
    document.getElementById("listkhoahoc").innerHTML = "";
    var main = '';
    for (i = 0; i < list.length; i++) {
        main += `<div class="col-sm-4">
        <a href="chitietkhoahoc?id=${list[i].id}" class="singcourse"><div class="singlecourse">
            <img src="${list[i].image}" class="imgkh" alt="Course Image">
            <span class="tieudecourse">${list[i].name}</span>
            <span class="sohocvien">${list[i].numUser} học viên</span>
            <span class="sivgia"><span class="giagoc">${formatmoney(list[i].price)}</span><span class="giacu">${list[i].oldPrice == null ? '' : formatmoney(list[i].oldPrice)}</span>
            ${list[i].oldPrice == null ? '' : `<span class="giamgia">-${(100 - list[i].price / list[i].oldPrice * 100).toString().split(".")[0]} %</span>`}
            </span>
        </div></a>
    </div>`
    }
    document.getElementById("listkhoahoc").innerHTML += main

    if (result.last === false) {
        document.getElementById("btnxemthemkh").onclick = function () {
            loadKhoaHoc(Number(page) + Number(1));
        }
    } else {
        document.getElementById("btnxemthemkh").onclick = function () {
            toastr.warning("Đã hết kết quả tìm kiếm");
        }
    }
}

async function loadACourse() {
    var id = window.location.search.split('=')[1];
    if (id != null) {
        var url = 'https://lmsdtm-production.up.railway.app/api/course/public/findById?id=' + id;
        var response = await fetch(url, {});
        var result = await response.json();
        console.log(result);
        document.getElementById("bannercourse").style.backgroundImage = `url(${result.banner})`
        document.getElementById("tenkhoahoc").innerHTML = result.name
        document.getElementById("thongtinkhoahoc").innerHTML = result.description
        document.getElementById("huongdanhoc").innerHTML = result.instruct
        document.getElementById("imgcourse").src = result.image
        var main = '';
        for (i = 0; i < result.promises.length; i++) {
            main += `✅ ${result.promises[i].content}<br>`;
            if (i === 2) {
                break;
            }
        }
        document.getElementById("listpromise").innerHTML = main

        document.getElementById("giamoikh").innerHTML = formatmoney(result.price)
        if (result.oldPrice != null && result.oldPrice > 0) {
            document.getElementById("divgiagoc").style.display = ''
            document.getElementById("giacukhoahoc").innerHTML = formatmoney(result.oldPrice)
            document.getElementById("giagiam").innerHTML = formatmoney(result.oldPrice - result.price)
            document.getElementById("phantramgiam").innerHTML = '(-' + (100 - result.price / result.oldPrice * 100).toString().split(".")[0] + '%)'
        }
        document.getElementById("songuoidk").innerHTML = result.numUser
        document.getElementById("thoigianhoc").innerHTML = `<strong>${result.startDate}</strong>` + ' đến ' + `<strong>${result.endDate}</strong>`
        document.getElementById("giohoc").innerHTML = `<strong>${result.studyTime}, thứ ${result.dayOfWeek}</strong>`
        document.getElementById("giangvien").innerHTML = `<strong>${result.teacher.fullName}</strong>`

        var promises = result.promises
        var main2 = ''
        for (i = 0; i < promises.length; i++) {
            main2 += `<span class="ndcamket"><span class="thutu">${Number(i + 1)}</span> ${promises[i].content}</span>`;
        }
        document.getElementById("listcamket").innerHTML = main2
        document.getElementById("btndangkykh").onclick = function () {
            window.location.href = 'xacnhan?khoahoc=' + id
            // if(result.isfree==false){
            //     window.location.href = 'xacnhan?khoahoc='+id
            // }else{
            //     window.location.href = 'joinkhoahoc'
            // }

        }
    }
}


async function loadACourseCheckout() {
    var id = window.location.search.split('=')[1];
    if (id != null) {
        var url = 'https://lmsdtm-production.up.railway.app/api/course/public/findById?id=' + id;
        try {
            var response = await fetch(url);

            if (!response.ok) {
                if (response.status === 404) {
                    window.location.href = '/notfound'; // Điều hướng đến trang 404
                }
                // Intentional: throw to break out of try/catch and handle HTTP error
                throw new Error(`HTTP error! status: ${response.status}`); // handled locally
            }

            var result = await response.json();
            console.log(result)
            document.getElementById("tenkhoahoc").innerHTML = result.name;
            document.getElementById("thoigianhoc").innerHTML = `<strong>${result.startDate}</strong>` + ' đến ' + `<strong>${result.endDate}</strong>`;
            document.getElementById("giohoc").innerHTML = `<strong>${result.studyTime}, thứ ${result.dayOfWeek}</strong>`;
            document.getElementById("giangvien").innerHTML = `<strong>${result.teacher.fullName}</strong>`;
            if (result.price === null) {
                document.getElementById("giamoikh").innerHTML = "<strong style='color: #28a745; font-size: 1.5em;'>Miễn phí</strong>";
            } else {
                document.getElementById("giamoikh").innerHTML = "<strong style='color: red; font-size: 1.5em;'>" + formatmoney(result.price) + "</strong>";
            }

        } catch (error) {
            console.error('An error occurred:', error.message);
        }
    }
}

// Sửa loadKhoaHocCuaToi để lưu list vào localStorage cho truy xuất nhanh
async function loadKhoaHocCuaToi() {
    var url = 'https://lmsdtm-production.up.railway.app/api/course-user/user/find-by-user';
    const response = await fetch(url, {
        method: 'GET',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    var list = await response.json();
    localStorage.setItem('listKhoaHocCuaToi', JSON.stringify(list));
    var main = '';
    for (i = 0; i < list.length; i++) {
        var courseUser = list[i];
        var level = courseUser && courseUser.courseUser ? courseUser.courseUser.level : courseUser.level;
        var cc = '';
        if (level != null && level !== '') {
            cc = `<li><a class='dropdown-item' href='chungchi?khoahoc=${courseUser.course.id}'><i class='fa fa-certificate'></i> Xem chứng chỉ</a></li>`;
        }
        main += `<div class="col-sm-4 dropend">
        <div class="singlekhoahoc" data-index="${i}">
            <img src="${courseUser.course.image}" class="imgkhoahocct" alt="Course Image">
            <p class="tenkhoahoc">${courseUser.course.name}</p>
        </div>
        </div>`
    }
    document.getElementById("listmycourse").innerHTML = main;

    // Xử lý hiệu ứng drop item ngay dưới singlekhoahoc
    setTimeout(function() {
      var courseDivs = document.querySelectorAll('#listmycourse .singlekhoahoc');
      courseDivs.forEach(function(div, idx) {
        div.onclick = function(e) {
          var next = div.nextElementSibling;
          if (next && next.classList.contains('course-items-dropdown')) {
            next.remove();
            return;
          }
          document.querySelectorAll('.course-items-dropdown').forEach(function(el){el.remove();});
          var list = JSON.parse(localStorage.getItem('listKhoaHocCuaToi'));
          var course = list[idx];
          var level = course && course.courseUser ? course.courseUser.level : course.level;
          var cc = '';
          if (level != null && level !== '') {
            cc += `<li><a class='dropdown-item' href='chungchi?khoahoc=${course.course.id}'><i class='fa fa-certificate'></i> Xem chứng chỉ</a></li>`;
          }
          var itemsHtml = `<div class='course-items-dropdown' style='background:#fff;border:1px solid #ddd;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);padding:10px;margin-top:10px;position:relative;z-index:10;'>
            <ul style='list-style:none;padding:0;margin:0;'>
              <li><a class='dropdown-item' data-bs-toggle='modal' data-bs-target='#modaltailieu' onclick='loadTaiLieuKh(${course.course.id})'><i class='fa fa-file'></i> Tài liệu</a></li>
              <li><a class='dropdown-item' href='baihoc?khoahoc=${course.course.id}'><i class='fa fa-list'></i> Bài học</a></li>
              <li><a class='dropdown-item' href='danhsachdethi?khoahoc=${course.course.id}&tenkhoahoc=${encodeURIComponent(course.course.name)}'><i class='fa fa-check-square'></i> Đề thi</a></li>
              ${cc}
            </ul>
            <span style='position:absolute;top:5px;right:10px;cursor:pointer;font-size:18px;' onclick='this.parentElement.remove()' title='Đóng'>&times;</span>
          </div>`;
          div.insertAdjacentHTML('afterend', itemsHtml);
        }
      });
    }, 500);
}


async function loadThongTinHocVienChungChi() {
    var uls = new URL(document.URL)
    var course = uls.searchParams.get("khoahoc");
    var url = 'https://lmsdtm-production.up.railway.app/api/exam/user/thong-tin-hoc-vien?course=' + course;
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


async function searchKhoaHoc(page, search) {
    var uls = new URL(document.URL)
    var danhmuc = uls.searchParams.get("danhmuc");
    var tendanhmuc = uls.searchParams.get("tendanhmuc") || '';
    var catId = danhmuc != null ? Number(danhmuc) : null;
    var url = 'https://lmsdtm-production.up.railway.app/api/course/public/search-course?page=' + page + '&size=' + size + '&sort=id,desc';
    if (catId != null && !Number.isNaN(catId)) {
        url += '&categoryId=' + catId;
    }
    if (search != null) {
        url += "&search=" + encodeURIComponent(search);
    }

    console.log('[searchKhoaHoc] URL=', url, ' categoryId=', catId, ' search=', search);

    try {
        const response = await fetch(url, {});
        if (!response.ok) {
            throw new Error('Request failed: ' + response.status);
        }
        var result = await response.json();
        console.log('[searchKhoaHoc] result page', page, result);
        var list = result.content || [];

        // On first page: clear list and show active category header (if present)
        if (Number(page) === 0) {
            var headerHtml = '';
            if (tendanhmuc && tendanhmuc.length > 0) {
                headerHtml = '<div class="col-12"><div class="contentblock" style="margin-bottom:8px"><strong>Danh mục:</strong> ' + tendanhmuc + '</div></div>';
            }
            document.getElementById("listkhoahoc").innerHTML = headerHtml;
        }

        // Render empty state when no courses match
        if (!list || list.length === 0) {
            if (Number(page) === 0) {
                document.getElementById("listkhoahoc").innerHTML += '<div class="col-12"><div class="contentblock"><p style="margin:8px 0;color:#6b7280">Không có khoá học phù hợp cho danh mục đã chọn.</p></div></div>';
            }
            document.getElementById("btnxemthemkh").onclick = function () {
                toastr.warning("Đã hết kết quả tìm kiếm");
            };
            return;
        }

        var main = '';
        for (i = 0; i < list.length; i++) {
            main += `<div class="col-sm-4">
        <a href="chitietkhoahoc?id=${list[i].id}" class="singcourse"><div class="singlecourse">
            <img src="${list[i].image}" class="imgkh" alt="Course Image">
            <span class="tieudecourse">${list[i].name}</span>
            <span class="sohocvien">${list[i].numUser} học viên</span>
            <span class="sivgia"><span class="giagoc">${formatmoney(list[i].price)}</span><span class="giacu">${list[i].oldPrice == null ? '' : formatmoney(list[i].oldPrice)}</span>
            ${list[i].oldPrice == null ? '' : `<span class="giamgia">-${(100 - list[i].price / list[i].oldPrice * 100).toString().split(".")[0]} %</span>`}
            </span>
        </div></a>
    </div>`
        }
        document.getElementById("listkhoahoc").innerHTML += main

        if (result.last === false) {
            document.getElementById("btnxemthemkh").onclick = function () {
                searchKhoaHoc(Number(page) + Number(1), search);
            }
        } else {
            document.getElementById("btnxemthemkh").onclick = function () {
                toastr.warning("Đã hết kết quả tìm kiếm");
            }
        }
    } catch (e) {
        console.error('searchKhoaHoc error', e);
        if (Number(page) === 0) {
            document.getElementById("listkhoahoc").innerHTML = '<div class="col-12"><div class="contentblock"><p style="margin:8px 0;color:#ef4444">Không tải được dữ liệu khoá học. Vui lòng thử lại.</p></div></div>';
        }
        document.getElementById("btnxemthemkh").onclick = function () {
            toastr.error("Không thể tải thêm dữ liệu");
        };
    }
}

function searchByParam() {
    // Read search input and trigger a fresh search from page 0
    var v = document.getElementById('search') ? document.getElementById('search').value.trim() : '';
    // Reset button to load next pages with current search
    document.getElementById('btnxemthemkh').onclick = function () {
        searchKhoaHoc(1, v);
    };
    // Render first page
    document.getElementById('listkhoahoc').innerHTML = '';
    searchKhoaHoc(0, v);
}

$(document).ready(function() {
    $('#anhdaidien').on('change', function(e) {
        const file = e.target.files[0];
        // Reset input để cho phép chọn lại cùng tên file
        $(this).val('');
        if (file) {
            if (!file.type.startsWith('image/')) {
                $('#error-anhdaidien').text('Vui lòng chọn đúng định dạng ảnh.');
                $('#imgpreview').attr('src', '');
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                $('#error-anhdaidien').text('Ảnh quá lớn, vui lòng chọn ảnh dưới 2MB.');
                $('#imgpreview').attr('src', '');
                return;
            }
            $('#error-anhdaidien').text('');
            const reader = new FileReader();
            reader.onload = function(ev) {
                $('#imgpreview').attr('src', ev.target.result).show();
            }
            reader.readAsDataURL(file);
        } else {
            $('#imgpreview').attr('src', '').hide();
            $('#error-anhdaidien').text('');
        }
    });
});

async function saveCourse() {
    try {
        var fileInput = document.getElementById('anhdaidien');
        var file = fileInput && fileInput.files ? fileInput.files[0] : null;
        var tenkh = document.getElementById('tenkh').value;
        var tungay = document.getElementById('tungay').value;
        var denngay = document.getElementById('denngay').value;
        var hocphi = document.getElementById('hocphi').value;
        var hocphicu = document.getElementById('hocphicu').value;
        var giangvien = document.getElementById('giangvien').value;
        var danhmuckhoahoc = document.getElementById('danhmuckhoahoc').value;
        var thutrongtuan = $('#thutrongtuan').val();
        var giohoc = document.getElementById('giohoc').value;
        var isFree = document.getElementById('isFree').checked;
        var mota = document.getElementById('editor').value;
        var huongdan = document.getElementById('editorch').value;

        // Helper to normalize currency string to number
        function parseNumber(str) {
            if (str == null || str === '') return null;
            var v = String(str).replace(/[^0-9]/g, '');
            return v ? Number(v) : null;
        }

        // 1. Upload image if provided
        let imageUrl = null;
        if (file) {
            const fd = new FormData();
            fd.append('file', file);
            const uploadRes = await fetch('https://lmsdtm-production.up.railway.app/api/public/upload-file', {
                method: 'POST',
                body: fd
            });
            if (!uploadRes.ok) {
                toastr.error('Upload hình ảnh thất bại');
                return;
            }
            imageUrl = await uploadRes.text();
        }

        // 2. Build course payload for create-update API
        var coursePayload = {
            name: tenkh,
            image: imageUrl, // may be null if không chọn ảnh
            banner: null,
            price: parseNumber(hocphi),
            oldPrice: parseNumber(hocphicu),
            description: mota,
            instruct: huongdan,
            dayOfWeek: Array.isArray(thutrongtuan) ? thutrongtuan.join(',') : null,
            studyTime: giohoc,
            startDate: tungay,
            endDate: denngay,
            isfree: isFree,
            teacher: giangvien ? { id: Number(giangvien) } : null,
            category: danhmuckhoahoc ? { id: Number(danhmuckhoahoc) } : null,
            promises: [] // giữ rỗng ở đây, cam kết được thêm qua luồng riêng
        };

        const res = await fetch('https://lmsdtm-production.up.railway.app/api/course/admin/create-update', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(coursePayload)
        });
        if (!res.ok) {
            let err;
            try { err = await res.json(); } catch (e) { err = {}; }
            toastr.error(err.defaultMessage || 'Có lỗi xảy ra khi lưu khoá học');
            return;
        }
        toastr.success('Thêm khoá học thành công!');
        // TODO: reset form hoặc chuyển trang danh sách đánh giá
    } catch (err) {
        console.error('saveCourse error', err);
        toastr.error('Lỗi kết nối server!');
    }
}

function renderMyCourseStats(list) {
    var statsEl = document.getElementById('mycourse-stats');
    if (!statsEl) return;
    var total = Array.isArray(list) ? list.length : 0;
    var today = new Date();
    var inProgress = 0;
    var completed = 0;
    var certificates = 0;

    for (var i = 0; i < total; i++) {
        var cu = list[i] || {};
        var course = cu.course || {};
        var endDateStr = course.endDate || cu.endDate;
        var endDate = parseDateStr(endDateStr);
        var level = cu && cu.courseUser ? cu.courseUser.level : cu.level;
        if (level) certificates++;
        if (endDate) {
            if (endDate < today) completed++;
            else inProgress++;
        } else {
            // No end date: assume in progress
            inProgress++;
        }
    }

    document.getElementById('stat-total-courses').innerText = total;
    document.getElementById('stat-in-progress').innerText = inProgress;
    document.getElementById('stat-completed').innerText = completed;
    document.getElementById('stat-certificates').innerText = certificates;
    // Also update mystats tab
    var s2Tot = document.getElementById('stat2-total-courses');
    if (s2Tot) {
        s2Tot.innerText = total;
        document.getElementById('stat2-in-progress').innerText = inProgress;
        document.getElementById('stat2-completed').innerText = completed;
        document.getElementById('stat2-certificates').innerText = certificates;
    }
    statsEl.style.display = 'block';
}
