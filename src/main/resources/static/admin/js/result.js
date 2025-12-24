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
        try { const resTeacher = await fetch(teacherUrl, options); return { response: resTeacher, from:'teacher', fallback:true }; }
        catch(e){ return { error:true, status:0, body:'Network error' }; }
    }
    return { response: res, from:'admin', fallback:false };
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
        if (item.writingPending != null) {
            const rid = item.result.id;
            actionCol = "<div class='row row-cols-2 g-1'>" +
                `<div class='col'><button id='btn-skill-reading-${rid}' class='btn btn-sm w-100 btn-skill btn-skill-reading' style='white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background-color:#95e1d3;border-color:#95e1d3;color:white;font-weight:bold' title='Reading' onclick='openReading(${rid})'>R</button></div>` +
                `<div class='col'><button id='btn-skill-listening-${rid}' class='btn btn-sm w-100 btn-skill btn-skill-listening' style='white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background-color:#4ecdc4;border-color:#4ecdc4;color:white;font-weight:bold' title='Listening' onclick='openListening(${rid})'>L</button></div>` +
                `<div class='col'><button id='btn-skill-speaking-${rid}' class='btn btn-sm w-100 btn-skill btn-skill-speaking' style='white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background-color:#feca57;border-color:#feca57;color:white;font-weight:bold' title='Speaking' onclick='openSpeaking(${rid})'>S</button></div>` +
                `<div class='col'><button id='btn-skill-writing-${rid}' class='btn btn-sm w-100 btn-skill btn-skill-writing' style='white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background-color:#ff6b6b;border-color:#ff6b6b;color:white;font-weight:bold' title='Writing' onclick='openWriting(${rid})'>W</button></div>` +
                "</div>";
        }
        var bandsHtml = '';
        // writing display placeholder removed
        main += '<tr>' +
            '<td>' + item.result.user.fullName + '<br>' + item.result.user.email + writingInfo + '</td>' +
            '<td>' + item.tongCauHoi + '</td>' +
            '<td>' + item.soTLSai + '</td>' +
            '<td>' + item.soTLDung + '</td>' +
            '<td>' + item.phanTram.toFixed(2) + '%</td>' +
            "<td class='text-center'>" + actionCol + '</td>' +
            '</tr>';
    }
    tbody.innerHTML = main || '<tr><td colspan="6" class="text-center text-muted">Không có dữ li��u.</td></tr>';
    // After rendering, check skill presence and hide buttons that have no parts
    setTimeout(async ()=>{
        try {
            for (var i = 0; i < list.length; i++) {
                const rid = list[i].result.id;
                ensureSkillButtonsVisibility(rid);
                await ensureWritingSingleTaskDisplay(rid, list[i]);
            }
        } catch(e){ console.warn('post-render checks error', e); }
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
        try { dt.page(0).draw('page'); } catch (e) {}
    }
}

async function ensureSkillButtonsVisibility(resultId){
    // Tìm item result theo id
    const item = (window.allResults||[]).find(x=>x.result && x.result.id===resultId);
    if(!item || !item.result || !item.result.exam || !item.result.exam.lessons){
        // Nếu không có thông tin, ẩn hết các nút
        ['btn-skill-reading-'+resultId,'btn-skill-listening-'+resultId,'btn-skill-speaking-'+resultId,'btn-skill-writing-'+resultId].forEach(id=>{
            const el = document.getElementById(id);
            if(el) el.style.display='none';
        });
        return;
    }
    // Lấy danh sách skill có trong exam
    const skills = new Set(item.result.exam.lessons.map(l=>l.skill && String(l.skill).toUpperCase()));
    const ids = {
        READING: 'btn-skill-reading-'+resultId,
        LISTENING: 'btn-skill-listening-'+resultId,
        SPEAKING: 'btn-skill-speaking-'+resultId,
        WRITING: 'btn-skill-writing-'+resultId
    };
    Object.keys(ids).forEach(skill=>{
        const el = document.getElementById(ids[skill]);
        if(!el) return;
        if(skills.has(skill)){
            el.style.display = '';
        }else{
            el.style.display = 'none';
        }
    });
}

async function ensureWritingSingleTaskDisplay(resultId, summaryItem){
    // If final writing band already exists in summary, show it and skip
    try{
        const placeholder = document.getElementById('writing-band-' + resultId);
        if(!placeholder) return;
        const finalBand = summaryItem && summaryItem.finalWritingBand;
        if(finalBand != null){
            placeholder.textContent = 'Writing: ' + finalBand;
            return;
        }
        // Fetch writing answers; if exactly 1, show its manual score
        const adminUrl = 'http://localhost:8080/api/result/admin/writing/by-result?resultId=' + resultId;
        const resp = await fetch(adminUrl, { headers: new Headers({'Authorization':'Bearer '+(localStorage.getItem('token')||sessionStorage.getItem('token'))})});
        if(!resp.ok){ return; }
        const list = await resp.json();
        if(Array.isArray(list) && list.length === 1){
            const w = list[0];
            const score = (w && (w.manualScore != null ? w.manualScore : w.score)) ?? null;
            if(score != null){ placeholder.textContent = 'Writing: ' + score; }
        }
    }catch(e){ /* ignore */ }
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
    var adminUrl = 'http://localhost:8080/api/result/admin/find-by-exam?examId=' + exam;
    var teacherUrl = 'http://localhost:8080/api/result/teacher/find-by-exam?examId=' + exam;
    var wrapper = await fetchWithTeacherFallback(adminUrl, teacherUrl, { method: 'GET', headers: new Headers({ 'Authorization': 'Bearer ' + token }) });
    if (wrapper.error) {
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Lỗi mạng khi tải dữ liệu.</td></tr>';
        }
        return;
    }
    var response = wrapper.response;
    if (!response.ok){
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
    $('#writingModal').modal('show');
    // Luôn chuyển tab về "Tất cả" khi mở modal
    const tabAll = document.querySelector('#writingTabAll');
    if (tabAll) { tabAll.click(); }
    loadWritingAnswers(resultId);
}

