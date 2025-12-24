var listLesson = null;
var fillAnswers = [];

async function getAllLesson() {
    var lessons = getparamNameMultiValues("lesson");
    var url = 'https://lmsdtm-production.up.railway.app/api/lesson/public/find-by-list-id';
    const response = await fetch(url, {
        method: 'POST',
        headers: new Headers({
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify(lessons)
    });
    var list = await response.json();
    // Build global question number map ascending by id
    const allQuestions = [];
    for (let li = 0; li < list.length; li++) {
        const qs = list[li].questions || [];
        qs.sort((a,b)=>a.id-b.id);
        for (let qi=0; qi<qs.length; qi++) {
            allQuestions.push(qs[qi]);
        }
    }
    allQuestions.sort((a,b)=>a.id-b.id);
    const questionNumberById = {};
    for (let i=0;i<allQuestions.length;i++){ questionNumberById[allQuestions[i].id] = i+1; }
    window.questionNumberById = questionNumberById;
    listLesson = list;

    // Build right sidebar buttons
    let mainList = '';
    for (let i = 0; i < list.length; i++) {
        const listch = list[i].questions || [];
        let ls = '';
        for (let j=0;j<listch.length;j++) {
            const num = questionNumberById[listch[j].id] || (j+1);
            ls += `<button onclick="moTab(${list[i].id})" id="btnch${listch[j].id}" class="socauhoi">${num}</button>`;
        }
        mainList += `<div class="singlelesson"><strong>${list[i].name}</strong><div>${ls}</div></div>`;
    }
    const listLessonEl = document.getElementById("listlesson");
    if (listLessonEl) listLessonEl.innerHTML = mainList;

    // Build tabs
    let mainTabs = '';
    for (let i = 0; i < list.length; i++) {
        mainTabs += `<li class="nav-item" role="presentation">
        <a class="nav-link ${i === 0 ? 'active' : ''}" id="ex1-tab-${list[i].id}" data-bs-toggle="tab" href="#ex1-tabs-${list[i].id}" role="tab" aria-controls="ex1-tabs-${list[i].id}" aria-selected="${i === 0 ? 'true' : 'false'}">${list[i].name}</a>
      </li>`
    }
    const tabsEl = document.getElementById("ex1-listtab");
    if (tabsEl) tabsEl.innerHTML = mainTabs;

    // Prepare tab content containers (empty initially except active)
    let maindiv = '';
    for (let i = 0; i < list.length; i++) {
        const isActive = i === 0;
        if (list[i].skill === 'SPEAKING') {
            maindiv += `<div class="tab-pane fade ${isActive ? 'show active' : ''}" id="ex1-tabs-${list[i].id}" role="tabpanel" aria-labelledby="ex1-tab-${list[i].id}">
                <div class="row">
                    <div class="col-sm-12">
                        <div class="noidungctl" id="dscauhoi${list[i].id}">${isActive ? renderLessonQuestionsHTML(list[i]) : ''}</div>
                    </div>
                </div>
            </div>`;
        } else {
            maindiv += `<div class="tab-pane fade ${isActive ? 'show active' : ''}" id="ex1-tabs-${list[i].id}" role="tabpanel" aria-labelledby="ex1-tab-${list[i].id}">
                <div class="row">
                    <div class="col-sm-7">
                        <div class="noidungch" id="noidungds${list[i].id}">${isActive ? renderLessonContentHTML(list[i]) : ''}</div>
                    </div>
                    <div class="col-sm-5">
                        <div class="noidungctl" id="dscauhoi${list[i].id}">${isActive ? renderLessonQuestionsHTML(list[i]) : ''}</div>
                    </div>
                </div>
            </div>`;
        }
    }
    const contentEl = document.getElementById("ex1-content");
    if (contentEl) contentEl.innerHTML = maindiv;

    // Initialize active tab features
    initSpeakingAudioEvents();
    attachInputHighlightListeners();

    // Lazy render for other tabs on first activation
    tabsEl && tabsEl.addEventListener('click', function(evt){
        const anchor = evt.target.closest('a.nav-link');
        if(!anchor) return;
        const idAttr = anchor.getAttribute('id'); // ex1-tab-<lessonId>
        if(!idAttr) return;
        const lessonId = parseInt(idAttr.replace('ex1-tab-',''));
        lazyRenderLesson(lessonId);
    });
}

// Helper: determine if question should use FILL (textarea) mode
function isFillQuestion(question) {
    if (!question) return false;
    // Ưu tiên questionType = FILL nếu được set đúng từ backend
    if (question.questionType && String(question.questionType).toUpperCase() === 'FILL') {
        return true;
    }
    // Fallback: dựa vào answerType = FILL trong danh sách đáp án
    var answers = question.answers || [];
    try {
        return answers.some(function (a) {
            return a && String(a.answerType || '').toUpperCase() === 'FILL';
        });
    } catch (e) {
        console.warn('isFillQuestion check error', e);
        return false;
    }
}

// Helper: render questions HTML for a lesson
function renderLessonQuestionsHTML(lesson){
    const listch = (lesson.questions || []).slice().sort((a,b)=>a.id-b.id);
    let html = '';
    for (let j = 0; j < listch.length; j++) {
        const q = listch[j];
        const num = (window.questionNumberById && window.questionNumberById[q.id]) ? window.questionNumberById[q.id] : (j+1);
        if (lesson.skill === 'SPEAKING') {
            html += `<div class="singcauhoi speaking-block" id="singcauhoi${q.id}"><span class="thutuch">${num}</span><div class="mt-2"><audio id="speakingQuestionAudio_${q.id}" class="post-audio-item question-audio" controls style="width:100%;" data-question-id="${q.id}"><source src="${q.linkAudio || ''}" type="audio/mpeg">Trình duyệt không hỗ trợ audio.</audio><div class="mt-2"><small>Ghi âm câu trả lời:</small><br><button type="button" id="speakingRecordBtn_${q.id}" class="btn btn-sm btn-outline-danger d-inline-flex align-items-center mt-1" onclick="toggleSpeakingRecording(${q.id})"><i class="fa fa-microphone me-1"></i><span>Thu âm</span></button><div id="speakingRecordStatus_${q.id}" class="text-muted mt-1" style="font-size:0.85rem;"></div></div><div class="mt-2" id="speakingSubmissionWrap_${q.id}" style="display:none;"><small>Bài nói của bạn:</small><audio id="speakingSubmissionAudio_${q.id}" class="post-audio-item submission-audio" controls style="width:100%;" data-question-id="${q.id}"><source src="" type="audio/mpeg">Trình duyệt không hỗ trợ audio.</audio></div></div></div>`;
            continue;
        }
        const listctl = q.answers || [];
        const hasFill = isFillQuestion(q);
        if (lesson.skill === 'WRITING') {
            const wType = q.writingType ? `<span class='badge bg-secondary ms-2'>${q.writingType}</span>` : '';
            const dsctlWriting = `<div class="writing-answer"><textarea id="writing_${q.id}" class="form-control writing-answer" data-question-id="${q.id}" rows="6" placeholder="Nhập bài viết..."></textarea></div>`;
            html += `<div class="singcauhoi" id="singcauhoi${q.id}"><span class="thutuch">${num}</span> <span class="titlech">${q.title} <span class="badge bg-info">Writing</span>${wType}</span>${dsctlWriting}</div>`;
            continue;
        }
        let dsctl = '';
        if (hasFill) {
            dsctl = `<div class="fill-answer-wrapper"><textarea class="form-control fill-answer" data-question-id="${q.id}" id="fill_${q.id}" rows="3" placeholder="Nhập đáp án..."></textarea></div>`;
        } else {
            for (let k=0;k<listctl.length;k++) {
                dsctl += `<span class="singctl" id="singctl${listctl[k].id}"><input value="${listctl[k].id}" onchange="setBGbutton(${q.id})" type="radio" name="dapanctl${q.id}" id="dpan${listctl[k].id}"> <label for="dpan${listctl[k].id}"> ${listctl[k].title}</label></span>`;
            }
        }
        html += `<div class="singcauhoi" id="singcauhoi${q.id}"><span class="thutuch">${num}</span> <span class="titlech">${q.title}</span>${dsctl}</div>`;
    }
    return html;
}

// Helper: render content HTML (reading/listening) for a lesson
function renderLessonContentHTML(lesson){
    if (lesson.skill === 'READING') {
        return lesson.content || '';
    }
    if (lesson.skill === 'LISTENING') {
        let contentHtml = '';
        if (lesson.content && lesson.content.trim().length > 0) {
            contentHtml = `<div class="mt-2 listening-extra">${lesson.content}</div>`;
        }
        return `<audio class="post-audio-item" controls>
                <source src="${lesson.linkFile}">
                Your browser does not support the audio element.
            </audio>${contentHtml}`;
    }
    return '';
}

// Lazy render on demand
function lazyRenderLesson(lessonId){
    if(!listLesson) return;
    const lesson = listLesson.find(l=>l.id === lessonId);
    if(!lesson) return;
    const qWrap = document.getElementById('dscauhoi'+lessonId);
    const contentWrap = document.getElementById('noidungds'+lessonId);
    // Only render if empty to avoid re-rendering
    if(qWrap && qWrap.children.length === 0){
        qWrap.innerHTML = renderLessonQuestionsHTML(lesson);
        initSpeakingAudioEvents();
        attachInputHighlightListeners();
    }
    if(contentWrap && contentWrap.children.length === 0){
        contentWrap.innerHTML = renderLessonContentHTML(lesson);
    }
}

async function loadCauHoiDiv() {
    for (let i = 0; i < listLesson.length; i++) {
        var mainCauHoi = '';
        var listch = (listLesson[i].questions || []).slice().sort((a,b)=>a.id-b.id);
        for (let j = 0; j < listch.length; j++) {
            const q = listch[j];
            const num = (window.questionNumberById && window.questionNumberById[q.id]) ? window.questionNumberById[q.id] : (j+1);
            if (listLesson[i].skill === 'SPEAKING') {
                mainCauHoi += `<div class="singcauhoi speaking-block" id="singcauhoi${q.id}"><span class="thutuch">${num}</span><div class="mt-2"><audio id="speakingQuestionAudio_${q.id}" class="post-audio-item question-audio" controls style="width:100%;" data-question-id="${q.id}"><source src="${q.linkAudio || ''}" type="audio/mpeg">Trình duyệt không hỗ trợ audio.</audio><div class="mt-2"><small>Ghi âm câu trả lời:</small><br><button type="button" id="speakingRecordBtn_${q.id}" class="btn btn-sm btn-outline-danger d-inline-flex align-items-center mt-1" onclick="toggleSpeakingRecording(${q.id})"><i class="fa fa-microphone me-1"></i><span>Thu âm</span></button><div id="speakingRecordStatus_${q.id}" class="text-muted mt-1" style="font-size:0.85rem;"></div></div><div class="mt-2" id="speakingSubmissionWrap_${q.id}" style="display:none;"><small>Bài nói của bạn:</small><audio id="speakingSubmissionAudio_${q.id}" class="post-audio-item submission-audio" controls style="width:100%;" data-question-id="${q.id}"><source src="" type="audio/mpeg">Trình duyệt không hỗ trợ audio.</audio></div></div></div>`;
                continue;
            }
            const listctl = q.answers || [];
            const hasFill = isFillQuestion(q);
            if (listLesson[i].skill === 'WRITING') {
                const wType = q.writingType ? `<span class='badge bg-secondary ms-2'>${q.writingType}</span>` : '';
                const dsctlWriting = `<div class="writing-answer"><textarea id="writing_${q.id}" class="form-control writing-answer" data-question-id="${q.id}" rows="6" placeholder="Nhập bài viết..."></textarea></div>`;
                mainCauHoi += `<div class="singcauhoi" id="singcauhoi${q.id}"><span class="thutuch">${num}</span> <span class="titlech">${q.title} <span class="badge bg-info">Writing</span>${wType}</span>${dsctlWriting}</div>`;
                continue;
            }
            let dsctl = '';
            if (hasFill) {
                dsctl = `<div class="fill-answer-wrapper"><textarea class="form-control fill-answer" data-question-id="${q.id}" id="fill_${q.id}" rows="3" placeholder="Nhập đáp án..."></textarea></div>`;
            } else {
                for (let k=0;k<listctl.length;k++) {
                    dsctl += `<span class="singctl" id="singctl${listctl[k].id}"><input value="${listctl[k].id}" onchange="setBGbutton(${q.id})" type="radio" name="dapanctl${q.id}" id="dpan${listctl[k].id}"> <label for="dpan${listctl[k].id}"> ${listctl[k].title}</label></span>`;
                }
            }
            mainCauHoi += `<div class="singcauhoi" id="singcauhoi${q.id}"><span class="thutuch">${num}</span> <span class="titlech">${q.title}</span>${dsctl}</div>`;
        }
        document.getElementById("dscauhoi" + listLesson[i].id).innerHTML = mainCauHoi;
    }
    initSpeakingAudioEvents();
    attachInputHighlightListeners(); // NEW: highlight buttons on user input for fill & writing
}

function attachInputHighlightListeners(){
    try {
        // Fill inputs/areas (listening/reading/etc with FILL answer type)
        var fillInputs = document.querySelectorAll('.fill-answer');
        fillInputs.forEach(function(inp){
            var qid = parseInt(inp.getAttribute('data-question-id') || inp.id.replace('fill_',''));
            inp.addEventListener('input', function(){
                var btn = document.getElementById('btnch'+qid);
                if(!btn) return;
                if(this.value.trim().length > 0){
                    btn.style.background='blue';
                    btn.style.color='#fff';
                } else {
                    btn.style.background='';
                    btn.style.color='';
                }
            });
        });
        // Writing textareas
        var writingAreas = document.querySelectorAll('textarea[id^="writing_"]');
        writingAreas.forEach(function(ta){
            var qid = parseInt(ta.id.replace('writing_',''));
            ta.addEventListener('input', function(){
                var btn = document.getElementById('btnch'+qid);
                if(!btn) return;
                if(this.value.trim().length > 0){
                    btn.style.background='blue';
                    btn.style.color='#fff';
                } else {
                    btn.style.background='';
                    btn.style.color='';
                }
            });
        });
    } catch(e){ console.warn('Không gắn được listener highlight câu hỏi', e); }
}

function initSpeakingAudioEvents() {
    // Audio câu hỏi: đã có src = question.linkAudio, chỉ cần để người dùng bấm play bình thường.
    // Audio bài nói của em: khi người dùng click play lần đầu thì mới load src từ API submission.
    var submissionAudios = document.querySelectorAll('.submission-audio');
    submissionAudios.forEach(function (audioEl) {
        audioEl.addEventListener('play', function onPlay() {
            // Nếu đã có src rồi thì không cần load lại
            var source = audioEl.querySelector('source');
            if (source && source.src) {
                return;
            }
            // Lần đầu play thì load src từ API speaking
            loadSpeakingSubmissionForAudio(audioEl);
            // Sau khi gắn src, bỏ listener này để tránh gọi nhiều lần
            audioEl.removeEventListener('play', onPlay);
        });
    });
}

async function loadSpeakingSubmissionForAudio(audioEl) {
    try {
        var questionId = parseInt(audioEl.getAttribute('data-question-id'));
        var uls = new URL(document.URL);
        var examId = uls.searchParams.get('exam');
        if (!examId || !questionId) return;

        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            alert('Bạn chưa đăng nhập hoặc phiên đã hết hạn.');
            return;
        }

        const url = `https://lmsdtm-production.up.railway.app/api/speaking/my/exam/${examId}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: new Headers({
                'Authorization': 'Bearer ' + token
            }),
        });

        if (!response.ok) {
            toastr.error('Không tải được audio speaking');
            return;
        }

        const list = await response.json();
        if (!Array.isArray(list) || list.length === 0) {
            toastr.warning('Bạn chưa có bài nói nào cho đề này.');
            return;
        }

        var sub = list.find(function (s) { return s.questionId === questionId; });
        if (!sub) {
            toastr.warning('Không tìm thấy audio cho câu hỏi này.');
            return;
        }

        var src = `https://lmsdtm-production.up.railway.app/api/speaking/audio/${sub.id}`;
        var source = audioEl.querySelector('source');
        source.src = src;
        audioEl.load();
        audioEl.play();
    } catch (e) {
        console.error(e);
        toastr.error('Lỗi khi phát audio speaking');
    }
}

// Quản lý ghi âm
var speakingRecorders = {}; // questionId -> { mediaRecorder, chunks, stream, recording }

function updateSpeakingRecordButton(questionId, isRecording) {
    var btn = document.getElementById('speakingRecordBtn_' + questionId);
    if (!btn) return;
    var icon = btn.querySelector('i');
    var label = btn.querySelector('span');
    if (isRecording) {
        btn.classList.remove('btn-outline-danger');
        btn.classList.add('btn-outline-secondary');
        if (icon) {
            icon.classList.remove('fa-microphone');
            icon.classList.add('fa-stop');
        }
        if (label) {
            label.textContent = 'Dừng & lưu';
        }
    } else {
        btn.classList.remove('btn-outline-secondary');
        btn.classList.add('btn-outline-danger');
        if (icon) {
            icon.classList.remove('fa-stop');
            icon.classList.add('fa-microphone');
        }
        if (label) {
            label.textContent = 'Thu âm';
        }
    }
}

async function toggleSpeakingRecording(questionId) {
    var rec = speakingRecorders[questionId];
    // Nếu đang ghi thì dừng và upload luôn
    if (rec && rec.mediaRecorder && rec.mediaRecorder.state === 'recording') {
        stopAndUploadSpeaking(questionId);
        return;
    }
    // Nếu chưa ghi thì bắt đầu ghi
    await startSpeakingRecording(questionId);
}

async function startSpeakingRecording(questionId) {
    // chuyển từ async/await sang promise chain vẫn giữ logic, thêm auto-timeout
    (async function() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert('Trình duyệt không hỗ trợ ghi âm (getUserMedia).');
                return;
            }
            const existing = speakingRecorders[questionId];
            if (existing && existing.mediaRecorder && existing.mediaRecorder.state === 'recording') {
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const chunks = [];
            mediaRecorder.ondataavailable = function (e) { if (e.data && e.data.size > 0) { chunks.push(e.data); } };
            mediaRecorder.onstart = function () { setSpeakingStatus(questionId, 'Đang ghi âm...'); updateSpeakingRecordButton(questionId, true); };
            mediaRecorder.onstop = function () { setSpeakingStatus(questionId, 'Đang lưu bài nói...'); };
            const MAX_SECONDS = 120; // giới hạn 2 phút
            const timeoutId = setTimeout(function() {
                try { if (mediaRecorder.state === 'recording') { stopAndUploadSpeaking(questionId); } } catch(e) { console.error(e); }
            }, MAX_SECONDS * 1000);
            speakingRecorders[questionId] = { mediaRecorder, chunks, stream, timeoutId };
            mediaRecorder.start();
        } catch (e) { console.error(e); alert('Không thể truy cập micro. Vui lòng kiểm tra quyền trình duyệt.'); }
    })();
}

