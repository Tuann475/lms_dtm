var lessonSkill = null;

async function loadQuestion() {
    var uls = new URL(document.URL)
    var id = uls.searchParams.get("exam");
    $('#example').DataTable().destroy();
    var url = 'http://localhost:8080/api/question/public/find-by-lesson?id=' + id;
    const response = await fetch(url, {
        method: 'GET'
    });
    var temp = await response.json();

    var list = temp.sort((a, b) => b.id - a.id); // Sắp xếp theo id giảm dần
    console.log("Sorted list:", list);

    // Fetch lesson to get reliable skill even if no questions yet
    try {
        const lessonResp = await fetch('http://localhost:8080/api/lesson/public/findById?id=' + id);
        if (lessonResp.status < 300) {
            const lessonObj = await lessonResp.json();
            lessonSkill = lessonObj.skill || null;
        }
    } catch (e) {
        console.warn('Không lấy được skill phần thi', e);
    }
    var currentSkill = lessonSkill; // override previous detection with lessonSkill

    var main = '';
    for (let i = 0; i < list.length; i++) {
        var ctl = '';
        var isWriting = list[i].lesson && list[i].lesson.skill === 'WRITING';
        var isSpeaking = list[i].lesson && list[i].lesson.skill === 'SPEAKING';
        var qType = (list[i].questionType || '').toUpperCase();
        if (!isWriting && !isSpeaking) {
            if(qType === 'FILL'){
                // Text type: show a badge and the current text (if any answer records exist)
                var txt = (list[i].answers && list[i].answers.length>0) ? list[i].answers[0].title : '';
                ctl = `<span class='badge bg-secondary me-2'>Text</span> ${txt}`;
            } else {
                // MCQ: list options
                for (let j = 0; j < list[i].answers.length; j++) {
                    ctl += `<span>
                    <i title="Xóa đáp án" onclick="loadAAnsewr(${list[i].answers[j].id}, ${list[i].id})" data-bs-toggle="modal" data-bs-target="#addcautl" class="fa fa-edit iconctl"></i>
                    <i title="Sửa đáp án" onclick="deleteAnw(${list[i].answers[j].id})" class="fa fa-trash iconctl"></i>${list[i].answers[j].title}
                    ${list[i].answers[j].isTrue ? '<span class="icontrue"> - true</span>' : ''}
                </span><br><br>`;
                }
            }
        } else if(isWriting){
            ctl = `<span class='badge bg-info'>Writing (${list[i].questionType || 'N/A'})</span>`;
        } else if(isSpeaking){
            var vname = voiceLabel(list[i].speakingVoice);
            ctl = `<span class='badge bg-warning text-dark'>Speaking ${vname}</span>` + (list[i].linkAudio?` <a target='_blank' href='${list[i].linkAudio}' class='badge bg-secondary'>Audio</a>`:'');
        }
        main += `<tr>
                    <td>${list[i].id}</td>
                    <td>${list[i].title}</td>
                    <td>${list[i].lesson.name}</td>
                    <td>${list[i].lesson.exam.name}</td>
                    <td>${ctl}</td>
                    <td class="sticky-col">
                        <i title="Xóa" onclick="deleteQuestion(${list[i].id})" class="fa fa-trash-alt iconaction"></i>
                        <a title="Cập nhật" data-bs-toggle="modal" data-bs-target="#addtk" href="#" onclick="loadAQuestion(${list[i].id})"><i class="fa fa-edit iconaction"></i></a>
                        ${(!isWriting && !isSpeaking && qType!=='FILL') ? `<a title="Thêm câu trả lời" onclick="setIdQuestion(${list[i].id})" data-bs-toggle="modal" data-bs-target="#addcautl" href="#"><i class="fa fa-plus iconaction"></i></a>` : ''}
                    </td>
                </tr>`;
    }

    document.getElementById("listQuestion").innerHTML = main;
    // Replace duplicate grp declarations
    let writingGroupEl = document.getElementById('writingTypeGroup');
    if (currentSkill === 'WRITING') {
        if (writingGroupEl) writingGroupEl.style.display = '';
    } else {
        if (writingGroupEl) writingGroupEl.style.display = 'none';
        let wt = document.getElementById('writingType');
        if (wt) wt.value = '';
    }
    // Speaking group toggle unified
    let speakingGroupEl = document.getElementById('speakingGroup');
    if(speakingGroupEl){ speakingGroupEl.style.display = (lessonSkill === 'SPEAKING') ? '' : 'none'; }
    // Question type group
    let qtg = document.getElementById('questionTypeGroup');
    if(qtg){ qtg.style.display = (lessonSkill==='WRITING' || lessonSkill==='SPEAKING')? 'none' : ''; }

    // Init datatable once
    $('#example').DataTable({ ordering: false });
}