async function loadWritingAnswers(resultId) {
    const url = 'http://localhost:8080/api/result/admin/writing/by-result?resultId=' + resultId;
    const response = await fetch(url, { headers: new Headers({'Authorization': 'Bearer ' + token})});
    var list = await response.json();
    window.currentWritingAnswers = list || [];
    const pending = window.currentWritingAnswers.filter(w => !w.graded);
    const graded  = window.currentWritingAnswers.filter(w =>  w.graded);
    function cardHtml(w){
        // Thêm badge trạng thái chờ chấm hoặc đã chấm
        const statusBadge = w.graded
            ? '<span class="badge bg-success" style="max-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:inline-block;">Đã chấm</span>'
            : '<span class="badge bg-warning text-dark" style="max-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:inline-block;">Chờ chấm</span>';
        const currentScore = (w.manualScore != null ? w.manualScore : '');
        const currentFeedback = w.feedback ?? '';
        return `<div class='card mb-2'><div class='card-body'>
            <p><strong>Câu hỏi ${w.questionId || ''}</strong> - ${w.questionTitle || ''}</p>
            <div class='mb-1'><strong>Trả lời học viên:</strong></div>
            <div style='white-space:pre-line' class='p-2 border bg-light'>${(w.answerText || '').replace(/</g,'&lt;')}</div>
            <div class="mb-2"></div>
            <p>${statusBadge}</p>
            ${w.graded ? `<p>Điểm hiện tại: ${currentScore ?? '-'}<br>Nhận xét hiện tại: ${currentFeedback}</p>` : ''}
            <div class='row g-2 align-items-center mt-2'>
                <div class='col-auto'><input type='number' min='0' max='9' step='0.5' id='score_${w.id}' class='form-control form-control-sm' placeholder='Điểm (0-9)' value='${currentScore ?? ''}'></div>
                <div class='col'><textarea id='fb_${w.id}' class='form-control form-control-sm' placeholder='Nhận xét' rows='2'>${currentFeedback}</textarea></div>
                <div class='col-auto'><button class='btn btn-sm btn-primary' onclick='gradeWriting(${w.id})'>${w.graded ? 'Chấm lại' : 'Chấm'}</button></div>
                <div class='col-auto'><button class='btn btn-sm btn-outline-secondary' onclick='openHistory("writing", ${w.id})'>Lịch sử</button></div>
            </div>
        </div></div>`;
    }
    // Keep sections but no “Chờ chấm” badge shown in cards
    document.getElementById('writingListPending').innerHTML =
        pending.length ? pending.map(cardHtml).join('') : '<div class="alert alert-info">Không có bài chờ chấm.</div>';
    document.getElementById('writingListGraded').innerHTML =
        graded.length ? graded.map(cardHtml).join('') : '<div class="alert alert-secondary">Chưa có bài đã chấm.</div>';
    document.getElementById('writingListAll').innerHTML =
        window.currentWritingAnswers.length ? window.currentWritingAnswers.map(cardHtml).join('') : '<div class="alert alert-info">Không có bài viết.</div>';
}

async function gradeWriting(id) {
    var scoreInput = document.getElementById('score_' + id);
    var fbEl = document.getElementById('fb_' + id);
    var scoreStrRaw = scoreInput ? String(scoreInput.value) : '';

    // Chuẩn hóa chuỗi: trim và thay dấu phẩy thành dấu chấm
    var scoreStr = scoreStrRaw.trim().replace(',', '.');
    var fb = fbEl ? String(fbEl.value).trim() : '';

    if (scoreStr === '') {
        toastr.error('Vui lòng nhập điểm dạng số');
        return;
    }

    // Parse số
    var scoreNum = parseFloat(scoreStr);
    if (!isFinite(scoreNum)) {
        toastr.error('Vui lòng nhập điểm dạng số');
        return;
    }

    // Kiểm tra khoảng 0-9 trước
    if (scoreNum < 0 || scoreNum > 9) {
        toastr.error('Điểm writing phải trong khoảng 0-9 (nhập theo bước 0.5: ví dụ 6.5, 7, 7.5, 8, 8.5, 9)');
        return;
    }

    // Chuẩn hóa về bội số 0.5 bằng cách nhân 2 và làm tròn, tránh sai số floating-point
    var scaled = Math.round(scoreNum * 2); // số nguyên gần nhất
    var recovered = scaled / 2;            // bội số 0.5 gần nhất

    // Nếu chênh lệch vượt quá epsilon, coi là không phải bội số 0.5 hợp lệ
    if (Math.abs(recovered - scoreNum) > 0.001) {
        toastr.error('Điểm writing phải theo bước 0.5 (ví dụ: 0, 0.5, 1, 1.5, 2, ..., 8.5, 9)');
        return;
    }

    // Đảm bảo sau khi chuẩn hóa vẫn trong khoảng 0-9
    if (recovered < 0 || recovered > 9) {
        toastr.error('Điểm writing phải trong khoảng 0-9 (nhập theo bước 0.5: ví dụ 6.5, 7, 7.5, 8, 8.5, 9)');
        return;
    }

    // Chuẩn hóa chuỗi gửi lên server: tối đa 1 chữ số thập phân, bỏ .0 nếu có
    var scoreOut = recovered.toFixed(1).replace(/\.0$/, '');

    const url = 'http://localhost:8080/api/result/admin/writing/grade?id=' + id + '&score=' + encodeURIComponent(scoreOut) + '&feedback=' + encodeURIComponent(fb);
    const response = await fetch(url, { method: 'POST', headers: new Headers({'Authorization': 'Bearer ' + token})});
    if (response.status < 300) {
        toastr.success('Đã chấm');
        // reload answers and keep current active tab
        loadWritingAnswers(window.currentResultId);
        loadResult();
        // Cập nhật lại giá trị ô input theo điểm chuẩn hóa
        if (scoreInput) {
            scoreInput.value = scoreOut;
        }
    } else {
        try { var err = await response.json(); toastr.error(err.defaultMessage || 'Lỗi'); } catch(e){ toastr.error('Lỗi'); }
    }
}