async function stopAndUploadSpeaking(questionId) {
    var rec = speakingRecorders[questionId];
    if (!rec || !rec.mediaRecorder || rec.mediaRecorder.state !== 'recording') {
        setSpeakingStatus(questionId, 'Chưa bắt đầu ghi âm.');
        updateSpeakingRecordButton(questionId, false);
        return;
    }
    try { if (rec.timeoutId) clearTimeout(rec.timeoutId); } catch(e) {}
    rec.mediaRecorder.stop();
    if (rec.stream) { rec.stream.getTracks().forEach(function (t) { t.stop(); }); }
    setTimeout(function () { uploadSpeakingRecording(questionId); }, 300);
}

async function uploadSpeakingRecording(questionId) {
    try {
        var rec = speakingRecorders[questionId];
        if (!rec || !rec.chunks || rec.chunks.length === 0) {
            setSpeakingStatus(questionId, 'Chưa có dữ liệu ghi âm để lưu.');
            updateSpeakingRecordButton(questionId, false);
            return;
        }
        var blob = new Blob(rec.chunks, { type: 'audio/webm' });
        var uls = new URL(document.URL);
        var examId = uls.searchParams.get('exam');
        if (!examId) {
            setSpeakingStatus(questionId, 'Không tìm thấy examId trên URL.');
            updateSpeakingRecordButton(questionId, false);
            return;
        }
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            alert('Bạn chưa đăng nhập hoặc phiên đã hết hạn.');
            updateSpeakingRecordButton(questionId, false);
            return;
        }
        var formData = new FormData();
        formData.append('examId', examId);
        formData.append('questionId', questionId);
        formData.append('audio', blob, 'speaking_' + questionId + '.webm');
        setSpeakingStatus(questionId, 'Đang tải lên...');
        const response = await fetch('https://lmsdtm-production.up.railway.app/api/speaking/upload-cloud', {
            method: 'POST',
            headers: new Headers({ 'Authorization': 'Bearer ' + token }),
            body: formData
        });
        let result; const ct = response.headers.get('content-type') || '';
        try {
            if (ct.includes('application/json')) { result = await response.json(); }
            else { const text = await response.text(); result = { error: text }; }
        } catch (parseErr) {
            console.error('Parse response error', parseErr); result = { error: 'Không đọc được phản hồi từ server.' };
        }
        if (!response.ok) {
            var msg = (result && (result.error || result.message || result.defaultMessage)) || 'Lỗi lưu bài nói.';
            setSpeakingStatus(questionId, msg);
            updateSpeakingRecordButton(questionId, false);
            return;
        }
        setSpeakingStatus(questionId, 'Đã ghi âm xong.');
        updateSpeakingRecordButton(questionId, false);
        var audioEl = document.getElementById('speakingSubmissionAudio_' + questionId);
        if (audioEl) {
            if (result && result.id) {
                var src = 'https://lmsdtm-production.up.railway.app/api/speaking/audio/' + result.id;
                var source = audioEl.querySelector('source');
                if (source) { source.src = src; audioEl.load(); }
            } else if (result && result.audioPath) {
                var src2 = result.audioPath; if (!src2.startsWith('http')) { if (!src2.startsWith('/')) src2 = '/' + src2; }
                var source2 = audioEl.querySelector('source'); if (source2) { source2.src = src2; audioEl.load(); }
            }
            // Hiện audio sau khi đã lưu thành công
            var wrap = document.getElementById('speakingSubmissionWrap_' + questionId);
            if (wrap) wrap.style.display = 'block';
        }
        speakingRecorders[questionId].chunks = [];
    } catch (e) {
        console.error(e);
        setSpeakingStatus(questionId, 'Có lỗi khi upload bài nói.');
        updateSpeakingRecordButton(questionId, false);
    }
}

