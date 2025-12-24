var token = localStorage.getItem("token");

// Guard để tránh init bị gọi nhiều lần (do template/script load trùng hoặc browser cache)
var __practiceInitDone = false;

function getPracticeStateKey(sessionId){
    return 'practice_state_' + String(sessionId || '');
}

function loadPracticeLocalState(sessionId){
    try{
        var raw = localStorage.getItem(getPracticeStateKey(sessionId));
        if(!raw) return { fillAnswers:{}, writingDrafts:{} };
        var obj = JSON.parse(raw);
        if(!obj || typeof obj !== 'object') return { fillAnswers:{}, writingDrafts:{} };
        return {
            fillAnswers: (obj.fillAnswers && typeof obj.fillAnswers==='object') ? obj.fillAnswers : {},
            writingDrafts: (obj.writingDrafts && typeof obj.writingDrafts==='object') ? obj.writingDrafts : {}
        };
    }catch(e){
        return { fillAnswers:{}, writingDrafts:{} };
    }
}

function savePracticeLocalState(){
    try{
        if(!window.practice || !practice.sessionId) return;
        var payload = {
            fillAnswers: practice.fillAnswers || {},
            writingDrafts: practice.writingDrafts || {},
            savedAt: new Date().toISOString()
        };
        localStorage.setItem(getPracticeStateKey(practice.sessionId), JSON.stringify(payload));
    }catch(e){ /* ignore */ }
}

function initOnLuyen() {
    if(__practiceInitDone){ return; }
    __practiceInitDone = true;

    var url = new URL(document.URL);
    var sessionId = url.searchParams.get("sessionId");
    if (!sessionId) {
        toastr.error("Không thấy session");
        return;
    }

    // restore local drafts first
    var localState = loadPracticeLocalState(sessionId);

    window.practice = {
        sessionId: sessionId,
        questions: [],
        byLesson: {},
        lessonOrder: [],
        answeredMap: {},
        examId: null,
        writingDrafts: localState.writingDrafts || {},
        fillAnswers: localState.fillAnswers || {}
    };

    // Auto-save local state while user is typing (also helps reload)
    try{
        window.addEventListener('beforeunload', savePracticeLocalState);
    }catch(e){}

    // Tải câu hỏi + thông tin session
    loadQuestionsAndSession();
}

function loadQuestionsAndSession() {
    $.ajax({
        url: "/api/practice/user/questions?sessionId=" + practice.sessionId, method: "GET", success: function (list) {
            practice.questions = list;
            buildLessonGrouping();
            renderTabs();
            renderSidebarLessonButtons();
            if(!practiceTimerInterval){ startPracticeTimer(); }
            // After questions loaded, load speaking submissions
            loadPracticeSpeakingSubmissions();
        }, error: function () {
            toastr.error("Không tải được câu hỏi");
        }
    });
    $.ajax({
        url: "/api/practice/user/session?sessionId=" + practice.sessionId, method: "GET", success: function (s) {
            updateSummaryFromSession(s);
        }
    });
}

function getLessonNameFromQuestion(q){
    function norm(v){ if(v==null) return ''; var s=String(v).trim(); if(s==='null'||s==='undefined') return ''; return s; }
    if(!q) return 'Ôn luyện';
    var candidates = [
        q.lessonName,
        q.lesson && (q.lesson.name || q.lesson.title || q.lesson.displayName),
        q.partName,
        q.sectionName,
        q.partTitle,
        q.sectionTitle
    ];
    for(var i=0;i<candidates.length;i++){
        var n = norm(candidates[i]);
        if(n) return n;
    }
    return 'Ôn luyện';
}

function buildLessonGrouping() {
    practice.byLesson = {};
    practice.lessonOrder = [];
    var defaultName = "Ôn luyện";
    practice.questions.forEach(function (q) {
        var lname = getLessonNameFromQuestion(q) || defaultName;
        if (!practice.byLesson[lname]) {
            practice.byLesson[lname] = [];
            practice.lessonOrder.push(lname);
        }
        practice.byLesson[lname].push(q);
    });
}

function getLessonFromGroup(lname){
    try{
        var list = practice.byLesson[lname] || [];
        for(var i=0;i<list.length;i++){
            var q = list[i];
            if(q && q.lesson){ return q.lesson; }
        }
    }catch(e){}
    return null;
}
function renderPracticeLessonContent(lesson){
    // Try to render from lesson if available; otherwise fallback from questions in current tab context
    var skill = String(lesson && lesson.skill || '').toUpperCase();
    var content = lesson && lesson.content || '';
    var linkFile = lesson && lesson.linkFile || '';

    // Fallback: if lesson missing OR lesson doesn't include content/media,
    // attempt to infer from the first question that belongs to this group.
    if((!skill || (skill!=='READING' && skill!=='LISTENING')) || (!content && !linkFile)){
        try{
            var qFallback = null;
            for(var i=0;i<practice.questions.length;i++){
                var q = practice.questions[i];
                // Prefer exact lessonId match
                if(lesson && lesson.id != null && q.lessonId != null && String(q.lessonId) === String(lesson.id)){
                    qFallback = q; break;
                }
                // Prefer same group name
                if(lesson && (getLessonNameFromQuestion(q) === (lesson.name||lesson.title||''))){ qFallback = q; break; }
                // Otherwise first Reading/Listening question
                var s = String(q.skill||'').toUpperCase();
                if(s==='READING' || s==='LISTENING'){ qFallback = q; break; }
            }
            if(qFallback){
                skill = String(qFallback.skill||skill||'').toUpperCase();
                // NEW preferred keys from backend
                content = content || qFallback.lessonContent || qFallback.content || qFallback.lessonBody || '';
                linkFile = linkFile || qFallback.lessonLinkFile || qFallback.linkFile || qFallback.audio || qFallback.mediaUrl || '';
            }
        }catch(e){}
    }

    if(skill === 'READING'){
        return content || '';
    }
    if(skill === 'LISTENING'){
        var html = '';
        if(linkFile){
            html += '<audio class="post-audio-item" controls style="width:100%">'
                 + '<source src="'+linkFile+'">Trình duyệt không hỗ trợ audio.</audio>';
        }
        if(content && String(content).trim().length>0){
            html += '<div class="mt-2 listening-extra">'+content+'</div>';
        }
        return html;
    }
    return content || '';
}