// Speaking grading functions
function openSpeaking(resultId) {
    window.currentResultId = resultId;
    $('#speakingModal').modal('show');
    // Luôn chuyển tab về "Tất cả" khi mở modal
    const tabAll = document.querySelector('#speakingTabAll');
    if (tabAll) { tabAll.click(); }
    loadSpeakingAnswers(resultId);
}

async function loadSpeakingAnswers(resultId) {
    const adminUrl   = 'http://localhost:8080/api/result/admin/speaking/by-result?resultId=' + resultId;
    const teacherUrl = 'http://localhost:8080/api/result/teacher/speaking/by-result?resultId=' + resultId;
    const w = await fetchWithTeacherFallback(adminUrl, teacherUrl, { headers: new Headers({'Authorization': 'Bearer ' + token})});
    if(w.error){
        document.getElementById('speakingListPending').innerHTML = '<div class="alert alert-danger">Lỗi mạng</div>';
        document.getElementById('speakingListGraded').innerHTML = '';
        document.getElementById('speakingListAll').innerHTML = '';
        return;
    }
    const response = w.response;
    var list = await response.json();
    window.currentSpeakingAnswers = list || [];

    const pending = window.currentSpeakingAnswers.filter(s => !s.graded);
    const graded  = window.currentSpeakingAnswers.filter(s =>  s.graded);

    // SPEAKING: Hiển thị tên người chấm trên từng card
    async function cardHtmlSpeaking(s){
        const qLinkRaw = s.questionLinkAudio || (s.question && (s.question.link_audio || s.question.linkAudio)) || s.linkAudio || '';
        const promptAudio = normalizeAudioSrcAdmin(qLinkRaw) || ('/api/speaking/audio/'+(s.questionId || s.id || ''));
        const studentAudioRaw = s.cloudinaryUrl || s.userAudio || s.speakingAudio || s.answerText || '';
        const studentAudio = normalizeAudioSrcAdmin(studentAudioRaw);
        const hasStudentAudio = !!studentAudio && String(studentAudio).trim().length>0;
        const statusBadge = s.graded
            ? '<span class="badge bg-success" style="max-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:inline-block;">Đã chấm</span>'
            : '<span class="badge bg-warning text-dark" style="max-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:inline-block;">Chờ chấm</span>';
        return `<div class='card mb-2'><div class='card-body'>
            <p><strong>Câu hỏi #${s.questionId || 'N/A'}</strong> - ${s.questionTitle || 'Speaking submission'}</p>
            <p>${statusBadge}</p>
            <div class='mb-2'><small class='text-muted d-block'>Audio đề:</small>
                <audio class='mt-1' controls style='width:100%; display:block;' data-audio-src='${promptAudio}' data-fallback-audio-id='${s.questionId || s.id || ''}'></audio>
            </div>
            <div class='mb-2'><small class='text-muted d-block'>Audio học viên:</small>
                ${hasStudentAudio ? `<audio class='mt-1' controls style='width:100%; display:block;' data-audio-src='${studentAudio}'></audio>` : '<em class="text-muted">Không có</em>'}
            </div>
            ${s.transcript ? `<p class="small"><strong>Transcript:</strong> ${String(s.transcript).replace(/</g,'&lt;')}</p>` : ''}
            ${s.graded ? `<p>Điểm hiện tại: ${s.score ?? '-'}<br>Nhận xét hiện tại: ${(s.feedback || '')}</p>` : ''}
            <div class='row g-2 align-items-center mt-2'>
                <div class='col-auto'><input type='number' min='0' max='9' step='0.5' id='score_sp_${s.id}' class='form-control form-control-sm' placeholder='Điểm (0-9)' value='${s.score ?? ''}'></div>
                <div class='col'><textarea id='fb_sp_${s.id}' class='form-control form-control-sm' placeholder='Nhận xét' rows='2'>${s.feedback ?? ''}</textarea></div>
                <div class='col-auto'><button class='btn btn-sm btn-primary' onclick='gradeSpeaking(${s.id})'>${s.graded ? 'Chấm lại' : 'Chấm'}</button></div>
                <div class='col-auto'><button class='btn btn-sm btn-outline-secondary' onclick='openHistory("speaking", ${s.id})'>Lịch sử</button></div>
            </div>
        </div></div>`;
    }

    // Keep sections but no “Chờ chấm” badge shown in cards
    const pendingHtmlSpeaking = pending.length ? (await Promise.all(pending.map(cardHtmlSpeaking))).join('') : '<div class="alert alert-info">Không có bài chờ chấm.</div>';
    const gradedHtmlSpeaking = graded.length ? (await Promise.all(graded.map(cardHtmlSpeaking))).join('') : '<div class="alert alert-secondary">Chưa có bài đã chấm.</div>';
    const allHtmlSpeaking = window.currentSpeakingAnswers.length ? (await Promise.all(window.currentSpeakingAnswers.map(cardHtmlSpeaking))).join('') : '<div class="alert alert-info">Không có bài nói.</div>';

    document.getElementById('speakingListPending').innerHTML = pendingHtmlSpeaking;
    document.getElementById('speakingListGraded').innerHTML  = gradedHtmlSpeaking;
    document.getElementById('speakingListAll').innerHTML     = allHtmlSpeaking;

    // Initialize audio players (fetch blobs with auth if needed)
    initAudioPlayersAdmin('speakingListPending');
    initAudioPlayersAdmin('speakingListGraded');
    initAudioPlayersAdmin('speakingListAll');
}

