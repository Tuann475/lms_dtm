// Ensure token is available when loaded from teacher pages
var token = typeof token !== 'undefined' ? token : (localStorage.getItem('token') || sessionStorage.getItem('token'));

// Global state for results & current tab filter
window.allResults = window.allResults || [];
window.currentTabFilter = window.currentTabFilter || 'ALL'; // ALL | PENDING | GRADED

// Helper: try admin endpoint, if 403 then fallback to teacher endpoint
async function fetchWithTeacherFallback(adminUrl, teacherUrl, options){
    let res;
    try { res = await fetch(adminUrl, options); } catch(e){ return { error:true, status:0, body:'Network error' }; }
    if(res.status === 403){
        try { const resTeacher = await fetch(teacherUrl, options); return { response: resTeacher, from:'teacher' }; }
        catch(e){ return { error:true, status:0, body:'Network error' }; }
    }
    return { response: res, from:'admin' };
}

// Helper: determine if a result is pending grading
function isPendingResult(item) {
    if (!item || !item.result) return false;
    var pendingCount = 0;
    // Writing pending
    if (item.writingPending && item.writingPending > 0) pendingCount++;
    // Any band null but exam has that skill attempted
    var hasAnyBand = item.finalWritingBand != null || item.readingBand != null || item.listeningBand != null || item.speakingBand != null;
    var hasNullBand = item.finalWritingBand == null || item.readingBand == null || item.listeningBand == null || item.speakingBand == null;
    if (hasAnyBand && hasNullBand) pendingCount++;
    return pendingCount > 0;
}

// Helper: determine if a result is fully graded
function isGradedResult(item) {
    if (!item || !item.result) return false;
    // If has any skill, require all non-null and no writing pending
    var hasAnyBand = item.finalWritingBand != null || item.readingBand != null || item.listeningBand != null || item.speakingBand != null;
    if (!hasAnyBand) return false;
    if (item.writingPending && item.writingPending > 0) return false;
    if (item.finalWritingBand == null || item.readingBand == null || item.listeningBand == null || item.speakingBand == null) return false;
    return true;
}

// Render table rows for a given list and (re)init DataTable
function renderResultTable(list) {
    var tbody = document.getElementById('listresult');
    if (!tbody) return;
    // Destroy DataTable safely
    if (window.$ && $.fn.DataTable && $.fn.DataTable.isDataTable('#example')) {
        $('#example').DataTable().destroy();
    }
    var main = '';
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        var writingInfo = '';
        var actionCol = '';
        // Remove bands W/R/L/S and overall display
        // var bands = []; ...existing code building bands...
        // var overallText = ''; ...existing code...
        // ...existing code...
        if (item.writingPending != null) {
            writingInfo = '';
            var skills = new Set();
            if (item.result && item.result.exam && Array.isArray(item.result.exam.lessons)) {
                item.result.exam.lessons.forEach(l => {
                    if (l.skill) skills.add(String(l.skill).toUpperCase());
                });
            }
            actionCol = "<div class='row row-cols-2 g-1'>";
            if (skills.has('READING')) {
                actionCol += "<div class='col'><button id='btn-skill-reading-"+item.result.id+"' class='btn btn-sm w-100 btn-skill btn-skill-reading btn-grade-reading' data-skill='READING' data-result='" + item.result.id + "' style='white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background-color:#95e1d3;border-color:#95e1d3;color:white;font-weight:bold' title='Reading'>R</button></div>";
            }
            if (skills.has('LISTENING')) {
                actionCol += "<div class='col'><button id='btn-skill-listening-"+item.result.id+"' class='btn btn-sm w-100 btn-skill btn-skill-listening btn-grade-listening' data-skill='LISTENING' data-result='" + item.result.id + "' style='white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background-color:#4ecdc4;border-color:#4ecdc4;color:white;font-weight:bold' title='Listening'>L</button></div>";
            }
            if (skills.has('SPEAKING')) {
                actionCol += "<div class='col'><button id='btn-skill-speaking-"+item.result.id+"' class='btn btn-sm w-100 btn-skill btn-skill-speaking btn-grade-speaking' data-skill='SPEAKING' data-result='" + item.result.id + "' style='white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background-color:#feca57;border-color:#feca57;color:white;font-weight:bold' title='Speaking'>S</button></div>";
            }
            if (skills.has('WRITING')) {
                actionCol += "<div class='col'><button id='btn-skill-writing-"+item.result.id+"' class='btn btn-sm w-100 btn-skill btn-skill-writing btn-grade-writing' data-skill='WRITING' data-result='" + item.result.id + "' style='white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background-color:#ff6b6b;border-color:#ff6b6b;color:white;font-weight:bold' title='Writing'>W</button></div>";
            }
            actionCol += "</div>";
        }
        var bandsHtml = '';
        main += '<tr>' +
            '<td>' + item.result.user.fullName + '<br>' + item.result.user.email + writingInfo + bandsHtml + '</td>' +
            '<td>' + item.tongCauHoi + '</td>' +
            '<td>' + item.soTLSai + '</td>' +
            '<td>' + item.soTLDung + '</td>' +
            '<td>' + item.phanTram.toFixed(2) + '%</td>' +
            "<td class='text-center'>" + actionCol + '</td>' +
            '</tr>';
    }
    tbody.innerHTML = main || '<tr><td colspan="6" class="text-center text-muted">Không có dữ li��u.</td></tr>';
    // Ẩn nút skill không có trong exam
    setTimeout(()=>{
        for (var i = 0; i < list.length; i++) {
            ensureSkillButtonsVisibilityTeacher(list[i].result.id);
        }
    }, 0);
    if (window.$ && $.fn.DataTable) {
        var dt = $('#example').DataTable({
            language: {
                emptyTable: 'Không có dữ liệu',
                zeroRecords: 'Không tìm thấy kết quả phù hợp',
                infoEmpty: 'Không có dữ liệu',
                search: 'Tìm kiếm:',
                lengthMenu: 'Hiển thị _MENU_ dòng',
                info: 'Hiển thị _START_ đến _END_ trong tổng _TOTAL_ dòng',
                paginate: { first: 'Đầu', last: 'Cuối', next: 'Sau', previous: 'Trước' }
            }
        });
        // luôn về trang đầu khi đổi tab
        try { dt.page(0).draw('page'); } catch (e) {}
    }
}

// Apply current tab filter and render
function applyResultFilterAndRender() {
    var filter = window.currentTabFilter || 'ALL';
    var all = window.allResults || [];
    var filtered;
    if (filter === 'PENDING') {
        filtered = all.filter(isPendingResult);
    } else if (filter === 'GRADED') {
        filtered = all.filter(isGradedResult);
    } else {
        filtered = all;
    }
    renderResultTable(filtered);
}