function renderTabs() {
    var tabsHtml = '';
    practice.lessonOrder.forEach(function (lname, idx) {
        tabsHtml += '<li class="nav-item" role="presentation">' +
            '<a class="nav-link ' + (idx === 0 ? 'active' : '') + '" data-bs-toggle="tab" href="#tab-' + idx + '" role="tab">' + lname + '</a></li>';
    });
    $('#practice-tabs').html(tabsHtml);
    var contentHtml = '';
    var globalIndex = 1;
    practice.lessonOrder.forEach(function (lname, idx) {
        var list = practice.byLesson[lname] || [];
        var lesson = getLessonFromGroup(lname);
        var skill = String((lesson && lesson.skill) || '').toUpperCase();
        // Prefer real numeric IDs if available to mirror lambaithi naming
        var lid = null;
        if(lesson && lesson.id != null) { lid = lesson.id; }
        if(lid == null){
            // Try extracting from questions: lessonId, sectionId, partId, etc.
            for(var i=0;i<list.length;i++){
                var q = list[i];
                if(q){
                    if(q.lessonId != null){ lid = q.lessonId; break; }
                    if(q.sectionId != null){ lid = q.sectionId; break; }
                    if(q.partId != null){ lid = q.partId; break; }
                    if(q.lesson && q.lesson.id != null){ lid = q.lesson.id; break; }
                }
            }
        }
        // derive a stable group key (prefer numeric id)
        var groupKey = (lid != null) ? String(lid) : ('idx' + idx);
        contentHtml += '<div class="tab-pane fade show ' + (idx === 0 ? 'active' : '') + '" id="tab-' + idx + '" role="tabpanel">';
        if(skill === 'SPEAKING'){
            // speaking: full width questions
            list.forEach(function (q) {
                q.globalIndex = globalIndex++;
                contentHtml += renderQuestionBlock(q);
            });
        } else {
            // reading/listening: left content, right questions
            contentHtml += '<div class="row">';
            // lambaithi-like IDs always include the section key
            var leftId = 'noidungds' + groupKey;
            contentHtml += '<div class="col-sm-7"><div class="noidungch" id="'+ leftId +'">'+ renderPracticeLessonContent(lesson) +'</div></div>';
            var rightId = 'dscauhoi' + groupKey;
            contentHtml += '<div class="col-sm-5"><div class="noidungctl" id="'+ rightId +'">';
            list.forEach(function (q) {
                q.globalIndex = globalIndex++;
                contentHtml += renderQuestionBlock(q);
            });
            contentHtml += '</div></div></div>';
        }
        contentHtml += '</div>';
    });
    $('#practice-content').html(contentHtml);
}

function isFillQuestion(q) {
    if (!q) return false;
    try{
        // normalize helper
        function norm(v){ return String(v||'').trim().toUpperCase(); }
        function isFillType(t){
            t = norm(t);
            // Support multiple backend variants
            return (
                t === 'FILL' ||
                t === 'FILL_TEXTAREA' ||
                t === 'FILL_TEXTAREA_VERIFICATION' ||
                t === 'TEXTAREA' ||
                t === 'ESSAY' ||
                t === 'SHORT_ANSWER' ||
                t === 'SHORTANSWER' ||
                t === 'OPEN' ||
                // some systems may include additional words
                t.includes('FILL') || t.includes('TEXTAREA') || t.includes('ESSAY') || t.includes('SHORT') || t.includes('OPEN')
            );
        }
        // explicit flags on question
        if (isFillType(q.questionType)) return true;
        if (isFillType(q.answerType)) return true;
        if (isFillType(q.type)) return true;
        // skills that commonly use text input (except SPEAKING)
        var skill = norm(q.skill);
        if (skill && skill !== 'SPEAKING'){
            // WRITING always text area when not answered
            if (skill === 'WRITING') return true;
            // READING/LISTENING with no options should show textarea input
            if ((skill === 'READING' || skill === 'LISTENING') && (!Array.isArray(q.answers) || q.answers.length === 0)) return true;
        }
        // check common nested places
        try{ if(isFillType(q.meta && q.meta.answerType)) return true; }catch(e){}
        try{ if(isFillType(q.extra && q.extra.answerType)) return true; }catch(e){}
        // answers array: check multiple possible keys and nested
        if (Array.isArray(q.answers) && q.answers.length>0) {
            // If there is any FILL-type answer among options, treat question as FILL
            var hasOption = false, hasFillOption = false;
            for(var i=0;i<q.answers.length;i++){
                var a = q.answers[i]; if(!a) continue; hasOption = true;
                var at = a.type || (a.meta && a.meta.type) || (a.extra && a.extra.type) || '';
                if(isFillType(at)) { hasFillOption = true; break; }
                try{
                    var at2 = (a.meta && a.meta.answerType) || (a.extra && a.extra.answerType) || '';
                    if(isFillType(at2)) { hasFillOption = true; break; }
                }catch(e){}
                // some APIs may leave answerType empty but use title with underscores or long blank markers
                var t = (a.title||''); if(/_{3,}/.test(t) || /\[blank]|\(blank\)/i.test(t)) { hasFillOption = true; break; }
            }
            if(hasFillOption) return true;
            // If there are options and none are fill-type, it's not a fill question
        } else {
            // No answers provided: likely FILL for non-speaking skills
            if (skill && skill !== 'SPEAKING') return true;
        }
        // title hint (Vietnamese / English)
        if(q.title && /Điền|chỗ\s*trống|fill|điền\s*vào|blank|blank\s*space/i.test(q.title)) return true;
    }catch(e){ /* ignore */ }
    return false;
}