function clearDataCauHoi() {
    document.getElementById("idcauhoi").value = ""
    document.getElementById("title").value = ""
    // Hide writing type select if lessonSkill is not WRITING
    var grp = document.getElementById('writingTypeGroup');
    if (grp) {
        if (lessonSkill === 'WRITING') {
            grp.style.display = '';
        } else {
            grp.style.display = 'none';
            var wt = document.getElementById('writingType');
            if (wt) wt.value = '';
        }
    }
    // reset speaking fields
    var sg = document.getElementById('speakingGroup');
    if(lessonSkill === 'SPEAKING'){ if(sg) sg.style.display=''; } else { if(sg) sg.style.display='none'; }
    var sn = document.getElementById('speakingNote'); if(sn) sn.value='';
    var sa = document.getElementById('speakingAudio'); if(sa){ sa.src=''; document.getElementById('speakingAudioWrap').style.display='none'; }
}

async function saveCauHoi() {
    var uls = new URL(document.URL)
    var id = uls.searchParams.get("exam");
    var title = document.getElementById("title").value;

    if (title.trim() === "") {
        toastr.error("Vui lòng nhập tên câu hỏi!");
        return;
    }
    // Không còn lấy/gán writingType từ/to DOM, chỉ dùng questionType
    var writingTypeSelect = document.getElementById('writingType');
    var writingType = writingTypeSelect ? writingTypeSelect.value : null;
    var effectiveQuestionType = null;
    if(lessonSkill === 'WRITING'){
        effectiveQuestionType = writingType || null;
    } else if(lessonSkill === 'SPEAKING'){
        effectiveQuestionType = null;
    } else {
        effectiveQuestionType = document.getElementById('questionType')?.value || null;
    }
    var speakingNoteEl = document.getElementById('speakingNote');
    var speakingVoiceEl = document.getElementById('speakingVoice');
    var speakingAudioEl = document.getElementById('speakingAudio');
    var linkAudio = speakingAudioEl && speakingAudioEl.src ? speakingAudioEl.src : null;
    var speakingNote = speakingNoteEl ? speakingNoteEl.value : null;
    if(lessonSkill !== 'SPEAKING'){ linkAudio = null; speakingNote = null; }
    var speakingVoice = (lessonSkill === 'SPEAKING' && speakingVoiceEl)? speakingVoiceEl.value : null;
    var cauhoi = {
        "id": document.getElementById("idcauhoi").value,
        "title": document.getElementById("title").value,
        "linkAudio": linkAudio,
        "speakingNote": speakingNote,
        "speakingVoice": speakingVoice,
        "questionType": effectiveQuestionType,
        lesson: { "id": id }
    }
    const response = await fetch('http://localhost:8080/api/question/admin/create-update', {
        method: 'POST',
        headers: new Headers({
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify(cauhoi)
    });
    if (response.status < 300) {
        toastr.success("thêm/sửa câu hỏi thành công!");
        loadQuestion();
        $("#addtk").modal('hide');
    } else if (response.status === exceptionCode) {
        var result = await response.json();
        toastr.warning(result.defaultMessage);
    }
}

async function loadAQuestion(id) {
    var url = 'http://localhost:8080/api/question/public/findById?id=' + id;
    const response = await fetch(url, {});
    var result = await response.json();
    console.log(result);
    document.getElementById("idcauhoi").value = result.id
    document.getElementById("title").value = result.title
    // Không còn gán wt.value = result.questionType || result.writingType || '';
    document.getElementById("writingType").value = result.questionType || '';
    var qTypeEl = document.getElementById('questionType'); if(qTypeEl){ qTypeEl.value = result.questionType || ''; }
    // Decide show writing type based on lesson skill
    let writingGroupEl = document.getElementById('writingTypeGroup');
    if (result.lesson && result.lesson.skill === 'WRITING') {
        if (writingGroupEl) writingGroupEl.style.display = '';
    } else {
        if (writingGroupEl) writingGroupEl.style.display = 'none';
        let wt = document.getElementById('writingType'); if (wt) wt.value='';
    }
    let speakingGroupEl = document.getElementById('speakingGroup');
    let speakingNoteEl = document.getElementById('speakingNote');
    let speakingAudioWrapEl = document.getElementById('speakingAudioWrap');
    let speakingAudioEl = document.getElementById('speakingAudio');
    let speakingVoiceEl = document.getElementById('speakingVoice');
    if(result.lesson && result.lesson.skill === 'SPEAKING'){
        if(speakingGroupEl) speakingGroupEl.style.display='';
        if(speakingNoteEl) speakingNoteEl.value = result.speakingNote || '';
        if(speakingAudioEl && result.linkAudio){ speakingAudioEl.src = result.linkAudio; if(speakingAudioWrapEl) speakingAudioWrapEl.style.display=''; } else { if(speakingAudioWrapEl) speakingAudioWrapEl.style.display='none'; }
        if(speakingVoiceEl) speakingVoiceEl.value = result.speakingVoice || '21m00Tcm4TlvDq8ikWAM';
    } else {
        if(speakingGroupEl) speakingGroupEl.style.display='none';
        if(speakingNoteEl) speakingNoteEl.value='';
        if(speakingAudioWrapEl) speakingAudioWrapEl.style.display='none';
    }
}

function setIdQuestion(id) {
    document.getElementById("idquestion").value = id
    document.getElementById("iddapan").value = ""
    document.getElementById("tieudectl").value = ""
    document.getElementById("istrue").checked = false
    // Default the answer type based on current questionType selection in form if present
    var qTypeEl = document.getElementById('questionType');
    var typeSel = document.getElementById('loaiDapAn');
    if(typeSel){ typeSel.value = (qTypeEl && (qTypeEl.value||'').toUpperCase()==='FILL') ? 'FILL' : 'MCQ'; }
    applyAnswerType();
}

async function deleteQuestion(id) {
    var con = confirm("Bạn chắc chắn muốn xóa câu hỏi này?");
    if (con === false) { return; }
    var url = 'http://localhost:8080/api/question/admin/delete?id=' + id;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    if (response.status < 300) {
        toastr.success("xóa thành công!");
        loadQuestion();
    } else if (response.status === exceptionCode) {
        var result = await response.json();
        toastr.warning(result.defaultMessage);
    }
}

async function deleteAnw(id) {
    var con = confirm("Bạn chắc chắn muốn xóa câu trả lời này?");
    if (con === false) { return; }
    var url = 'http://localhost:8080/api/answer/admin/delete?id=' + id;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: new Headers({
            'Authorization': 'Bearer ' + token
        })
    });
    if (response.status < 300) {
        toastr.success("xóa thành công!");
        loadQuestion();
    } else if (response.status === exceptionCode) {
        var result = await response.json();
        toastr.warning(result.defaultMessage);
    }
}