async function gradeSpeaking(id) {
    var raw = document.getElementById('score_sp_' + id);
    var fbEl = document.getElementById('fb_sp_' + id);
    var scoreStr = raw ? String(raw.value).trim() : '';

    // Thay thế dấu phẩy thành dấu chấm nếu có
    scoreStr = scoreStr.replace(',', '.');

    var score = scoreStr === '' ? NaN : parseFloat(scoreStr);
    var fb = fbEl ? String(fbEl.value).trim() : '';

    // Validate: number
    if (isNaN(score)) {
        toastr.error('Vui lòng nhập điểm dạng số');
        return;
    }

    // Làm tròn điểm về bội số của 0.5 ngay từ đầu để tránh lỗi floating-point
    score = Math.round(score * 2) / 2;

    // Validate: range 0-9 (sau khi đã làm tròn)
    if (score < 0 || score > 9) {
        toastr.error('Điểm speaking phải trong khoảng 0-9 (nhập theo bước 0.5: ví dụ 6.5, 7, 7.5, 8, 8.5, 9)');
        return;
    }

    // Validate: step 0.5 - kiểm tra sau khi làm tròn
    var doubled = score * 2;
    var isValidStep = Math.abs(doubled - Math.round(doubled)) < 0.0001;

    if (!isValidStep) {
        toastr.error('Điểm phải theo bước 0.5 (ví dụ: 0, 0.5, 1, 1.5, 2, ..., 8.5, 9)');
        return;
    }


    const url = 'http://localhost:8080/api/result/admin/speaking/grade?id=' + id + '&score=' + score + '&feedback=' + encodeURIComponent(fb);
    try {
        const response = await fetch(url, { method: 'POST', headers: new Headers({'Authorization': 'Bearer ' + token})});
        if (response.ok) {
            toastr.success('Đã chấm bài speaking');
            loadSpeakingAnswers(window.currentResultId);
            loadResult();
            if (raw) raw.value = '';
            if (fbEl) fbEl.value = '';
        } else {
            let msg = 'Lỗi khi chấm speaking';
            try { const err = await response.json(); if (err && err.defaultMessage) msg = err.defaultMessage; }
            catch(e){ try { msg = await response.text(); } catch(_){} }
            toastr.error(msg || 'Lỗi');
        }
    } catch (e) {
        toastr.error('Lỗi mạng khi chấm speaking');
        console.error('gradeSpeaking error', e);
    }
}

// Reading grading functions
function openReading(resultId) {
    window.currentResultId = resultId;
    $('#readingModal').modal('show');
    // Luôn chuyển tab về "Tất cả" khi mở modal
    const tabAll = document.querySelector('#readingTabAll');
    if (tabAll) { tabAll.click(); }
    loadReadingAnswers(resultId);
}

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
        // Prefer explicit flags when present
        if(item?.isCorrect === true) return true;
        if(item?.isCorrect === false) return false;
        // If selected answer object has isTrue
        if(item?.answer && typeof item.answer.isTrue === 'boolean') return item.answer.isTrue === true;
        // If options included and selectedAnswerId provided
        const opts = item?.options || item?.answers || item?.question?.answers || [];
        if(item?.selectedAnswerId && Array.isArray(opts)){
            const match = opts.find(o=> (o.id===item.selectedAnswerId) || (''+o.id === ''+item.selectedAnswerId));
            if(match && typeof match.isTrue === 'boolean') return match.isTrue === true;
        }
        // Fallback: compare userAnswer to correct option content if available
        if(Array.isArray(opts) && item?.userAnswer){
            const correct = opts.find(o=> o.isTrue===true);
            if(correct){ return (String(item.userAnswer).trim() === String(correct.content??correct.title??'').trim()); }
        }
    }catch(e){}
    return null; // unknown
}