function renderQuestionBlock(q) {
    var html = '<div class="singcauhoi" id="pq-' + q.id + '">';
    html += '<span class="thutuch">' + q.globalIndex + '</span>';
    // Show question text for non-Speaking skills
    if(q.skill !== 'SPEAKING') {
        html += ' <span>' + (q.title||'') + ((q.questionType && q.lesson && q.lesson.skill==='WRITING')? ' <span class="badge bg-info">Writing</span>' : '') + '</span>';
    }
    if(q.writingType){
        if(q.answered && q.answerText){
            html += '<div class="mt-2"><strong>Bài viết đã nộp:</strong><div class="p-2 border" style="white-space:pre-line">'+escapeHtml(q.answerText)+'</div>';
            if(q.graded){
                html+='<div class="mt-1"><strong>Trạng thái:</strong> <span class="badge bg-success">Đã chấm</span> <strong>Điểm:</strong> '+(q.manualScore!=null?q.manualScore:'-')+' <strong>Nhận xét:</strong> '+escapeHtml(q.feedback||'')+'</div>';
            } else {
                html+='<div class="mt-1"><strong>Trạng thái:</strong> <span class="badge bg-warning text-dark">Chờ chấm</span></div>';
            }
            html+='</div>';
        } else {
            html += '<div class="mt-2">'
                + '<textarea id="writingAns-'+q.id+'" class="form-control" rows="6" placeholder="Nhập bài viết..." oninput="captureWritingDraft('+q.id+')"></textarea>'
                + '</div>';
        }
    } else if(q.skill==='SPEAKING') {
        html += '<div class="mt-2">';
        if(q.linkAudio){ html += '<audio id="speakingQuestionAudio_'+q.id+'" controls style="width:100%"><source src="'+q.linkAudio+'" type="audio/mpeg">Trình duyệt không hỗ trợ audio.</audio>'; }

        // Nếu đã có answerText là URL audio (lưu từ PracticeSessionQuestion), hiển thị "Bài nói đã nộp"
        if(q.answerText && q.answerText.indexOf('http') === 0){
            html += '<div class="mt-2"><small>Bài nói đã nộp:</small>'+
                    '<audio controls style="width:100%"><source src="'+q.answerText+'" type="audio/mpeg">Trình duyệt không hỗ trợ audio.</audio></div>';
        }

        // Do NOT show question text for speaking
        html += '<small class="d-block mt-2">Ghi âm câu trả lời:</small>';
        html += '<button type="button" class="btn btn-sm btn-outline-danger d-inline-flex align-items-center mt-1" onclick="togglePracticeSpeakingRecording('+q.id+')" id="speakingRecordBtn_'+q.id+'"><i class="fa fa-microphone me-1"></i><span>Thu âm</span></button>';
        // Ẩn text trạng thái mặc định "Chưa ghi âm" khi chưa có bài ghi âm
        var speakingStatusText = (q.speakingSubmissions && q.speakingSubmissions.length>0)
            ? ('Đã có '+q.speakingSubmissions.length+' bài ghi âm')
            : '';
        html += '<div id="speakingRecordStatus_'+q.id+'" class="small text-muted mt-2">'+speakingStatusText+'</div>';
        // Latest submission player (if any)
        if(q.speakingSubmissions && q.speakingSubmissions.length>0){
            var latest = q.speakingSubmissions[0];
            var latestSrc = latest.id ? '/api/speaking/audio/'+latest.id : (latest.audioPath||'');
            html += '<div class="mt-3"><small>Bài nói mới nhất:</small><audio controls style="width:100%"><source src="'+latestSrc+'" type="audio/mpeg"></audio>';
            if(latest.durationSeconds){ html += '<div class="text-muted" style="font-size:0.8rem">Thời lượng: '+latest.durationSeconds+'s</div>'; }
            if(latest.createdDate){ html += '<div class="text-muted" style="font-size:0.7rem">Ghi lúc: '+formatDateTime(latest.createdDate)+'</div>'; }
            html += '</div>';
        }
        // List previous attempts (if >1)
        if(q.speakingSubmissions && q.speakingSubmissions.length>1){
            html += '<details class="mt-2"><summary class="small">Các lần ghi trước</summary>';
            for(var i=1;i<q.speakingSubmissions.length;i++){
                var sub = q.speakingSubmissions[i];
                var src = sub.id? '/api/speaking/audio/'+sub.id : (sub.audioPath||'');
                html += '<div class="mt-2"><audio controls style="width:100%"><source src="'+src+'" type="audio/mpeg"></audio>';
                if(sub.durationSeconds){ html+='<div class="text-muted" style="font-size:0.7rem">'+sub.durationSeconds+'s</div>'; }
                if(sub.createdDate){ html+='<div class="text-muted" style="font-size:0.7rem">'+formatDateTime(sub.createdDate)+'</div>'; }
                html+='</div>';
            }
            html += '</details>';
        }
        // Placeholder for immediate new upload preview
        html += '<div id="speakingSubmissionWrap_'+q.id+'" style="display:none" class="mt-3">';
        html += '<small>Bài nói vừa thu:</small><audio id="speakingSubmissionAudio_'+q.id+'" controls style="width:100%"><source src="" type="audio/webm"></audio></div>';
        html += '</div>';
    } else if(isFillQuestion(q)) {
        // Always render textarea when question is detected as FILL-type (for any skill except SPEAKING)
        html += '<div class="mt-2">';
        var fillVal = '';
        try{
            if(practice && practice.fillAnswers && practice.fillAnswers[q.id]) fillVal = practice.fillAnswers[q.id];
            else if(q.answerText) fillVal = q.answerText;
            else if(q.userAnswer) fillVal = q.userAnswer;
            else if(q.userFill) fillVal = q.userFill;
        }catch(e){ fillVal = ''; }
        function escTextarea(s){ if(!s) return ''; return String(s).replace(/</g,'&lt;').replace(/\r/g,'').replace(/\n/g,'\n'); }
        html += '<textarea id="fillAns-'+q.id+'" class="form-control" rows="3" placeholder="Nhập đáp án..." oninput="captureFillAnswer('+q.id+')">'+escTextarea(fillVal)+'</textarea>';
        html += '</div>';
        // Debug helper
        html += '<!-- FILL_RENDER_DEBUG: questionId='+q.id+' isFill=true -->';
        console && console.debug && console.debug('renderQuestionBlock: fill-question', q.id, q);
        // Render any non-FILL answer options (if present)
        if(q.answers && q.answers.length > 0){
            q.answers.forEach(function(a){
                if(!(a && String(a.answerType||'').toUpperCase() === 'FILL')){
                    var disabled = q.answered ? 'disabled' : '';
                    var extraClass = '';
                    if(q.answered){ if(a.isTrue){ extraClass=' text-success fw-bold'; } else if(q.selectedAnswerId===a.id){ extraClass=' text-danger'; } }
                    html += '<div class="singctl">'
                        + '<input type="radio" name="ans-'+q.id+'" '+disabled+' onclick="answerQuestion('+q.id+','+a.id+')">'
                        + '<label class="'+extraClass+'">'+(a.title||'')+'</label>'
                        + (q.answered && a.isTrue ? '<span class="badge bg-success ms-2">Đúng</span>' : '')
                        + '</div>';
                }
            });
        }
        if(q.answered){ html += '<div class="mt-1>'+ (q.correct?'<span class="text-success">Bạn trả lời đúng</span>':'<span class="text-danger">Bạn trả lời sai</span>')+'</div>'; }
        // Nếu là giáo viên chấm, hiển thị dropdown Đúng/Sai thay vì nhập điểm
        if(window.isPracticeGrading && q.answered){
            html += '<div class="mt-2"><label>Chấm kết quả: </label> <select id="gradeFill-'+q.id+'" class="form-select form-select-sm" style="width:auto;display:inline-block;">'
                + '<option value="1"' + (q.correct===true ? ' selected' : '') + '>Đúng</option>'
                + '<option value="0"' + (q.correct===false ? ' selected' : '') + '>Sai</option>'
                + '</select> <button class="btn btn-sm btn-primary" onclick="gradePracticeFill('+q.id+')">Lưu</button></div>';
        }
    } else {
        q.answers.forEach(function (a) {
            var disabled = q.answered ? 'disabled' : '';
            var extraClass='';
            if(q.answered){ if(a.isTrue){ extraClass=' text-success fw-bold'; } else if(q.selectedAnswerId===a.id){ extraClass=' text-danger'; } }
            html += '<div class="singctl">'
                + '<input type="radio" name="ans-'+q.id+'" '+disabled+' onclick="answerQuestion('+q.id+','+a.id+')">'
                + '<label class="'+extraClass+'">'+a.title+'</label>'
                + (q.answered && a.isTrue ? '<span class="badge bg-success ms-2">Đúng</span>' : '')
                + '</div>';
        });
        if(q.answered){ html += '<div class="mt-1">'+(q.correct?'<span class="text-success">Bạn trả lời đúng</span>':'<span class="text-danger">Bạn trả lời sai</span>')+'</div>'; }
        // Nếu là giáo viên chấm, hiển thị dropdown Đúng/Sai thay vì nhập điểm
        if(window.isPracticeGrading && q.answered){
            html += '<div class="mt-2"><label>Chấm kết quả: </label> <select id="gradeMCQ-'+q.id+'" class="form-select form-select-sm" style="width:auto;display:inline-block;">'
                + '<option value="1"' + (q.correct===true ? ' selected' : '') + '>Đúng</option>'
                + '<option value="0"' + (q.correct===false ? ' selected' : '') + '>Sai</option>'
                + '</select> <button class="btn btn-sm btn-primary" onclick="gradePracticeMCQ('+q.id+')">Lưu</button></div>';
        }
    }
    html += '</div>'; return html;
}

