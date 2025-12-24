async function login() {
    var url = 'http://localhost:8080/api/login'
    var username = document.getElementById("username").value
    var password = document.getElementById("password").value
    var user = {
        "username": username,
        "password": password,
    }
    const response = await fetch(url, {
        method: 'POST',
        headers: new Headers({
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify(user)
    });
    var result = await response.json();
    if (response.status < 300) {
        localStorage.setItem("user", JSON.stringify(result.user));
        localStorage.setItem("token", result.token);
        if (result.user.authorities.name === "ROLE_ADMIN") {
            window.location.href = 'admin/index';
        }
        if (result.user.authorities.name === "ROLE_USER") {
            window.location.href = 'index';
        }
        if (result.user.authorities.name === "ROLE_TEACHER") {
            window.location.href = 'teacher/khoahoccuatoi';
        }
    }
    if (response.status == exceptionCode) {
        if (result.errorCode == 300) {
            swal({
                title: "Thông báo",
                text: "Tài khoản chưa được kích hoạt, đi tới kích hoạt tài khoản!",
                type: "warning"
            }, function () {
                window.location.href = 'confirm?email=' + username
            });
        } else {
            toastr.warning(result.defaultMessage);
        }
    }
}

function handleCredentialResponse(response) {
    console.log(response);
    console.log(response.credential);
    sendLoginRequestToBackend(response.credential);
}

async function sendLoginRequestToBackend(accessToken) {
    var response = await fetch('http://localhost:8080/api/login/google', {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
        },
        body: accessToken
    })
    var result = await response.json();

    if (response.status < 300) {
        localStorage.setItem("user", JSON.stringify(result.user));
        localStorage.setItem("token", result.token);
        if (result.user.authorities.name === "ROLE_ADMIN") {
            window.location.href = 'admin/index';
        }
        if (result.user.authorities.name === "ROLE_USER") {
            window.location.href = 'index';
        }
        if (result.user.authorities.name === "ROLE_TEACHER") {
            window.location.href = 'teacher/khoahoccuatoi';
        }
    }
    if (response.status == exceptionCode) {
        if (result.errorCode == 300) {
            swal({
                title: "Thông báo",
                text: "Tài khoản chưa được kích hoạt, đi tới kích hoạt tài khoản!",
                type: "warning"
            }, function () {
                window.location.href = 'confirm?email=' + username
            });
        } else {
            toastr.warning(result.defaultMessage);
        }
    }
}


// Hàm kiểm tra định dạng email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Hàm kiểm tra định dạng số điện thoại
function validatePhone(phone) {
    const phoneRegex = /^0[0-9]{9}$/;
    return phoneRegex.test(phone);
}

// Kiểm tra email
function checkEmail() {
    const email = document.getElementById('email').value.trim();
    const errorEmail = document.getElementById('error-email');
    if (email === '') {
        errorEmail.textContent = 'Email không được để trống.';
        return false;
    } else if (!validateEmail(email)) {
        errorEmail.textContent = 'Email không hợp lệ.';
        return false;
    } else {
        errorEmail.textContent = '';
        return true;
    }
}

// Kiểm tra số điện thoại
function checkPhone() {
    const phone = document.getElementById('phone').value.trim();
    const errorPhone = document.getElementById('error-phone');
    if (phone === '') {
        errorPhone.textContent = 'Số điện thoại không được để trống.';
        return false;
    } else if (!validatePhone(phone)) {
        errorPhone.textContent = 'Số điện thoại không hợp lệ.';
        return false;
    } else {
        errorPhone.textContent = '';
        return true;
    }
}

// Hàm kiểm tra toàn bộ form
function validateForm() {
    const fullname = document.getElementById('fullname').value.trim();
    const password = document.getElementById('password').value.trim();
    const repassword = document.getElementById('repassword').value.trim();

    let isValid = true;

    if (fullname === '') {
        document.getElementById('error-fullname').textContent = 'Họ tên không được để trống.';
        isValid = false;
    } else {
        document.getElementById('error-fullname').textContent = '';
    }

    if (!checkEmail()) isValid = false;
    if (!checkPhone()) isValid = false;

    if (password === '') {
        document.getElementById('error-password').textContent = 'Mật khẩu không được để trống.';
        isValid = false;
    } else if (password.length < 6) {
        document.getElementById('error-password').textContent = 'Mật khẩu phải có ít nhất 6 ký tự.';
        isValid = false;
    } else {
        document.getElementById('error-password').textContent = '';
    }

    if (repassword === '') {
        document.getElementById('error-repassword').textContent = 'Vui lòng nhập lại mật khẩu.';
        isValid = false;
    } else if (password !== repassword) {
        document.getElementById('error-repassword').textContent = 'Mật khẩu nhập lại không khớp.';
        isValid = false;
    } else {
        document.getElementById('error-repassword').textContent = '';
    }

    return isValid;
}

// Hàm đăng ký
async function regis() {
    if (!validateForm()) {
        toastr.warning("Vui lòng kiểm tra lại thông tin!");
        return;
    }

    const url = 'http://localhost:8080/api/regis';
    const email = document.getElementById("email").value.trim();
    const fullname = document.getElementById("fullname").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value.trim();

    const user = {
        "fullName": fullname,
        "username": email,
        "email": email,
        "phone": phone,
        "password": password
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
        });

        const result = await response.json();
        if (response.ok) {
            swal({
                    title: "Thông báo",
                    text: "Đăng ký thành công! Hãy check email của bạn!",
                    type: "success"
                },
                function () {
                    window.location.href = 'confirm?email=' + result.email;
                });
        } else {
            toastr.warning(result.defaultMessage || "Có lỗi xảy ra!");
        }
    } catch (error) {
        toastr.error("Lỗi kết nối tới server!");
        console.error(error);
    }
}