async function loadReadingAnswers(resultId) {
    const adminUrl   = 'http://localhost:8080/api/result/admin/reading/by-result?resultId=' + resultId;
    const teacherUrl = 'http://localhost:8080/api/result/teacher/reading/by-result?resultId=' + resultId;
    const w = await fetchWithTeacherFallback(adminUrl, teacherUrl, { headers: new Headers({'Authorization': 'Bearer ' + token})});
    if(w.error){
        document.getElementById('readingListPending').innerHTML = '<div class="alert alert-danger">Lỗi mạng</div>';
        document.getElementById('readingListGraded').innerHTML = '';
        document.getElementById('readingListAll').innerHTML = '';
        return;
    }
    const response = w.response;
    var list = await response.json();
    // KEEP: show ALL answers (including MCQ) so teacher can see user answer
    window.currentReadingAnswers = list || [];

    const pending = window.currentReadingAnswers.filter(r => !r.graded && !isMcqItem(r));
    const graded  = window.currentReadingAnswers.filter(r =>  r.graded || isMcqItem(r));

    // READING: Hiển thị tên người chấm trên từng card
    async function cardHtmlReading(r){
        const isMcq = isMcqItem(r);
        const displayGraded = r.graded || isMcq;
        const correctness = isMcq ? isCorrectMcq(r) : null;
        const correctnessBadge = (correctness===true)
            ? " <span class='badge bg-success'>Đúng</span>"
            : (correctness===false)
                ? " <span class='badge bg-danger'>Sai</span>"
                : '';
        const answerBlock = isMcq
            ? (r.userAnswer || r.selectedAnswerId
                ? `<span class='badge bg-secondary'>MCQ</span> ${r.userAnswer || ''} ${r.selectedAnswerId ? `<small class='text-muted'>(answers_id: ${r.selectedAnswerId})</small>` : ''}${correctnessBadge}`
                : '<em>Không có câu trả lời</em>')
            : ((r.answerText && r.answerText.trim().length>0)
                ? (r.answerText.replace(/</g,'&lt;'))
                : (r.userAnswer || '<em>Không có câu trả lời</em>'));
        let graderName = '';
        if (displayGraded) {
            graderName = await resolveGraderDisplay(r);
        }
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
                <div class='col-auto'><button class='btn btn-sm btn-primary' onclick='gradeReading(${r.id})'>${displayGraded ? 'Cập nhật' : 'Lưu'}</button></div>
                <div class='col-auto'><button class='btn btn-sm btn-outline-secondary' onclick='openHistory("reading", ${r.id})'>Lịch sử</button></div>
            </div>`;
        return `<div class='card mb-2'><div class='card-body'>
            <p><strong>Câu hỏi ${r.questionId || 'N/A'}</strong> - ${r.questionTitle || ''}</p>
            <p><strong>Câu trả lời:</strong> ${answerBlock}</p>
            <p>${displayGraded ? '<span class="badge bg-success">Đã chấm</span>' : '<span class="badge bg-warning text-dark">Chưa chấm</span>'}</p>
            ${displayGraded ? `<p>Kết quả hiện tại: ${(r.score !== false && r.score != null) ? (r.score>0? 'Đúng':'Sai') : '-'}<br>Nhận xét hiện tại: ${(r.feedback && r.feedback !== false ? r.feedback : '')}</p>` : ''}
            ${controlRow}
        </div></div>`;
    }

    // Keep sections but no “Chờ chấm” badge shown in cards
    const pendingHtmlReading = pending.length ? (await Promise.all(pending.map(cardHtmlReading))).join('') : '<div class="alert alert-info">Không có câu chờ chấm.</div>';
    const gradedHtmlReading = graded.length ? (await Promise.all(graded.map(cardHtmlReading))).join('') : '<div class="alert alert-secondary">Chưa có câu đã chấm.</div>';
    const allHtmlReading = window.currentReadingAnswers.length ? (await Promise.all(window.currentReadingAnswers.map(cardHtmlReading))).join('') : '<div class="alert alert-info">Không có câu hỏi Reading.</div>';

    document.getElementById('readingListPending').innerHTML = pendingHtmlReading;
    document.getElementById('readingListGraded').innerHTML  = gradedHtmlReading;
    document.getElementById('readingListAll').innerHTML     = allHtmlReading;
}

async function gradeReading(id) {
    // Switch to correctness dropdown
    var okEl = document.getElementById('ok_rd_' + id);
    var fb = (document.getElementById('fb_rd_' + id)?.value || '').trim();
    if (!okEl) { toastr.error('Thiếu lựa chọn Đúng/Sai'); return; }
    var score = okEl.value === '1' ? 1 : 0; // map Đúng/Sai to 1/0
    const url = 'http://localhost:8080/api/result/admin/reading/grade?id=' + id + '&score=' + score + '&feedback=' + encodeURIComponent(fb);
    try {
        const response = await fetch(url, { method: 'POST', headers: new Headers({'Authorization': 'Bearer ' + token})});
        if (response.status < 300) {
            toastr.success('Đã lưu kết quả Reading');
            loadReadingAnswers(window.currentResultId);
            loadResult();
        } else {
            try { var err = await response.json(); toastr.error(err.defaultMessage || 'Lỗi'); } catch(e){ toastr.error('Lỗi'); }
        }
    } catch(e){ toastr.error('Lỗi mạng'); }
}

// Listening grading functions
function openListening(resultId) {
    window.currentResultId = resultId;
    $('#listeningModal').modal('show');
    // Luôn chuyển tab về "Tất cả" khi mở modal
    const tabAll = document.querySelector('#listeningTabAll');
    if (tabAll) { tabAll.click(); }
    loadListeningAnswers(resultId);
}

async function loadListeningAnswers(resultId) {
    const adminUrl   = 'http://localhost:8080/api/result/admin/listening/by-result?resultId=' + resultId;
    const teacherUrl = 'http://localhost:8080/api/result/teacher/listening/by-result?resultId=' + resultId;
    const w = await fetchWithTeacherFallback(adminUrl, teacherUrl, { headers: new Headers({'Authorization': 'Bearer ' + token})});
    if(w.error){
        document.getElementById('listeningListPending').innerHTML = '<div class="alert alert-danger">Lỗi mạng</div>';
        document.getElementById('listeningListGraded').innerHTML = '';
        document.getElementById('listeningListAll').innerHTML = '';
        return;
    }
    const response = w.response;
    var list = await response.json();
    // FIX: show ALL listening answers, không filter MCQ
    window.currentListeningAnswers = list || [];

    const pending = window.currentListeningAnswers.filter(l => !l.graded && !isMcqItem(l));
    const graded  = window.currentListeningAnswers.filter(l =>  l.graded || isMcqItem(l));

    // LISTENING: Hiển thị tên người chấm trên từng card
    async function cardHtmlListening(l){
        const isMcq = isMcqItem(l);
        const displayGraded = l.graded || isMcq;
        const correctness = isMcq ? isCorrectMcq(l) : null;
        const correctnessBadge = (correctness===true)
            ? " <span class='badge bg-success'>Đúng</span>"
            : (correctness===false)
                ? " <span class='badge bg-danger'>Sai</span>"
                : '';
        const answerBlock = isMcq
            ? (l.userAnswer || l.selectedAnswerId
                ? `<span class='badge bg-secondary'>MCQ</span> ${l.userAnswer || ''} ${l.selectedAnswerId ? `<small class='text-muted'>(answers_id: ${l.selectedAnswerId})</small>` : ''}${correctnessBadge}`
                : '<em>Không có câu trả lời</em>')
            : ((l.answerText && l.answerText.trim().length>0)
                ? (l.answerText.replace(/</g,'&lt;'))
                : (l.userAnswer || '<em>Không có câu trả lời</em>'));
        let graderName = '';
        if (displayGraded) {
            graderName = await resolveGraderDisplay(l);
        }
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
                <div class='col-auto'><button class='btn btn-sm btn-primary' onclick='gradeListening(${l.id})'>${displayGraded ? 'Chấm lại' : 'Chấm'}</button></div>
                <div class='col-auto'><button class='btn btn-sm btn-outline-secondary' onclick='openHistory("listening", ${l.id})'>Lịch sử</button></div>
            </div>`;
        return `<div class='card mb-2'><div class='card-body'>
            <p><strong>Câu hỏi #${l.questionId || 'N/A'}</strong> - ${l.questionTitle || ''}</p>
            <!-- Audio đề đã bị bỏ -->
            <p><strong>Đáp án học viên:</strong> ${answerBlock}</p>
            <p>${displayGraded ? '<span class="badge bg-success">Đã chấm</span>' : '<span class="badge bg-warning text-dark">Chưa chấm</span>'}</p>
            ${displayGraded ? `<p>Kết quả hiện tại: ${(l.score !== false && l.score != null) ? (l.score>0? 'Đúng':'Sai') : '-'}<br>Nhận xét hiện tại: ${(l.feedback && l.feedback !== false ? l.feedback : '')}</p>` : ''}
            ${controlRow}
         </div></div>`;
     }

     // Keep sections but no “Chờ chấm” badge shown in cards
     const pendingHtmlListening = pending.length ? (await Promise.all(pending.map(cardHtmlListening))).join('') : '<div class="alert alert-info">Không có câu chờ chấm.</div>';
     const gradedHtmlListening = graded.length ? (await Promise.all(graded.map(cardHtmlListening))).join('') : '<div class="alert secondary">Chưa có câu đã chấm.</div>';
     const allHtmlListening = window.currentListeningAnswers.length ? (await Promise.all(window.currentListeningAnswers.map(cardHtmlListening))).join('') : '<div class="alert alert-info">Không có câu hỏi Listening.</div>';

     document.getElementById('listeningListPending').innerHTML = pendingHtmlListening;
     document.getElementById('listeningListGraded').innerHTML = gradedHtmlListening;
     document.getElementById('listeningListAll').innerHTML = allHtmlListening;

    // init audio
    initAudioPlayersAdmin('listeningListPending');
    initAudioPlayersAdmin('listeningListGraded');
    initAudioPlayersAdmin('listeningListAll');
}