async function saveCauTraLoi() {
    // Infer question type of parent question
    const qId = document.getElementById('idquestion').value;
    if(!qId){ toastr.error('Thiếu ID câu hỏi'); return; }
    let qType = null;
    try {
        const resp = await fetch('http://localhost:8080/api/question/public/findById?id=' + qId);
        if(resp.ok){ const q = await resp.json(); qType = (q.questionType||'').toUpperCase(); }
    } catch(e){ console.warn('Không lấy được questionType', e); }
    // Determine input source
    const txtMcqEl = document.getElementById('tieudectl');
    const txtFillEl = document.getElementById('tieudectl_text');
    let rawTitle = '';
    let isFill = false;
    if(qType === 'FILL'){ // question declared fill => treat as fill answer
        isFill = true;
        rawTitle = (txtFillEl && txtFillEl.style.display !== 'none') ? (txtFillEl.value||'') : (txtMcqEl.value||'');
    } else {
        // MCQ question; treat as MCQ answer
        rawTitle = (txtMcqEl.value||'');
    }
    if(rawTitle.trim() === ''){ toastr.error('Vui lòng nhập nội dung đáp án'); return; }
    // For fill: backend expects answerType = FILL, isTrue forced true
    const answerPayload = {
        id: document.getElementById('iddapan').value || null,
        title: rawTitle.trim(),
        isTrue: isFill ? true : document.getElementById('istrue').checked,
        question: { id: qId },
        answerType: isFill ? 'FILL' : null // MCQ or unspecified => null
    };
    const response = await fetch('http://localhost:8080/api/answer/admin/create-update', {
        method: 'POST',
        headers: new Headers({ 'Authorization': 'Bearer '+token, 'Content-Type':'application/json' }),
        body: JSON.stringify(answerPayload)
    });
    if(response.status < 300){ toastr.success('Thêm/sửa câu trả lời thành công'); loadQuestion(); $('#addcautl').modal('hide'); }
    else if(response.status === exceptionCode){ try { const err = await response.json(); toastr.warning(err.defaultMessage || 'Lỗi'); } catch(e){ toastr.error('Lỗi không rõ'); } }
    else { toastr.error('Lưu đáp án thất bại'); }
}

