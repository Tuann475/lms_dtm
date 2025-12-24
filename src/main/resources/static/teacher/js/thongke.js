async function thongKe() {

    var course = document.getElementById("khoahocselect").value
    var url = 'https://lmsdtm-production.up.railway.app/api/chapter/all/find-by-course?course=' + course;
    var response = await fetch(url, {
        method: 'GET',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        }),
    });
    var list = await response.json();
    var main = `<tr><th>Học viên</th>`;
    for (i = 0; i < list.length; i++) {
        main += `<th class="text-center" colspan="${list[i].units.length}">${list[i].name}</th>`
    }
    main += `<th class="sticky-col">Tổng</th>
    <th class="sticky-col">Chức năng</th>
    </tr>`;
    document.getElementById("chuongtk").innerHTML = main
    document.getElementById("listthongke").innerHTML = ""

    main = '<tr><td></td>';
    for (i = 0; i < list.length; i++) {
        var listUnit = list[i].units;
        for (j = 0; j < listUnit.length; j++) {
            main += `<td class="text-center small-text">${listUnit[j].name}</td>`
        }
    }
    main += `<td class="sticky-col"></td>
    <td class="sticky-col"></td>
    </tr>`;
    document.getElementById("chuongtk").innerHTML += main


    var url = 'https://lmsdtm-production.up.railway.app/api/user-unit/teacher/thong-ke?course=' + course;
    var response = await fetch(url, {
        method: 'GET',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        }),
    });
    var list = await response.json();
    console.log(list);

    for (i = 0; i < list.length; i++) {
        var main = `<tr><td>${list[i].user.email}</td>`;
        var listUnit = list[i].units;

        var tonghoc = 0;
        for (j = 0; j < listUnit.length; j++) {
            if (listUnit[j].daHoc == true) {
                main += `<td>${listUnit[j].createdDate}</td>`
                tonghoc += Number(1)
            } else {
                main += `<td><i class="fa fa-remove text-red"></></td>`
            }
        }

        main += `<td class="sticky-col">${tonghoc}/ ${listUnit.length}</td>
        <td class="sticky-col"><i onclick="xoaKhoaHocUser(${document.getElementById("khoahocselect").value},${list[i].user.id})" class="fa fa-trash-o pointer"></i></td>
        </tr>`;
        document.getElementById("listthongke").innerHTML += main
    }

    $('#example').DataTable();
}


async function xoaKhoaHocUser(idcourse, iduser) {
    var con = confirm("Xác nhận xóa học viên này?")
    if (con == false) {
        return;
    }
    var url = 'https://lmsdtm-production.up.railway.app/api/course-user/teacher/delete?idCourse=' + idcourse + '&iduser=' + iduser;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    if (response.status < 300) {
        toastr.success("xóa thành công!");
        thongKe();
    }
    if (response.status == exceptionCode) {
        var result = await response.json()
        toastr.warning(result.defaultMessage);
    }
}


function loadThongKe() {
    var course = document.getElementById("khoahocselect").value
    window.location.href = `thongke?khoahoc=` + course
}