async function gradeListening(id) {
    var okEl = document.getElementById('ok_ls_' + id);
    var fb = (document.getElementById('fb_ls_' + id)?.value || '').trim();
    if (!okEl) { toastr.error('Thiếu lựa chọn Đúng/Sai'); return; }
    var score = okEl.value === '1' ? 1 : 0;
    const url = 'http://localhost:8080/api/result/admin/listening/grade?id=' + id + '&score=' + score + '&feedback=' + encodeURIComponent(fb);
    try {
        const response = await fetch(url, { method: 'POST', headers: new Headers({'Authorization': 'Bearer ' + token})});
        if (response.status < 300) {
            toastr.success('Đã lưu kết quả Listening');
            loadListeningAnswers(window.currentResultId);
            loadResult();
        } else {
            try { var err = await response.json(); toastr.error(err.defaultMessage || 'Lỗi'); } catch(e){ toastr.error('Lỗi'); }
        }
    } catch(e){ toastr.error('Lỗi mạng'); }
}

// Init tab click handlers after DOM is ready
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
        // toggle active class
        var links = container.querySelectorAll('.nav-link');
        links.forEach(function (el) { el.classList.remove('active'); });
        target.classList.add('active');
        applyResultFilterAndRender();
    });
}

// Fetch and render all students in a course
async function loadCourseStudents(courseId){
    try{
        const tokenLocal = localStorage.getItem('token') || sessionStorage.getItem('token');
        const headers = new Headers({ 'Authorization': 'Bearer ' + tokenLocal });
        const adminUrl = `/api/course/admin/students?courseId=${encodeURIComponent(courseId)}`;
        const teacherUrl = `/api/course/teacher/students?courseId=${encodeURIComponent(courseId)}`;
        const tbody = document.getElementById('liststudents');
        if(tbody){ tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Đang tải danh sách học viên...</td></tr>`; }
        // Destroy existing DataTable if any
        if (window.$ && $.fn.DataTable && $.fn.DataTable.isDataTable('#studentsTable')) {
            $('#studentsTable').DataTable().destroy();
        }
        const w = await fetchWithTeacherFallback(adminUrl, teacherUrl, { headers });
        if(w.error){
            if(tbody){ tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Lỗi mạng khi tải học viên.</td></tr>`; }
            return;
        }
        const res = w.response;
        if(!res.ok){
            const msg = res.status===403 ? 'Không có quyền xem danh sách học viên.' : `Không tải được dữ liệu (mã: ${res.status}).`;
            if(tbody){ tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">${msg}</td></tr>`; }
            return;
        }
        let list = [];
        try{ list = await res.json(); }catch(e){ list = []; }
        renderStudentsTable(Array.isArray(list) ? list : []);
    }catch(e){
        const tbody = document.getElementById('liststudents');
        if(tbody){ tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Đã xảy ra lỗi.</td></tr>`; }
    }
}

function renderStudentsTable(list){
    const tbody = document.getElementById('liststudents');
    if(!tbody) return;
    const rows = (list && list.length) ? list.map(function(st){
        const fullName = st.fullName || st.name || st.username || st.email || '-';
        const email = st.email || st.userEmail || '';
        const phone = st.phone || st.phoneNumber || '';
        const joinedAt = (st.joinedAt || st.createdAt || st.enrolledAt || '').toString().replace('T',' ');
        return `<tr>
            <td>${fullName}</td>
            <td>${email}</td>
            <td>${phone}</td>
            <td>${joinedAt}</td>
        </tr>`;
    }).join('') : '<tr><td colspan="4" class="text-center text-muted">Không có học viên.</td></tr>';
    tbody.innerHTML = rows;
    // Init DataTable if available
    if (window.$ && $.fn.DataTable) {
        $('#studentsTable').DataTable({
            language: {
                emptyTable: 'Không có dữ liệu',
                zeroRecords: 'Không tìm thấy học viên phù hợp',
                infoEmpty: 'Không có dữ liệu',
                search: 'Tìm kiếm:',
                lengthMenu: 'Hiển thị _MENU_ dòng',
                info: 'Hiển thị _START_ đến _END_ trong tổng _TOTAL_ dòng',
                paginate: { first: 'Đầu', last: 'Cuối', next: 'Sau', previous: 'Trước' }
            }
        });
    }
}

// Expose to global for page usage
window.loadCourseStudents = window.loadCourseStudents || loadCourseStudents;

// Utility: normalize audio src to root-relative if not absolute
function normalizeAudioSrcAdmin(src){
    if(!src) return src;
    const t = String(src).trim();
    if(/^https?:\/\//i.test(t)) return t;
    if(t.startsWith('/')) return t;
    return '/' + t.replace(/^\/+/, '');
}

// Utility: load audio via fetch with Authorization if same-origin path/API, else assign src directly
async function loadBlobAudioToPlayerAdmin(audioEl){
    try{
        let src = audioEl?.dataset?.audioSrc;
        const fallbackId = audioEl?.dataset?.fallbackAudioId;
        if(!src && fallbackId){ src = '/api/speaking/audio/' + fallbackId; audioEl.dataset.audioSrc = src; }
        if(!src) return;
        const isAbsolute = /^https?:\/\//i.test(src);
        const isApiOrSameOrigin = !isAbsolute && (src.startsWith('/') || src.startsWith('/api/'));
        let ok=false;
        if(isApiOrSameOrigin){
            try{
                const resp = await fetch(src, { headers: new Headers({ 'Authorization':'Bearer '+token })});
                if(resp.ok){ const blob = await resp.blob(); audioEl.src = URL.createObjectURL(blob); audioEl.load(); ok=true; }
            }catch(e){ /* ignore */ }
        }
        if(!ok){ audioEl.src = src; audioEl.load(); }
    }catch(e){ /* ignore */ }
}

function initAudioPlayersAdmin(container){
    const node = (typeof container==='string') ? document.getElementById(container) : container;
    if(!node) return;
    const players = node.querySelectorAll('audio[data-audio-src]');
    players.forEach(p=>{ loadBlobAudioToPlayerAdmin(p); });
}

// History modal functions
const graderCache = new Map();
const pendingGraderFetches = new Map();
async function fetchGraderNameById(id){
    if(id==null) return null;
    const key = String(id);
    if(graderCache.has(key)) return graderCache.get(key);
    if(pendingGraderFetches.has(key)) return pendingGraderFetches.get(key);
    const fetchPromise = (async ()=>{
        try {
            const res = await fetch(`http://localhost:8080/api/user/admin/find-by-id?id=${encodeURIComponent(id)}`, {
                headers: new Headers({ 'Authorization': 'Bearer ' + (localStorage.getItem('token')||sessionStorage.getItem('token')) })
            });
            if(!res.ok){ return null; }
            const data = await res.json();
            const name = data && (data.fullName || data.username || data.email || ('#'+id));
            graderCache.set(key, name);
            return name;
        } catch(e){ return null; }
        finally { pendingGraderFetches.delete(key); }
    })();
    pendingGraderFetches.set(key, fetchPromise);
    return fetchPromise;
}

