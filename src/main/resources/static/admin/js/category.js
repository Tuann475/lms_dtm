var token = localStorage.getItem("token");
var size = 10;

async function loadCategory() {
    $('#example').DataTable().destroy();
    var url = 'https://lmsdtm-production.up.railway.app/api/category/public/find-by-type';
    const response = await fetch(url, {
        method: 'GET'
    });
    var list = await response.json();
    var main = '';
    for (i = 0; i < list.length; i++) {
        main += `<tr>
                    <td>${list[i].id}</td>
                    <td>${list[i].name}</td>
                    <td>${list[i].categoryType}</td>
                    <td class="sticky-col">
                        <i onclick="deleteCategory(${list[i].id})" class="fa fa-trash-alt iconaction"></i>
                        <a data-bs-toggle="modal" data-bs-target="#addtk" href="#" onclick="loadACategory(${list[i].id})"><i class="fa fa-edit iconaction"></i></a>
                    </td>
                </tr>`
    }
    document.getElementById("listcategory").innerHTML = main
    $('#example').DataTable();
}

async function loadTypeCategory() {
    var url = 'https://lmsdtm-production.up.railway.app/api/category/public/get-all-category-type';
    const response = await fetch(url, {});
    var list = await response.json();
    var main = '';
    for (i = 0; i < list.length; i++) {
        main += `<option value="${list[i]}">${list[i]}</option>`
    }
    document.getElementById("catetype").innerHTML = main
}


async function loadACategory(id) {
    var url = 'https://lmsdtm-production.up.railway.app/api/category/admin/findById?id=' + id;
    const response = await fetch(url, {
        method: 'GET',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    var result = await response.json();
    document.getElementById("idcate").value = result.id
    document.getElementById("catename").value = result.name
    document.getElementById("catetype").value = result.categoryType
}

function clearData() {
    document.getElementById("idcate").value = ""
    document.getElementById("catename").value = ""
}


async function saveCategory() {
    var id = document.getElementById("idcate").value
    var catename = document.getElementById("catename").value
    var catetype = document.getElementById("catetype").value
    if (catename.trim() === "") {
        toastr.warning('Tên danh mục không được để trống!');
        return;
    }

    var url = 'https://lmsdtm-production.up.railway.app/api/category/admin/create';
    if (id != "" && id != null) {
        url = 'https://lmsdtm-production.up.railway.app/api/category/admin/update';
    }
    var category = {
        "id": id,
        "name": catename,
        "categoryType": catetype,
    }
    const response = await fetch(url, {
        method: 'POST',
        headers: new Headers({
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify(category)
    });
    if (response.status < 300) {
        toastr.success("thêm/sửa danh mục thành công!");
        loadCategory();
        $("#addtk").modal('hide');
    }
    if (response.status == exceptionCode) {
        var result = await response.json()
        toastr.warning(result.defaultMessage);
    }
}

async function deleteCategory(id) {
    var con = confirm("Bạn chắc chắn muốn xóa danh mục này?");
    if (con == false) {
        return;
    }
    var url = 'https://lmsdtm-production.up.railway.app/api/category/admin/delete?id=' + id;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    if (response.status < 300) {
        toastr.success("xóa danh mục thành công!");
        loadCategory(0, "");
    }
    if (response.status == exceptionCode) {
        var result = await response.json()
        toastr.warning(result.defaultMessage);
    }
}

async function loadCategoryProduct() {
    var url = 'https://lmsdtm-production.up.railway.app/api/category/public/findAll';
    const response = await fetch(url, {
        method: 'GET'
    });
    var list = await response.json();

    var main = '<option value="">Tất cả danh mục</option>';
    for (i = 0; i < list.length; i++) {
        main += `<option value="${list[i].id}">${list[i].name}</option>`
    }
    document.getElementById("danhmuc").innerHTML = main
}


async function loadCategoryBaiThi() {
    var response = await fetch('https://lmsdtm-production.up.railway.app/api/category/public/find-by-type?type=PHAN_THI', {});
    var list = await response.json();
    console.log(list)
    var main = '';
    for (i = 0; i < list.length; i++) {
        main += `<option value="${list[i].id}">${list[i].name}</option>`
    }
    document.getElementById("danhmucphanthi").innerHTML = main
    document.getElementById("danhmucphanthiupdate").innerHTML = main
}


async function loadCategoryKhoaHoc() {
    var response = await fetch('https://lmsdtm-production.up.railway.app/api/category/public/find-by-type?type=KHOA_HOC', {});
    var list = await response.json();
    var main = '';
    for (i = 0; i < list.length; i++) {
        main += `<option value="${list[i].id}">${list[i].name}</option>`
    }
    document.getElementById("danhmuckhoahoc").innerHTML = main
}