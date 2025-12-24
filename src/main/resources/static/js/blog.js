var sizeblog = 10;

async function loadBaiViet(page, type) {
    var searchblog = document.getElementById("searchblog").value;
    if (searchblog == null) {
        searchblog = "";
    }
    var url = 'https://lmsdtm-production.up.railway.app/api/blog/public/findAll?page=' + page + '&size=' + sizeblog + '&sort=id,desc' + '&search=' + searchblog;
    const response = await fetch(url, {});
    var result = await response.json();
    console.log(result);
    var list = result.content;
    var main = '';
    for (i = 0; i < list.length; i++) {
        main += `<a href="chitietbaiviet?id=${list[i].id}" class="linkbaiviet"><div class="singlebaiviet row">
        <div class="col-sm-4"><img src="${list[i].imageBanner}" class="imgblogch"></div>
        <div class="col-sm-8">
            <h6>${list[i].title}</h6>
            <span class="motabaiviet">${list[i].description}</span>
            <span class="thongtindang"><span class="ngaydangbv">${list[i].createdDate}</span> Bởi <span>${list[i].user.fullName}</span></span>
        </div>
    </div></a>`
    }
    if (type == "CONG") {
        document.getElementById("listbaiviet").innerHTML += main
    }
    if (type == "MOI") {
        document.getElementById("listbaiviet").innerHTML = main
    }

    if (result.last == false) {
        document.getElementById("btnxemthemblog").onclick = function () {
            loadBaiViet(Number(page) + Number(1), 'CONG');
        }
    } else {
        document.getElementById("btnxemthemblog").onclick = function () {
            toastr.warning("Đã hết kết quả tìm kiếm");
        }
    }
}


async function loadCtBlog() {
    var id = window.location.search.split('=')[1];
    if (id != null) {
        var url = 'https://lmsdtm-production.up.railway.app/api/blog/public/findById?id=' + id;
        const response = await fetch(url, {
            method: 'GET'
        });
        var blog = await response.json();
        document.getElementById("tieudebaiviet").innerHTML = blog.title
        document.getElementById("tennguoidang").innerHTML = blog.user.fullName
        document.getElementById("ngaydangbv").innerHTML = blog.createdDate
        document.getElementById("contentblog").innerHTML = blog.content
        baiVietLienQuan();
    }
}

async function baiVietLienQuan() {
    var id = window.location.search.split('=')[1];
    var url = 'https://lmsdtm-production.up.railway.app/api/blog/public/findAll?page=0&size=3&sort=id,desc';
    const response = await fetch(url, {});
    var result = await response.json();
    var list = result.content;
    var main = '';
    for (i = 0; i < list.length; i++) {
        if (list[i].id != id) {
            main += `<li class="post-link"><a href="chitietbaiviet?id=${list[i].id}">${list[i].title}</a></li>
            `
        }
    }
    document.getElementById("listlienquanblog").innerHTML = main;

}