function escapeHtml(str){
    if(!str) return '';
    return str.replace(/</g,'&lt;');
}

// Ghi nháp viết thay vì auto-submit
function captureWritingDraft(psqId){
    var $ta=$('#writingAns-'+psqId); if(!$ta.length) return;
    var val=$ta.val(); practice.writingDrafts[psqId]=val;
    savePracticeLocalState();
    var q=practice.questions.find(x=>x.id===psqId); if(q){ q.draftAnswered = (val||'').trim().length>0; markWritingDraft(q); }
}
function markWritingDraft(q){ var $btn=$('#btn-q-'+q.id); if(!$btn.length) return; if(!q.answered){ $btn.removeClass('socauhoi-dung socauhoi-sai socauhoi-done'); if(q.draftAnswered){ $btn.addClass('socauhoi-done'); } } }

var fillSaveTimers = {};
function captureFillAnswer(qid) {
    var $ta = $('#fillAns-' + qid);
    if (!$ta.length) return;
    var val = $ta.val();
    practice.fillAnswers[qid] = val;
    savePracticeLocalState();
    // Debounce auto-save to server for FILL questions
    if(fillSaveTimers[qid]){ clearTimeout(fillSaveTimers[qid]); }
    fillSaveTimers[qid] = setTimeout(function(){
        autoSaveFillAnswer(qid, val);
    }, 600); // 600ms after stop typing
}
function autoSaveFillAnswer(qid, val){
    // Find question object to ensure it's FILL
    var q = practice.questions.find(x=>x.id===qid);
    if(!q) return;
    if(!q.questionType || !(/FILL|TEXTAREA|SHORT|ESSAY|OPEN/i.test(q.questionType))) return;
    var txt = (val||'').trim();
    if(txt.length===0){ // allow clearing; still send to keep consistency
        // Optionally skip sending empty; but we send so teacher sees 'Chưa nhập' replaced by blank
    }
    $.ajax({
        url:'/api/practice/user/answer-fill?psqId='+qid+'&answerText='+encodeURIComponent(txt),
        method:'POST',
        headers:{'Authorization':'Bearer '+token},
        success:function(updated){
            // update local question state
            if(updated && updated.answerText!==undefined){ q.answerText = updated.answerText; }
            if(updated && updated.answered){ q.answered = updated.answered; }
            if(updated && updated.correct!==undefined){ q.correct = updated.correct; }
            // Show saved indicator
            var id = 'fillSaved_'+qid;
            var $ind = $('#'+id);
            if(!$ind.length){ $ta.after('<div id="'+id+'" class="small text-success mt-1">Đã lưu</div>'); }
            else { $ind.text('Đã lưu'); $ind.removeClass('text-danger').addClass('text-success'); }
            setTimeout(function(){ $('#'+id).fadeOut(1000,function(){ $(this).remove(); }); }, 2500);
        },
        error:function(){
            var id = 'fillSaved_'+qid;
            var $ind = $('#'+id);
            if(!$ind.length){ $ta.after('<div id="'+id+'" class="small text-danger mt-1">Lỗi lưu</div>'); }
            else { $ind.text('Lỗi lưu').removeClass('text-success').addClass('text-danger'); }
            setTimeout(function(){ $('#'+id).fadeOut(2000,function(){ $(this).remove(); }); }, 3000);
        }
    });
}

