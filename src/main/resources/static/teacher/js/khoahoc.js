async function loadKhoaHocCuaToi() {
    var url = 'http://localhost:8080/api/course/teacher/find-by-teacher';
    const response = await fetch(url, {
        method: 'GET',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        }),
    });
    var list = await response.json();
    var main = '';
    for (i = 0; i < list.length; i++) {
        main += `<div class="col-sm-4 mb-4" style="position:relative;">
            <div class="singlekhoahoc" style="cursor:pointer; height:auto; overflow:hidden; display:flex; flex-direction:column; justify-content:flex-start;">
                <img src="${list[i].image}" class="imgkhoahocct card-img-top" alt="Course Image">
                <div class="card-body d-flex flex-column align-items-center p-2" style="flex:1 1 auto; display:flex; flex-direction:column; justify-content:flex-start; padding-bottom:0; margin-bottom:0;">
                    <p class="tenkhoahoc" style="word-break:break-word; margin-bottom:0; padding-bottom:0; height:auto; line-height:1.4;">${list[i].name}</p>
                </div>
            </div>
        </div>`
    }
    document.getElementById("listcoursect").innerHTML = main;
    // Hiệu ứng drop item: dropdown là con của col-sm-4.mb-4, position:absolute
    setTimeout(function() {
        var courseDivs = document.querySelectorAll('.singlekhoahoc');
        courseDivs.forEach(function(div, idx) {
            div.onclick = function(e) {
                var parentCol = div.parentElement;
                var dropdown = parentCol.querySelector('.course-items-dropdown');
                var placeholder = parentCol.querySelector('.dropdown-placeholder');
                if (dropdown) {
                    dropdown.remove();
                    if (placeholder) placeholder.remove();
                    return;
                }
                document.querySelectorAll('.course-items-dropdown').forEach(function(el){el.remove();});
                document.querySelectorAll('.dropdown-placeholder').forEach(function(el){el.remove();});
                var course = list[idx];
                var itemsHtml = `<div class='course-items-dropdown' style='position:absolute;left:0;right:0;top:100%;background:#fff;border:1px solid #ddd;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);padding:10px;margin-top:4px;z-index:1000;min-width:180px;'>
                    <ul style='list-style:none;padding:0;margin:0;'>
                        <li><a class='dropdown-item' href='tailieu?khoahoc=${course.id}'><i class='fa fa-file'></i> Tài liệu</a></li>
                        <li><a class='dropdown-item' href='chapter?khoahoc=${course.id}'><i class='fa fa-list'></i> Nội dung</a></li>

                        <li><a class='dropdown-item' href='thongke?khoahoc=${course.id}'><i class='fa fa-chart-line'></i> Thống kê</a></li>

                    </ul>
                    <span style='position:absolute;top:5px;right:10px;cursor:pointer;font-size:18px;' onclick='this.parentElement.nextElementSibling.remove();this.parentElement.remove()' title='Đóng'>&times;</span>
                </div>`;
                // Thêm placeholder để đẩy các khoá học phía dưới xuống (tăng khoảng cách)
                var placeholderHtml = `<div class="dropdown-placeholder" style="height:10px;"></div>`;
                parentCol.insertAdjacentHTML('beforeend', itemsHtml + placeholderHtml);
            }
        });
    }, 500);
}


async function loadKhoaHocCuaToiSelect() {
    var uls = new URL(document.URL)
    var khoahoc = uls.searchParams.get("khoahoc");
    var url = 'http://localhost:8080/api/course/teacher/find-by-teacher';
    const response = await fetch(url, {
        method: 'GET',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        }),
    });
    var list = await response.json();
    var main = '';
    for (i = 0; i < list.length; i++) {
        main += `<option ${khoahoc === String(list[i].id) ? 'selected' : ""} value="${list[i].id}">${list[i].name}</option>`
    }
    document.getElementById("khoahocselect").innerHTML = main
}


async function loadKhoaHocCuaToiAdd() {
    var uls = new URL(document.URL)
    var khoahoc = uls.searchParams.get("khoahoc");
    var url = 'http://localhost:8080/api/course/teacher/find-by-teacher';
    const response = await fetch(url, {
        method: 'GET',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        }),
    });
    var list = await response.json();
    var main = '';
    for (i = 0; i < list.length; i++) {
        main += `<option ${khoahoc === String(list[i].id) ? 'selected' : ""} value="${list[i].id}">${list[i].name}</option>`
    }
    document.getElementById("khoahocselectadd").innerHTML = main
}
