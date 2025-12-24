function getToken(){return localStorage.getItem('token')||sessionStorage.getItem('token');}
var PRACTICE_DATA = { questions: [], session: null, filtered: [] };

function getUnifiedScore(q){
  if(!q) return null;
  if(q.score != null) return q.score;
  if(q.manualScore != null) return q.manualScore;
  if(q.practiceScore != null) return q.practiceScore;
  if(q.finalScore != null) return q.finalScore;
  if(q.speakingScore != null) return q.speakingScore;
  return null;
}

function loadPracticeResult(){
  var url = new URL(document.URL);
  var sessionId = url.searchParams.get('sessionId');
  if(!sessionId){ toastr.error('Thiếu sessionId'); return; }
  $.ajax({
    url: '/api/practice/user/session?sessionId='+sessionId,
    method:'GET',
    headers:{'Authorization':'Bearer '+getToken()},
    success:function(s){
      PRACTICE_DATA.session = s;
      // Set per-exam history link if examId is available
      try{
        var link = document.getElementById('examPracticeHistoryLink');
        if(link){
          var examId = s && (s.examId || (s.result && s.result.examId));
          if(examId){ link.href = 'lichsuonluyen?examId='+encodeURIComponent(examId); }
        }
      }catch(e){}
      applyPracticeHeaderFromSession(s); // cập nhật Ngày thi, Thời gian, Họ tên
      // Không gọi applyPracticeBandSummary nữa để tránh ẩn card khi chưa có overallBand
      showOverallStatusPractice(s);
      // renderSessionSummary(s); // removed
      loadPracticeQuestions(sessionId);
    },
    error:function(){ toastr.error('Không tải được phiên'); }
  });
}

function isReadingFillGradedCompleted(){
  var s = PRACTICE_DATA.session || {};
  if(typeof s.readingFillGradedCompleted === 'boolean') return s.readingFillGradedCompleted;
  // Fallback: tự kiểm tra từ danh sách câu hỏi
  try{
    const list = PRACTICE_DATA.questions || [];
    for(let i=0;i<list.length;i++){
      const q = list[i];
      const skill = String(q.skill||'').trim().toUpperCase();
      if(skill !== 'READING') continue;
      // pending khi là FILL, đã nhập answerText nhưng chưa graded
      if(q.isFill === true && q.isFillAnswered === true && q.isGraded !== true){
        return false;
      }
      // hoặc khi có cờ pending do augmentQuestion
      if(q.isPendingReading === true){
        return false;
      }
    }
    return true;
  }catch(e){ return true; }
}
function isListeningFillGradedCompleted(){
  var s = PRACTICE_DATA.session || {};
  if(typeof s.listeningFillGradedCompleted === 'boolean') return s.listeningFillGradedCompleted;
  // Fallback: tự kiểm tra từ danh sách câu hỏi
  try{
    const list = PRACTICE_DATA.questions || [];
    for(let i=0;i<list.length;i++){
      const q = list[i];
      const skill = String(q.skill||'').trim().toUpperCase();
      if(skill !== 'LISTENING') continue;
      if(q.isFill === true && q.isFillAnswered === true && q.isGraded !== true){
        return false;
      }
      if(q.isPendingListening === true){
        return false;
      }
    }
    return true;
  }catch(e){ return true; }
}

function applyPracticeHeaderFromSession(s){
  try{
    // Tiêu đề bài luyện (nếu có)
    var titleEl = document.getElementById('practiceExamTitle');
    if(titleEl && s){
      titleEl.innerText = s.examName || titleEl.innerText || 'Kết quả ôn luyện';
    }

    // Ngày thi: lấy từ createdDate (cột created_date của practice_session)
    var dateEl = document.getElementById('practiceDate');
    if(dateEl && s){
      var src = s.createdDate;
      if(src){
        var d = new Date(src);
        if(!isNaN(d.getTime())){
          dateEl.innerText = d.toLocaleDateString('vi-VN');
        } else {
          // Nếu backend gửi chuỗi ngày không phải ISO, hiển thị nguyên chuỗi
          dateEl.innerText = src;
        }
      } else {
        dateEl.innerText = '';
      }
    }

    // Thời gian hoàn thành: từ durationSeconds nếu có; fallback từ createdDate/finishedDate
    var durationEl = document.getElementById('practiceDuration');
    if(durationEl && s){
      if(s.durationSeconds != null){
        durationEl.innerText = formatDuration(Number(s.durationSeconds));
      } else if (s.createdDate && s.finishedDate){
        var start = new Date(s.createdDate), end = new Date(s.finishedDate);
        if(!isNaN(start.getTime()) && !isNaN(end.getTime())){
          var diff = Math.max(0, Math.floor((end.getTime() - start.getTime())/1000));
          durationEl.innerText = formatDuration(diff);
        } else {
          durationEl.innerText = '';
        }
      } else {
        durationEl.innerText = '';
      }
    }

    // Họ tên: ưu tiên fullName, fallback sang username
    var nameEl = document.getElementById('practiceUserName');
    if(nameEl && s){
      nameEl.innerText = s.fullName || s.username || '';
    }
  }catch(e){ console.warn('applyPracticeHeaderFromSession error', e); }
}