function setSpeakingStatus(questionId, text) {
    var el = document.getElementById('speakingRecordStatus_' + questionId);
    if (el) {
        el.innerText = text;
    }
}

var listcauTl = [];

async function nopBaiThi() {
    // Đánh dấu nộp bài để bỏ cảnh báo reload
    try { window.isSubmitting = true; window.removeEventListener('beforeunload', window.beforeUnloadHandler); } catch(e) {}

    // Bảo đảm tất cả lesson đã được render để lấy dữ liệu WRITING / FILL
    try {
        if (Array.isArray(listLesson)) {
            listLesson.forEach(ls => {
                var qWrap = document.getElementById('dscauhoi' + ls.id);
                if (qWrap && qWrap.children.length === 0) {
                    try { qWrap.innerHTML = renderLessonQuestionsHTML(ls); } catch(e) { console.warn('Render questions lỗi', e); }
                }
                var cWrap = document.getElementById('noidungds' + ls.id);
                if (cWrap && cWrap.children.length === 0) {
                    try { cWrap.innerHTML = renderLessonContentHTML(ls); } catch(e) { console.warn('Render content lỗi', e); }
                }
            });
            try { initSpeakingAudioEvents(); attachInputHighlightListeners(); } catch(e) {}
        }
    } catch(e){ console.warn('Không thể ép render tất cả lesson trước khi nộp', e); }

    var uls = new URL(document.URL);
    var exam = uls.searchParams.get("exam");

    var giaylam;
    try { giaylam = limittime * 60 - giay; } catch(e){ giaylam = 0; }
    var sophutlam = (giaylam / 60).toString().split(".")[0] + ' : ' + (giaylam % 60);

    if (typeof token === 'undefined' || !token) {
        var tkLocal = localStorage.getItem('token');
        var tkSession = sessionStorage.getItem('token');
        window.token = tkLocal || tkSession || '';
    }
    if (!token) {
        try { toastr.error('Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.'); } catch(e){ alert('Phiên đăng nhập đã hết.'); }
        return;
    }

    var writings = [];
    var fills = [];
    var answerIdSet = new Set();

    try {
        for (let i = 0; i < (listLesson || []).length; i++) {
            var listch = listLesson[i].questions || [];
            for (let j = 0; j < listch.length; j++) {
                var q = listch[j];
                if (listLesson[i].skill === 'WRITING') {
                    var txtEl = document.getElementById('writing_' + q.id);
                    if (txtEl) {
                        var txt = txtEl.value.trim();
                        if (txt.length > 0) { writings.push({ questionId: q.id, answerText: txt }); }
                    }
                } else if (listLesson[i].skill === 'SPEAKING') {
                    // speaking upload riêng
                } else {
                    var listctl = q.answers || [];
                    var hasFill = isFillQuestion(q);
                    if (hasFill) {
                        var fillEl = document.getElementById('fill_' + q.id);
                        if (fillEl) {
                            var userInput = (fillEl.value || '').trim();
                            if (userInput.length > 0) {
                                fills.push({ questionId: q.id, answerText: userInput });
                                var matched = listctl.filter(function(a){
                                    return a && String(a.answerType || '').toUpperCase() === 'FILL' && (a.title||'').trim().toLowerCase() === userInput.toLowerCase();
                                });
                                matched.forEach(function(m){ answerIdSet.add(m.id); });
                                fillAnswers.push({ questionId: q.id, entered: userInput, matched: matched.map(function(m){ return m.id; }) });
                            }
                        }
                    } else {
                        var selected = document.querySelector('input[name="dapanctl' + q.id + '"]:checked');
                        if (selected && selected.value) { answerIdSet.add(Number(selected.value)); }
                    }
                }
            }
        }
    } catch(e){ console.error('Lỗi thu thập đáp án', e); }

    var listcauTl = Array.from(answerIdSet);
    console.log('Fill answers detail', fillAnswers);

    clearInterval(looper);

    var payload = { examId: exam, time: sophutlam, answerIds: listcauTl, writings: writings, fills: fills };
    var useComplex = (writings.length > 0) || (fills.length > 0);
    var urlSubmit = useComplex ? 'https://lmsdtm-production.up.railway.app/api/result/user/create-with-fills' : ('https://lmsdtm-production.up.railway.app/api/result/user/create?examId=' + encodeURIComponent(exam) + '&time=' + encodeURIComponent(sophutlam));

    let response, result;
    try {
        response = await fetch(urlSubmit, {
            method: 'POST',
            headers: new Headers({
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }),
            body: useComplex ? JSON.stringify(payload) : JSON.stringify(listcauTl)
        });
        const ct = response.headers.get('content-type') || '';
        if (ct.includes('application/json')) { result = await response.json(); }
        else { const txt = await response.text(); result = { raw: txt }; }
    } catch (networkErr) {
        console.error('Network submit error', networkErr);
        try { toastr.error('Không thể kết nối máy chủ. Vui lòng kiểm tra mạng.'); } catch(e){ alert('Không thể kết nối máy chủ.'); }
        return;
    }

    console.log('Submit result', result);
    if (response && response.ok) {
        try {
            swal({ title: 'Thông báo', text: 'Đã nộp bài thi của bạn!', type: 'success' }, function () {
                try { localStorage.setItem('ketqua', JSON.stringify(result)); } catch(e) {}
                var examIdForRedirect = exam || (result && result.result && result.result.exam && result.result.exam.id) || '';
                if(!examIdForRedirect){ examIdForRedirect = (result && result.examId) || ''; }
                window.location.href = examIdForRedirect ? ('ketqua?exam=' + encodeURIComponent(examIdForRedirect)) : 'ketqua';
            });
        } catch(e){
            try { toastr.success('Đã nộp bài thành công'); } catch(_) {}
            try { localStorage.setItem('ketqua', JSON.stringify(result)); } catch(_){ }
            var examIdForRedirect2 = exam || (result && result.result && result.result.exam && result.result.exam.id) || '';
            if(!examIdForRedirect2){ examIdForRedirect2 = (result && result.examId) || ''; }
            window.location.href = examIdForRedirect2 ? ('ketqua?exam=' + encodeURIComponent(examIdForRedirect2)) : 'ketqua';
        }
    } else {
        let msg = (result && (result.defaultMessage || result.message || result.error)) || 'Có lỗi xảy ra khi nộp bài';
        try { toastr.error(msg); } catch(e){ alert(msg); }
    }
}