function renderSidebarLessonButtons() {
    var html='<div class="singlelesson"><div style="display:flex;flex-wrap:wrap;gap:5px;">';
    var idx=1; practice.questions.forEach(function(q){
        var cls='socauhoi';
        if(practice.completed){ cls+=' socauhoi-done'; }
        else if(q.answered){
            if(q.writingType){ cls+=' socauhoi-done'; }
            else if(q.correct===true){ cls+=' socauhoi-dung'; }
            else if(q.correct===false){ cls+=' socauhoi-sai'; }
        } else if(q.writingType && q.draftAnswered){ cls+=' socauhoi-done'; }
        html+='<button id="btn-q-'+q.id+'" class="'+cls+'" onclick="scrollToQuestion('+q.id+')">'+(idx++)+'</button>';
    });
    html+='</div></div>'; $('#listlessonpractice').html(html);
}

function markQuestionAnswered(q){
    var $btn = $('#btn-q-' + q.id);
    if(!$btn.length) return;
    $btn.removeClass('socauhoi-dung socauhoi-sai socauhoi-writing socauhoi-done');
    if(q.writingType){
        $btn.addClass('socauhoi-done');
    } else if(q.correct === true){
        $btn.addClass('socauhoi-dung');
    } else if(q.correct === false){
        $btn.addClass('socauhoi-sai');
    }
}