async function loadAAnsewr(id, idquestion) {
    const url = 'http://localhost:8080/api/answer/public/findById?id=' + id;
    const resp = await fetch(url, {});
    if(!resp.ok){ toastr.error('Không tải được đáp án'); return; }
    const result = await resp.json();
    document.getElementById('iddapan').value = result.id;
    document.getElementById('idquestion').value = idquestion;
    // Fetch question to know type
    let qType = null;
    try { const qResp = await fetch('http://localhost:8080/api/question/public/findById?id=' + idquestion); if(qResp.ok){ const q = await qResp.json(); qType = (q.questionType||'').toUpperCase(); } } catch(e){ }
    const txtMcqEl = document.getElementById('tieudectl');
    const txtFillEl = document.getElementById('tieudectl_text');
    if(qType === 'FILL'){
        if(txtFillEl){ txtFillEl.style.display=''; txtFillEl.value = result.title || ''; }
        if(txtMcqEl){ txtMcqEl.style.display='none'; txtMcqEl.value=''; }
        const isTrueEl = document.getElementById('istrue'); if(isTrueEl){ isTrueEl.checked = true; }
        const hint = document.getElementById('hintFill'); if(hint){ hint.style.display='block'; hint.innerText='Dạng ô trống (t��� động đúng).'; }
    } else {
        if(txtMcqEl){ txtMcqEl.style.display=''; txtMcqEl.value = result.title || ''; }
        if(txtFillEl){ txtFillEl.style.display='none'; txtFillEl.value=''; }
        const isTrueEl = document.getElementById('istrue'); if(isTrueEl){ isTrueEl.checked = !!result.isTrue; }
        const hint = document.getElementById('hintFill'); if(hint){ hint.style.display='none'; }
    }
}

async function generateSpeakingAudio(){
    if(lessonSkill !== 'SPEAKING'){ toastr.warning('Không phải phần thi SPEAKING'); return; }
    var text = (document.getElementById('speakingNote').value || document.getElementById('title').value || '').trim();
    if(!text){ toastr.warning('Nhập prompt hoặc câu hỏi trước'); return; }
    var voiceId = document.getElementById('speakingVoice').value;
    var btn = document.getElementById('btnGenVoice'); if(btn){ btn.disabled=true; btn.innerText='Đang tạo...'; }
    try {
        const aiRes = await fetch('/api/ai/speech/generate?voiceId=' + encodeURIComponent(voiceId) + '&text=' + encodeURIComponent(text), { method:'POST' });
        if(!aiRes.ok){
            let errTxt = await aiRes.text();
            toastr.error('AI thất bại ('+aiRes.status+'): '+ (errTxt||'Không rõ')); return;
        }
        const blob = await aiRes.blob();
        const fd = new FormData();
        fd.append('file', new File([blob], 'speaking-q.mp3', { type:'audio/mpeg' }));
        const upRes = await fetch('http://localhost:8080/api/public/upload-file', { method:'POST', body: fd });
        if(!upRes.ok){ let t = await upRes.text(); toastr.error('Upload audio thất bại ('+upRes.status+'): '+t); return; }
        const link = await upRes.text();
        var sa = document.getElementById('speakingAudio');
        var saWrap = document.getElementById('speakingAudioWrap');
        var aLink = document.getElementById('speakingAudioLink');
        if(sa){ sa.src = link; }
        if(aLink){ aLink.href = link; aLink.style.display='inline-block'; }
        if(saWrap){ saWrap.style.display=''; }
        toastr.success('Đã tạo audio AI');
    } catch(e){ toastr.error('Lỗi tạo audio: ' + (e.message||e)); }
    finally { if(btn){ btn.disabled=false; btn.innerText='Tạo voice AI'; } }
}