function setBGbutton(idcauhoi) {
    document.getElementById("btnch" + idcauhoi).style.background = 'blue'
    document.getElementById("btnch" + idcauhoi).style.color = '#fff'
}

async function loadNoiDungDiv() {
    for (i = 0; i < listLesson.length; i++) {
        if (listLesson[i].skill === 'READING') {
            document.getElementById("noidungds" + listLesson[i].id).innerHTML = listLesson[i].content
        }
        if (listLesson[i].skill === 'LISTENING') {
            var contentHtml = '';
            if (listLesson[i].content && listLesson[i].content.trim().length > 0) {
                contentHtml = `<div class="mt-2 listening-extra">${listLesson[i].content}</div>`;
            }
            document.getElementById("noidungds" + listLesson[i].id).innerHTML =
                `<audio class="post-audio-item" controls>
                <source src="${listLesson[i].linkFile}">
                Your browser does not support the audio element.
            </audio>${contentHtml}`
        }
    }
}


function getparamNameMultiValues(paramName) {
    var sURL = window.document.URL.toString();
    var value = [];
    if (sURL.indexOf("?") > 0) {
        var arrParams = sURL.split("?");
        var arrURLParams = arrParams[1].split("&");
        for (var i = 0; i < arrURLParams.length; i++) {
            var sParam = arrURLParams[i].split("=");
            if (sParam) {
                if (sParam[0] === paramName) {
                    if (sParam.length > 0) {
                        value.push(sParam[1].trim());
                    }
                }
            }
        }
    }
    return value;
}