async function confirmAccount() {
    var uls = new URL(document.URL)
    var email = uls.searchParams.get("email");
    var key = document.getElementById("maxacthuc").value;
    var url = 'http://localhost:8080/api/active-account?email=' + email + '&key=' + key
    const res = await fetch(url, {
        method: 'POST'
    });
    if (res.status < 300) {
        swal({
                title: "Thông báo",
                text: "Xác nhận tài khoản thành công!",
                type: "success"
            },
            function () {
                window.location.href = 'login'
            });
    }
    if (res.status == exceptionCode) {
        var result = await res.json()
        toastr.warning(result.defaultMessage);
    }
}


async function changePassword() {
    // Xóa thông báo lỗi trước đó
    document.getElementById("error-oldpass").innerText = "";
    document.getElementById("error-newpass").innerText = "";
    document.getElementById("error-renewpass").innerText = "";

    // Lấy giá trị từ input
    var oldpass = document.getElementById("oldpass").value.trim();
    var newpass = document.getElementById("newpass").value.trim();
    var renewpass = document.getElementById("renewpass").value.trim();
    var token = localStorage.getItem("token");

    // Cờ để kiểm tra dữ liệu
    var isValid = true;

    // Validate các trường bắt buộc
    if (oldpass === "") {
        document.getElementById("error-oldpass").innerText = "Vui lòng nhập mật khẩu hiện tại.";
        isValid = false;
    }
    if (newpass === "") {
        document.getElementById("error-newpass").innerText = "Vui lòng nhập mật khẩu mới.";
        isValid = false;
    }
    if (renewpass === "") {
        document.getElementById("error-renewpass").innerText = "Vui lòng xác nhận mật khẩu mới.";
        isValid = false;
    }
    if (newpass !== renewpass) {
        document.getElementById("error-renewpass").innerText = "Mật khẩu xác nhận không khớp.";
        isValid = false;
    }

    // Nếu dữ liệu không hợp lệ, dừng hàm
    if (!isValid) {
        return;
    }

    // Chuẩn bị dữ liệu gửi đi
    var passw = {
        "oldPass": oldpass,
        "newPass": newpass
    };

    try {
        const response = await fetch('http://localhost:8080/api/user/change-password', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(passw)
        });

        if (response.status < 300) {
            swal({
                title: "Thông báo",
                text: "Cập nhật mật khẩu thành công, hãy đăng nhập lại.",
                type: "success"
            }, function () {
                window.location.reload();
            });
        } else {
            var result = await response.json();
            document.getElementById("error-oldpass").innerText = result.defaultMessage || "Có lỗi xảy ra.";
        }
    } catch (error) {
        document.getElementById("error-oldpass").innerText = "Không thể kết nối tới server.";
    }
}