// Round to nearest 0.5 like backend
function roundHalf(v){
  if(v==null || isNaN(v)) return null;
  return Math.round(Number(v)*2)/2;
}

function computeSkillBands(){
  // Compute reading/listening from MCQ + graded FILL correctness; keep speaking/writing from existing scores
  const list = PRACTICE_DATA.questions || [];
  const acc = {reading:{correct:0,total:0}, listening:{correct:0,total:0}};

  list.forEach(q=>{
    if(!q) return;
    const skill = String(q.skill||'').trim().toUpperCase();
    const isWriting = q.isWriting === true || skill==='WRITING';
    const isSpeaking = q.isSpeaking === true || skill==='SPEAKING';
    const isFill = q.isFill === true || isFillType(q);

    // Only handle reading/listening here
    if(skill==='READING' || skill==='LISTENING'){
      const bucket = (skill==='READING')? acc.reading : acc.listening;
      // MCQ: not writing, not fill, not speaking
      if(!isWriting && !isFill && !isSpeaking){
        if(q.answered){
          bucket.total++;
          if(q.isCorrect === true) bucket.correct++;
        }
      } else if(isFill){
        // FILL: include only if answered and graded, and not pending
        const answered = q.isFillAnswered === true || (q.answerText && String(q.answerText).trim().length>0);
        const pending = (skill==='READING'? q.isPendingReading : q.isPendingListening) === true;
        const graded = q.isGraded === true;
        if(answered && graded && !pending){
          bucket.total++;
          if(q.correct === true){ bucket.correct++; }
          else if(q.correct === false){ /* no-op */ }
          else {
            const s = (q.score!=null)? q.score : (q.practiceScore!=null? q.practiceScore : null);
            if(s != null){ if(Number(s) === 1) bucket.correct++; }
          }
        }
      }
    }
  });

  const toBand = (obj)=>{
    if(!obj || obj.total<=0) return null;
    return roundHalf((obj.correct/obj.total)*9);
  };

  // Speaking & Writing: keep using average numeric scores if any
  const avgScores = {READING:[], LISTENING:[], SPEAKING:[], WRITING:[]};
  list.forEach(q=>{
    const skill = String(q.skill||'').trim().toUpperCase();
    const score = (q.score!=null? q.score : (q.manualScore!=null? q.manualScore : (q.practiceScore!=null? q.practiceScore : null)));
    const graded = q.isGraded === true || q.graded === true || q.practiceGraded === true || (score!=null);
    if(graded && score!=null){
      if(skill==='SPEAKING') avgScores.SPEAKING.push(Number(score));
      else if(skill==='WRITING') avgScores.WRITING.push(Number(score));
    }
  });
  const avg = arr => arr.length? (arr.reduce((a,b)=>a+b,0)/arr.length) : null;

  // Force null band if any FILL in that skill is still pending grading
  const readingCompleted = isReadingFillGradedCompleted();
  const listeningCompleted = isListeningFillGradedCompleted();

  const readingBand = readingCompleted ? toBand(acc.reading) : null;
  const listeningBand = listeningCompleted ? toBand(acc.listening) : null;

  return {
    reading: readingBand,
    listening: listeningBand,
    speaking: avg(avgScores.SPEAKING),
    writing: avg(avgScores.WRITING)
  };
}
function formatBandOrPending(value){
  if(value==null) return 'Chờ chấm';
  const num = parseFloat(value);
  if(Number.isNaN(num)) return 'Chờ chấm';
  let text = Math.abs(num % 1) < 1e-6 ? num.toFixed(0) : num.toFixed(1);
  return text.replace(/\.0$/,'');
}
function markBandState(wrapId, val){
  const wrap = document.getElementById(wrapId);
  if(!wrap) return;
  wrap.classList.remove('pending');
  if(val==null){ wrap.classList.add('pending'); }
}
function getAvailableSkills(){
  const set = new Set();
  (PRACTICE_DATA.questions||[]).forEach(q=>{ if(q && q.skill){ set.add(String(q.skill).trim().toUpperCase()); } });
  return set; // ví dụ: {'READING','LISTENING'}
}
function showHideBandItemsBySkills(){
  const skills = getAvailableSkills();
  const map = {
    READING: {wrap:'readingBandWrap'},
    LISTENING: {wrap:'listeningBandWrap'},
    SPEAKING: {wrap:'speakingBandWrap'},
    WRITING: {wrap:'writingBandWrap'}
  };
  Object.keys(map).forEach(k=>{
    const wrapId = map[k].wrap;
    const el = document.getElementById(wrapId);
    if(!el) return;
    if(skills.has(k)){
      el.classList.remove('d-none');
    } else {
      el.classList.add('d-none');
    }
  });
}
function applyPracticeFourBands(){
  try{
    const bandCard = document.getElementById('bandCard');
    const placeholder = document.getElementById('bandPlaceholder');
    if(!bandCard) return;
    const k = computeSkillBands();
    bandCard.classList.remove('d-none');
    if(placeholder){ placeholder.style.display=''; }
    showHideBandItemsBySkills();
    const skills = getAvailableSkills();

    const rEl = document.getElementById('readingBand');
    const lEl = document.getElementById('listeningBand');
    const sEl = document.getElementById('speakingBand');
    const wEl = document.getElementById('writingBand');

    // Reading band
    let readingVal = k.reading;
    const readingCompleted = isReadingFillGradedCompleted();
    if(skills.has('READING') && !readingCompleted){
      readingVal = null;
      if(rEl) rEl.innerText = 'Đang chấm câu điền';
    } else if(rEl && skills.has('READING')){
      rEl.innerText = formatBandOrPending(readingVal);
    }

    // Listening band
    let listeningVal = k.listening;
    const listeningCompleted = isListeningFillGradedCompleted();
    if(skills.has('LISTENING') && !listeningCompleted){
      listeningVal = null;
      if(lEl) lEl.innerText = 'Đang chấm câu điền';
    } else if(lEl && skills.has('LISTENING')){
      lEl.innerText = formatBandOrPending(listeningVal);
    }

    if(sEl && skills.has('SPEAKING')) sEl.innerText = formatBandOrPending(k.speaking);
    if(wEl && skills.has('WRITING')) wEl.innerText = formatBandOrPending(k.writing);

    if(skills.has('READING')) markBandState('readingBandWrap', readingVal);
    if(skills.has('LISTENING')) markBandState('listeningBandWrap', listeningVal);
    if(skills.has('SPEAKING')) markBandState('speakingBandWrap', k.speaking);
    if(skills.has('WRITING')) markBandState('writingBandWrap', k.writing);

    // --- overall: chỉ tính trên các kỹ năng đã có band số ---
    const overallWrap = document.getElementById('overallBandWrap');
    const overallEl = document.getElementById('overallBand');
    if(overallWrap && overallEl){
      const numericValues = [readingVal, listeningVal, k.speaking, k.writing]
        .map(v => (v == null ? null : Number(v)))
        .filter(v => v != null && Number.isFinite(v));
      if(numericValues.length === 2 || numericValues.length === 4){
        const sum = numericValues.reduce((a,b)=>a+b,0);
        const overallVal = roundHalf(sum / numericValues.length);
        overallEl.innerText = formatBandOrPending(overallVal);
        overallWrap.classList.remove('d-none');
        markBandState('overallBandWrap', overallVal);
      } else {
        overallWrap.classList.add('d-none');
        overallEl.innerText = 'Chờ chấm';
        markBandState('overallBandWrap', null);
      }
    }
    // --- END overall ---
  }catch(e){ console.warn('applyPracticeFourBands error', e); }
}