function moTab(idlesson) {
    document.getElementById("ex1-tab-" + idlesson).click();
}


function loadKetQua() {
    var ketqua = window.localStorage.getItem("ketqua");
    ketqua = JSON.parse(ketqua);
    console.log(ketqua);
    document.getElementById("tenbaithi").innerHTML = ketqua.result.exam.name
    document.getElementById("ngaythi").innerHTML = ketqua.result.exam.examDate + " " + ketqua.result.exam.examTime
    document.getElementById("timeht").innerHTML = ketqua.result.finishTime + " giây "
    document.getElementById("hotenthi").innerHTML = ketqua.result.user.fullName
    document.getElementById("tongphu").innerHTML = ketqua.result.exam.limitTime
    document.getElementById("sodung").innerHTML = ketqua.soTLDung
    document.getElementById("sosai").innerHTML = ketqua.soTLSai
    document.getElementById("chuatl").innerHTML = ketqua.soCauBo
    document.getElementById("progress").style.width = ketqua.phanTram + "%"
    document.getElementById("sosaidung").innerHTML = ketqua.soTLDung + " / " + ketqua.tongCauHoi + " (" + parseFloat(ketqua.phanTram).toFixed(2) + "%)"
    // Hiển thị nút luyện lại chỉ khi trạng thái đã kết thúc
    try {
        var trangThai = ketqua.result.exam.trangThai;
        if (trangThai === 'DA_KET_THUC') {
            var btn = document.getElementById('btnPracticeAll');
            if (btn) {
                btn.style.display = 'inline-block';
            }
        }
    } catch (e) {
        console.warn('Không lấy được trạng thái exam', e);
    }
    renderWritingDetails(ketqua.result.id);
    // Hiển thị trạng thái câu dạng FILL (đã chấm/đang chờ)
    try { renderFillDetails(ketqua.result.id); } catch(e){ console.warn('Không hiển thị FILL details', e); }
}

