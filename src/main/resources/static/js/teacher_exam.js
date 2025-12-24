var token = localStorage.getItem("token");

function initExamForm(){
    if(!token){
        document.getElementById("message").innerText = "Bạn cần đăng nhập";
    }
}

function submitExam(e){
    e.preventDefault();
    if(!token){
        return false;
    }
    const data = {
        name: document.getElementById('name').value.trim(),
        limitTime: parseInt(document.getElementById('limitTime').value),
        examDate: document.getElementById('examDate').value,
        examTime: document.getElementById('examTime').value, // HH:mm matches backend
        courseId: parseInt(document.getElementById('courseId').value),
        lessons: [] // future enhancement
    };
    fetch('/api/exam/teacher/create',{
        method: 'POST',
        headers: {
            'Content-Type':'application/json',
            'Authorization': 'Bearer '+ token
        },
        body: JSON.stringify(data)
    }).then(async res => {
        const text = await res.text();
        if(res.status === 201){
            document.getElementById('message').style.color='green';
            document.getElementById('message').innerText = 'Tạo bài thi thành công';
            document.getElementById('examForm').reset();
        } else {
            document.getElementById('message').style.color='red';
            document.getElementById('message').innerText = text;
        }
    }).catch(err => {
        document.getElementById('message').innerText = 'Lỗi hệ thống';
    });
    return false;
}