async function loadResult() {
    // Destroy DataTable safely
    if (window.$ && $.fn.DataTable && $.fn.DataTable.isDataTable('#example')) {
        $('#example').DataTable().destroy();
    }
    var tbody = document.getElementById('listresult');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Đang tải...</td></tr>';
    }
    var exam = new URL(document.URL).searchParams.get('exam');
    var adminUrl = '/api/result/admin/find-by-exam?examId=' + exam;
    var teacherUrl = '/api/result/teacher/find-by-exam?examId=' + exam;
    var wrapper = await fetchWithTeacherFallback(adminUrl, teacherUrl, { method: 'GET', headers: new Headers({ 'Authorization': 'Bearer ' + token }) });
    if (wrapper.error) {
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Lỗi mạng khi tải dữ liệu.</td></tr>';
        }
        return;
    }
    var response = wrapper.response;
    if (!response.ok){
        let msg=''; try{ msg = await response.text(); }catch(e){}
        const isBadReq = response.status === 400;
        const isForbidden = response.status === 403;
        const userMsg = isForbidden
            ? 'Không có quyền truy cập dữ liệu này (403). Vui lòng kiểm tra quyền giáo viên hoặc đăng nhập lại.'
            : (isBadReq
                ? 'Yêu cầu không hợp lệ. Vui lòng kiểm tra tham số bài thi.'
                : ('Không tải được dữ liệu (mã: '+response.status+').'));
        if(tbody){ tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${userMsg}</td></tr>`; }
        // Re-init DataTable to keep table structure usable
        if(window.$ && $.fn.DataTable){
            $('#example').DataTable({
                language: {
                    emptyTable: "Không có dữ liệu",
                    zeroRecords: "Không tìm thấy kết quả phù hợp",
                    infoEmpty: "Không có dữ liệu",
                    search: "Tìm kiếm:",
                    lengthMenu: "Hiển thị _MENU_ dòng",
                    info: "Hiển thị _START_ đến _END_ trong tổng _TOTAL_ dòng",
                    paginate: { first: "Đầu", last: "Cuối", next: "Sau", previous: "Trước" }
                }
            });
        }
        return;
    }
    var list = [];
    try { list = await response.json(); } catch(e){ list = []; }
    window.allResults = list || [];
    applyResultFilterAndRender();
}

function openWriting(resultId) {
    window.currentResultId = resultId;
    // default show modal and load into tabs
    $('#writingModal').modal('show');
    // Chuyển tab về "Tất cả" khi mở modal
    const tabAll = document.querySelector('#writingTabAll');
    if (tabAll) {
        tabAll.click();
    }
    loadWritingAnswers(resultId);
}

async function loadWritingAnswers(resultId) {
    const adminUrl = '/api/result/admin/writing/by-result?resultId=' + resultId;
    const teacherUrl = '/api/result/teacher/writing/by-result?resultId=' + resultId;
    const w = await fetchWithTeacherFallback(adminUrl, teacherUrl, { headers: new Headers({'Authorization': 'Bearer ' + token})});
    if(w.error){
        const elP = document.getElementById('writingListPending');
        const elG = document.getElementById('writingListGraded');
        const elA = document.getElementById('writingListAll');
        if(elP) elP.innerHTML = '<div class="alert alert-danger">Lỗi mạng</div>';
        if(elG) elG.innerHTML = '';
        if(elA) elA.innerHTML = '';
        return;
    }
    var response = w.response;
    var list = await response.json();
    window.currentWritingAnswers = list || [];
    const pending = window.currentWritingAnswers.filter(w => !w.graded);
    const graded  = window.currentWritingAnswers.filter(w =>  w.graded);
    function cardHtml(w){
        const answerText = getGenericAnswerText(w);
        const safe = (answerText || '').replace(/</g,'&lt;');
        return `<div class='card mb-2'><div class='card-body'>
            <p><strong>Câu hỏi #${w.questionId || ''}</strong> - ${w.questionTitle || ''}</p>
            <div class='mb-1'><strong>Trả lời học viên:</strong></div>
            <div style='white-space:pre-line' class='p-2 border bg-light'>${safe}</div>
            <p>${w.graded ? '<span class="badge bg-success">Đã chấm</span>' : '<span class="badge bg-warning text-dark">Chưa chấm</span>'}
            ${`<p id='writing_current_${w.id}'>Điểm hiện tại: ${w.manualScore ?? '-'}<br>Nhận xét hiện tại: ${(w.feedback || '')}</p>`}
            </p>
            <div class='row g-2 align-items-center mt-2 card-grade-inputs'>
                <div class='col-auto'><input type='number' min='0' max='9' step='1' class='form-control form-control-sm score-input' data-field='score' data-result-exam='${w.id}' placeholder='Điểm (0-9)' value='${w.manualScore ?? ''}'></div>
                <div class='col'><textarea class='form-control form-control-sm feedback-input' data-field='feedback' data-result-exam='${w.id}' placeholder='Nhận xét' rows='2'>${w.feedback ?? ''}</textarea></div>
                <div class='col-auto d-flex gap-2'>
                  <button class='btn btn-sm btn-primary' onclick='gradeWriting(${w.id}, this)'>${w.graded ? 'Chấm lại' : 'Chấm'}</button>
                  <button class='btn btn-sm btn-outline-secondary' onclick='openHistory("WRITING", ${w.id})'>Lịch sử</button>
                </div>
            </div>
        </div></div>`;
    }
    const elPending = document.getElementById('writingListPending');
    const elGraded  = document.getElementById('writingListGraded');
    const elAll     = document.getElementById('writingListAll');
    if(elPending){ elPending.innerHTML = pending.length ? pending.map(cardHtml).join('') : '<div class="alert alert-info">Không có bài chờ chấm.</div>'; }
    if(elGraded) { elGraded.innerHTML  = graded.length ? graded.map(cardHtml).join('')  : '<div class="alert alert-secondary">Chưa có bài đã chấm.</div>'; }
    if(elAll)    { elAll.innerHTML     = window.currentWritingAnswers.length ? window.currentWritingAnswers.map(cardHtml).join('') : '<div class="alert alert-info">Không có bài viết.</div>'; }
}

async function gradeWriting(id, btn) {
    var scoreInput = null;
    var fbInput = null;
    if (btn && typeof btn.closest === 'function') {
        var card = btn.closest('.card-grade-inputs') || btn.closest('.card');
        if (card) {
            scoreInput = card.querySelector("[data-field='score'][data-result-exam='" + id + "']");
            fbInput = card.querySelector("[data-field='feedback'][data-result-exam='" + id + "']");
        }
    }
    if (!scoreInput) { scoreInput = document.getElementById('score_' + id); }
    if (!fbInput) { fbInput = document.getElementById('fb_' + id); }

    var scoreStr = scoreInput ? String(scoreInput.value).trim() : '';
    var fb = fbInput ? String(fbInput.value).trim() : '';

    // Thay thế dấu phẩy thành dấu chấm nếu có
    scoreStr = scoreStr.replace(',', '.');

    var score = scoreStr === '' ? NaN : parseFloat(scoreStr);

    // Validate: number
    if (isNaN(score)) {
        toastr.error('Vui lòng nhập điểm dạng số');
        return;
    }

    // Làm tròn điểm về bội số của 0.5 ngay từ đầu để tránh lỗi floating-point
    score = Math.round(score * 2) / 2;

    // Validate: range 0-9 (sau khi đã làm tròn)
    if (score < 0 || score > 9) {
        toastr.error('Điểm writing phải trong khoảng 0-9 (nhập theo bước 0.5: ví dụ 6.5, 7, 7.5, 8, 8.5, 9)');
        return;
    }

    // Validate: step 0.5 - kiểm tra sau khi làm tròn
    var doubled = score * 2;
    var isValidStep = Math.abs(doubled - Math.round(doubled)) < 0.0001;

    if (!isValidStep) {
        toastr.error('Điểm writing phải theo bước 0.5 (ví dụ: 0, 0.5, 1, 1.5, 2, ..., 8.5, 9)');
        return;
    }

    const adminUrl = '/api/result/admin/writing/grade?id=' + id + '&score=' + score + '&feedback=' + encodeURIComponent(fb);
    const teacherUrl = '/api/result/teacher/writing/grade?id=' + id + '&score=' + score + '&feedback=' + encodeURIComponent(fb);
    const w = await fetchWithTeacherFallback(adminUrl, teacherUrl, { method: 'POST', headers: new Headers({'Authorization': 'Bearer ' + token})});
    const response = w.response;
    if (response && response.status < 300) {
        toastr.success('Đã chấm');
        // Cập nhật ngay điểm và nhận xét hiển thị
        const elCurrent = document.getElementById('writing_current_' + id);
        if(elCurrent){
            elCurrent.innerHTML = `Điểm hiện tại: ${score}<br>Nhận xét hiện tại: ${fb}`;
        }
        // cũng cập nhật lại giá trị trong input
        if(scoreInput) scoreInput.value = score;
        if(fbInput) fbInput.value = fb;
        loadWritingAnswers(window.currentResultId);
        loadResult();
    } else {
        try { var err = await response.json(); toastr.error(err?.defaultMessage || 'Lỗi'); } catch(e){ toastr.error('Lỗi'); }
    }
}

// Speaking grading functions
function openSpeaking(resultId) {
    window.currentResultId = resultId;
    $('#speakingModal').modal('show');
    loadSpeakingAnswers(resultId);
}

async function loadSpeakingAnswers(resultId) {
    const adminUrl = '/api/result/admin/speaking/by-result?resultId=' + resultId;
    const teacherUrl = '/api/result/teacher/speaking/by-result?resultId=' + resultId;
    const w = await fetchWithTeacherFallback(adminUrl, teacherUrl, { headers: new Headers({'Authorization': 'Bearer ' + token})});
    if(w.error){
        const elP = document.getElementById('speakingListPending');
        const elG = document.getElementById('speakingListGraded');
        const elA = document.getElementById('speakingListAll');
        if(elP) elP.innerHTML = '<div class="alert alert-danger">Lỗi mạng</div>';
        if(elG) elG.innerHTML = '';
        if(elA) elA.innerHTML = '';
        return;
    }
    const response = w.response;
    var list = await response.json();
    window.currentSpeakingAnswers = list || [];

    // Split into pending and graded lists
    const pending = window.currentSpeakingAnswers.filter(s => !s.graded);
    const graded  = window.currentSpeakingAnswers.filter(s =>  s.graded);

    function cardHtml(s){
        const promptAudio = s.questionLinkAudio || (s.question && (s.question.link_audio || s.question.linkAudio)) || s.linkAudio || '';
        const promptAudioBlock = promptAudio
            ? `<div class='mb-2'><small class='text-muted d-block'>Audio đề:</small><audio class='mt-1' controls style='width:100%; display:block;'><source src='${promptAudio}' type='audio/mpeg'>Trình duyệt không hỗ trợ.</audio></div>`
            : `<div class='mb-2'><small class='text-muted d-block'>Audio đề:</small><em class='text-muted'>Không có</em></div>`;
        const studentAudioBlock = s.cloudinaryUrl
            ? `<div class='mb-2'><small class='text-muted d-block'>Audio học viên:</small><audio class='mt-1' controls style='width:100%; display:block;'><source src='${s.cloudinaryUrl}' type='audio/mpeg'>Trình duyệt không hỗ trợ.</audio></div>`
            : '<p class="text-muted">Không có audio học viên</p>';
        const statusBadge = s.graded ? '<span class="badge bg-success">Đã chấm</span>' : '<span class="badge bg-warning text-dark">Chưa chấm</span>';
        return `<div class='card mb-2'><div class='card-body'>
            <p><strong>Câu hỏi #${s.questionId || 'N/A'}</strong> - ${s.questionTitle || 'Speaking submission'} ${statusBadge}</p>
            ${promptAudioBlock}
            ${studentAudioBlock}
            ${s.transcript ? `<p class="small"><strong>Transcript:</strong> ${String(s.transcript).replace(/</g,'&lt;')}</p>` : ''}
            ${s.graded ? `<p id='speaking_current_${s.id}'>Điểm hiện tại: ${s.score ?? '-'}<br>Nhận xét hiện tại: ${(s.feedback || '')}</p>` : ''}
            <div class='row g-2 align-items-center mt-2 card-grade-inputs'>
                <div class='col-auto'><input type='number' min='0' max='9' step='0.5' class='form-control form-control-sm score-input' data-field='score' data-submission-id='${s.id}' placeholder='Điểm (0-9)' value='${s.score ?? ''}'></div>
                <div class='col'><textarea class='form-control form-control-sm feedback-input' data-field='feedback' data-submission-id='${s.id}' placeholder='Nhận xét' rows='2'>${s.feedback ?? ''}</textarea></div>
                <div class='col-auto d-flex gap-2'>
                  <button class='btn btn-sm btn-primary' onclick='gradeSpeaking(${s.id}, this)'>${s.graded ? 'Chấm lại' : 'Chấm'}</button>
                  <button class='btn btn-sm btn-outline-secondary' onclick='openHistorySpeaking(${s.id})'>Lịch sử</button>
                </div>
            </div>
        </div></div>`;
    }

    // Populate each tab
    const elPending = document.getElementById('speakingListPending');
    const elGraded  = document.getElementById('speakingListGraded');
    const elAll     = document.getElementById('speakingListAll');

    if(elPending){ elPending.innerHTML = pending.length ? pending.map(cardHtml).join('') : '<div class="alert alert-info">Không có bài chờ chấm.</div>'; }
    if(elGraded) { elGraded.innerHTML  = graded.length ? graded.map(cardHtml).join('')  : '<div class="alert alert-secondary">Chưa có bài đã chấm.</div>'; }
    if(elAll)    { elAll.innerHTML     = window.currentSpeakingAnswers.length ? window.currentSpeakingAnswers.map(cardHtml).join('') : '<div class="alert alert-info">Không có bài nói.</div>'; }
}

async function gradeSpeaking(id, btn) {
    var scoreInput = null;
    var fbInput = null;
    if (btn && typeof btn.closest === 'function') {
        var card = btn.closest('.card-grade_inputs') || btn.closest('.card');
        if (card) {
            scoreInput = card.querySelector("[data-field='score'][data-submission-id='" + id + "']");
            fbInput = card.querySelector("[data-field='feedback'][data-submission-id='" + id + "']");
        }
    }
    if (!scoreInput) { scoreInput = document.getElementById('score_sp_' + id); }
    if (!fbInput) { fbInput = document.getElementById('fb_sp_' + id); }
    var score = scoreInput ? scoreInput.value : '';
    var fb = fbInput ? fbInput.value : '';
    if (score === '' || score < 0 || score > 9) { toastr.error('Điểm không hợp lệ (0-9)'); return; }
    const adminUrl = '/api/result/admin/speaking/grade?id=' + id + '&score=' + score + '&feedback=' + encodeURIComponent(fb);
    const teacherUrl = '/api/result/teacher/speaking/grade?id=' + id + '&score=' + score + '&feedback=' + encodeURIComponent(fb);
    const w = await fetchWithTeacherFallback(adminUrl, teacherUrl, { method: 'POST', headers: new Headers({'Authorization': 'Bearer ' + token})});
    const response = w.response;
    if (response && response.status < 300) {
        toastr.success('Đã chấm bài speaking');
        // immediate UI update
        const elCur = document.getElementById('speaking_current_' + id);
        if(elCur){ elCur.innerHTML = `Điểm hiện tại: ${score}<br>Nhận xét hiện tại: ${fb}`; }
        // also update inputs to reflect saved values
        if(scoreInput) scoreInput.value = score;
        if(fbInput) fbInput.value = fb;
        loadSpeakingAnswers(window.currentResultId);
        loadResult();
    } else {
        try { var err = await response.json(); toastr.error(err?.defaultMessage || 'Lỗi'); } catch(e){ toastr.error('Lỗi'); }
    }
}

// Reading grading functions (teacher dùng full answer text)
function openReading(resultId) {
    window.currentResultId = resultId;
    try {
        if (typeof openSkillModal === 'function') {
            openSkillModal(resultId, 'READING');
            return;
        }
    } catch (e) {}
    $('#readingModal').modal('show');
    loadReadingAnswers(resultId);
}

// Helper giống admin: xác định MCQ
function isMcqItem(item) {
    const hasChoice = !!item.selectedAnswerId || !!(item.answer && item.answer.id);
    const hasText = !!(item.answerText && String(item.answerText).trim().length > 0);
    const hasAudio = !!(item.userAudio || item.speakingAudio);
    const qt = String(item?.questionType ?? item?.question?.type ?? item?.question?.questionType ?? '').toUpperCase();
    const explicitMcq = qt === 'MCQ' || qt.includes('MULTI') || qt.includes('CHOICE');
    return (explicitMcq || hasChoice) && !hasText && !hasAudio;
}
function isCorrectMcq(item){
    try{
        if(item?.isCorrect === true) return true;
        if(item?.isCorrect === false) return false;
        if(item?.answer && typeof item.answer.isTrue === 'boolean') return item.answer.isTrue === true;
        const opts = item?.options || item?.answers || item?.question?.answers || [];
        if(item?.selectedAnswerId && Array.isArray(opts)){
            const match = opts.find(o=> (o.id===item.selectedAnswerId) || (''+o.id === ''+item.selectedAnswerId));
            if(match && typeof match.isTrue === 'boolean') return match.isTrue === true;
        }
        if(Array.isArray(opts) && item?.userAnswer){
            const correct = opts.find(o=> o.isTrue===true);
            if(correct){ return (String(item.userAnswer).trim() === String(correct.content??correct.title??'').trim()); }
        }
    }catch(e){}
    return null;
}

// Generic helper to get best-effort textual answer for non-speaking skills
function getGenericAnswerText(item){
    if(item && item.answerText != null && String(item.answerText).trim().length > 0){
        return String(item.answerText);
    }
    if(item && item.userAnswer != null && String(item.userAnswer).trim().length > 0){
        return String(item.userAnswer);
    }
    if(item && item.answer){
        const opt = item.answer.content ?? item.answer.title ?? item.answerText;
        if(opt != null && String(opt).trim().length > 0){
            return String(opt);
        }
    }
    return '';
}

function getReadingAnswerText(item){
    return getGenericAnswerText(item);
}

async function loadReadingAnswers(resultId) {
    const adminUrl   = '/api/result/admin/reading/by-result?resultId=' + resultId;
    const teacherUrl = '/api/result/teacher/reading/by-result?resultId=' + resultId;
    const w = await fetchWithTeacherFallback(adminUrl, teacherUrl, { headers: new Headers({'Authorization': 'Bearer ' + token})});
    const elP = document.getElementById('readingListPending');
    const elG = document.getElementById('readingListGraded');
    const elA = document.getElementById('readingList'); // FIX: match HTML id
    if(w.error){
        if(elP) elP.innerHTML = '<div class="alert alert-danger">Lỗi mạng</div>';
        if(elG) elG.innerHTML = '';
        if(elA) elA.innerHTML = '';
        return;
    }
    const response = w.response;
    var list = await response.json();
    window.currentReadingAnswers = list || [];
    const pending = window.currentReadingAnswers.filter(r => !r.graded && !isMcqItem(r));
    const graded  = window.currentReadingAnswers.filter(r =>  r.graded || isMcqItem(r));
    function cardHtml(r){
        const isMcq = isMcqItem(r);
        const correctness = isMcq ? isCorrectMcq(r) : null;
        const correctnessBadge = (correctness===true)
            ? " <span class='badge bg-success'>Đúng</span>"
            : (correctness===false)
                ? " <span class='badge bg-danger'>Sai</span>"
                : '';
        const answerText = getGenericAnswerText(r);
        const safe = (answerText || '').replace(/</g,'&lt;');
        const answerBlock = isMcq
            ? (answerText
                ? `<span class='badge bg-secondary me-1'>MCQ</span>${safe}${r.selectedAnswerId ? `<small class='text-muted'>(answers_id: ${r.selectedAnswerId})</small>` : ''}${correctnessBadge}`
                : '<em>Không có câu trả lời</em>')
            : (answerText
                ? safe
                : '<em>Không có câu trả lời</em>');
        const displayGraded = r.graded || isMcq;
        const controlRow = isMcq
            ? '<div class="text-muted small">Trắc nghiệm sẽ được tự động chấm.</div>'
            : `<div class='row g-2 align-items-center mt-2'>
               <div class='col-auto'>
                  <select id='ok_rd_${r.id}' class='form-select form-select-sm'>
                    <option value='1'>Đúng</option>
                    <option value='0'>Sai</option>
                  </select>
                </div>
                <div class='col'><textarea id='fb_rd_${r.id}' class='form-control form-control-sm' placeholder='Nhận xét' rows='2'>${r.feedback ?? ''}</textarea></div>
                <div class='col-auto d-flex gap-2'>
                    <button class='btn btn-sm btn-primary' onclick='gradeReading(${r.id})'>${displayGraded ? 'Chấm lại' : 'Lưu'}</button>
                    <button class='btn btn-sm btn-outline-secondary' onclick='openHistory("READING", ${r.id})'>Lịch sử</button>
                </div>
            </div>`;
        return `<div class='card mb-2'><div class='card-body'>
            <p><strong>Câu hỏi #${r.questionId || 'N/A'}</strong> - ${r.questionTitle || ''}</p>
            <p><strong>Câu trả lời:</strong> ${answerBlock}</p>
            <p>${displayGraded ? '<span class="badge bg-success">Đã chấm</span>' : '<span class="badge bg-warning text-dark">Chưa chấm</span>'}</p>
            ${displayGraded ? `<p id='reading_current_${r.id}'>Kết quả hiện tại: ${(r.score !== false && r.score != null) ? (r.score>0? 'Đúng':'Sai') : '-'}<br>Nhận xét hiện tại: ${(r.feedback && r.feedback !== false ? r.feedback : '')}</p>` : ''}
            ${controlRow}
         </div></div>`;
    }
    if(elP){ elP.innerHTML = pending.length ? pending.map(cardHtml).join('') : '<div class="alert alert-info">Không có câu chờ chấm.</div>'; }
    if(elG){ elG.innerHTML  = graded.length ? graded.map(cardHtml).join('')  : '<div class="alert alert-secondary">Chưa có bài đã chấm.</div>'; }
    if(elA){ elA.innerHTML  = window.currentReadingAnswers.length ? window.currentReadingAnswers.map(cardHtml).join('') : '<div class="alert alert-info">Không có câu hỏi Reading.</div>'; }
}
async function gradeReading(id) {
    var okEl = document.getElementById('ok_rd_' + id);
    var fb = (document.getElementById('fb_rd_' + id)?.value || '').trim();
    if (!okEl) { toastr.error('Thiếu lựa chọn Đúng/Sai'); return; }
    var score = okEl.value === '1' ? 1 : 0;
    const adminUrl = '/api/result/admin/reading/grade?id=' + id + '&score=' + score + '&feedback=' + encodeURIComponent(fb);
    const teacherUrl = '/api/result/teacher/reading/grade?id=' + id + '&score=' + score + '&feedback=' + encodeURIComponent(fb);
    const w = await fetchWithTeacherFallback(adminUrl, teacherUrl, { method: 'POST', headers: new Headers({'Authorization': 'Bearer ' + token})});
    const response = w.response;
    if (response && response.status < 300) {
        toastr.success('Đã lưu kết quả Reading');
        const elCur = document.getElementById('reading_current_' + id);
        if(elCur){ elCur.innerHTML = `Kết quả hiện tại: ${score>0?'Đúng':'Sai'}<br>Nhận xét hiện tại: ${fb}`; }
        loadReadingAnswers(window.currentResultId);
        loadResult();
    } else {
        try { var err = await response.json(); toastr.error(err?.defaultMessage || 'Lỗi'); } catch(e){ toastr.error('Lỗi'); }
    }
}

// Listening grading functions – áp dụng giống admin, đã có audio + MCQ
function openListening(resultId) {
    window.currentResultId = resultId;
    try {
        if (typeof openSkillModal === 'function') {
            openSkillModal(resultId, 'LISTENING');
            return;
        }
    } catch (e) {}
    $('#listeningModal').modal('show');
    loadListeningAnswers(resultId);
}

async function loadListeningAnswers(resultId) {
    const adminUrl   = '/api/result/admin/listening/by-result?resultId=' + resultId;
    const teacherUrl = '/api/result/teacher/listening/by-result?resultId=' + resultId;
    const w = await fetchWithTeacherFallback(adminUrl, teacherUrl, { headers: new Headers({'Authorization': 'Bearer ' + token})});
    const elP = document.getElementById('listeningListPending');
    const elG = document.getElementById('listeningListGraded');
    const elA = document.getElementById('listeningListAll');
    if(w.error){
        if(elP) elP.innerHTML = '<div class="alert alert-danger">Lỗi mạng</div>';
        if(elG) elG.innerHTML = '';
        if(elA) elA.innerHTML = '';
        return;
    }
    const response = w.response;
    var list = await response.json();
    window.currentListeningAnswers = list || [];
    const pending = window.currentListeningAnswers.filter(l => !l.graded && !isMcqItem(l));
    const graded  = window.currentListeningAnswers.filter(l =>  l.graded || isMcqItem(l));
    function cardHtml(l){
        const isMcq = isMcqItem(l);
        const correctness = isMcq ? isCorrectMcq(l) : null;
        const correctnessBadge = (correctness===true)
            ? " <span class='badge bg-success'>Đúng</span>"
            : (correctness===false)
                ? " <span class='badge bg-danger'>Sai</span>"
                : '';
        const answerText = getGenericAnswerText(l);
        const safe = (answerText || '').replace(/</g,'&lt;');
        const answerBlock = isMcq
            ? (answerText
                ? `<span class='badge bg-secondary'>MCQ</span> ${safe} ${l.selectedAnswerId ? `<small class='text-muted'>(answers_id: ${l.selectedAnswerId})</small>` : ''}${correctnessBadge}`
                : '<em>Không có câu trả lời</em>')
            : (answerText
                ? safe
                : '<em>Không có câu trả lời</em>');
        const displayGraded = l.graded || isMcq;
        const controlRow = isMcq
            ? '<div class="text-muted small">Trắc nghiệm sẽ được tự động chấm.</div>'
            : `<div class='row g-2 align-items-center mt-2'>
               <div class='col-auto'>
                  <select id='ok_ls_${l.id}' class='form-select form-select-sm'>
                    <option value='1'>Đúng</option>
                    <option value='0'>Sai</option>
                  </select>
                </div>
                <div class='col'><textarea id='fb_ls_${l.id}' class='form-control form-control-sm' placeholder='Nhận xét' rows='2'>${l.feedback ?? ''}</textarea></div>
                <div class='col-auto d-flex gap-2'>
                    <button class='btn btn-sm btn-primary' onclick='gradeListening(${l.id})'>${displayGraded ? 'Chấm lại' : 'Lưu'}</button>
                    <button class='btn btn-sm btn-outline-secondary' onclick='openHistory("LISTENING", ${l.id})'>Lịch sử</button>
                </div>
            </div>`;
        return `<div class='card mb-2'><div class='card-body'>
            <p><strong>Câu hỏi #${l.questionId || 'N/A'}</strong> - ${l.questionTitle || ''}</p>
            <p><strong>Đáp án học viên:</strong> ${answerBlock}</p>
            <p>${displayGraded ? '<span class="badge bg-success">Đã chấm</span>' : '<span class="badge bg-warning text-dark">Chưa chấm</span>'}</p>
            ${displayGraded ? `<p id='listening_current_${l.id}'>Kết quả hiện tại: ${(l.score !== false && l.score != null) ? (l.score>0? 'Đúng':'Sai') : '-'}<br>Nhận xét hiện tại: ${(l.feedback && l.feedback !== false ? l.feedback : '')}</p>` : ''}
            ${controlRow}
         </div></div>`;
    }
    if(elP){ elP.innerHTML = pending.length ? pending.map(cardHtml).join('') : '<div class="alert alert-info">Không có câu chờ chấm.</div>'; }
    if(elG){ elG.innerHTML  = graded.length ? graded.map(cardHtml).join('')  : '<div class="alert alert-secondary">Chưa có bài đã chấm.</div>'; }
    if(elA){ elA.innerHTML  = window.currentListeningAnswers.length ? window.currentListeningAnswers.map(cardHtml).join('') : '<div class="alert alert-info">Không có câu hỏi Listening.</div>'; }
    // Khởi tạo audio giống admin
    initAudioPlayersTeacher('listeningListPending');
    initAudioPlayersTeacher('listeningListGraded');
    initAudioPlayersTeacher('listeningListAll');
}
async function gradeListening(id) {
    var okEl = document.getElementById('ok_ls_' + id);
    var fb = (document.getElementById('fb_ls_' + id)?.value || '').trim();
    if (!okEl) { toastr.error('Thiếu lựa chọn Đúng/Sai'); return; }
    var score = okEl.value === '1' ? 1 : 0;
    const adminUrl = '/api/result/admin/listening/grade?id=' + id + '&score=' + score + '&feedback=' + encodeURIComponent(fb);
    const teacherUrl = '/api/result/teacher/listening/grade?id=' + id + '&score=' + score + '&feedback=' + encodeURIComponent(fb);
    const w = await fetchWithTeacherFallback(adminUrl, teacherUrl, { method: 'POST', headers: new Headers({'Authorization': 'Bearer ' + token})});
    const response = w.response;
    if (response && response.status < 300) {
        toastr.success('Đã lưu kết quả Listening');
        const elCur = document.getElementById('listening_current_' + id);
        if(elCur){ elCur.innerHTML = `Kết quả hiện tại: ${score>0?'Đúng':'Sai'}<br>Nhận xét hiện tại: ${fb}`; }
        loadListeningAnswers(window.currentResultId);
        loadResult();
    } else {
        try { var err = await response.json(); toastr.error(err?.defaultMessage || 'Lỗi'); } catch(e){ toastr.error('Lỗi'); }
    }
}

// Init tab click handlers after DOM is ready (CHỈ ĐỊNH NGHĨA 1 LẦN)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initResultTabs);
} else {
    initResultTabs();
}

function initResultTabs() {
    var container = document.getElementById('resultTabs');
    if (!container) return;
    container.addEventListener('click', function (e) {
        var target = e.target;
        if (target.tagName !== 'BUTTON' && target.tagName !== 'A') return;
        var filter = target.getAttribute('data-filter');
        if (!filter) return;
        e.preventDefault();
        window.currentTabFilter = filter;
        var links = container.querySelectorAll('.nav-link');
        links.forEach(function (el) { el.classList.remove('active'); });
        target.classList.add('active');
        applyResultFilterAndRender();
    });
}

// Utility: normalize audio src (same style as admin)
function normalizeAudioSrcTeacher(src){
    if(!src) return src;
    const t = String(src).trim();
    if(/^https?:\/\//i.test(t)) return t;
    if(t.startsWith('/')) return t;
    return '/' + t.replace(/^\/+/, '');
}

// Utility: load audio via fetch with Authorization if same-origin path/API
async function loadBlobAudioToPlayerTeacher(audioEl){
    try{
        let src = audioEl?.dataset?.audioSrc;
        const fallbackId = audioEl?.dataset?.fallbackAudioId;
        if(!src && fallbackId){
            src = '/api/speaking/audio/' + fallbackId;
            audioEl.dataset.audioSrc = src;
        }
        if(!src) return;
        const isAbsolute = /^https?:\/\//i.test(src);
        const isApiOrSameOrigin = !isAbsolute && (src.startsWith('/') || src.startsWith('/api/'));
        let ok=false;
        if(isApiOrSameOrigin){
            try{
                const resp = await fetch(src, { headers: new Headers({ 'Authorization':'Bearer '+token })});
                if(resp.ok){
                    const blob = await resp.blob();
                    audioEl.src = URL.createObjectURL(blob);
                    audioEl.load();
                    ok=true;
                }
            }catch(e){ /* ignore */ }
        }
        if(!ok){
            audioEl.src = src;
            audioEl.load();
        }
    }catch(e){ /* ignore */ }
}
function initAudioPlayersTeacher(container){
    const node = (typeof container==='string') ? document.getElementById(container) : container;
    if(!node) return;
    const players = node.querySelectorAll('audio[data-audio-src]');
    players.forEach(p=>{ loadBlobAudioToPlayerTeacher(p); });
}

// History viewer using existing endpoints and a shared modal in ketqua.html
function openHistory(skill, resultExamId){
    const upper = String(skill||'').toUpperCase();
    let adminUrl, teacherUrl;
    if(upper === 'WRITING'){
        adminUrl  = '/api/result/admin/writing/history?resultExamId=' + resultExamId;
        teacherUrl= '/api/result/teacher/writing/history?resultExamId=' + resultExamId;
    } else if(upper === 'READING'){
        adminUrl  = '/api/result/admin/reading/history?resultExamId=' + resultExamId;
        teacherUrl= '/api/result/teacher/reading/history?resultExamId=' + resultExamId;
    } else if(upper === 'LISTENING'){
        adminUrl  = '/api/result/admin/listening/history?resultExamId=' + resultExamId;
        teacherUrl= '/api/result/teacher/listening/history?resultExamId=' + resultExamId;
    } else {
        if(window.toastr){ toastr.info('Chưa hỗ trợ xem lịch sử cho kỹ năng ' + upper); }
        return;
    }
    const modalEl = document.getElementById('historyModal');
    const bodyEl = document.getElementById('historyBody');
    const titleEl = document.getElementById('historyTitle');
    if(!modalEl || !bodyEl){ console.warn('Missing history modal nodes'); return; }
    if(titleEl){ titleEl.textContent = 'Lịch sử chấm ' + upper + ' #' + resultExamId; }
    bodyEl.innerHTML = '<p class="text-muted">Đang tải lịch sử...</p>';
    fetchWithTeacherFallback(adminUrl, teacherUrl, { headers: new Headers({'Authorization': 'Bearer ' + token})})
      .then(w=>{
        if(w.error || !w.response || !w.response.ok){ throw new Error('HTTP ' + (w.response ? w.response.status : '0')); }
        return w.response.json();
      })
      .then(list=>{
        bodyEl.innerHTML = buildHistoryTableTeacher(list, skill);
      })
      .catch(e=>{
        bodyEl.innerHTML = '<p class="text-danger">Lỗi tải lịch sử: '+(e.message||'')+'</p>';
      });
    try{ new bootstrap.Modal(modalEl).show(); }catch(_){ /* ignore */ }
}

function openHistorySpeaking(submissionId){
    const adminUrl   = '/api/result/admin/speaking/history?submissionId=' + submissionId;
    const teacherUrl = '/api/result/teacher/speaking/history?submissionId=' + submissionId;
    const modalEl = document.getElementById('historyModal');
    const bodyEl = document.getElementById('historyBody');
    const titleEl = document.getElementById('historyTitle');
    if(!modalEl || !bodyEl){ console.warn('Missing history modal nodes'); return; }
    if(titleEl){ titleEl.textContent = 'Lịch sử chấm SPEAKING #' + submissionId; }
    bodyEl.innerHTML = '<p class="text-muted">Đang tải lịch sử...</p>';
    fetchWithTeacherFallback(adminUrl, teacherUrl, { headers: new Headers({'Authorization': 'Bearer ' + token})})
      .then(w=>{
        if(w.error || !w.response || !w.response.ok){ throw new Error('HTTP ' + (w.response ? w.response.status : '0')); }
        return w.response.json();
      })
      .then(list=>{
        bodyEl.innerHTML = buildHistoryTableTeacher(list);
      })
      .catch(e=>{ bodyEl.innerHTML = '<p class="text-danger">Lỗi tải lịch sử: '+(e.message||'')+'</p>'; });
    try{ new bootstrap.Modal(modalEl).show(); }catch(_){ /* ignore */ }
}

// Build history table HTML for teacher modal
function buildHistoryTableTeacher(list, skillContext){
    if(!Array.isArray(list) || list.length===0){
        return '<p class="text-muted">Chưa có lịch sử.</p>';
    }
    let rows = list.map(h=>{
        let at = '';
        if(h.gradedAt){
            const dt = new Date(h.gradedAt).toLocaleString();
            // Split at comma and join with <br>
            const parts = dt.split(',');
            at = parts.length > 1 ? `${parts[0]}<br>${parts[1].trim()}` : dt;
        }
        const score = formatHistoryScoreTeacher(skillContext, h.score);
        const fb = h.feedback ? String(h.feedback).replace(/</g,'&lt;') : '';
        const grader = resolveGraderDisplayTeacher(h);
        return `<tr><td>${at}</td><td>${score}</td><td style='white-space:pre-line;word-break:break-word;'>${fb}</td><td style='white-space:nowrap;min-width:160px;'>${grader}</td></tr>`;
    }).join('');
    return `<table class='table table-sm table-bordered mb-2'><thead><tr><th style='min-width:140px;white-space:nowrap;'>Thời gian</th><th>Điểm</th><th>Nhận xét</th><th style='min-width:160px;white-space:nowrap;'>Người chấm</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function formatHistoryScoreTeacher(skillContext, rawScore){
    const skill = String(skillContext||'').toUpperCase();
    if(skill==='READING' || skill==='LISTENING'){
        const num = Number(rawScore);
        if(!Number.isNaN(num)){
            if(num===1) return 'Đúng';
            if(num===0) return 'Sai';
        }
        return rawScore ?? '';
    }
    return rawScore ?? '';
}

// Grader display resolution function for teacher history modals
function resolveGraderDisplayTeacher(h){
    // Try direct name fields first
    if(h.graderName) return h.graderName;
    // Try nested grader object
    if(h.grader && (h.grader.fullName || h.grader.username || h.grader.email)){
        return h.grader.fullName || h.grader.username || h.grader.email;
    }
    return '';
}

//# Teacher-specific code changes

// Ensure token is available when loaded from teacher pages
var token = typeof token !== 'undefined' ? token : (localStorage.getItem('token') || sessionStorage.getItem('token'));

// Global state for results & current tab filter
window.allResults = window.allResults || [];
window.currentTabFilter = window.currentTabFilter || 'ALL'; // ALL | PENDING | GRADED

// Helper: try admin endpoint, if 403 then fallback to teacher endpoint
async function fetchWithTeacherFallback(adminUrl, teacherUrl, options){
    let res;
    try { res = await fetch(adminUrl, options); } catch(e){ return { error:true, status:0, body:'Network error' }; }
    if(res.status === 403){
        try { const resTeacher = await fetch(teacherUrl, options); return { response: resTeacher, from:'teacher' }; }
        catch(e){ return { error:true, status:0, body:'Network error' }; }
    }
    return { response: res, from:'admin' };
}

// Helper: determine if a result is pending grading
function isPendingResult(item) {
    if (!item || !item.result) return false;
    var pendingCount = 0;
    // Writing pending
    if (item.writingPending && item.writingPending > 0) pendingCount++;
    // Any band null but exam has that skill attempted
    var hasAnyBand = item.finalWritingBand != null || item.readingBand != null || item.listeningBand != null || item.speakingBand != null;
    var hasNullBand = item.finalWritingBand == null || item.readingBand == null || item.listeningBand == null || item.speakingBand == null;
    if (hasAnyBand && hasNullBand) pendingCount++;
    return pendingCount > 0;
}

// Helper: determine if a result is fully graded
function isGradedResult(item) {
    if (!item || !item.result) return false;
    // If has any skill, require all non-null and no writing pending
    var hasAnyBand = item.finalWritingBand != null || item.readingBand != null || item.listeningBand != null || item.speakingBand != null;
    if (!hasAnyBand) return false;
    if (item.writingPending && item.writingPending > 0) return false;
    if (item.finalWritingBand == null || item.readingBand == null || item.listeningBand == null || item.speakingBand == null) return false;
    return true;
}

// Render table rows for a given list and (re)init DataTable
function renderResultTable(list) {
    var tbody = document.getElementById('listresult');
    if (!tbody) return;
    // Destroy DataTable safely
    if (window.$ && $.fn.DataTable && $.fn.DataTable.isDataTable('#example')) {
        $('#example').DataTable().destroy();
    }
    var main = '';
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        var writingInfo = '';
        var actionCol = '';
        // Remove bands W/R/L/S and overall display
        // var bands = []; ...existing code building bands...
        // var overallText = ''; ...existing code...
        // ...existing code...
        if (item.writingPending != null) {
            writingInfo = '';
            var skills = new Set();
            if (item.result && item.result.exam && Array.isArray(item.result.exam.lessons)) {
                item.result.exam.lessons.forEach(l => {
                    if (l.skill) skills.add(String(l.skill).toUpperCase());
                });
            }
            actionCol = "<div class='row row-cols-2 g-1'>";
            if (skills.has('READING')) {
                actionCol += "<div class='col'><button id='btn-skill-reading-"+item.result.id+"' class='btn btn-sm w-100 btn-skill btn-skill-reading btn-grade-reading' data-skill='READING' data-result='" + item.result.id + "' style='white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background-color:#95e1d3;border-color:#95e1d3;color:white;font-weight:bold' title='Reading'>R</button></div>";
            }
            if (skills.has('LISTENING')) {
                actionCol += "<div class='col'><button id='btn-skill-listening-"+item.result.id+"' class='btn btn-sm w-100 btn-skill btn-skill-listening btn-grade-listening' data-skill='LISTENING' data-result='" + item.result.id + "' style='white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background-color:#4ecdc4;border-color:#4ecdc4;color:white;font-weight:bold' title='Listening'>L</button></div>";
            }
            if (skills.has('SPEAKING')) {
                actionCol += "<div class='col'><button id='btn-skill-speaking-"+item.result.id+"' class='btn btn-sm w-100 btn-skill btn-skill-speaking btn-grade-speaking' data-skill='SPEAKING' data-result='" + item.result.id + "' style='white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background-color:#feca57;border-color:#feca57;color:white;font-weight:bold' title='Speaking'>S</button></div>";
            }
            if (skills.has('WRITING')) {
                actionCol += "<div class='col'><button id='btn-skill-writing-"+item.result.id+"' class='btn btn-sm w-100 btn-skill btn-skill-writing btn-grade-writing' data-skill='WRITING' data-result='" + item.result.id + "' style='white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background-color:#ff6b6b;border-color:#ff6b6b;color:white;font-weight:bold' title='Writing'>W</button></div>";
            }
            actionCol += "</div>";
        }
        var bandsHtml = '';
        main += '<tr>' +
            '<td>' + item.result.user.fullName + '<br>' + item.result.user.email + writingInfo + bandsHtml + '</td>' +
            '<td>' + item.tongCauHoi + '</td>' +
            '<td>' + item.soTLSai + '</td>' +
            '<td>' + item.soTLDung + '</td>' +
            '<td>' + item.phanTram.toFixed(2) + '%</td>' +
            "<td class='text-center'>" + actionCol + '</td>' +
            '</tr>';
    }
    tbody.innerHTML = main || '<tr><td colspan="6" class="text-center text-muted">Không có dữ li��u.</td></tr>';
    // Ẩn nút skill không có trong exam
    setTimeout(()=>{
        for (var i = 0; i < list.length; i++) {
            ensureSkillButtonsVisibilityTeacher(list[i].result.id);
        }
    }, 0);
    if (window.$ && $.fn.DataTable) {
        var dt = $('#example').DataTable({
            language: {
                emptyTable: 'Không có dữ liệu',
                zeroRecords: 'Không tìm thấy kết quả phù hợp',
                infoEmpty: 'Không có dữ liệu',
                search: 'Tìm kiếm:',
                lengthMenu: 'Hiển thị _MENU_ dòng',
                info: 'Hiển thị _START_ đến _END_ trong tổng _TOTAL_ dòng',
                paginate: { first: 'Đầu', last: 'Cuối', next: 'Sau', previous: 'Trước' }
            }
        });
        // luôn về trang đầu khi đổi tab
        try { dt.page(0).draw('page'); } catch (e) {}
    }
}

// Apply current tab filter and render
function applyResultFilterAndRender() {
    var filter = window.currentTabFilter || 'ALL';
    var all = window.allResults || [];
    var filtered;
    if (filter === 'PENDING') {
        filtered = all.filter(isPendingResult);
    } else if (filter === 'GRADED') {
        filtered = all.filter(isGradedResult);
    } else {
        filtered = all;
    }
    renderResultTable(filtered);
}

async function loadResult() {
    // Destroy DataTable safely
    if (window.$ && $.fn.DataTable && $.fn.DataTable.isDataTable('#example')) {
        $('#example').DataTable().destroy();
    }
    var tbody = document.getElementById('listresult');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Đang tải...</td></tr>';
    }
    var exam = new URL(document.URL).searchParams.get('exam');
    var adminUrl = '/api/result/admin/find-by-exam?examId=' + exam;
    var teacherUrl = '/api/result/teacher/find-by-exam?examId=' + exam;
    var wrapper = await fetchWithTeacherFallback(adminUrl, teacherUrl, { method: 'GET', headers: new Headers({ 'Authorization': 'Bearer ' + token }) });
    if (wrapper.error) {
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Lỗi mạng khi tải dữ liệu.</td></tr>';
        }
        return;
    }
    var response = wrapper.response;
    if (!response.ok){
        let msg=''; try{ msg = await response.text(); }catch(e){}
        const isBadReq = response.status === 400;
        const isForbidden = response.status === 403;
        const userMsg = isForbidden
            ? 'Không có quyền truy cập dữ liệu này (403). Vui lòng kiểm tra quyền giáo viên hoặc đăng nhập lại.'
            : (isBadReq
                ? 'Yêu cầu không hợp lệ. Vui lòng kiểm tra tham số bài thi.'
                : ('Không tải được dữ liệu (mã: '+response.status+').'));
        if(tbody){ tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${userMsg}</td></tr>`; }
        // Re-init DataTable to keep table structure usable
        if(window.$ && $.fn.DataTable){
            $('#example').DataTable({
                language: {
                    emptyTable: "Không có dữ liệu",
                    zeroRecords: "Không tìm thấy kết quả phù hợp",
                    infoEmpty: "Không có dữ liệu",
                    search: "Tìm kiếm:",
                    lengthMenu: "Hiển thị _MENU_ dòng",
                    info: "Hiển thị _START_ đến _END_ trong tổng _TOTAL_ dòng",
                    paginate: { first: "Đầu", last: "Cuối", next: "Sau", previous: "Trước" }
                }
            });
        }
        return;
    }
    var list = [];
    try { list = await response.json(); } catch(e){ list = []; }
    window.allResults = list || [];
    applyResultFilterAndRender();
}

function openWriting(resultId) {
    window.currentResultId = resultId;
    // default show modal and load into tabs
    $('#writingModal').modal('show');
    // Chuyển tab về "Tất cả" khi mở modal
    const tabAll = document.querySelector('#writingTabAll');
    if (tabAll) {
        tabAll.click();
    }
    loadWritingAnswers(resultId);
}

async function loadWritingAnswers(resultId) {
    const adminUrl = '/api/result/admin/writing/by-result?resultId=' + resultId;
    const teacherUrl = '/api/result/teacher/writing/by-result?resultId=' + resultId;
    const w = await fetchWithTeacherFallback(adminUrl, teacherUrl, { headers: new Headers({'Authorization': 'Bearer ' + token})});
    if(w.error){
        const elP = document.getElementById('writingListPending');
        const elG = document.getElementById('writingListGraded');
        const elA = document.getElementById('writingListAll');
        if(elP) elP.innerHTML = '<div class="alert alert-danger">Lỗi mạng</div>';
        if(elG) elG.innerHTML = '';
        if(elA) elA.innerHTML = '';
        return;
    }
    var response = w.response;
    var list = await response.json();
    window.currentWritingAnswers = list || [];
    const pending = window.currentWritingAnswers.filter(w => !w.graded);
    const graded  = window.currentWritingAnswers.filter(w =>  w.graded);
    function cardHtml(w){
        const answerText = getGenericAnswerText(w);
        const safe = (answerText || '').replace(/</g,'&lt;');
        return `<div class='card mb-2'><div class='card-body'>
            <p><strong>Câu hỏi #${w.questionId || ''}</strong> - ${w.questionTitle || ''}</p>
            <div class='mb-1'><strong>Trả lời học viên:</strong></div>
            <div style='white-space:pre-line' class='p-2 border bg-light'>${safe}</div>
            <p>${w.graded ? '<span class="badge bg-success">Đã chấm</span>' : '<span class="badge bg-warning text-dark">Chưa chấm</span>'}
            ${`<p id='writing_current_${w.id}'>Điểm hiện tại: ${w.manualScore ?? '-'}<br>Nhận xét hiện tại: ${(w.feedback || '')}</p>`}
            </p>
            <div class='row g-2 align-items-center mt-2 card-grade-inputs'>
                <div class='col-auto'><input type='number' min='0' max='9' step='1' class='form-control form-control-sm score-input' data-field='score' data-result-exam='${w.id}' placeholder='Điểm (0-9)' value='${w.manualScore ?? ''}'></div>
                <div class='col'><textarea class='form-control form-control-sm feedback-input' data-field='feedback' data-result-exam='${w.id}' placeholder='Nhận xét' rows='2'>${w.feedback ?? ''}</textarea></div>
                <div class='col-auto d-flex gap-2'>
                  <button class='btn btn-sm btn-primary' onclick='gradeWriting(${w.id}, this)'>${w.graded ? 'Chấm lại' : 'Chấm'}</button>
                  <button class='btn btn-sm btn-outline-secondary' onclick='openHistory("WRITING", ${w.id})'>Lịch sử</button>
                </div>
            </div>
        </div></div>`;
    }
    const elPending = document.getElementById('writingListPending');
    const elGraded  = document.getElementById('writingListGraded');
    const elAll     = document.getElementById('writingListAll');
    if(elPending){ elPending.innerHTML = pending.length ? pending.map(cardHtml).join('') : '<div class="alert alert-info">Không có bài chờ chấm.</div>'; }
    if(elGraded) { elGraded.innerHTML  = graded.length ? graded.map(cardHtml).join('')  : '<div class="alert alert-secondary">Chưa có bài đã chấm.</div>'; }
    if(elAll)    { elAll.innerHTML     = window.currentWritingAnswers.length ? window.currentWritingAnswers.map(cardHtml).join('') : '<div class="alert alert-info">Không có bài viết.</div>'; }
}

async function gradeWriting(id, btn) {
    var scoreInput = null;
    var fbInput = null;
    if (btn && typeof btn.closest === 'function') {
        var card = btn.closest('.card-grade-inputs') || btn.closest('.card');
        if (card) {
            scoreInput = card.querySelector("[data-field='score'][data-result-exam='" + id + "']");
            fbInput = card.querySelector("[data-field='feedback'][data-result-exam='" + id + "']");
        }
    }
    if (!scoreInput) { scoreInput = document.getElementById('score_' + id); }
    if (!fbInput) { fbInput = document.getElementById('fb_' + id); }
    var score = scoreInput ? scoreInput.value : '';
    var fb = fbInput ? fbInput.value : '';
    if (score === '' || score < 0 || score > 9) { toastr.error('Điểm không hợp lệ (0-9)'); return; }
    const adminUrl = '/api/result/admin/writing/grade?id=' + id + '&score=' + score + '&feedback=' + encodeURIComponent(fb);
    const teacherUrl = '/api/result/teacher/writing/grade?id=' + id + '&score=' + score + '&feedback=' + encodeURIComponent(fb);
    const w = await fetchWithTeacherFallback(adminUrl, teacherUrl, { method: 'POST', headers: new Headers({'Authorization': 'Bearer ' + token})});
    const response = w.response;
    if (response && response.status < 300) {
        toastr.success('Đã chấm');
        // Cập nhật ngay điểm và nhận xét hiển thị
        const elCurrent = document.getElementById('writing_current_' + id);
        if(elCurrent){
            elCurrent.innerHTML = `Điểm hiện tại: ${score}<br>Nhận xét hiện tại: ${fb}`;
        }
        // cũng cập nhật lại giá trị trong input
        if(scoreInput) scoreInput.value = score;
        if(fbInput) fbInput.value = fb;
        loadWritingAnswers(window.currentResultId);
        loadResult();
    } else {
        try { var err = await response.json(); toastr.error(err?.defaultMessage || 'Lỗi'); } catch(e){ toastr.error('Lỗi'); }
    }
}

// Speaking grading functions
function openSpeaking(resultId) {
    window.currentResultId = resultId;
    $('#speakingModal').modal('show');
    loadSpeakingAnswers(resultId);
}

async function loadSpeakingAnswers(resultId) {
    const adminUrl = '/api/result/admin/speaking/by-result?resultId=' + resultId;
    const teacherUrl = '/api/result/teacher/speaking/by-result?resultId=' + resultId;
    const w = await fetchWithTeacherFallback(adminUrl, teacherUrl, { headers: new Headers({'Authorization': 'Bearer ' + token})});
    if(w.error){
        const elP = document.getElementById('speakingListPending');
        const elG = document.getElementById('speakingListGraded');
        const elA = document.getElementById('speakingListAll');
        if(elP) elP.innerHTML = '<div class="alert alert-danger">Lỗi mạng</div>';
        if(elG) elG.innerHTML = '';
        if(elA) elA.innerHTML = '';
        return;
    }
    const response = w.response;
    var list = await response.json();
    window.currentSpeakingAnswers = list || [];

    // Split into pending and graded lists
    const pending = window.currentSpeakingAnswers.filter(s => !s.graded);
    const graded  = window.currentSpeakingAnswers.filter(s =>  s.graded);

    function cardHtml(s){
        const promptAudio = s.questionLinkAudio || (s.question && (s.question.link_audio || s.question.linkAudio)) || s.linkAudio || '';
        const promptAudioBlock = promptAudio
            ? `<div class='mb-2'><small class='text-muted d-block'>Audio đề:</small><audio class='mt-1' controls style='width:100%; display:block;'><source src='${promptAudio}' type='audio/mpeg'>Trình duyệt không hỗ trợ.</audio></div>`
            : `<div class='mb-2'><small class='text-muted d-block'>Audio đề:</small><em class='text-muted'>Không có</em></div>`;
        const studentAudioBlock = s.cloudinaryUrl
            ? `<div class='mb-2'><small class='text-muted d-block'>Audio học viên:</small><audio class='mt-1' controls style='width:100%; display:block;'><source src='${s.cloudinaryUrl}' type='audio/mpeg'>Trình duyệt không hỗ trợ.</audio></div>`
            : '<p class="text-muted">Không có audio học viên</p>';
        const statusBadge = s.graded ? '<span class="badge bg-success">Đã chấm</span>' : '<span class="badge bg-warning text-dark">Chưa chấm</span>';
        return `<div class='card mb-2'><div class='card-body'>
            <p><strong>Câu hỏi #${s.questionId || 'N/A'}</strong> - ${s.questionTitle || 'Speaking submission'} ${statusBadge}</p>
            ${promptAudioBlock}
            ${studentAudioBlock}
            ${s.transcript ? `<p class="small"><strong>Transcript:</strong> ${String(s.transcript).replace(/</g,'&lt;')}</p>` : ''}
            ${s.graded ? `<p id='speaking_current_${s.id}'>Điểm hiện tại: ${s.score ?? '-'}<br>Nhận xét hiện tại: ${(s.feedback || '')}</p>` : ''}
            <div class='row g-2 align-items-center mt-2 card-grade-inputs'>
                <div class='col-auto'><input type='number' min='0' max='9' step='0.5' class='form-control form-control-sm score-input' data-field='score' data-submission-id='${s.id}' placeholder='Điểm (0-9)' value='${s.score ?? ''}'></div>
                <div class='col'><textarea class='form-control form-control-sm feedback-input' data-field='feedback' data-submission-id='${s.id}' placeholder='Nhận xét' rows='2'>${s.feedback ?? ''}</textarea></div>
                <div class='col-auto d-flex gap-2'>
                  <button class='btn btn-sm btn-primary' onclick='gradeSpeaking(${s.id}, this)'>${s.graded ? 'Chấm lại' : 'Chấm'}</button>
                  <button class='btn btn-sm btn-outline-secondary' onclick='openHistorySpeaking(${s.id})'>Lịch sử</button>
                </div>
            </div>
        </div></div>`;
    }

    // Populate each tab
    const elPending = document.getElementById('speakingListPending');
    const elGraded  = document.getElementById('speakingListGraded');
    const elAll     = document.getElementById('speakingListAll');

    if(elPending){ elPending.innerHTML = pending.length ? pending.map(cardHtml).join('') : '<div class="alert alert-info">Không có bài chờ chấm.</div>'; }
    if(elGraded) { elGraded.innerHTML  = graded.length ? graded.map(cardHtml).join('')  : '<div class="alert alert-secondary">Chưa có bài đã chấm.</div>'; }
    if(elAll)    { elAll.innerHTML     = window.currentSpeakingAnswers.length ? window.currentSpeakingAnswers.map(cardHtml).join('') : '<div class="alert alert-info">Không có bài nói.</div>'; }
}

async function gradeSpeaking(id, btn) {
    var scoreInput = null;
    var fbInput = null;
    if (btn && typeof btn.closest === 'function') {
        var card = btn.closest('.card-grade_inputs') || btn.closest('.card');
        if (card) {
            scoreInput = card.querySelector("[data-field='score'][data-submission-id='" + id + "']");
            fbInput = card.querySelector("[data-field='feedback'][data-submission-id='" + id + "']");
        }
    }
    if (!scoreInput) { scoreInput = document.getElementById('score_sp_' + id); }
    if (!fbInput) { fbInput = document.getElementById('fb_sp_' + id); }
    var score = scoreInput ? scoreInput.value : '';
    var fb = fbInput ? fbInput.value : '';
    if (score === '' || score < 0 || score > 9) { toastr.error('Điểm không hợp lệ (0-9)'); return; }
    const adminUrl = '/api/result/admin/speaking/grade?id=' + id + '&score=' + score + '&feedback=' + encodeURIComponent(fb);
    const teacherUrl = '/api/result/teacher/speaking/grade?id=' + id + '&score=' + score + '&feedback=' + encodeURIComponent(fb);
    const w = await fetchWithTeacherFallback(adminUrl, teacherUrl, { method: 'POST', headers: new Headers({'Authorization': 'Bearer ' + token})});
    const response = w.response;
    if (response && response.status < 300) {
        toastr.success('Đã chấm bài speaking');
        // immediate UI update
        const elCur = document.getElementById('speaking_current_' + id);
        if(elCur){ elCur.innerHTML = `Điểm hiện tại: ${score}<br>Nhận xét hiện tại: ${fb}`; }
        // also update inputs to reflect saved values
        if(scoreInput) scoreInput.value = score;
        if(fbInput) fbInput.value = fb;
        loadSpeakingAnswers(window.currentResultId);
        loadResult();
    } else {
        try { var err = await response.json(); toastr.error(err?.defaultMessage || 'Lỗi'); } catch(e){ toastr.error('Lỗi'); }
    }
}

// Reading grading functions (teacher dùng full answer text)
function openReading(resultId) {
    window.currentResultId = resultId;
    try {
        if (typeof openSkillModal === 'function') {
            openSkillModal(resultId, 'READING');
            return;
        }
    } catch (e) {}
    $('#readingModal').modal('show');
    loadReadingAnswers(resultId);
}

// Helper giống admin: xác định MCQ
function isMcqItem(item) {
    const hasChoice = !!item.selectedAnswerId || !!(item.answer && item.answer.id);
    const hasText = !!(item.answerText && String(item.answerText).trim().length > 0);
    const hasAudio = !!(item.userAudio || item.speakingAudio);
    const qt = String(item?.questionType ?? item?.question?.type ?? item?.question?.questionType ?? '').toUpperCase();
    const explicitMcq = qt === 'MCQ' || qt.includes('MULTI') || qt.includes('CHOICE');
    return (explicitMcq || hasChoice) && !hasText && !hasAudio;
}
function isCorrectMcq(item){
    try{
        if(item?.isCorrect === true) return true;
        if(item?.isCorrect === false) return false;
        if(item?.answer && typeof item.answer.isTrue === 'boolean') return item.answer.isTrue === true;
        const opts = item?.options || item?.answers || item?.question?.answers || [];
        if(item?.selectedAnswerId && Array.isArray(opts)){
            const match = opts.find(o=> (o.id===item.selectedAnswerId) || (''+o.id === ''+item.selectedAnswerId));
            if(match && typeof match.isTrue === 'boolean') return match.isTrue === true;
        }
        if(Array.isArray(opts) && item?.userAnswer){
            const correct = opts.find(o=> o.isTrue===true);
            if(correct){ return (String(item.userAnswer).trim() === String(correct.content??correct.title??'').trim()); }
        }
    }catch(e){}
    return null;
}

// Generic helper to get best-effort textual answer for non-speaking skills
function getGenericAnswerText(item){
    if(item && item.answerText != null && String(item.answerText).trim().length > 0){
        return String(item.answerText);
    }
    if(item && item.userAnswer != null && String(item.userAnswer).trim().length > 0){
        return String(item.userAnswer);
    }
    if(item && item.answer){
        const opt = item.answer.content ?? item.answer.title ?? item.answerText;
        if(opt != null && String(opt).trim().length > 0){
            return String(opt);
        }
    }
    return '';
}

function getReadingAnswerText(item){
    return getGenericAnswerText(item);
}

async function loadReadingAnswers(resultId) {
    const adminUrl   = '/api/result/admin/reading/by-result?resultId=' + resultId;
    const teacherUrl = '/api/result/teacher/reading/by-result?resultId=' + resultId;
    const w = await fetchWithTeacherFallback(adminUrl, teacherUrl, { headers: new Headers({'Authorization': 'Bearer ' + token})});
    const elP = document.getElementById('readingListPending');
    const elG = document.getElementById('readingListGraded');
    const elA = document.getElementById('readingList'); // FIX: match HTML id
    if(w.error){
        if(elP) elP.innerHTML = '<div class="alert alert-danger">Lỗi mạng</div>';
        if(elG) elG.innerHTML = '';
        if(elA) elA.innerHTML = '';
        return;
    }
    const response = w.response;
    var list = await response.json();
    window.currentReadingAnswers = list || [];
    const pending = window.currentReadingAnswers.filter(r => !r.graded && !isMcqItem(r));
    const graded  = window.currentReadingAnswers.filter(r =>  r.graded || isMcqItem(r));
    function cardHtml(r){
        const isMcq = isMcqItem(r);
        const correctness = isMcq ? isCorrectMcq(r) : null;
        const correctnessBadge = (correctness===true)
            ? " <span class='badge bg-success'>Đúng</span>"
            : (correctness===false)
                ? " <span class='badge bg-danger'>Sai</span>"
                : '';
        const answerText = getGenericAnswerText(r);
        const safe = (answerText || '').replace(/</g,'&lt;');
        const answerBlock = isMcq
            ? (answerText
                ? `<span class='badge bg-secondary me-1'>MCQ</span>${safe}${r.selectedAnswerId ? `<small class='text-muted'>(answers_id: ${r.selectedAnswerId})</small>` : ''}${correctnessBadge}`
                : '<em>Không có câu trả lời</em>')
            : (answerText
                ? safe
                : '<em>Không có câu trả lời</em>');
        const displayGraded = r.graded || isMcq;
        const controlRow = isMcq
            ? '<div class="text-muted small">Trắc nghiệm sẽ được tự động chấm.</div>'
            : `<div class='row g-2 align-items-center mt-2'>
               <div class='col-auto'>
                  <select id='ok_rd_${r.id}' class='form-select form-select-sm'>
                    <option value='1'>Đúng</option>
                    <option value='0'>Sai</option>
                  </select>
                </div>
                <div class='col'><textarea id='fb_rd_${r.id}' class='form-control form-control-sm' placeholder='Nhận xét' rows='2'>${r.feedback ?? ''}</textarea></div>
                <div class='col-auto d-flex gap-2'>
                    <button class='btn btn-sm btn-primary' onclick='gradeReading(${r.id})'>${displayGraded ? 'Chấm lại' : 'Lưu'}</button>
                    <button class='btn btn-sm btn-outline-secondary' onclick='openHistory("READING", ${r.id})'>Lịch sử</button>
                </div>
            </div>`;
        return `<div class='card mb-2'><div class='card-body'>
            <p><strong>Câu hỏi #${r.questionId || 'N/A'}</strong> - ${r.questionTitle || ''}</p>
            <p><strong>Câu trả lời:</strong> ${answerBlock}</p>
            <p>${displayGraded ? '<span class="badge bg-success">Đã chấm</span>' : '<span class="badge bg-warning text-dark">Chưa chấm</span>'}</p>
            ${displayGraded ? `<p id='reading_current_${r.id}'>Kết quả hiện tại: ${(r.score !== false && r.score != null) ? (r.score>0? 'Đúng':'Sai') : '-'}<br>Nhận xét hiện tại: ${(r.feedback && r.feedback !== false ? r.feedback : '')}</p>` : ''}
            ${controlRow}
         </div></div>`;
    }
    if(elP){ elP.innerHTML = pending.length ? pending.map(cardHtml).join('') : '<div class="alert alert-info">Không có câu chờ chấm.</div>'; }
    if(elG){ elG.innerHTML  = graded.length ? graded.map(cardHtml).join('')  : '<div class="alert alert-secondary">Chưa có bài đã chấm.</div>'; }
    if(elA){ elA.innerHTML  = window.currentReadingAnswers.length ? window.currentReadingAnswers.map(cardHtml).join('') : '<div class="alert alert-info">Không có câu hỏi Reading.</div>'; }
}
async function gradeReading(id) {
    var okEl = document.getElementById('ok_rd_' + id);
    var fb = (document.getElementById('fb_rd_' + id)?.value || '').trim();
    if (!okEl) { toastr.error('Thiếu lựa chọn Đúng/Sai'); return; }
    var score = okEl.value === '1' ? 1 : 0;
    const adminUrl = '/api/result/admin/reading/grade?id=' + id + '&score=' + score + '&feedback=' + encodeURIComponent(fb);
    const teacherUrl = '/api/result/teacher/reading/grade?id=' + id + '&score=' + score + '&feedback=' + encodeURIComponent(fb);
    const w = await fetchWithTeacherFallback(adminUrl, teacherUrl, { method: 'POST', headers: new Headers({'Authorization': 'Bearer ' + token})});
    const response = w.response;
    if (response && response.status < 300) {
        toastr.success('Đã lưu kết quả Reading');
        const elCur = document.getElementById('reading_current_' + id);
        if(elCur){ elCur.innerHTML = `Kết quả hiện tại: ${score>0?'Đúng':'Sai'}<br>Nhận xét hiện tại: ${fb}`; }
        loadReadingAnswers(window.currentResultId);
        loadResult();
    } else {
        try { var err = await response.json(); toastr.error(err?.defaultMessage || 'Lỗi'); } catch(e){ toastr.error('Lỗi'); }
    }
}

// Listening grading functions – áp dụng giống admin, đã có audio + MCQ
function openListening(resultId) {
    window.currentResultId = resultId;
    try {
        if (typeof openSkillModal === 'function') {
            openSkillModal(resultId, 'LISTENING');
            return;
        }
    } catch (e) {}
    $('#listeningModal').modal('show');
    loadListeningAnswers(resultId);
}

async function loadListeningAnswers(resultId) {
    const adminUrl   = '/api/result/admin/listening/by-result?resultId=' + resultId;
    const teacherUrl = '/api/result/teacher/listening/by-result?resultId=' + resultId;
    const w = await fetchWithTeacherFallback(adminUrl, teacherUrl, { headers: new Headers({'Authorization': 'Bearer ' + token})});
    const elP = document.getElementById('listeningListPending');
    const elG = document.getElementById('listeningListGraded');
    const elA = document.getElementById('listeningListAll');
    if(w.error){
        if(elP) elP.innerHTML = '<div class="alert alert-danger">Lỗi mạng</div>';
        if(elG) elG.innerHTML = '';
        if(elA) elA.innerHTML = '';
        return;
    }
    const response = w.response;
    var list = await response.json();
    window.currentListeningAnswers = list || [];
    const pending = window.currentListeningAnswers.filter(l => !l.graded && !isMcqItem(l));
    const graded  = window.currentListeningAnswers.filter(l =>  l.graded || isMcqItem(l));
    function cardHtml(l){
        const isMcq = isMcqItem(l);
        const correctness = isMcq ? isCorrectMcq(l) : null;
        const correctnessBadge = (correctness===true)
            ? " <span class='badge bg-success'>Đúng</span>"
            : (correctness===false)
                ? " <span class='badge bg-danger'>Sai</span>"
                : '';
        const answerText = getGenericAnswerText(l);
        const safe = (answerText || '').replace(/</g,'&lt;');
        const answerBlock = isMcq
            ? (answerText
                ? `<span class='badge bg-secondary'>MCQ</span> ${safe} ${l.selectedAnswerId ? `<small class='text-muted'>(answers_id: ${l.selectedAnswerId})</small>` : ''}${correctnessBadge}`
                : '<em>Không có câu trả lời</em>')
            : (answerText
                ? safe
                : '<em>Không có câu trả lời</em>');
        const displayGraded = l.graded || isMcq;
        const controlRow = isMcq
            ? '<div class="text-muted small">Trắc nghiệm sẽ được tự động chấm.</div>'
            : `<div class='row g-2 align-items-center mt-2'>
               <div class='col-auto'>
                  <select id='ok_ls_${l.id}' class='form-select form-select-sm'>
                    <option value='1'>Đúng</option>
                    <option value='0'>Sai</option>
                  </select>
                </div>
                <div class='col'><textarea id='fb_ls_${l.id}' class='form-control form-control-sm' placeholder='Nhận xét' rows='2'>${l.feedback ?? ''}</textarea></div>
                <div class='col-auto d-flex gap-2'>
                    <button class='btn btn-sm btn-primary' onclick='gradeListening(${l.id})'>${displayGraded ? 'Chấm lại' : 'Lưu'}</button>
                    <button class='btn btn-sm btn-outline-secondary' onclick='openHistory("LISTENING", ${l.id})'>Lịch sử</button>
                </div>
            </div>`;
        return `<div class='card mb-2'><div class='card-body'>
            <p><strong>Câu hỏi #${l.questionId || 'N/A'}</strong> - ${l.questionTitle || ''}</p>
            <p><strong>Đáp án học viên:</strong> ${answerBlock}</p>
            <p>${displayGraded ? '<span class="badge bg-success">Đã chấm</span>' : '<span class="badge bg-warning text-dark">Chưa chấm</span>'}</p>
            ${displayGraded ? `<p id='listening_current_${l.id}'>Kết quả hiện tại: ${(l.score !== false && l.score != null) ? (l.score>0? 'Đúng':'Sai') : '-'}<br>Nhận xét hiện tại: ${(l.feedback && l.feedback !== false ? l.feedback : '')}</p>` : ''}
            ${controlRow}
         </div></div>`;
    }
    if(elP){ elP.innerHTML = pending.length ? pending.map(cardHtml).join('') : '<div class="alert alert-info">Không có câu chờ chấm.</div>'; }
    if(elG){ elG.innerHTML  = graded.length ? graded.map(cardHtml).join('')  : '<div class="alert alert-secondary">Chưa có bài đã chấm.</div>'; }
    if(elA){ elA.innerHTML  = window.currentListeningAnswers.length ? window.currentListeningAnswers.map(cardHtml).join('') : '<div class="alert alert-info">Không có câu hỏi Listening.</div>'; }
    // Khởi tạo audio giống admin
    initAudioPlayersTeacher('listeningListPending');
    initAudioPlayersTeacher('listeningListGraded');
    initAudioPlayersTeacher('listeningListAll');
}
async function gradeListening(id) {
    var okEl = document.getElementById('ok_ls_' + id);
    var fb = (document.getElementById('fb_ls_' + id)?.value || '').trim();
    if (!okEl) { toastr.error('Thiếu lựa chọn Đúng/Sai'); return; }
    var score = okEl.value === '1' ? 1 : 0;
    const adminUrl = '/api/result/admin/listening/grade?id=' + id + '&score=' + score + '&feedback=' + encodeURIComponent(fb);
    const teacherUrl = '/api/result/teacher/listening/grade?id=' + id + '&score=' + score + '&feedback=' + encodeURIComponent(fb);
    const w = await fetchWithTeacherFallback(adminUrl, teacherUrl, { method: 'POST', headers: new Headers({'Authorization': 'Bearer ' + token})});
    const response = w.response;
    if (response && response.status < 300) {
        toastr.success('Đã lưu kết quả Listening');
        const elCur = document.getElementById('listening_current_' + id);
        if(elCur){ elCur.innerHTML = `Kết quả hiện tại: ${score>0?'Đúng':'Sai'}<br>Nhận xét hiện tại: ${fb}`; }
        loadListeningAnswers(window.currentResultId);
        loadResult();
    } else {
        try { var err = await response.json(); toastr.error(err?.defaultMessage || 'Lỗi'); } catch(e){ toastr.error('Lỗi'); }
    }
}

// Init tab click handlers after DOM is ready (CHỈ ĐỊNH NGHĨA 1 LẦN)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initResultTabs);
} else {
    initResultTabs();
}

function initResultTabs() {
    var container = document.getElementById('resultTabs');
    if (!container) return;
    container.addEventListener('click', function (e) {
        var target = e.target;
        if (target.tagName !== 'BUTTON' && target.tagName !== 'A') return;
        var filter = target.getAttribute('data-filter');
        if (!filter) return;
        e.preventDefault();
        window.currentTabFilter = filter;
        var links = container.querySelectorAll('.nav-link');
        links.forEach(function (el) { el.classList.remove('active'); });
        target.classList.add('active');
        applyResultFilterAndRender();
    });
}

// Utility: normalize audio src (same style as admin)
function normalizeAudioSrcTeacher(src){
    if(!src) return src;
    const t = String(src).trim();
    if(/^https?:\/\//i.test(t)) return t;
    if(t.startsWith('/')) return t;
    return '/' + t.replace(/^\/+/, '');
}

// Utility: load audio via fetch with Authorization if same-origin path/API
async function loadBlobAudioToPlayerTeacher(audioEl){
    try{
        let src = audioEl?.dataset?.audioSrc;
        const fallbackId = audioEl?.dataset?.fallbackAudioId;
        if(!src && fallbackId){
            src = '/api/speaking/audio/' + fallbackId;
            audioEl.dataset.audioSrc = src;
        }
        if(!src) return;
        const isAbsolute = /^https?:\/\//i.test(src);
        const isApiOrSameOrigin = !isAbsolute && (src.startsWith('/') || src.startsWith('/api/'));
        let ok=false;
        if(isApiOrSameOrigin){
            try{
                const resp = await fetch(src, { headers: new Headers({ 'Authorization':'Bearer '+token })});
                if(resp.ok){
                    const blob = await resp.blob();
                    audioEl.src = URL.createObjectURL(blob);
                    audioEl.load();
                    ok=true;
                }
            }catch(e){ /* ignore */ }
        }
        if(!ok){
            audioEl.src = src;
            audioEl.load();
        }
    }catch(e){ /* ignore */ }
}
function initAudioPlayersTeacher(container){
    const node = (typeof container==='string') ? document.getElementById(container) : container;
    if(!node) return;
    const players = node.querySelectorAll('audio[data-audio-src]');
    players.forEach(p=>{ loadBlobAudioToPlayerTeacher(p); });
}

// History viewer using existing endpoints and a shared modal in ketqua.html
function openHistory(skill, resultExamId){
    const upper = String(skill||'').toUpperCase();
    let adminUrl, teacherUrl;
    if(upper === 'WRITING'){
        adminUrl  = '/api/result/admin/writing/history?resultExamId=' + resultExamId;
        teacherUrl= '/api/result/teacher/writing/history?resultExamId=' + resultExamId;
    } else if(upper === 'READING'){
        adminUrl  = '/api/result/admin/reading/history?resultExamId=' + resultExamId;
        teacherUrl= '/api/result/teacher/reading/history?resultExamId=' + resultExamId;
    } else if(upper === 'LISTENING'){
        adminUrl  = '/api/result/admin/listening/history?resultExamId=' + resultExamId;
        teacherUrl= '/api/result/teacher/listening/history?resultExamId=' + resultExamId;
    } else {
        if(window.toastr){ toastr.info('Chưa hỗ trợ xem lịch sử cho kỹ năng ' + upper); }
        return;
    }
    const modalEl = document.getElementById('historyModal');
    const bodyEl = document.getElementById('historyBody');
    const titleEl = document.getElementById('historyTitle');
    if(!modalEl || !bodyEl){ console.warn('Missing history modal nodes'); return; }
    if(titleEl){ titleEl.textContent = 'Lịch sử chấm ' + upper + ' #' + resultExamId; }
    bodyEl.innerHTML = '<p class="text-muted">Đang tải lịch sử...</p>';
    fetchWithTeacherFallback(adminUrl, teacherUrl, { headers: new Headers({'Authorization': 'Bearer ' + token})})
      .then(w=>{
        if(w.error || !w.response || !w.response.ok){ throw new Error('HTTP ' + (w.response ? w.response.status : '0')); }
        return w.response.json();
      })
      .then(list=>{
        bodyEl.innerHTML = buildHistoryTableTeacher(list, skill);
      })
      .catch(e=>{
        bodyEl.innerHTML = '<p class="text-danger">Lỗi tải lịch sử: '+(e.message||'')+'</p>';
      });
    try{ new bootstrap.Modal(modalEl).show(); }catch(_){ /* ignore */ }
}

function openHistorySpeaking(submissionId){
    const adminUrl   = '/api/result/admin/speaking/history?submissionId=' + submissionId;
    const teacherUrl = '/api/result/teacher/speaking/history?submissionId=' + submissionId;
    const modalEl = document.getElementById('historyModal');
    const bodyEl = document.getElementById('historyBody');
    const titleEl = document.getElementById('historyTitle');
    if(!modalEl || !bodyEl){ console.warn('Missing history modal nodes'); return; }
    if(titleEl){ titleEl.textContent = 'Lịch sử chấm SPEAKING #' + submissionId; }
    bodyEl.innerHTML = '<p class="text-muted">Đang tải lịch sử...</p>';
    fetchWithTeacherFallback(adminUrl, teacherUrl, { headers: new Headers({'Authorization': 'Bearer ' + token})})
      .then(w=>{
        if(w.error || !w.response || !w.response.ok){ throw new Error('HTTP ' + (w.response ? w.response.status : '0')); }
        return w.response.json();
      })
      .then(list=>{
        bodyEl.innerHTML = buildHistoryTableTeacher(list);
      })
      .catch(e=>{ bodyEl.innerHTML = '<p class="text-danger">Lỗi tải lịch sử: '+(e.message||'')+'</p>'; });
    try{ new bootstrap.Modal(modalEl).show(); }catch(_){ /* ignore */ }
}

// Build history table HTML for teacher modal
function buildHistoryTableTeacher(list, skillContext){
    if(!Array.isArray(list) || list.length===0){
        return '<p class="text-muted">Chưa có lịch sử.</p>';
    }
    let rows = list.map(h=>{
        let at = '';
        if(h.gradedAt){
            const dt = new Date(h.gradedAt).toLocaleString();
            // Split at comma and join with <br>
            const parts = dt.split(',');
            at = parts.length > 1 ? `${parts[0]}<br>${parts[1].trim()}` : dt;
        }
        const score = formatHistoryScoreTeacher(skillContext, h.score);
        const fb = h.feedback ? String(h.feedback).replace(/</g,'&lt;') : '';
        const grader = resolveGraderDisplayTeacher(h);
        return `<tr><td>${at}</td><td>${score}</td><td style='white-space:pre-line;word-break:break-word;'>${fb}</td><td style='white-space:nowrap;min-width:160px;'>${grader}</td></tr>`;
    }).join('');
    return `<table class='table table-sm table-bordered mb-2'><thead><tr><th style='min-width:140px;white-space:nowrap;'>Thời gian</th><th>Điểm</th><th>Nhận xét</th><th style='min-width:160px;white-space:nowrap;'>Người chấm</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function formatHistoryScoreTeacher(skillContext, rawScore){
    const skill = String(skillContext||'').toUpperCase();
    if(skill==='READING' || skill==='LISTENING'){
        const num = Number(rawScore);
        if(!Number.isNaN(num)){
            if(num===1) return 'Đúng';
            if(num===0) return 'Sai';
        }
        return rawScore ?? '';
    }
    return rawScore ?? '';
}

// Grader display resolution function for teacher history modals
function resolveGraderDisplayTeacher(h){
    // Try direct name fields first
    if(h.graderName) return h.graderName;
    // Try nested grader object
    if(h.grader && (h.grader.fullName || h.grader.username || h.grader.email)){
        return h.grader.fullName || h.grader.username || h.grader.email;
    }
    return '';
}