function showHideTabsBySkills(){
  // no-op: tab hiển thị theo phần thi, không còn ẩn/hiện theo kỹ năng
  return;
}

// Lấy tên phần thi từ một câu hỏi: ưu tiên các trường tên bài/lesson/phần phổ biến trước khi fallback 'Khác'
function getPartNameFromQuestion(q){
  function norm(v){ if(v==null) return ''; var s=String(v).trim(); if(s==='null'||s==='undefined') return ''; return s; }
  if(!q) return 'Khác';
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
  return 'Khác';
}

// Gom nhóm câu hỏi theo lesson.name/lesson.title
function buildPartsFromQuestions(){
  const list = PRACTICE_DATA.questions || [];
  const map = new Map();
  list.forEach(function(q){
    var name = getPartNameFromQuestion(q);
    if(!map.has(name)){
      map.set(name, { key: name, name: name, questions: [] });
    }
    map.get(name).questions.push(q);
  });
  return Array.from(map.values());
}

// Render nội dung chi tiết cho một phần thi: dùng lại renderQuestionList-style nhưng chỉ cho các câu trong phần đó
function renderPartDetail(questions){
  if(!questions || questions.length===0){
    return '<div class="alert alert-info">Không có câu hỏi trong phần này.</div>';
  }
  var html = '';
  questions.forEach(function(q){
    var cls = 'card question-card mb-2 ';
    if(q.isCorrect) cls+='correct'; else if(q.isWrong) cls+='incorrect';
    var gradedFrameNeeded = false;
    var frameColor = '#198754'; // default green for correct

    // MCQ questions: show frame if answered
    if(!q.isWriting && !q.isFill && !q.isSpeaking && q.answered){
      gradedFrameNeeded = true;
      frameColor = q.isCorrect ? '#198754' : '#dc3545'; // green if correct, red if wrong
    }

    // Fill questions: show frame if graded
    if(q.isFill && q.isFillAnswered && !(q.isPendingReading||q.isPendingListening) && q.isGraded) {
      gradedFrameNeeded = true;
      frameColor = q.isCorrect ? '#198754' : '#dc3545'; // green if correct, red if wrong
    }

    // Writing and Speaking: NO border (removed as per user request)

    var frameStyle = gradedFrameNeeded ? (' style="border:2px solid '+frameColor+';"') : '';
    html += '<div class="'+cls+'"'+frameStyle+'><div class="card-header">Câu '+q.index+'</div><div class="card-body">';
    html += '<p><strong>'+escapeHtml(q.title||'')+'</strong></p>';
    if(q.isWriting){
      if(q.isWritingAnswered){
        html += '<div class="answer-line">'+ (q.isWritingPending?'<span class="badge bg-warning text-dark">Chờ chấm</span>':'<span class="badge bg-success">Đã chấm</span>')+'</div>';
        html += '<div class="p-2 border rounded bg-light" style="white-space:pre-line">'+escapeHtml(q.answerText||'')+'</div>';
        if(q.isGraded){ html += '<p class="mt-2"><span class="fw-bold">Kết quả:</span> '+(q.manualScore!=null?q.manualScore:'-')+' '+(q.feedback?('| <strong>Nhận xét:</strong> '+escapeHtml(q.feedback)):'')+'</p>'; }
      } else { html += '<p class="text-muted">Chưa nộp bài viết</p>'; }
    } else if(q.isFill){
      if(q.isFillAnswered){
        var fillPending = (q.isPendingReading || q.isPendingListening);
        html += '<div class="answer-line">'+ (fillPending?'<span class="badge bg-warning text-dark">Chờ chấm</span>':'<span class="badge bg-success">Đã chấm</span>')+'</div>';
        html += '<div class="p-2 border rounded bg-light" style="white-space:pre-line">'+escapeHtml(q.answerText||'')+'</div>';
        // Show fill result explicitly
        html += '<p class="mt-2"><span class="fw-bold">Kết quả:</span> '+formatFillResult(q)+'</p>';
      } else { html += '<p class="mt-2 text-muted">Chưa trả lời</p>'; }
    } else if(q.isSpeaking){
      if(q.isSpeakingAnswered){
        html += '<div class="answer-line">'+ (q.isPendingSpeaking?'<span class="badge bg-warning text-dark">Chờ chấm</span>':'<span class="badge bg-success">Đã chấm</span>')+'</div>';
        var src = null;
        if(q.answerText && String(q.answerText).trim().length>0){ src = q.answerText; }
        else if(Array.isArray(q.speakingSubmissions) && q.speakingSubmissions.length>0){
          var latest = q.speakingSubmissions[0];
          src = latest.id? ('/api/speaking/audio/'+latest.id) : (latest.audioPath || null);
        }
        if(src){
          var mime = inferAudioType(src);
          html += '<audio controls style="width:100%"><source src="'+escapeHtml(src)+'" type="'+mime+'"></audio>';
        } else { html += '<div class="text-muted">Không tìm thấy audio đã nộp</div>'; }
        if(q.isGraded){
          var sc = getUnifiedScore(q);
          if(sc != null){ html += '<p class="mt-2"><span class="fw-bold">Kết quả:</span> '+sc+' '+(q.feedback?('| <strong>Nhận xét:</strong> '+escapeHtml(q.feedback)):'')+'</p>'; }
        }
      } else { html += '<p class="mt-2 text-muted">Chưa trả lời</p>'; }
    } else {
      (q.answers||[]).forEach(function(a){
        var aCls='answer-line'; if(a.isTrue) aCls+=' correct';
        if(q.isWrong && q.selectedAnswerId===a.id && !a.isTrue) aCls+=' selected-wrong';
        html += '<div class="'+aCls+'">'+escapeHtml(a.title)+' '+(a.isTrue?'<span class="badge bg-success">Đúng</span>':'')+'</div>';
      });
      if(q.answered){ html += '<p class="mt-2"><span class="fw-bold">Kết quả:</span> '+(q.isCorrect?'<span class="text-success">ĐÚNG</span>':'<span class="text-danger">SAI</span>')+'</p>'; }
      else { html += '<p class="mt-2 text-muted">Chưa trả lời</p>'; }
    }
    html += '</div></div>';
  });
  return html;
}