async function loadKetQuaByExam() {
    var uls = new URL(document.URL)
    var exam = uls.searchParams.get("exam");
    const response = await fetch('https://lmsdtm-production.up.railway.app/api/result/user/find-by-user-exam?examId=' + exam, {
        method: 'GET',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    var ketqua = await response.json();
    if (response.status > 300) {
        if (response.status === exceptionCode) {
            swal({
                    title: "Thông báo",
                    text: ketqua.defaultMessage,
                    type: "error"
                },
                function () {
                    history.go(-1);
                });
        } else {
            swal({
                    title: "Thông báo",
                    text: "Có lỗi xảy ra",
                    type: "error"
                },
                function () {
                    history.go(-1);
                });
        }
    }
    console.log(ketqua);
    document.getElementById("tenbaithi").innerHTML = ketqua.result.exam.name
    document.getElementById("ngaythi").innerHTML = ketqua.result.exam.examDate + " " + ketqua.result.exam.examTime
    document.getElementById("timeht").innerHTML = ketqua.result.finishTime + " giây "
    document.getElementById("hotenthi").innerHTML = ketqua.result.user.fullName
    document.getElementById("tongphu").innerHTML = ketqua.result.exam.limitTime
    document.getElementById("sodung").innerHTML = ketqua.soTLDung
    document.getElementById("sosai").innerHTML = ketqua.soTLSai
    document.getElementById("chuatl").innerHTML = ketqua.soCauBo
    document.getElementById("progress").style.width = ketqua.phanTram + "%"
    document.getElementById("sosaidung").innerHTML = ketqua.soTLDung + " / " + ketqua.tongCauHoi + " (" + parseFloat(ketqua.phanTram).toFixed(2) + "%)"
    // Hiển thị nút luyện lại nếu đã kết thúc
    try {
        var trangThai = ketqua.result.exam.trangThai;
        if (trangThai === 'DA_KET_THUC') {
            var btn = document.getElementById('btnPracticeAll');
            if (btn) {
                btn.style.display = 'inline-block';
            }
        }
    } catch (e) {
        console.warn('Không lấy được trạng thái exam', e);
    }
    renderWritingDetails(ketqua.result.id);
    // Hiển thị trạng thái câu dạng FILL (đã chấm/đang chờ)
    try { renderFillDetails(ketqua.result.id); } catch(e){ console.warn('Không hiển thị FILL details', e); }
}

function renderWritingDetails(resultId){
    fetch('https://lmsdtm-production.up.railway.app/api/result/user/writing/by-result?resultId='+resultId,{
        headers:new Headers({'Authorization':'Bearer '+token})
    }).then(r=>r.json()).then(list=>{
        if(!Array.isArray(list) || list.length===0){
            // Hide both writing detail and pending sections if nothing
            var pendingWrap0 = document.getElementById('pendingWritingWrap'); if(pendingWrap0) pendingWrap0.style.display='none';
            return;
        }
        var gradedCount = 0, pendingCount = 0;
        var pendingItems = [];
        for(var i=0;i<list.length;i++){
            if(list[i].graded){
                gradedCount++; // accumulate count
            } else { pendingCount++; pendingItems.push(list[i]); }
        }
        var summaryRow = document.getElementById('writingSummaryRow');
        if(summaryRow){
            summaryRow.style.display='';
            document.getElementById('writingGraded').innerText = gradedCount;
            document.getElementById('writingPending').innerText = pendingCount;
            document.getElementById('writingTotal').innerText = '';
        }
        // Pending list render
        var pendingWrap = document.getElementById('pendingWritingWrap');
        var pendingListDiv = document.getElementById('pendingWritingList');
        if(pendingWrap && pendingListDiv){
            if(pendingItems.length>0){
                pendingWrap.style.display='';
                var pHtml='';
                for(var j=0;j<pendingItems.length;j++){
                    var p = pendingItems[j];
                    var qTitle = (p.questionTitle||'').replace(/</g,'&lt;');
                    var answerPreview = (p.answerText||'').trim();
                    if(answerPreview.length>140) answerPreview = answerPreview.substring(0,140) + '...';
                    answerPreview = answerPreview.replace(/</g,'&lt;');
                    var typeBadgePending = p.writingType?`<span class='badge bg-secondary ms-1'>${p.writingType}</span>`:'';
                    pHtml += `<a class='list-group-item list-group-item-action'>
                        <div class='d-flex w-100 justify-content-between'>
                          <h6 class='mb-1'>${qTitle} ${typeBadgePending}</h6>
                          <span class='badge bg-warning text-dark'>Chờ chấm</span>
                        </div>
                        <p class='mb-1 small' style='white-space:pre-line'>${answerPreview}</p>
                    </a>`;
                }
                pendingListDiv.innerHTML = pHtml;
            } else {
                pendingWrap.style.display='none';
                pendingListDiv.innerHTML='';
            }
        }
        // Show detailed list (graded and pending answers) below
        var detailDiv = document.getElementById('writingDetail');
        if(detailDiv){ detailDiv.style.display=''; }
        var content = '';
        for(let i=0;i<list.length;i++){
            var w = list[i];
            var statusBadge = w.graded ? `<span class='badge bg-success'>Đã chấm</span>` : `<span class='badge bg-warning text-dark'>Đang chờ chấm</span>`;
            var scoreDisplay = w.graded && w.manualScore!=null ? w.manualScore : '-';
            var feedbackDisplay = w.graded && w.feedback ? w.feedback.replace(/</g,'&lt;') : '-';
            var typeBadgeDetail = w.writingType ? `<span class='badge bg-secondary ms-1'>${w.writingType}</span>` : '';
            content += `<div class='card mb-2'><div class='card-body'>
                <p><strong>Trạng thái:</strong> ${statusBadge}</p>
                <p><strong>Câu hỏi:</strong> ${(w.questionTitle||'').replace(/</g,'&lt;')} ${typeBadgeDetail}</p>
                <p><strong>Bài làm:</strong><br><span style='white-space:pre-line'>${(w.answerText||'').replace(/</g,'&lt;')}</span></p>
                <p><strong>Điểm:</strong> ${scoreDisplay} &nbsp; <strong>Nhận xét:</strong> ${feedbackDisplay}</p>
            </div></div>`;
        }
        var detailContentDiv = document.getElementById('writingDetailContent');
        if(detailContentDiv){ detailContentDiv.innerHTML = content || '<em>Không có bài viết</em>'; }
    }).catch(e=>console.warn('Không tải chi tiết writing',e));
    // After existing summary update, append band status
    try {
        if(ketqua.task1Score!=null && ketqua.task2Score!=null){
            const bandLine = `IELTS Writing Band: ${ketqua.finalWritingBand}`;
            ensureWritingBandRow(bandLine);
        } else if(ketqua.task1Score!=null || ketqua.task2Score!=null){
            ensureWritingBandRow('Đang chờ chấm đủ TASK để tính IELTS Writing Band');
        }
    }catch(e){console.warn('Không hiển thị band',e);}
}

function ensureWritingBandRow(text){
    let row = document.getElementById('writingBandRow');
    if(!row){
        const table = document.querySelector('.chitietthi table');
        if(table){
            row = document.createElement('tr');
            row.id='writingBandRow';
            row.innerHTML = `<td>IELTS Writing</td><td id='writingBandCell'></td>`;
            table.appendChild(row);
        }
    }
    const cell = document.getElementById('writingBandCell');
    if(cell){ cell.textContent = text; }
}

function getQuestionById(id) {
    if (!listLesson) return null;
    for (var i = 0; i < listLesson.length; i++) {
        var qs = listLesson[i].questions || [];
        for (var j = 0; j < qs.length; j++) {
            if (qs[j].id === id) return qs[j];
        }
    }
    return null;
}

function renderFillDetails(resultId){
    // Thử lấy danh sách câu trả lời FILL gắn với result này
    fetch('https://lmsdtm-production.up.railway.app/api/result/user/fill/by-result?resultId='+resultId,{
        headers:new Headers({'Authorization':'Bearer '+token})
    }).then(r=>{
        if(!r.ok){ throw new Error('HTTP '+r.status); }
        const ct = r.headers.get('content-type')||'';
        if(ct.includes('application/json')) return r.json();
        return [];
    }).then(list=>{
        if(!Array.isArray(list) || list.length===0){
            var wrap0 = document.getElementById('pendingFillWrap'); if(wrap0) wrap0.style.display='none';
            var detailDiv0 = document.getElementById('fillDetail'); if(detailDiv0) detailDiv0.style.display='none';
            return;
        }
        var gradedCount = 0, pendingCount = 0;
        var pendingItems = [];
        for(var i=0;i<list.length;i++){
            if(list[i].graded){ gradedCount++; } else { pendingCount++; pendingItems.push(list[i]); }
        }
        // Summary row in table if exists
        var summaryRow = document.getElementById('fillSummaryRow');
        if(summaryRow){
            summaryRow.style.display='';
            var g = document.getElementById('fillGraded'); if(g) g.innerText = gradedCount;
            var p = document.getElementById('fillPending'); if(p) p.innerText = pendingCount;
            var t = document.getElementById('fillTotal'); if(t) t.innerText = '';
        }
        // Pending list
        var pendingWrap = document.getElementById('pendingFillWrap');
        var pendingListDiv = document.getElementById('pendingFillList');
        if(pendingWrap && pendingListDiv){
            if(pendingItems.length>0){
                pendingWrap.style.display='';
                var pHtml='';
                for(var j=0;j<pendingItems.length;j++){
                    var pendingItem = pendingItems[j];
                    var qTitle = (pendingItem.questionTitle||'').replace(/</g,'&lt;');
                    var answerPreview = (pendingItem.answerText||'').trim();
                    if(answerPreview.length>140) answerPreview = answerPreview.substring(0,140) + '...';
                    answerPreview = answerPreview.replace(/</g,'&lt;');
                    pHtml += `<a class='list-group-item list-group-item-action'>
                        <div class='d-flex w-100 justify-content-between'>
                          <h6 class='mb-1'>${qTitle}</h6>
                          <span class='badge bg-warning text-dark'>Chờ chấm</span>
                        </div>
                        <p class='mb-1 small' style='white-space:pre-line'>${answerPreview}</p>
                    </a>`;
                }
                pendingListDiv.innerHTML = pHtml;
            } else {
                pendingWrap.style.display='none';
                pendingListDiv.innerHTML='';
            }
        }
        // Detailed list
        var detailDiv = document.getElementById('fillDetail');
        var detailContentDiv = document.getElementById('fillDetailContent');
        if(detailDiv && detailContentDiv){
            detailDiv.style.display='';
            var content='';
            for(let i=0;i<list.length;i++){
                var fillItem = list[i];
                var statusBadge = fillItem.graded ? `<span class='badge bg-success'>Đã chấm</span>` : `<span class='badge bg-warning text-dark'>Đang chờ chấm</span>`;
                var scoreDisplay = fillItem.graded && fillItem.autoScore!=null ? fillItem.autoScore : '-';
                var feedbackDisplay = fillItem.feedback ? fillItem.feedback.replace(/</g,'&lt;') : '-';
                content += `<div class='card mb-2'><div class='card-body'>
                    <p><strong>Trạng thái:</strong> ${statusBadge}</p>
                    <p><strong>Câu hỏi:</strong> ${(fillItem.questionTitle||'').replace(/</g,'&lt;')}</p>
                    <p><strong>Đáp án nhập:</strong><br><span style='white-space:pre-line'>${(fillItem.answerText||'').replace(/</g,'&lt;')}</span></p>
                    <p><strong>Điểm:</strong> ${scoreDisplay} &nbsp; <strong>Nhận xét:</strong> ${feedbackDisplay}</p>
                </div></div>`;
            }
            detailContentDiv.innerHTML = content || '<em>Không có câu dạng FILL</em>';
        }
        // Optional: add a note row in main table
        try {
            let noteRow = document.getElementById('fillNoteRow');
            if(!noteRow){
                const table = document.querySelector('.chitietthi table');
                if(table){
                    noteRow = document.createElement('tr');
                    noteRow.id='fillNoteRow';
                    noteRow.innerHTML = `<td>Ghi chú FILL</td><td id='fillNoteCell'></td>`;
                    table.appendChild(noteRow);
                }
            }
            const cell = document.getElementById('fillNoteCell');
            if(cell){
                if(pendingCount>0){ cell.textContent = 'Có câu FILL đang chờ chấm. Điểm tổng sẽ cập nhật sau khi hoàn tất.'; }
                else { cell.textContent = 'Tất cả câu FILL đã được chấm.'; }
            }
        } catch(e) { console.warn('Không thể hiển thị ghi chú FILL', e); }
    }).catch(e=>{
        console.warn('Không tải chi tiết FILL', e);
        // Nếu API không tồn tại, ẩn các khối liên quan
        var wrap0 = document.getElementById('pendingFillWrap'); if(wrap0) wrap0.style.display='none';
        var detailDiv0 = document.getElementById('fillDetail'); if(detailDiv0) detailDiv0.style.display='none';
    });
}