function scrollToQuestion(qid) {
    var el = document.getElementById('pq-' + qid);
    if (el) {
        el.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
}

function answerQuestion(psqId, answerId) {
    var q = practice.questions.find(x => x.id === psqId);
    if (q.answered) {
        return;
    }
    $.ajax({
        url: '/api/practice/user/answer?psqId=' + psqId + '&answerId=' + answerId,
        method: 'POST',
        headers: {'Authorization': 'Bearer ' + token},
        success: function (updated) {
            q.answered = true;
            q.correct = updated.correct;
            q.selectedAnswerId = updated.selectedAnswerId;
            $('#pq-' + q.id).replaceWith(renderQuestionBlock(q));
            markQuestionAnswered(q); // immediate color update
            updateSessionAndSidebar();
        },
        error: function () {
            toastr.error('Không gửi được đáp án');
        }
    });
}

function updateSessionAndSidebar() {
    $.ajax({
        url: "/api/practice/user/session?sessionId=" + practice.sessionId,
        method: "GET",
        headers: {'Authorization': 'Bearer ' + token},
        success: function (s) {
            updateSummaryFromSession(s);
        }
    });
    renderSidebarLessonButtons();
}

var practiceTimerInterval = null;
var practiceStartTime = null; // timestamp when current run started
var practiceElapsed = 0; // accumulated seconds while active
var practicePaused = false;

function startPracticeTimer(){
    if(practiceTimerInterval){ clearInterval(practiceTimerInterval); }
    if(!practiceStartTime){ practiceStartTime = Date.now(); }
    practicePaused = false;
    practiceTimerInterval = setInterval(updatePracticeTimerDisplay, 1000);
    updatePracticeTimerDisplay();
}
function updatePracticeTimerDisplay(){
    if(practicePaused){ return; }
    var base = practiceStartTime ? Math.floor((Date.now() - practiceStartTime)/1000) : 0;
    var total = practiceElapsed + base;
    renderTimer(total);
}
function renderTimer(total){
    var m = Math.floor(total/60); var s = total%60;
    $('#practiceTimer').text((m<10?'0'+m:m)+':' + (s<10?'0'+s:s));
}
function pausePracticeTimer(){
    if(practicePaused) return;
    // accumulate time so far
    if(practiceStartTime){
        practiceElapsed += Math.floor((Date.now() - practiceStartTime)/1000);
        practiceStartTime = null;
    }
    practicePaused = true;
    $('#practiceTimer').addClass('paused');
    renderTimer(practiceElapsed);
}
function resumePracticeTimer(){
    if(!practicePaused) return;
    practicePaused = false;
    $('#practiceTimer').removeClass('paused');
    practiceStartTime = Date.now();
    updatePracticeTimerDisplay();
}
function stopPracticeTimer(){
    // finalize accumulation
    if(practiceStartTime){
        practiceElapsed += Math.floor((Date.now() - practiceStartTime)/1000);
        practiceStartTime = null;
    }
    if(practiceTimerInterval){ clearInterval(practiceTimerInterval); practiceTimerInterval=null; }
    practicePaused = false; // freeze display but not in paused style
    $('#practiceTimer').removeClass('paused');
    renderTimer(practiceElapsed);
}

function updateSummaryFromSession(s) {
    practice.examId = s.examId; practice.mode='ALL_RANDOM'; practice.completed = s.completed;
    // Xác định tiêu đề trực tiếp từ DTO (examName mới được backend gửi về)
    var title = s.examName || s.name || s.examTitle || s.examName || '';
    if(!title && practice.questions && practice.questions.length>0){
        var firstQ = practice.questions[0];
        title = firstQ.examName || firstQ.lessonName || '';
    }
    $('#tieudeonluyen_center').text(title);
    document.title = title;

    // Thống kê
    var localAnswered = practice.questions.filter(q=>q.answered).length;
    var shownAnswered = Math.max(s.numAnswered||0, localAnswered);
    var total = s.totalQuestions||practice.questions.length||0;
    var numCorrect = s.numCorrect||practice.questions.filter(q=>q.correct===true).length;
    // Tính số bài viết đã nộp (answerText) để loại khỏi sai
    var localWritingAnswered = practice.questions.filter(q=>q.questionType && q.lesson && q.lesson.skill==='WRITING' && q.answerText && q.answerText.trim().length>0).length;
    var writingAnswered = s.writingAnswered!=null? s.writingAnswered : localWritingAnswered;
    var wrongCount = shownAnswered - numCorrect - writingAnswered; if(wrongCount < 0) wrongCount = 0;
    $('#summary').html('<b>'+shownAnswered+'/'+total+'</b> đã trả lời - Đúng: '+numCorrect);
    $('#sodadung').text(numCorrect);
    $('#sodasai').text(wrongCount); // loại writing khỏi sai
    $('#socc').text(total - shownAnswered);
    var pct = (total>0)?(shownAnswered*100/total):0; $('#practiceProgressBar').css('width',pct+'%'); $('#practiceProgressText').text(shownAnswered+'/'+total);
    if(!s.completed){ $('#btnSubmitPractice').prop('disabled', false).text('Nộp bài ôn luyện'); }
    if(s.completed){ $('#ketqualam').show(); $('#btnSubmitPractice').prop('disabled', true).text('Đã nộp'); $('#btnViewPracticeResult').show(); stopPracticeTimer(); }
    if(s.writingTotal && s.writingTotal>0){
        // tính các trạng thái chấm bài viết
        var gradedWriting = practice.questions.filter(q=>q.questionType && q.lesson && q.lesson.skill==='WRITING' && q.graded).length;
        var waitingReview = writingAnswered - gradedWriting; if(waitingReview<0) waitingReview=0;
        // Bỏ phần text "Chưa nộp" để không hiển thị trạng thái chưa trả lời, chỉ giữ thông tin đã nộp/chờ chấm/đã chấm
        $('#summary').append(`<div class='mt-1'><strong>Writing:</strong> Đã nộp: ${writingAnswered}/${s.writingTotal} - Chờ chấm: ${waitingReview} - Đã chấm: ${gradedWriting}</div>`);
    }
    renderSidebarLessonButtons();
}

// Hook into lifecycle
$(window).on('blur', function(){ pausePracticeTimer(); });
$(window).on('focus', function(){ resumePracticeTimer(); });

function submitPractice(){
    if(!window.practice || !practice.sessionId){ toastr.error('Không tìm thấy phiên'); return; }
    swal({
        title: 'Xác nhận nộp bài',
        text: 'Bạn có chắc chắn muốn nộp bài ôn luyện không? Sau khi nộp bạn sẽ không thể thay đổi câu trả lời nữa.',
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Nộp bài',
        cancelButtonText: 'Hủy',
        closeOnConfirm: false,
        closeOnCancel: true
    }, function(isConfirm){
        if(!isConfirm){ return; }
        $('#btnSubmitPractice').prop('disabled', true).text('Đang nộp...');
        submitWritingDrafts(function(hadError){
            if(hadError){
                swal.close();
                $('#btnSubmitPractice').prop('disabled', false).text('Nộp bài ôn luyện');
                return;
            }
            // Ensure we collect current textarea values even if oninput wasn't triggered
            try{
                var textareas = document.querySelectorAll('textarea[id^="fillAns-"]');
                textareas.forEach(function(ta){
                    var id = ta.id.replace('fillAns-','');
                    if(id){ practice.fillAnswers[id] = ta.value; }
                });
            } catch(e){ /* ignore */ }
            var fillSubmits = [];
            for(var qid in practice.fillAnswers){
                if(practice.fillAnswers.hasOwnProperty(qid)){
                    var val = practice.fillAnswers[qid];
                    if(val && val.trim().length > 0){
                        fillSubmits.push({ questionId: Number(qid), answerText: val });
                    }
                }
            }
            $.ajax({
                url: '/api/practice/user/finish?sessionId='+practice.sessionId,
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token },
                data: JSON.stringify({ fills: fillSubmits }),
                contentType: 'application/json',
                success: function(){
                    swal.close();
                    window.location.href = 'ketquaonluyen?sessionId=' + practice.sessionId;
                },
                error: function(xhr){
                    swal.close();
                    if(xhr.responseJSON && xhr.responseJSON.defaultMessage){
                        toastr.warning(xhr.responseJSON.defaultMessage);
                    } else {
                        toastr.error('Nộp bài thất bại');
                    }
                    updateSessionAndSidebar();
                    $('#btnSubmitPractice').prop('disabled', false).text('Nộp bài ôn luyện');
                }
            });
        });
    });
}