async function resolveGraderDisplay(h){
    const nameFields = [
        h.graderName, h.teacherName, h.adminName, h.updatedByName, h.createdByName,
        h.fullName, h.name, h.userName, h.gradedBy, h.reviewer, h.marker
    ];
    const gName = nameFields.find(n => n && String(n).trim().length > 0);
    const nestedGrader = h.grader || h.markerUser || h.teacher || h.admin;
    const nestedName = nestedGrader && (nestedGrader.fullName || nestedGrader.username || nestedGrader.email);
    if(gName){ return gName; }
    if(nestedName){ return nestedName; }
    return '<span class="text-muted">N/A</span>';
}

async function buildHistoryTableHtml(list, skillContext){
    if(!Array.isArray(list) || list.length===0){
        return '<p class="text-muted">Chưa có lịch sử.</p>';
    }
    const rows = await Promise.all(list.map(async h=>{
        const gradedAtRaw = h.gradedAt || h.createdAt || h.updatedAt || h.time || '';
        const gradedAt = String(gradedAtRaw).toString().replace('T',' ');
        const fb = (h.feedback||'').toString().replace(/</g,'&lt;');
        const graderDisplay = await resolveGraderDisplay(h);
        const formattedScore = formatHistoryScore(skillContext, h.score);
        return `<tr><td>${gradedAt}</td><td>${formattedScore}</td><td style='white-space:pre-line;word-break:break-word;'>${fb}</td><td style='white-space:nowrap;min-width:160px;'>${graderDisplay}</td></tr>`;
    }));
    return '<table class="table table-sm table-bordered mb-2"><thead><tr><th style="min-width:140px;white-space:nowrap;">Thời gian</th><th>Điểm</th><th>Nhận xét</th><th style="min-width:160px;white-space:nowrap;">Người chấm</th></tr></thead><tbody>'
        + rows.join('') +
        '</tbody></table>';
}

function resolveResultIdFromAnswer(skill, id){
    try{
        const sid = String(skill||'').toLowerCase();
        let arr = [];
        if(sid==='writing') arr = window.currentWritingAnswers || [];
        else if(sid==='reading') arr = window.currentReadingAnswers || [];
        else if(sid==='listening') arr = window.currentListeningAnswers || [];
        else if(sid==='speaking') arr = window.currentSpeakingAnswers || [];
        const item = arr.find(x=> (x && (x.id===id || String(x.id)===String(id))));
        if(!item) return null;
        // Try common fields
        if(item.resultId) return item.resultId;
        if(item.result && item.result.id) return item.result.id;
        if(item.result_id) return item.result_id;
        if(item.answer && (item.answer.resultId || item.answer.result_id)) return item.answer.resultId || item.answer.result_id;
        return null;
    }catch(e){ return null; }
}