// Cập nhật tiêu đề tab và nội dung theo phần thi
function openViewPracticeAnswers(){
  try{
    var modalEl = document.getElementById('viewPracticeAnswersModal');
    var paneR = document.getElementById('pane-reading');
    var paneL = document.getElementById('pane-listening');
    var paneS = document.getElementById('pane-speaking');
    var paneW = document.getElementById('pane-writing');
    var tabR = document.getElementById('tab-reading');
    var tabL = document.getElementById('tab-listening');
    var tabS = document.getElementById('tab-speaking');
    var tabW = document.getElementById('tab-writing');
    if(!modalEl || !paneR || !paneL || !paneS || !paneW || !tabR || !tabL || !tabS || !tabW){
      toastr.info('Không có nội dung để xem chi tiết');
      return;
    }
    var parts = buildPartsFromQuestions();
    if(parts.length===0){
      toastr.info('Bài thi không có phần nào để hiển thị');
      return;
    }
    // Lấy tối đa 4 phần đầu tiên gán vào 4 tab có sẵn
    var slots = [
      {tab:tabR, pane:paneR},
      {tab:tabL, pane:paneL},
      {tab:tabS, pane:paneS},
      {tab:tabW, pane:paneW}
    ];
    // Reset tất cả tab/pane
    slots.forEach(function(s){
      s.tab.classList.add('d-none');
      s.tab.classList.remove('active');
      s.pane.classList.add('d-none');
      s.pane.classList.remove('show');
      s.pane.classList.remove('active');
      s.pane.innerHTML = '';
    });
    // Gán dữ liệu phần thi
    var activeSet = false;
    for(var i=0;i<slots.length && i<parts.length;i++){
      var p = parts[i];
      var slot = slots[i];
      slot.tab.classList.remove('d-none');
      slot.pane.classList.remove('d-none');
      // Đặt tiêu đề tab bằng tên phần thi
      slot.tab.textContent = p.name;
      // Nội dung: chi tiết các câu trong phần đó
      slot.pane.innerHTML = renderPartDetail(p.questions);
      if(!activeSet){
        slot.tab.classList.add('active');
        slot.pane.classList.add('show');
        slot.pane.classList.add('active');
        activeSet = true;
      }
    }
    // Hiển thị modal bằng Bootstrap
    var modal = null;
    try { modal = new bootstrap.Modal(modalEl); } catch(e) { /* fallback */ }
    if(modal && typeof modal.show === 'function'){
      modal.show();
    } else {
      modalEl.classList.add('show');
      modalEl.style.display = 'block';
      modalEl.removeAttribute('aria-hidden');
    }
  }catch(e){ console.warn('openViewPracticeAnswers error', e); }
}