function submitWritingDrafts(onAllDone){
    // Chỉ gửi các câu thuộc kỹ năng WRITING (theo DTO backend) và chưa được đánh dấu answered
    var pending = practice.questions.filter(function(q){
        var skill = (q.skill || '').toString().toUpperCase();
        var isWritingSkill = skill === 'WRITING';
        var hasWritingType = !!q.writingType; // backend set writingType cho câu writing
        return (isWritingSkill || hasWritingType) && !q.answered;
    });
    var calls = [];
    var hadError = false;
    pending.forEach(function(q){
        var txt = practice.writingDrafts[q.id];
        if(txt){ txt = txt.trim(); }
        if(txt && txt.length>0){
            calls.push(
                $.ajax({
                    url:'/api/practice/user/answer-writing?psqId='+q.id+'&answerText='+encodeURIComponent(txt),
                    method:'POST',
                    headers:{'Authorization':'Bearer '+token},
                    success:function(updated){
                        q.answered = true;
                        q.answerText = txt;
                        q.questionType = updated.questionType;
                        q.graded = updated.graded;
                        q.manualScore = updated.manualScore;
                        q.feedback = updated.feedback;
                        $('#pq-'+q.id).replaceWith(renderQuestionBlock(q));
                        markQuestionAnswered(q);
                    },
                    error:function(){ hadError = true; }
                })
            );
        }
    });
    if(calls.length===0){ onAllDone(false); return; }
    $.when.apply($, calls).always(function(){
        if(hadError){ toastr.warning('Một số bài viết chưa gửi được.'); }
        updateSessionAndSidebar();
        onAllDone(hadError);
    });
}

function viewPracticeResult(){
    if(!practice || !practice.sessionId){ toastr.error('Không tìm thấy phiên'); return; }
    window.location.href = 'ketquaonluyen?sessionId=' + practice.sessionId;
}

var practiceSpeakingRecorders = {};
async function togglePracticeSpeakingRecording(questionId){
    var rec = practiceSpeakingRecorders[questionId];
    if(rec && rec.mediaRecorder && rec.mediaRecorder.state==='recording'){ stopAndUploadPracticeSpeaking(questionId); return; }
    await startPracticeSpeakingRecording(questionId);
}
async function startPracticeSpeakingRecording(questionId){
    (async function(){
        try{
            if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ toastr.error('Trình duyệt không hỗ trợ ghi âm'); return; }
            const existing = practiceSpeakingRecorders[questionId];
            if(existing && existing.mediaRecorder && existing.mediaRecorder.state==='recording'){ return; }
            const stream = await navigator.mediaDevices.getUserMedia({audio:true});
            const mediaRecorder = new MediaRecorder(stream);
            const chunks = [];
            mediaRecorder.ondataavailable = e=>{ if(e.data && e.data.size>0) chunks.push(e.data); };
            mediaRecorder.onstart = ()=>{ setPracticeSpeakingStatus(questionId,'Đang ghi âm...'); updatePracticeSpeakingRecordButton(questionId,true); };
            mediaRecorder.onstop = ()=>{ setPracticeSpeakingStatus(questionId,'Đang lưu...'); };
            const MAX_SECONDS = 120;
            const timeoutId = setTimeout(()=>{ try{ if(mediaRecorder.state==='recording'){ stopAndUploadPracticeSpeaking(questionId); } }catch(e){} }, MAX_SECONDS*1000);
            practiceSpeakingRecorders[questionId] = { mediaRecorder, chunks, stream, timeoutId };
            mediaRecorder.start();
        }catch(e){ console.error(e); toastr.error('Không truy cập được micro'); }
    })();
}
async function stopAndUploadPracticeSpeaking(questionId){
    var rec = practiceSpeakingRecorders[questionId];
    if(!rec || !rec.mediaRecorder || rec.mediaRecorder.state!=='recording'){
        // Không hiển thị trạng thái "Chưa bắt đầu" để tránh cảm giác chưa làm; chỉ reset nút thu âm
        updatePracticeSpeakingRecordButton(questionId,false);
        return;
    }
    try{ if(rec.timeoutId) clearTimeout(rec.timeoutId); }catch(e){}
    rec.mediaRecorder.stop();
    if(rec.stream){ rec.stream.getTracks().forEach(t=>t.stop()); }
    setTimeout(()=>{ uploadPracticeSpeaking(questionId); }, 300);
}
async function uploadPracticeSpeaking(questionId){
    try{
        var rec = practiceSpeakingRecorders[questionId];
        if(!rec || !rec.chunks || rec.chunks.length===0){
            // Không hiện "Chưa có dữ liệu" nữa, chỉ reset nút
            updatePracticeSpeakingRecordButton(questionId,false);
            return;
        }
        var blob = new Blob(rec.chunks,{type:'audio/webm'});
        if(!practice || !practice.sessionId){ setPracticeSpeakingStatus(questionId,'Không tìm thấy session'); updatePracticeSpeakingRecordButton(questionId,false); return; }
        var token = localStorage.getItem('token');
        if(!token){ toastr.error('Chưa đăng nhập'); updatePracticeSpeakingRecordButton(questionId,false); return; }

        // Trong API /api/practice/user/questions, id của phần tử chính là id của practice_session_question
        var psqId = questionId;

        var formData = new FormData();
        formData.append('practiceSessionQuestionId', psqId);
        formData.append('audio', blob, 'practice_speaking_'+questionId+'.webm');
        setPracticeSpeakingStatus(questionId,'Đang tải lên...');

        // Luồng ôn luyện speaking: luôn lưu qua PracticeSessionQuestionService
        var url = '/api/speaking/upload-cloud-practice-question';
        const response = await fetch(url, { method:'POST', headers:new Headers({'Authorization':'Bearer '+token}), body: formData });
        let result; const ct = response.headers.get('content-type')||'';
        try{ if(ct.includes('application/json')){ result = await response.json(); } else { const t = await response.text(); result = {error:t}; } }catch(parseErr){ result = {error:'Không đọc được phản hồi'}; }
        if(!response.ok){ var msg = (result && (result.error||result.message||result.defaultMessage)) || 'Lỗi upload'; setPracticeSpeakingStatus(questionId,msg); updatePracticeSpeakingRecordButton(questionId,false); return; }
        setPracticeSpeakingStatus(questionId,'Đã ghi âm xong'); updatePracticeSpeakingRecordButton(questionId,false);

        var audioEl = document.getElementById('speakingSubmissionAudio_'+questionId);
        if(audioEl){
            var src = null;
            // response là PracticeSessionQuestion, URL audio được lưu trong answerText
            if(result && result.answerText){ src = result.answerText; }
            if(src){
                var source = audioEl.querySelector('source');
                if(source){ source.src = src; audioEl.load(); }
                var wrap = document.getElementById('speakingSubmissionWrap_'+questionId);
                if(wrap) wrap.style.display='block';
            }
        }

        var q2 = practice.questions.find(function(x){ return x.id===questionId; });
        if(q2){
            // cập nhật trạng thái answered để sidebar đổi màu
            q2.answered = true;
            // đồng bộ answerText = URL audio (phục vụ hiển thị khác nếu cần)
            if(result && result.answerText){ q2.answerText = result.answerText; }
            $('#pq-'+q2.id).replaceWith(renderQuestionBlock(q2));
            markQuestionAnswered(q2);
        }
        updateSessionAndSidebar();
        practiceSpeakingRecorders[questionId].chunks = [];
    }catch(e){ console.error(e); setPracticeSpeakingStatus(questionId,'Đã ghi âm xong'); updatePracticeSpeakingRecordButton(questionId,false); }
}
function setPracticeSpeakingStatus(questionId,text){ var el=document.getElementById('speakingRecordStatus_'+questionId); if(el){ el.innerText=text; } }
function updatePracticeSpeakingRecordButton(questionId,isRecording){ var btn=document.getElementById('speakingRecordBtn_'+questionId); if(!btn) return; var icon=btn.querySelector('i'); var label=btn.querySelector('span'); if(isRecording){ btn.classList.remove('btn-outline-danger'); btn.classList.add('btn-outline-secondary'); if(icon){ icon.classList.remove('fa-microphone'); icon.classList.add('fa-stop'); } if(label){ label.textContent='Dừng & lưu'; } } else { btn.classList.remove('btn-outline-secondary'); btn.classList.add('btn-outline-danger'); if(icon){ icon.classList.remove('fa-stop'); icon.classList.add('fa-microphone'); } if(label){ label.textContent='Thu âm'; } } }