async function loadThongTinTkCheckout() {
    const response = await fetch('http://localhost:8080/api/user/user-logged', {
        method: 'POST',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    var result = await response.json();
    console.log(response);
    document.getElementById("fullname").value = result.fullName
    document.getElementById("phone").value = result.phone
    document.getElementById("emaildangky").value = result.email
}

async function capNhatThongTin() {
    // Lấy các giá trị từ form
    var fullName = document.getElementById("fullname").value.trim();
    var email = document.getElementById("email").value.trim();
    var phone = document.getElementById("phone").value.trim();
    var error = false; // Biến cờ để kiểm tra lỗi

    // Reset thông báo lỗi
    document.querySelectorAll('.error').forEach(el => el.innerHTML = '');

    // Validate Họ tên
    if (fullName === "") {
        document.getElementById("fullname").nextElementSibling.innerHTML = "Họ tên không được để trống.";
        error = true;
    }
    if (fullName.length > 255) {
        document.getElementById("fullname").nextElementSibling.innerHTML = "Họ tên không được vượt quá 255 ký tự.";
        error = true;
    }
    // Validate Email
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex để kiểm tra email
    if (email === "") {
        document.getElementById("email").nextElementSibling.innerHTML = "Email không được để trống.";
        error = true;
    } else if (!emailRegex.test(email)) {
        document.getElementById("email").nextElementSibling.innerHTML = "Email không đúng định dạng.";
        error = true;
    }

    // Validate Số điện thoại
    var phoneRegex = /^[0-9]{10,11}$/; // Số điện thoại chỉ chứa 10-11 số
    if (phone === "") {
        document.getElementById("phone").nextElementSibling.innerHTML = "Số điện thoại không được để trống.";
        error = true;
    } else if (!phoneRegex.test(phone)) {
        document.getElementById("phone").nextElementSibling.innerHTML = "Số điện thoại không hợp lệ.";
        error = true;
    }

    // Nếu có lỗi, dừng việc gửi dữ liệu
    if (error) {
        return;
    }

    // Dữ liệu hợp lệ, chuẩn bị gửi API
    var user = {
        "fullName": fullName,
        "email": email,
        "phone": phone,
    }

    try {
        const response = await fetch('http://localhost:8080/api/user/update-account', {
            method: 'POST',
            headers: new Headers({
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify(user)
        });
        var result = await response.json();

        // Kiểm tra phản hồi từ server
        if (response.status < 300) {
            swal({
                    title: "Thông báo",
                    text: "Cập nhật tài khoản thành công!",
                    type: "success"
                },
                function () {
                    window.location.reload();
                });
        } else if (response.status == exceptionCode) {
            toastr.warning(result.defaultMessage);
        } else {
            toastr.error("Có lỗi xảy ra khi cập nhật thông tin.");
        }
    } catch (e) {
        console.error("Lỗi khi gửi dữ liệu: ", e);
        toastr.error("Không thể kết nối tới server.");
    }
}


async function capNhatThongTinteacher() {
    var imgElement = document.getElementById("btnchange");
    var backgroundImage = imgElement.style.backgroundImage;

// Loại bỏ phần `url("...")` để chỉ lấy đường link
    var url = backgroundImage.slice(5, -2);
    var avatar = url;
    var user = {
        "fullName": document.getElementById("fullname").value,
        "email": document.getElementById("email").value,
        "phone": document.getElementById("phone").value,
        "avatar": avatar,
    }
    const response = await fetch('http://localhost:8080/api/teacher/update-account', {
        method: 'POST',
        headers: new Headers({
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify(user)
    });
    var result = await response.json();
    if (response.status < 300) {
        swal({
                title: "Thông báo",
                text: "Cập nhât tài khoản thành công! test",
                type: "success"
            },
            function () {
                window.location.reload();
            });
    }
    if (response.status == exceptionCode) {
        toastr.warning(result.defaultMessage);
    }
}

async function loadThongTinTaiKhoan() {
    const response = await fetch('http://localhost:8080/api/user/user-logged', {
        method: 'POST',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    var result = await response.json();
    console.log(result);

    // Gán giá trị cho các trường thông tin
    document.getElementById("fullname").value = result.fullName;
    document.getElementById("phone").value = result.phone;
    document.getElementById("email").value = result.email;

    // Thay đổi ảnh nền của nút
    var img = document.getElementById("btnchange");
    img.style.backgroundImage = `url(${result.avatar})`;
    img.style.backgroundSize = 'cover'; // Đảm bảo ảnh phủ kín
    img.style.backgroundPosition = 'center'; // Đảm bảo ảnh căn giữa
    img.style.backgroundRepeat = 'no-repeat'; // Không lặp lại ảnh
}

async function loadThongTinTaiKhoan_teacher() {
    const response = await fetch('http://localhost:8080/api/teacher/logged', {
        method: 'GET',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    var result = await response.json();
    console.log(result);

    // Gán giá trị cho các trường thông tin
    document.getElementById("fullname").value = result.fullName;
    document.getElementById("phone").value = result.phone;
    document.getElementById("email").value = result.email;

    // Thay đổi ảnh nền của nút
    var img = document.getElementById("btnchange");
    img.style.backgroundImage = `url(${result.avatar})`;
    img.style.backgroundSize = 'cover'; // Đảm bảo ảnh phủ kín
    img.style.backgroundPosition = 'center'; // Đảm bảo ảnh căn giữa
    img.style.backgroundRepeat = 'no-repeat'; // Không lặp lại ảnh
}

async function changeAvatar() {

    const filePath = document.getElementById('fileanhdaidientl')
    const formData = new FormData()
    formData.append("file", filePath.files[0])
    var urlUpload = 'http://localhost:8080/api/all/change-avatar';
    const res = await fetch(urlUpload, {
        method: 'POST',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        }),
        body: formData
    });
    if (res.status < 300) {
        var linkImage = await res.text();
        console.log(linkImage);
        document.getElementById("btnchange").style.backgroundImage = `url(${linkImage})`
    }
}


async function forgorPassword() {
    var email = document.getElementById("email").value.trim();
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex kiểm tra định dạng email

    // Kiểm tra nếu email chưa nhập hoặc sai định dạng
    if (email === "") {
        toastr.warning("Vui lòng nhập email.");
        return;
    }
    if (!emailRegex.test(email)) {
        toastr.warning("Email không đúng định dạng. Vui lòng nhập lại.");
        return;
    }

    // Gửi request nếu email hợp lệ
    var url = 'http://localhost:8080/api/public/quen-mat-khau?email=' + email;
    try {
        const res = await fetch(url, {
            method: 'POST'
        });

        if (res.status < 300) {
            swal({
                    title: "",
                    text: "Kiểm tra email của bạn",
                    type: "success"
                },
                function () {
                    window.location.replace("login");
                });
        } else if (res.status == exceptionCode) {
            var result = await res.json();
            toastr.warning(result.defaultMessage);
        } else {
            toastr.error("Có lỗi xảy ra. Vui lòng thử lại.");
        }
    } catch (error) {
        toastr.error("Không thể kết nối đến server. Vui lòng kiểm tra lại.");
    }
}


async function datLaiMatKhau() {
    var password = document.getElementById("password").value
    var repassword = document.getElementById("repassword").value
    if (password != repassword) {
        toastr.warning("Mật khẩu không trùng khớp");
        return;
    }
    var uls = new URL(document.URL)
    var email = uls.searchParams.get("email");
    var key = uls.searchParams.get("key");
    var url = 'http://localhost:8080/api/public/dat-lai-mat-khau?email=' + email + '&key=' + key + '&password=' + password
    const res = await fetch(url, {
        method: 'POST'
    });
    if (res.status < 300) {
        swal({
                title: "",
                text: "Đặt lại mật khẩu thành công",
                type: "success"
            },
            function () {
                window.location.replace("login")
            });
    }
    if (res.status == exceptionCode) {
        var result = await res.json()
        toastr.warning(result.defaultMessage);
    }
}

async function loadUserExamStats() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            return;
        }
        const response = await fetch('http://localhost:8080/api/user/exam-practice-stats', {
            method: 'GET',
            headers: new Headers({
                'Authorization': 'Bearer ' + token
            })
        });
        if (!response.ok) {
            return;
        }
        const data = await response.json();
        const examEl = document.getElementById('stat2-total-exams');
        if (examEl) examEl.textContent = data.totalExamsDone ?? 0;
        const practiceEl = document.getElementById('stat2-total-practices');
        if (practiceEl) practiceEl.textContent = data.totalPracticesDone ?? 0;
    } catch (e) {
        console.error('Không tải được thống kê bài thi/ôn luyện', e);
    }
}