// Gọi hiển thị 4 band sau khi tải câu hỏi
function loadPracticeQuestions(sessionId){
  $.ajax({
    url:'/api/practice/user/questions?sessionId='+sessionId,
    method:'GET',
    headers:{'Authorization':'Bearer '+getToken()},
    success:function(list){
      PRACTICE_DATA.questions = list.map((q,i)=>augmentQuestion(q,i));
      PRACTICE_DATA.filtered = PRACTICE_DATA.questions.slice();
      // renderExtraStats(); // removed
      renderQuestionList(PRACTICE_DATA.filtered);
      applyPracticeFourBands(); // cập nhật hiển thị 4 band
    },
    error:function(){ toastr.error('Không tải được câu hỏi'); }
  });
}

// Helper: detect fill/open-text type (exclude speaking)
function isFillType(q){
  if(!q) return false; const norm = v=>String(v||'').trim().toUpperCase();
  const t1 = norm(q.questionType), t2 = norm(q.answerType), t3 = norm(q.type);
  const skill = norm(q.skill);
  const match = (t)=> t==='FILL'||t==='FILL_TEXTAREA'||t==='TEXTAREA'||t==='ESSAY'||t==='SHORT_ANSWER'||t==='SHORTANSWER'||t==='OPEN' || t.includes('FILL')||t.includes('TEXTAREA')||t.includes('ESSAY')||t.includes('SHORT')||t.includes('OPEN');
  if(match(t1)||match(t2)||match(t3)) return skill!=='SPEAKING';
  if((skill==='WRITING')||(skill!=='SPEAKING' && (!Array.isArray(q.answers)||q.answers.length===0))) return true;
  return false;
}
// Helper: detect speaking
function isSpeaking(q){ return String(q.skill||'').trim().toUpperCase()==='SPEAKING'; }

