var token = localStorage.getItem("token");
var exceptionCode = 417;

async function loadMenu() {
    // Inject CSS for clearer toggler menu when expanded


    var dn = '<li class="liheader"><a href="login" class="btn btn-round btndangnhapheader">Đăng nhập</a></li>';
    if (token != null) {
        dn = `
        <li class="nav-item dropdown itemdropdown">
            <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            <img src="image/user_icon.webp" class="userheader">
            </a>
            <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
            <li><a class="dropdown-item" href="taikhoan">Tài khoản</a></li>
            <li><a class="dropdown-item" href="taikhoan#mycourse">Khóa học của tôi</a></li>
            <li><hr class="dropdown-divider"></li>
            <li onclick="dangXuat()"><a class="dropdown-item" href="#">Đăng xuất</a></li>
            </ul>
        </li>`;
    }
    var menu =
        ` <div class="container-fluid">
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse custom-navbar-collapse" id="navbarSupportedContent">
      <ul class="navbar-nav me-auto mb-2 mb-lg-0">
        <li class="nav-item">
          <a class="nav-link active" aria-current="page" href="index"><img src="image/logof.png" class="logoheader"></a>
        </li>
        
      </ul>
      <div class="d-flex">
          <ul class="listdmheader">
              <li class="liheader"><a href="index" class="navlink">Trang chủ</a></li>
              <li class="liheader"><a href="timkhoahoc" class="navlink">Khóa học</a></li>
              <li class="liheader"><a href="luyende" class="navlink">Luyện đề</a></li>
              <li class="liheader"><a href="baiviet" class="navlink">Blog</a></li>
              ${dn}
          </ul>
      </div>
    </div>
  </div>`
    document.getElementById("menu").innerHTML = menu

    loadFooter();
}


function loadFooter() {
    var footer =
        `
    <section class="d-flex justify-content-center justify-content-lg-between p-4 border-bottom">
      <div class=" text-center text-md-start mt-5">
        <div class="row mt-3">
          <div class="col-md-3 col-lg-4 col-xl-3 mx-auto mb-4">
<a href="#"><img src="image/logo.png" class="imglogofooter d-block mx-auto" alt="Logo"></a>      
      <h6 class="text-center">KẾT NỐI CÙNG CHÚNG TÔI</h6>
<div class="site-socials" style="width: 140px !important;">
                        <a target="_blank" href="https://facebook.com/study4.official"><span class="social-link fab fa-facebook-square"></span></a>
                        <a target="_blank" href="https://instagram.com/study4.official"><span class="social-link fab fa-instagram"></span></a>
                        <a target="_blank" href="https://twitter.com/study4Official"><span class="social-link fab fa-twitter"></span></a>
                        <a target="_blank" href="https://youtube.com/@STUDY4Official"><span class="social-link fab fa-youtube"></span></a>
                        <a target="_blank" href="https://www.tiktok.com/@study4.official"><span class="social-link fab fa-tiktok"></span></a>
                    </div>

<p style="text-align: justify;">
    Là trường đại học công lập duy nhất phía Nam trực thuộc Bộ Nông nghiệp và Môi trường, trải qua hơn 45 năm xây dựng và phát triển, Trường Đại học Tài nguyên và Môi trường TP. Hồ Chí Minh đã khẳng định được vị thế trong hệ thống giáo dục đại học đào tạo nguồn nhân lực có trình độ trong lĩnh vực công nghệ, quản lý tài nguyên, đảm bảo môi trường sạch cho phát triển bền vững và cùng thế giới ứng phó với các vấn đề biển đổi khí hậu trên toàn cầu.
</p>
          </div>
          <div class="col-md-3 col-lg-2 col-xl-2 mx-auto mb-4">
            <h6 class="text-uppercase fw-bold mb-4">Thông tin liên hệ</h6>
            <p><a href="#!" class="text-reset">Hotline: 028.38443006</a></p>
            <p><a href="#!" class="text-reset">Email: info@hcmunre.edu.vn</a></p>
            <p><a href="#!" class="text-reset">Địa chỉ: 236B Lê Văn Sỹ, Phường Tân Sơn Hòa, TP. Hồ Chí Minh</a></p>
          </div>
          <div class="col-md-2 col-lg-2 col-xl-2 mx-auto mb-4">
            <h6 class="text-uppercase fw-bold mb-4">Về chúng tôi</h6>
            <p><a href="#!" class="text-reset">Về HCMUNRE</a></p>
            <p><a href="#!" class="text-reset">Tin tức</a></p>
            <p><a href="#!" class="text-reset">Tuyển sinh</a></p>
            <p><a href="#!" class="text-reset">Liên hệ</a></p>
          </div>
          <div class="col-md-4 col-lg-3 col-xl-3 mx-auto mb-md-0 mb-4">
            <h6 class="text-uppercase fw-bold mb-4">Chính sách chung</h6>
            <p><a href="#!" class="text-reset"> THướng dẫn sử dụng</p>
            <p><a href="#!" class="text-reset">Hướng dẫn thanh toán</a></p>
            <p><a href="#!" class="text-reset">Điều khoản và Điều Kiện Giao Dịch</a></p>
            <p><a href="#!" class="text-reset">Chính sách giao, nhận hàngg</a></p>
            <p><a href="#!" class="text-reset">Phản hồi, khiếu nại</a></p>
            <p><a href="#!" class="text-reset">Chính sách chuyển đổi, hoàn hủy</a></p>
          </div>
<div class="copy" style="text-align: center;">Copyright 2023 © Trường ĐH Tài nguyên và Môi trường Tp. HCM<br></div>
</div>        </div>
      </div>
    </section>
  </footer>`
    document.getElementById("footer").innerHTML = footer
}


function formatmoney(money) {
    const VND = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    });
    return VND.format(money);
}

async function dangXuat() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.replace('login')
}

function formatdate(dateString) {
    let date = new Date(dateString);

    let formattedDate = date.toISOString().slice(0, 19).replace('T', ' ');
    return formattedDate//
}
