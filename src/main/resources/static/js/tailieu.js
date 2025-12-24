async function loadTaiLieuKh(course) {
    $('#example').DataTable().destroy();
    var url = 'https://lmsdtm-production.up.railway.app/api/document/all/find-by-course?course=' + course;
    const response = await fetch(url, {
        method: 'GET',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        }),
    });
    var list = await response.json();
    var main = '';
    for (i = 0; i < list.length; i++) {
        main += `<tr>
        <td>${list[i].name}</td>
        <td>${list[i].storage}</td>
        <td>${formatdate(list[i].createdDate)}</td>
        <td>
            <a href="${list[i].linkFile}" download target="_blank"><i class="fa fa-download icontable"></i></a>
        </td>
    </tr>`
    }
    document.getElementById("listfile").innerHTML = main
    $('#example').DataTable();
    localStorage.removeItem("")
}