function voiceLabel(v){
    if(!v) return '';
    switch(v){
        case '21m00Tcm4TlvDq8ikWAM': return '(Rachel)';
        case 'AZnzlk1XvdvUeBnXmlld': return '(Domi)';
        case 'EXAVITQu4vr4xnSDxMaL': return '(Bella)';
        case 'ErXwobaYiN019PkySvjV': return '(Antoni)';
        default: return '('+v.substring(0,6)+'...)';
    }
}

function removeSpeakingAudio(){
    var sa = document.getElementById('speakingAudio'); if(sa){ sa.src=''; }
    var wrap = document.getElementById('speakingAudioWrap'); if(wrap){ wrap.style.display='none'; }
    var aLink = document.getElementById('speakingAudioLink'); if(aLink){ aLink.style.display='none'; aLink.href='#'; }
    toastr.info('Đã xóa audio tạm, lưu câu hỏi để cập nhật');
}

function clearAnswerType(){
    var sel = document.getElementById('loaiDapAn');
    if(sel){ sel.value=''; }
    // Hiện lại input MCQ, ẩn fill, bật checkbox đúng
    var wrapIsTrue = document.getElementById('wrapIsTrue'); if(wrapIsTrue) wrapIsTrue.style.display='';
    var hintFill = document.getElementById('hintFill'); if(hintFill) hintFill.style.display='none';
    var inputMcq = document.getElementById('tieudectl'); if(inputMcq){ inputMcq.style.display=''; }
    var inputFill = document.getElementById('tieudectl_text'); if(inputFill){ inputFill.style.display='none'; inputFill.value=''; }
    var isTrue = document.getElementById('istrue'); if(isTrue){ isTrue.checked=false; }
}

function applyAnswerType(){
    var type = document.getElementById('loaiDapAn');
    if(!type) return;
    var wrapIsTrue = document.getElementById('wrapIsTrue');
    var hintFill = document.getElementById('hintFill');
    var inputMcq = document.getElementById('tieudectl');
    var inputFill = document.getElementById('tieudectl_text');
    var val = type.value;
    if(val === 'FILL'){
        if(wrapIsTrue) wrapIsTrue.style.display='none';
        var isTrue = document.getElementById('istrue'); if(isTrue) isTrue.checked = true;
        if(hintFill) hintFill.style.display='block';
        if(inputMcq) inputMcq.style.display='none';
        if(inputFill) inputFill.style.display='';
    } else if(val === 'MCQ') {
        if(wrapIsTrue) wrapIsTrue.style.display='';
        if(hintFill) hintFill.style.display='none';
        if(inputMcq) inputMcq.style.display='';
        if(inputFill) inputFill.style.display='none';
    } else { // rỗng
        if(wrapIsTrue) wrapIsTrue.style.display='';
        if(hintFill) hintFill.style.display='none';
        if(inputMcq) inputMcq.style.display='';
        if(inputFill){ inputFill.style.display='none'; }
    }
}
// Optional: when changing questionType in add/edit form, reflect default answer type
(function(){
  var qTypeEl = document.getElementById('questionType');
  if(qTypeEl){
    qTypeEl.addEventListener('change', function(){
      var typeSel = document.getElementById('loaiDapAn');
      if(typeSel){ typeSel.value = (qTypeEl.value||'').toUpperCase()==='FILL' ? 'FILL' : 'MCQ'; }
      applyAnswerType();
    });
  }
})();
