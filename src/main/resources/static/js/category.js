async function loadDanhMuc() {
    var url = 'http://localhost:8080/api/category/public/find-by-type?type=BAI_THI';
    const response = await fetch(url, {});
    var list = await response.json();
    var main = '';
    for (i = 0; i < list.length; i++) {
        main += `<li><a href="dethionline?category=${list[i].id}">${list[i].name}</a></li>`
    }
    document.getElementById("listdanhmuc").innerHTML = main
}


async function loadDanhMucThiOnline() {
    var url = 'http://localhost:8080/api/category/public/find-by-type?type=BAI_THI';
    const response = await fetch(url, {});
    var list = await response.json();
    var main = `<li class="nav-item w-auto">
                    <a class="nav-link" href="dethionline?category=-1">Tất cả</a>
                </li>`;
    for (i = 0; i < list.length; i++) {
        main += ` <li class="nav-item w-auto">
                    <a class="nav-link " href="dethionline?category=${list[i].id}">${list[i].name}</a>
                </li>`
    }
    document.getElementById("danhsachdmdethi").innerHTML = main
}


async function loadDanhMucTimKhoaHoc() {
    var url = 'http://localhost:8080/api/category/public/find-by-type?type=KHOA_HOC';
    const response = await fetch(url, {});
    var list = await response.json();
    console.log(list)
    var uls = new URL(document.URL)
    var danhmuc = uls.searchParams.get("danhmuc");
    var main = `<li class="nav-item w-auto">
    <a class="nav-link ${danhmuc == null ? 'active' : ''}" href="timkhoahoc">Tất cả</a>
</li>`;
    for (i = 0; i < list.length; i++) {
        main += `<li class="nav-item w-auto">
        <a class="nav-link ${danhmuc == list[i].id ? 'active' : ''}" href="timkhoahoc?danhmuc=${list[i].id}&tendanhmuc=${list[i].name}">${list[i].name}</a>
    </li>`
    }
    document.getElementById("danhsachdmdethi").innerHTML = main
}

