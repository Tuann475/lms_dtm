var token = localStorage.getItem("token");
var exceptionCode = 417
var avat = 'image/user.svg'
var user = localStorage.getItem("user");
// Safe parse user
try { if (user != null) { user = JSON.parse(user); avat = user.avatar || avat } } catch(e){ console.warn('Cannot parse user from localStorage', e); user = null; }
const displayName = (user && user.fullName) ? user.fullName : 'Giáo viên';

// New robust injector (idempotent)
function injectTeacherLayout() {
    // Compute current Vietnamese day name each call (ensures immediate display)
    const dayNames = ["Chủ nhật","Thứ hai","Thứ ba","Thứ tư","Thứ năm","Thứ sáu","Thứ bảy"];
    const day_name = dayNames[new Date().getDay()];
    const navLeftEl = document.getElementById('navleft');
    const headerEl = document.getElementById('headerweb');
    if (!navLeftEl || !headerEl) {
        return; // DOM not ready yet
    }
    // Prevent duplicate build
    if (navLeftEl.getAttribute('data-initialized') === 'true' && headerEl.getAttribute('data-initialized') === 'true') {
        return;
    }
    var main =
        `<div class="divroot">
        <h3>Xin chào</h3>
    </div>
    <div class="listmenumain">
        <a href="/teacher/khoahoccuatoi"><i class="fa fa-user"></i> Khóa học</a>
        <a href="/teacher/baithi"><i class="fa fa-file"></i> Bài thi</a>
        <a href="/teacher/thongke"><i class="fa fa-chart-line"></i> Thống kê</a>
        <a data-bs-toggle="modal" data-bs-target="#modalmatkhau" href="#"><i class="fa fa-key"></i> Đổi mật khẩu</a>
        <a href="#" onclick="dangXuat()"><i class=""></i> Đăng xuất</a>
    </div>`;
    navLeftEl.innerHTML = main;
    navLeftEl.setAttribute('data-initialized','true');
    if (!document.querySelector('style[data-origin="teacher-navfit"]')) {
        const styleEl = document.createElement('style');
        styleEl.setAttribute('data-origin','teacher-navfit');
        styleEl.textContent = `
          .navfit{ position:fixed; left:0; top:0; bottom:0; width:auto; padding:8px 14px; z-index:1000; }
          .navfit .listmenumain a{ display:block; white-space:nowrap; padding:6px 10px; }
          body{ margin:0; }
        `;
        document.head.appendChild(styleEl);
    }
    navLeftEl.classList.add('navfit');
    const contentEl = document.querySelector('.contentweb');
    const applyContentOffset = () => {
        if (contentEl && !contentEl.style.marginLeft){ contentEl.style.marginLeft = navLeftEl.offsetWidth + 'px'; }
        if (headerEl && !headerEl.style.left){ headerEl.style.left = navLeftEl.offsetWidth + 'px'; }
    };
    applyContentOffset();
    window.addEventListener('resize', applyContentOffset);

    // Robust avatar path logic
    let avatarSrc = avat;
    if (avat) {
        if (avat.startsWith('http')) {
            avatarSrc = avat;
        } else if (!avat.startsWith('/')) {
            avatarSrc = '/' + avat;
        } else {
            avatarSrc = avat;
        }
    }
    var header =
        `<div class="ctnheader d-flex justify-content-between align-items-center">
           <div class="d-flex align-items-center gap-2">
             <i class="fa fa-calendar iconlich" aria-hidden="true"></i>
             <span class="text-uppercase fw-weight-bold mb-0" id="ngayhomnay">${day_name}</span>
             <span class="text-gray fst-italic mb-0" id="digital-clock"></span>
           </div>
           <div class="userheader d-flex align-items-center gap-2">
             <span class="tendangnhap">${displayName}</span>
             <a class="nav-link dropdown-toggle menucha" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
               <img src="${avatarSrc}" class="userlogo" alt="avatar">
             </a>
             <ul class="dropdown-menu listitemtk" aria-labelledby="navbarDropdown">
               <li><a class="dropdown-item" href="thongtincanhan"><i class="fa fa-user"></i> Thay đổi thông tin cá nhân</a></li>
               <div class="dropdown-divider"></div>
               <li><a class="dropdown-item" onclick="dangXuat()" href="#"><i ></i> Đăng xuất</a></li>
             </ul>
           </div>
         </div>`;
    headerEl.innerHTML = header;
    headerEl.setAttribute('data-initialized','true');
    if (!document.querySelector('style[data-origin="teacher-header"]')) {
        const headerStyle = document.createElement('style');
        headerStyle.setAttribute('data-origin','teacher-header');
        headerStyle.textContent = `
          .headerweb{ position: sticky; top: 0; left: 0; right: 0; z-index: 900; background:#fff; border-bottom:1px solid #e5e5e5; padding:8px 12px; }
          .ctnheader{ min-height:48px; }
          .iconlich{ font-size:20px; color:#5733dd; }
          #ngayhomnay, #digital-clock{ white-space: nowrap; }
          .userheader .tendangnhap{ max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display:inline-block; }
        `;
        document.head.appendChild(headerStyle);
    }

    // Inject password modal if not present
    const modalContainer = document.getElementById('divdoimk');
    if (modalContainer && !document.getElementById('modalmatkhau')) {
        modalContainer.innerHTML +=
            ` <div class="modal fade" id="modalmatkhau" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="false">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="exampleModalLabel">Cập nhật mật khẩu</h5> <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>
            <div class="modal-body row">
                <form action="javascript:changePassword()" class="col-sm-6" style="margin: auto;">
                    <label class="lb-form">Mật khẩu hiện tại *</label>
                    <input id="oldpass" type="password" class="form-control">
                    <label class="lb-form">Mật khẩu mới *</label>
                    <input id="newpass" type="password" class="form-control">
                    <label class="lb-form">Xác nhận mật khẩu mới *</label>
                    <input id="renewpass" type="password" class="form-control"><br>
                    <button type="submit" class="btn btn-primary">CẬP NHẬT</button>
                </form>
            </div>
        </div>
    </div>
</div>`;
    }
}