function augmentQuestion(q, idx){
  q.index = idx+1;
  const skillUpper = String(q.skill||'').trim().toUpperCase();
  var isWriting = skillUpper==='WRITING' || !!q.questionType && q.lesson && q.lesson.skill==='WRITING';
  var hasWritingAnswer = isWriting && q.answerText && q.answerText.trim().length>0;
  // Unified graded flag (any indication of grading or score)
  var gradedFlag = (q.graded===true) || (q.practiceGraded===true) || (q.score!=null && q.score>=0) || (q.manualScore!=null);
  var isFill = !isWriting && skillUpper!=='SPEAKING' && isFillType(q);
  var hasFillAnswer = isFill && q.answerText && String(q.answerText).trim().length>0;
  var speaking = skillUpper==='SPEAKING';
  var speakingAnswered = speaking && ((q.answerText && String(q.answerText).trim().length>0) || (Array.isArray(q.speakingSubmissions) && q.speakingSubmissions.length>0));

  // Per-skill pending flags
  q.isPendingReading = (skillUpper==='READING' && isFill && hasFillAnswer && !gradedFlag);
  q.isPendingListening = (skillUpper==='LISTENING' && isFill && hasFillAnswer && !gradedFlag);
  q.isPendingSpeaking = (speaking && speakingAnswered && !gradedFlag);
  q.isWriting = isWriting;
  q.isWritingAnswered = hasWritingAnswer;
  q.isWritingPending = hasWritingAnswer && !gradedFlag;
  q.isFill = isFill;
  q.isFillAnswered = hasFillAnswer;
  q.isSpeaking = speaking;
  q.isSpeakingAnswered = speakingAnswered;
  q.isGraded = gradedFlag; // generic graded state

  // Infer correctness for objective FILL if score is present but correct flag is missing
  if(isFill && q.correct == null){
    // Check both score and practiceScore (practiceScore is set after manual re-grading)
    if(q.score != null){ q.correct = (Number(q.score) === 1); }
    else if(q.practiceScore != null){ q.correct = (Number(q.practiceScore) === 1); }
  }

  // Set isCorrect and isWrong for MCQ questions
  if(!isWriting && !isFill && !speaking && q.answered){
    q.isCorrect = q.correct === true;
    q.isWrong = !q.correct;
  } else {
    q.isCorrect = false;
    q.isWrong = false;
  }

  // Set isCorrect and isWrong for FILL questions after grading
  if(isFill && hasFillAnswer && gradedFlag){
    q.isCorrect = q.correct === true;
    q.isWrong = q.correct === false;
  }

  q.isUnanswered = (!q.answered) && (!hasWritingAnswer) && (!hasFillAnswer) && (!speakingAnswered);
  return q;
}

