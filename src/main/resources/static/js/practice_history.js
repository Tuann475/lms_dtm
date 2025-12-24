function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function fmt(d) { return d ? d.replace('T', ' ') : ''; }
function safeText(v){ return (v==null || String(v).trim()==='' || v==='null' || v==='undefined')? '' : String(v).trim(); }
function getQueryParam(name){ try{ var u=new URL(document.URL); return u.searchParams.get(name); }catch(e){ return null; } }

function loadPracticeHistory() {
    $.ajax({
        url: '/api/practice/user/sessions', method: 'GET', headers: {'Authorization': 'Bearer ' + getToken()},
        success: function (list) {
            var selExamId = getQueryParam('examId') || getQueryParam('exam');
            var selectedGid = null;
            var groups = {}, order = [];
            (list||[]).forEach(function(s){
                var gid = (s.examId!=null? ('EXAM_'+s.examId) : (safeText(s.examName)||'UNKNOWN'));
                if(!groups[gid]){ groups[gid] = { title: safeText(s.examName)||'Bài thi chưa đặt tên', items: [] }; order.push(gid); }
                groups[gid].items.push(s);
            });
            // If no exam specified, show a hint and render nothing
            if(!selExamId){
                $('#examInfo').html('<div class="alert alert-info">Vui lòng truy cập từ trang bài thi hoặc thêm ?examId=<id> để xem lịch sử của bài thi cụ thể.</div>');
                $('#practiceHistoryBody').html('');
                return;
            }
            var n = parseInt(selExamId, 10);
            if(isNaN(n)){
                $('#examInfo').html('<div class="alert alert-warning">examId không hợp lệ trên URL.</div>');
                $('#practiceHistoryBody').html('');
                return;
            }
            var gid = 'EXAM_'+n;
            var group = groups[gid];
            if(!group){
                $('#examInfo').html('<div class="alert alert-warning">Không tìm thấy lịch sử cho bài thi ID '+n+'.</div>');
                $('#practiceHistoryBody').html('');
                return;
            }
            // Show selected exam info
            $('#examInfo').html('<div><strong>Bài thi:</strong> '+(group.title||'')+' <span class="badge bg-light text-dark">'+n+'</span></div>');
            // Render only this exam's sessions
            var html = '';
            group.items.forEach(function (s, idx) {
                var actionHtml = s.completed ?
                    '<button class="btn btn-sm btn-success" onclick="viewPracticeResult('+s.id+')">Xem</button>' :
                    '<button class="btn btn-sm btn-primary" onclick="continuePractice('+s.id+')">Tiếp tục</button>';
                html += '<tr>' +
                    '<td>' + (idx + 1) + '</td>' +
                    '<td>' + fmt(s.createdDate) + '</td>' +
                    '<td>' + fmt(s.finishedDate) + '</td>' +
                    '<td>' + (s.totalQuestions!=null? s.totalQuestions: '-') + '</td>' +
                    '<td>' + (s.numAnswered!=null? s.numAnswered: '-') + '</td>' +
                    '<td>' + (s.numCorrect!=null? s.numCorrect: '-') + '</td>' +
                    '<td>' + (s.percentCorrect != null ? s.percentCorrect.toFixed(1) : '0.0') + '%</td>' +
                    '<td>' + (s.durationSeconds != null ? s.durationSeconds : '-') + '</td>' +
                    '<td>' + actionHtml + '</td>' +
                    '</tr>';
            });
            $('#practiceHistoryBody').html(html);
        },
        error: function () { toastr.error('Không tải được lịch sử ôn luyện'); }
    });
}

function viewPracticeResult(sessionId){ window.location.href = 'ketquaonluyen?sessionId=' + sessionId; }
function continuePractice(sessionId){ window.location.href = 'onluyen?sessionId=' + sessionId; }