async function fetchExamGradeHistory(skill, targetId, token){
    const headers = new Headers({ 'Authorization': 'Bearer ' + token });
    // Ưu tiên gọi API mới
    const url = `/api/exam-grade-history/by-result-exam?resultExamId=${targetId}${skill ? `&skill=${skill.toUpperCase()}` : ''}`;
    try {
        const res = await fetch(url, { headers });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
                data.__source = 'admin';
                data.__fallback = false;
                return data;
            }
        }
    } catch (e) { /* fallback */ }
    const combos = [
        { admin: `/api/result/admin/${String(skill).toLowerCase()}/history?resultExamId=${targetId}`, teacher: `/api/result/teacher/${String(skill).toLowerCase()}/history?resultExamId=${targetId}` },
        { admin: `/api/result/admin/${String(skill).toLowerCase()}/history?submissionId=${targetId}`, teacher: `/api/result/teacher/${String(skill).toLowerCase()}/history?submissionId=${targetId}` },
        { admin: `/api/result/admin/skill-history?resultId=${targetId}&skill=${skill}`, teacher: `/api/result/teacher/skill-history?resultId=${targetId}&skill=${skill}` }
    ];
    for(const combo of combos){
        const wrapper = await fetchWithTeacherFallback(combo.admin, combo.teacher, { headers });
        if(wrapper.error) continue;
        const res = wrapper.response;
        if(res && res.ok){
            const payload = await res.json();
            const data = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
            if(Array.isArray(data)){
                // attach meta about source for later UI badge
                data.__source = wrapper.from || 'admin';
                data.__fallback = !!wrapper.fallback;
                return data;
            }
        }
    }
    throw new Error('EXAM_GRADE_HISTORY_FETCH_FAILED');
}

async function openHistory(skill, id) {
  try {
    const tkn = localStorage.getItem('token') || sessionStorage.getItem('token');
    const modalEl = document.getElementById('historyModal');
    const bodyEl = document.getElementById('historyBody');
    const titleEl = document.getElementById('historyTitle');
    // Normalize skill casing to uppercase for title and logic
    const normSkillUpper = String(skill || '').trim().toUpperCase();
    const normSkillLower = normSkillUpper.toLowerCase();
    if (titleEl) titleEl.textContent = `Lịch sử chấm #${id} (${normSkillUpper})`;
    if (bodyEl) bodyEl.innerHTML = '<p class="text-muted">Đang tải lịch sử...</p>';

    // Prefer resolving parent resultId if id is an answer
    let list = [];
    const resolvedResultId = resolveResultIdFromAnswer(normSkillUpper, id);
    const candidates = [id, resolvedResultId].filter(v=> v!=null);
    let fetched = false;
    let source = 'admin';
    let usedFallback = false;
    for(const cand of candidates){
      try {
        list = await fetchExamGradeHistory(normSkillLower, cand, tkn);
        fetched = true;
        source = list.__source || 'admin';
        usedFallback = !!list.__fallback;
        break;
      } catch (_) { /* try next */ }
    }
    if(!fetched){
      // Final fallback: direct skill-history with resultId=id
      const headers = new Headers({ 'Authorization': 'Bearer ' + tkn });
      const adminUrl = `/api/result/admin/skill-history?resultId=${resolvedResultId || id}&skill=${normSkillUpper}`;
      const teacherUrl = `/api/result/teacher/skill-history?resultId=${resolvedResultId || id}&skill=${normSkillUpper}`;
      try {
        let w = await fetchWithTeacherFallback(adminUrl, teacherUrl, { headers });
        const r = w.response;
        if (r && r.ok) {
          const payload = await r.json();
          list = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
          fetched = true;
          source = w.from || 'admin';
          usedFallback = !!w.fallback;
        }
      } catch (_) {}
    }

    // Build header badges
    let headerBadge = '';
    const permNote = usedFallback ? `<div class='alert alert-warning mt-2 mb-2 p-2'><strong>Lưu ý quyền:</strong> Không có quyền xem lịch sử qua API Admin (403), đã chuyển sang dữ liệu Teacher. Một số thao tác có thể bị giới hạn.</div>` : '';

    // Render
    const contentHtml = (!Array.isArray(list) || list.length === 0)
        ? '<p class="text-muted">Chưa có lịch sử.</p>'
        : await buildHistoryTableHtml(list, normSkillLower);
    bodyEl.innerHTML = headerBadge + permNote + contentHtml;

    // Show modal
    if (window.bootstrap && bootstrap.Modal) {
      bootstrap.Modal.getOrCreateInstance(modalEl).show();
    } else if (window.$) {
      $('#historyModal').modal('show');
    }
  } catch (err) {
    const modalEl = document.getElementById('historyModal');
    const bodyEl = document.getElementById('historyBody');
    if (bodyEl) bodyEl.innerHTML = `<div class='alert alert-danger mb-0'>Lỗi tải lịch sử</div>`;
    if (window.bootstrap && bootstrap.Modal) {
      bootstrap.Modal.getOrCreateInstance(modalEl).show();
    } else if (window.$) {
      $('#historyModal').modal('show');
    }
  }
}

function formatHistoryScore(skillContext, rawScore){
    const skill = String(skillContext||'').toUpperCase();
    if(skill==='READING' || skill==='LISTENING'){
        const num = Number(rawScore);
        if(!Number.isNaN(num)){
            if(num===1) return 'Đúng';
            if(num===0) return 'Sai';
        }
        return rawScore??'';
    }
    return rawScore??'';
}