function computePendingBreakdown(){
  const breakdown = {READING:0, LISTENING:0, SPEAKING:0, WRITING:0};
  PRACTICE_DATA.questions.forEach(q=>{
    const skill = String(q.skill||'').trim().toUpperCase();
    if(skill==='READING' && q.isPendingReading) breakdown.READING++;
    else if(skill==='LISTENING' && q.isPendingListening) breakdown.LISTENING++;
    else if(skill==='SPEAKING' && q.isPendingSpeaking) breakdown.SPEAKING++;
    else if(skill==='WRITING' && q.isWritingPending) breakdown.WRITING++;
  });
  breakdown.TOTAL = breakdown.READING + breakdown.LISTENING + breakdown.SPEAKING + breakdown.WRITING;
  return breakdown;
}

function renderQuestionList(list){
  var html='';
  list.forEach(function(q){
    var cls = 'card question-card mb-2 ';
    if(q.isCorrect) cls+='correct'; else if(q.isWrong) cls+='incorrect';
    var gradedFrameNeeded = false;
    var frameColor = '#198754'; // default green for correct

    // MCQ questions: show frame if answered
    if(!q.isWriting && !q.isFill && !q.isSpeaking && q.answered){
      gradedFrameNeeded = true;
      frameColor = q.isCorrect ? '#198754' : '#dc3545'; // green if correct, red if wrong
    }

    // Fill questions: show frame if graded
    if(q.isFill && q.isFillAnswered && !(q.isPendingReading||q.isPendingListening) && q.isGraded) {
      gradedFrameNeeded = true;
      frameColor = q.isCorrect ? '#198754' : '#dc3545'; // green if correct, red if wrong
    }

    // Writing and Speaking: NO border (removed as per user request)

    var frameStyle = gradedFrameNeeded ? (' style="border:2px solid '+frameColor+';"') : '';
    html += '<div class="'+cls+'"'+frameStyle+'><div class="card-header">Câu '+q.index+'</div><div class="card-body">';
    html += '<p><strong>'+escapeHtml(q.title||'')+'</strong></p>';
    if(q.isWriting){
      if(q.isWritingAnswered){
        html += '<div class="answer-line">'+ (q.isWritingPending?'<span class="badge bg-warning text-dark">Chờ chấm</span>':'<span class="badge bg-success">Đã chấm</span>')+'</div>';
        html += '<div class="p-2 border rounded bg-light" style="white-space:pre-line">'+escapeHtml(q.answerText||'')+'</div>';
        if(q.isGraded){ html += '<p class="mt-2"><span class="fw-bold">Kết quả:</span> '+(q.manualScore!=null?q.manualScore:'-')+' '+(q.feedback?('| <strong>Nhận xét:</strong> '+escapeHtml(q.feedback)):'')+'</p>'; }
      } else { html += '<p class="text-muted">Chưa nộp bài viết</p>'; }
    } else if(q.isFill){
      if(q.isFillAnswered){
        var fillPending = (q.isPendingReading || q.isPendingListening);
          html += '<div class="answer-line">'+ (fillPending?'<span class="badge bg-warning text-dark">Chờ chấm</span>':'<span class="badge bg-success">Đã chấm</span>')+'</div>';
          html += '<div class="p-2 border rounded bg-light" style="white-space:pre-line">'+escapeHtml(q.answerText||'')+'</div>';
          // Show fill result explicitly
          html += '<p class="mt-2"><span class="fw-bold">Kết quả:</span> '+formatFillResult(q)+'</p>';
      } else { html += '<p class="mt-2 text-muted">Chưa trả lời</p>'; }
    } else if(q.isSpeaking){
        if(q.isSpeakingAnswered){
            html += '<div class="answer-line">'+ (q.isPendingSpeaking?'<span class="badge bg-warning text-dark">Chờ chấm</span>':'<span class="badge bg-success">Đã chấm</span>')+'</div>';
            var src = null;
            if(q.answerText && String(q.answerText).trim().length>0){ src = q.answerText; }
            else if(Array.isArray(q.speakingSubmissions) && q.speakingSubmissions.length>0){
                var latest = q.speakingSubmissions[0];
                src = latest.id? ('/api/speaking/audio/'+latest.id) : (latest.audioPath || null);
            }
            if(src){
                var mime = inferAudioType(src);
                html += '<audio controls style="width:100%"><source src="'+escapeHtml(src)+'" type="'+mime+'"></audio>';
            } else { html += '<div class="text-muted">Không tìm thấy audio đã nộp</div>'; }
            if(q.isGraded){
              var sc = getUnifiedScore(q);
              if(sc != null){ html += '<p class="mt-2"><span class="fw-bold">Kết quả:</span> '+sc+' '+(q.feedback?('| <strong>Nhận xét:</strong> '+escapeHtml(q.feedback)):'')+'</p>'; }
            }
        } else { html += '<p class="mt-2 text-muted">Chưa trả lời</p>'; }
    } else {
        (q.answers||[]).forEach(function(a){
            var aCls='answer-line'; if(a.isTrue) aCls+=' correct';
            html += '<div class="'+aCls+'">'+escapeHtml(a.title)+' '+(a.isTrue?'<span class="badge bg-success">Đúng</span>':'')+'</div>';
        });
        if(q.answered){ html += '<p class="mt-2"><span class="fw-bold">Kết quả:</span> '+(q.isCorrect?'<span class="text-success">ĐÚNG</span>':'<span class="text-danger">SAI</span>')+'</p>'; }
        else { html += '<p class="mt-2 text-muted">Chưa trả lời</p>'; }
    }
      html += '</div></div>';
  });
    return html;
}