function gradePracticeFill(qid){
    var sel = document.getElementById('gradeFill-'+qid);
    if(!sel) return;
    var val = sel.value === '1';
    $.ajax({
        url:'/api/practice/admin/grade-fill?psqId='+qid+'&correct='+(val?'true':'false'),
        method:'POST',
        headers:{'Authorization':'Bearer '+token},
        success:function(updated){
            var q = practice.questions.find(x=>x.id===qid);
            if(q){ q.correct = updated.correct; q.answered = true; $('#pq-'+q.id).replaceWith(renderQuestionBlock(q)); markQuestionAnswered(q); updateSessionAndSidebar(); }
            toastr.success('Đã lưu kết quả');
        },
        error:function(){ toastr.error('Lỗi khi lưu kết quả'); }
    });
}
function gradePracticeMCQ(qid){
    var sel = document.getElementById('gradeMCQ-'+qid);
    if(!sel) return;
    var val = sel.value === '1';
    $.ajax({
        url:'/api/practice/admin/grade-mcq?psqId='+qid+'&correct='+(val?'true':'false'),
        method:'POST',
        headers:{'Authorization':'Bearer '+token},
        success:function(updated){
            var q = practice.questions.find(x=>x.id===qid);
            if(q){ q.correct = updated.correct; q.answered = true; $('#pq-'+q.id).replaceWith(renderQuestionBlock(q)); markQuestionAnswered(q); updateSessionAndSidebar(); }
            toastr.success('Đã lưu kết quả');
        },
        error:function(){ toastr.error('Lỗi khi lưu kết quả'); }
    });
}
function gradePracticeSpeaking(psqId, score, feedback){
    return $.ajax({
        url: '/api/practice/admin/grade-skill?psqId='+psqId+'&score='+encodeURIComponent(score)+'&feedback='+encodeURIComponent(feedback||''),
        method: 'POST',
        headers:{'Authorization':'Bearer '+token}
    });
}

// When rendering grading history (for example, in a modal or table), update the score display:
function renderGradingHistoryRow(h) {
  let scoreDisplay = '';
  if(h.skill === 'READING' || h.skill === 'LISTENING') {
    if(h.score === 1) scoreDisplay = 'Đúng';
    else if(h.score === 0) scoreDisplay = 'Sai';
    else scoreDisplay = '';
  } else {
    scoreDisplay = h.score ?? '';
  }
  return `<tr><td>${h.gradedAt}</td><td>${scoreDisplay}</td><td>${h.feedback||''}</td><td>${h.graderName||''}</td></tr>`;
}

// In the function that renders the grading history table, replace direct usage of h.score with renderGradingHistoryRow(h)

function loadPracticeSpeakingSubmissions(){
    // Placeholder: prevent undefined function error blocking rendering
    // If needed, implement fetching speaking submissions per question and update practice.questions
    try{ /* no-op */ }catch(e){}
}
