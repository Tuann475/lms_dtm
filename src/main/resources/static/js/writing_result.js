var writingApiBase = '/api/result';

function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function initWritingPage() {
    // exam id from query
    var uls = new URL(document.URL);
    var examId = uls.searchParams.get('exam');
    if (!examId) {
        document.getElementById('statusMsg').innerHTML = '<div class="alert alert-danger">Thiếu examId trên URL ?exam=...</div>';
        return;
    }
    // Check if user already has a result (any result for this exam)
    $.ajax({
        url: writingApiBase + '/user/find-by-user-exam?examId=' + examId,
        method: 'GET',
        headers: {'Authorization': 'Bearer ' + getToken()},
        success: function (res) {
            if (res && res.result) {
                // Already submitted -> disable submit and show link to view writing result if writing
                $('#btnSubmitWriting').prop('disabled', true).text('Đã nộp');
                $('#statusMsg').html('<div class="alert alert-success">Bạn đã nộp bài viết. Không thể nộp lại.</div>');
                $('#linkViewResult').attr('href', 'writingresult?resultId=' + res.result.id).show();
            }
        },
        error: function () { /* ignore -> can submit */
        }
    });
}

function submitWriting() {
    var uls = new URL(document.URL);
    var examId = uls.searchParams.get('exam');
    var fullText = $('#fullText').val();
    if (!fullText || fullText.trim().length < 50) {
        toastr.warning('Bài viết quá ngắn (tối thiểu 50 ký tự)');
        return;
    }
    $('#btnSubmitWriting').prop('disabled', true).text('Đang nộp...');
    $.ajax({
        url: writingApiBase + '/user/writing-submit',
        method: 'POST',
        data: JSON.stringify({examId: Number(examId), fullText: fullText}),
        contentType: 'application/json',
        headers: {'Authorization': 'Bearer ' + getToken()},
        success: function (res) {
            toastr.success('Nộp bài viết thành công');
            $('#statusMsg').html('<div class="alert alert-success">Đã nộp bài viết thành công.</div>');
            $('#btnSubmitWriting').text('Đã nộp');
            $('#linkViewResult').attr('href', 'writingresult?resultId=' + res.resultId).show();
        },
        error: function (xhr) {
            $('#btnSubmitWriting').prop('disabled', false).text('Nộp bài viết');
            toastr.error('Nộp bài thất bại: ' + (xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : 'Lỗi'));
        }
    });
}

function loadWritingResult() {
    var uls = new URL(document.URL);
    var resultId = uls.searchParams.get('resultId');
    if (!resultId) {
        $('#resultMeta').html('<div class="alert alert-danger">Thiếu resultId</div>');
        return;
    }
    $.ajax({
        url: writingApiBase + '/user/writing-evaluation?resultId=' + resultId,
        method: 'GET',
        headers: {'Authorization': 'Bearer ' + getToken()},
        success: function (resp) {
            if (resp.fullText) {
                $('#fullTextContent').text(resp.fullText);
            } else {
                $('#fullTextContent').html('<em>Chưa có nội dung bài viết</em>');
            }
            var metaHtml = '<div class="card"><div class="card-body">';
            metaHtml += '<strong>Điểm Task Response:</strong> ' + (resp.trScore ?? '-') + ' | ';
            metaHtml += '<strong>Coherence & Cohesion:</strong> ' + (resp.ccScore ?? '-') + ' | ';
            metaHtml += '<strong>Lexical Resource:</strong> ' + (resp.lrScore ?? '-') + ' | ';
            metaHtml += '<strong>Grammatical Range & Accuracy:</strong> ' + (resp.graScore ?? '-') + ' | ';
            metaHtml += '<strong>Overall:</strong> ' + (resp.overallScore ?? '-') + '</div></div>';
            $('#resultMeta').html(metaHtml);
            $('#teacherFeedback').text(resp.teacherFeedback || 'Chưa có nhận xét');
            var sections = resp.sections || [];
            var sectionHtml = '';
            if (sections.length === 0) {
                sectionHtml = '<div class="alert alert-warning">Chưa có phần đánh giá chi tiết.</div>';
            } else {
                sections.sort(function (a, b) {
                    return a.sectionIndex - b.sectionIndex;
                });
                for (var i = 0; i < sections.length; i++) {
                    var s = sections[i];
                    var titleMap = {0: 'Introduction', 1: 'Body paragraph 1', 2: 'Body paragraph 2', 3: 'Conclusion'};
                    var title = titleMap[s.sectionIndex] || ('Section ' + s.sectionIndex);
                    sectionHtml += '<div class="card mb-2">';
                    sectionHtml += '<div class="card-header">' + title + '</div>';
                    sectionHtml += '<div class="card-body">';
                    sectionHtml += '<p style="white-space:pre-line">' + (s.content || '') + '</p>';
                    if (s.scoreTeacher != null) {
                        sectionHtml += '<p><strong>Điểm GV:</strong> ' + s.scoreTeacher + '</p>';
                    }
                    if (s.feedbackTeacher) {
                        sectionHtml += '<p><strong>Nhận xét GV:</strong> ' + s.feedbackTeacher + '</p>';
                    }
                    sectionHtml += '</div></div>';
                }
            }
            $('#sectionList').html(sectionHtml);
        },
        error: function () {
            $('#resultMeta').html('<div class="alert alert-danger">Không tải được kết quả viết</div>');
        }
    });
}