// Add resilient initializer with multiple strategies
function initTeacherNavbars(){
    try { injectTeacherLayout(); } catch(e){ console.error('injectTeacherLayout error:', e); }
    // If still empty, schedule a few retries
    let attempts = 0;
    const maxAttempts = 5;
    const interval = setInterval(()=>{
        attempts++;
        const nav = document.getElementById('navleft');
        const header = document.getElementById('headerweb');
        if(nav && nav.innerHTML.trim()===''){ try { injectTeacherLayout(); } catch(e){ console.error('Retry inject nav error:', e); } }
        if(header && header.innerHTML.trim()===''){ try { injectTeacherLayout(); } catch(e){ console.error('Retry inject header error:', e); } }
        if((nav && nav.getAttribute('data-initialized')==='true') && (header && header.getAttribute('data-initialized')==='true')){ clearInterval(interval); }
        if(attempts>=maxAttempts){ clearInterval(interval); }
    }, 300);
}

// jQuery ready (if jQuery present)
if(typeof $ !== 'undefined'){
    $(document).ready(function(){
        try { checkroleTeacher(); } catch(e){ console.error('checkroleTeacher error:', e); }
        initTeacherNavbars();
    });
}

// DOMContentLoaded fallback (in case jQuery not loaded yet or overridden)
window.addEventListener('DOMContentLoaded', function(){
    // Avoid double run if already initialized
    const nav = document.getElementById('navleft');
    if(!(nav && nav.getAttribute('data-initialized')==='true')){
        initTeacherNavbars();
    }
});

// Visibility change reinforcement
document.addEventListener('visibilitychange', function(){ if(!document.hidden){ initTeacherNavbars(); }});


function dangXuat() {
    window.localStorage.removeItem('user')
    window.localStorage.removeItem('token')
    window.location.replace('../login');
}


async function changePassword() {
    var oldpass = document.getElementById("oldpass").value
    var newpass = document.getElementById("newpass").value
    var renewpass = document.getElementById("renewpass").value
    var url = 'http://localhost:8080/api/all/change-password';
    if (newpass !== renewpass) {
        alert("mật khẩu mới không trùng khớp");
        return;
    }
    var passw = { "oldPass": oldpass, "newPass": newpass }
    const response = await fetch(url, {
        method: 'POST',
        headers: new Headers({ 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }),
        body: JSON.stringify(passw)
    });
    if (response.status < 300) {
        swal({ title: "Thông báo", text: "cập nhật mật khẩu thành công, hãy đăng nhập lại", type: "success" }, function () { window.location.reload(); });
    }
    if (response.status === exceptionCode) {
        var result = await response.json();
        toastr.error(result.defaultMessage);
    }
}

async function checkroleTeacher() {
    if (token == null) {
        window.location.replace('../login')
        return;
    }
    var url = 'http://localhost:8080/api/teacher/check-role-teacher';
    const response = await fetch(url, {
        method: 'GET',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    if (response.status > 300) {
        window.location.replace('../login')
    }
}


function formatmoney(money) {
    const VND = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    });
    return VND.format(money);
}


async function uploadFile(filePath) {
    const formData = new FormData()
    formData.append("file", filePath.files[0])
    var urlUpload = 'http://localhost:8080/api/public/upload-file';
    const res = await fetch(urlUpload, {
        method: 'POST',
        body: formData
    });
    if (res.status < 300) {
        return await res.text();
    }
    return null;
}


function formatdate(dateString) {
    let date = new Date(dateString);
    return date.toISOString().slice(0, 19).replace('T', ' ');
}


function getDateTime() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    var day = now.getDate();
    var hour = now.getHours();
    var minute = now.getMinutes();
    var second = now.getSeconds();
    // pad
    if (month.toString().length === 1) { month = '0' + month; }
    if (day.toString().length === 1) { day = '0' + day; }
    if (hour.toString().length === 1) { hour = '0' + hour; }
    if (minute.toString().length === 1) { minute = '0' + minute; }
    if (second.toString().length === 1) { second = '0' + second; }
    return year + '/' + month + '/' + day + ' ' + hour + ':' + minute + ':' + second;
}

setInterval(function () {
    currentTime = getDateTime();
    var clockEl = document.getElementById("digital-clock");
    if(clockEl){ clockEl.innerHTML = currentTime; }
}, 1000);