// Không còn dùng cho modal user: giữ stub nếu nơi khác gọi
function renderPartsForSkill(skill){
  return '<div class="alert alert-info">Đã thay đổi sang hiển thị theo phần thi, chức năng cũ không còn dùng.</div>';
}

// Infer audio MIME type from URL or default to audio/mpeg
function inferAudioType(src){
  const el = document.createElement('audio');
  el.src = src;
  const isSupported = (type) => {
    return el.canPlayType(type) !== '';
  };
  // Kiểm tra theo thứ tự: mp3, wav, ogg, m4a
  if(isSupported('audio/mpeg')) return 'audio/mpeg';
  if(isSupported('audio/wav')) return 'audio/wav';
  if(isSupported('audio/ogg')) return 'audio/ogg';
  if(isSupported('audio/mp4')) return 'audio/mp4';
  // Nếu không xác định được định dạng, trả về mặc định là mp3
  return 'audio/mpeg';
}

function escapeHtml(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

function ensureBandStyles(){}

function loadPracticeBands(session){}
function loadBandsFromResultExam(session){}
function applyBandsFromHistory(list){}
function applyBandSummaryPractice(k){}
function showOverallStatusPractice(){
  try{
    const overallWrap = document.getElementById('overallBandWrap');
    const overallEl = document.getElementById('overallBand');
    if(overallWrap && overallEl){
      overallWrap.classList.add('d-none');
      overallEl.innerText = 'Chờ chấm';
    }
  }catch(e){}
}

function formatFillResult(q){
  try{
    // Pending states for reading/listening fill
    var pending = (q.isPendingReading === true) || (q.isPendingListening === true);
    if(pending) return '<span class="badge bg-warning text-dark">Chờ chấm</span>';
    // If graded, prefer boolean correct
    if(q.isGraded === true){
      if(q.correct === true) return '<span class="text-success">Đúng</span>';
      if(q.correct === false) return '<span class="text-danger">Sai</span>';
      // Fallback to score binary (check both score and practiceScore)
      var scoreValue = null;
      if(q.score != null){ scoreValue = q.score; }
      else if(q.practiceScore != null){ scoreValue = q.practiceScore; }

      if(scoreValue != null){
        return (Number(scoreValue) === 1) ? '<span class="text-success">Đúng</span>' : '<span class="text-danger">Sai</span>';
      }
      if(q.manualScore != null){
        // If manualScore is given but correctness unknown, display the score value
        return '<span class="text-info">Điểm: '+String(q.manualScore)+'</span>';
      }
      return '<span class="text-muted">Đã chấm</span>';
    }
    // Not graded and not pending
    return '<span class="text-muted">-</span>';
  }catch(e){ return '<span class="text-muted">-</span>'; }
}

// NEW: duration formatter to avoid ReferenceError in header rendering
function formatDuration(totalSeconds){
  if(totalSeconds == null || isNaN(totalSeconds)) return '';
  var sec = Math.max(0, Math.floor(Number(totalSeconds)));
  var h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60), s = sec%60;
  if(h > 0){
    return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  }
  return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
}
