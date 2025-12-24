// Teacher-specific question management script
var lessonSkill = null;
var token = window.token || localStorage.getItem('token');
var exceptionCode = 417; // assuming same as admin

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
function ensureLessonSkill(cb){
    if(lessonSkill){ if(cb) cb(); return; }
    try {
        var id = new URL(document.URL).searchParams.get('exam');
        if(!id){ if(cb) cb(); return; }
        fetch('https://lmsdtm-production.up.railway.app/api/lesson/public/findById?id=' + id)
            .then(r=> r.ok? r.json(): null)
            .then(j=>{ if(j && j.skill){ lessonSkill = j.skill; console.log('[TeacherQuestion] fetched skill =', lessonSkill); } if(cb) cb(); })
            .catch(e=>{ console.warn('Không lấy được skill', e); if(cb) cb(); });
    } catch(e){ console.warn('ensureLessonSkill error', e); if(cb) cb(); }
}
function currentSkill(){ return (lessonSkill||'').toUpperCase(); }
function updateSkillBadge(){
    var el = document.getElementById('currentSkillLabel');
    if(!el) return;
    var s = currentSkill();
    if(!s){ el.style.display='none'; return; }
    el.textContent = 'Skill: ' + s;
    el.style.display='';
}
function applySkillVisibility(){
    var skill = currentSkill();
    var writing = document.getElementById('writingTypeGroup');
    var speaking = document.getElementById('speakingGroup');
    var qtype = document.getElementById('questionTypeGroup');
    if(writing) writing.style.display='none';
    if(speaking) speaking.style.display='none';
    if(qtype) qtype.style.display='none';
    if(skill==='WRITING'){ if(writing) writing.style.display=''; }
    else if(skill==='SPEAKING'){ if(speaking) speaking.style.display=''; }
    else if(skill==='LISTENING' || skill==='READING'){ if(qtype) qtype.style.display=''; }
    else { if(qtype) qtype.style.display=''; }
}
function showNoDataIfEmpty(){
    var tbody = document.getElementById('listQuestion');
    if(!tbody) return;
    var rows = Array.from(tbody.querySelectorAll('tr')).filter(r=> r.id !== 'noDataRow');
    var noRow = document.getElementById('noDataRow');
    if(noRow){ noRow.style.display = rows.length === 0 ? '' : 'none'; }
}

async function loadQuestion(){
    var uls = new URL(document.URL);
    var id = uls.searchParams.get('exam');
    if(!id){ console.warn('Thiếu exam id'); return; }
    try { if($.fn.DataTable.isDataTable('#example')) { $('#example').DataTable().destroy(); } } catch(e){}
    var url = 'https://lmsdtm-production.up.railway.app/api/question/public/find-by-lesson?id=' + id;
    const response = await fetch(url, { method:'GET' });
    if(!response.ok){ console.error('Không tải được câu hỏi', response.status); return; }
    var temp = await response.json();
    var list = temp.sort((a,b)=> b.id - a.id);

    // Fetch lesson to get skill
    try {
        const lessonResp = await fetch('https://lmsdtm-production.up.railway.app/api/lesson/public/findById?id=' + id);
        if (lessonResp.status < 300) {
            const lessonObj = await lessonResp.json();
            lessonSkill = lessonObj.skill || null;
        }
    } catch(e){ console.warn('Không lấy được skill phần thi', e); }

    var main='';
    for(let i=0;i<list.length;i++){
        var q = list.length>i? list[i]: null;
        if(!q) continue;
        var ctl='';
        var isWriting = q.lesson && q.lesson.skill === 'WRITING';
        var isSpeaking = q.lesson && q.lesson.skill === 'SPEAKING';
        var qType = (q.questionType||'').toUpperCase();
        if(!isWriting && !isSpeaking){
            if(qType==='FILL'){
                var txt = (q.answers && q.answers.length>0)? (q.answers[0].title||'') : '';
                ctl = `<span class='badge bg-secondary me-2'>Text</span> ${txt}`;
            } else {
                for(let j=0;j<q.answers.length;j++){
                    ctl += `<span><i title="Sửa đáp án" onclick="loadAAnsewr(${q.answers[j].id}, ${q.id})" data-bs-toggle="modal" data-bs-target="#addcautl" class="fa fa-edit iconctl"></i>
                            <i title="Xóa đáp án" onclick="deleteAnw(${q.answers[j].id})" class="fa fa-trash iconctl"></i>${q.answers[j].title}
                            ${q.answers[j].isTrue? '<span class="icontrue"> - true</span>' : ''}</span><br><br>`;
                }
            }
        } else if(isWriting){
            ctl = `<span class='badge bg-info'>Writing (${q.questionType || 'N/A'})</span>`;
        } else if(isSpeaking){
            var vname = voiceLabel(q.speakingVoice);
            ctl = `<span class='badge bg-warning text-dark'>Speaking ${vname}</span>` + (q.linkAudio?` <a target='_blank' href='${q.linkAudio}' class='badge bg-secondary'>Audio</a>`:'');
        }
        main += `<tr>
            <td>${q.id}</td>
            <td>${q.title}</td>
            <td>${q.lesson ? q.lesson.name : ''}</td>
            <td>${(q.lesson && q.lesson.exam)? q.lesson.exam.name : ''}</td>
            <td>${ctl}</td>
            <td class="sticky-col">
                <i title="Xóa" onclick="deleteQuestion(${q.id})" class="fa fa-trash-alt iconaction"></i>
                <a title="Cập nhật" data-bs-toggle="modal" data-bs-target="#addtk" href="#" onclick="loadAQuestion(${q.id})"><i class="fa fa-edit iconaction"></i></a>
                ${(!isWriting && !isSpeaking && qType!=='FILL') ? `<a title="Thêm câu trả lời" onclick="setIdQuestion(${q.id})" data-bs-toggle="modal" data-bs-target="#addcautl" href="#"><i class="fa fa-plus iconaction"></i></a>` : ''}
            </td>
        </tr>`;
    }
    var listEl = document.getElementById('listQuestion'); if(listEl) listEl.innerHTML = main;

    applySkillVisibility();
    updateSkillBadge();
    showNoDataIfEmpty();
    try { $('#example').DataTable({ ordering:false }); } catch(e){}
}

function clearDataCauHoi(){
    var idcauhoi = document.getElementById('idcauhoi'); if(idcauhoi) idcauhoi.value='';
    var title = document.getElementById('title'); if(title) title.value='';
    var sn = document.getElementById('speakingNote'); if(sn) sn.value='';
    var sv = document.getElementById('speakingVoice'); if(sv) sv.value='21m00Tcm4TlvDq8ikWAM';
    var sa = document.getElementById('speakingAudio'); if(sa){ sa.src=''; }
    var saWrap = document.getElementById('speakingAudioWrap'); if(saWrap){ saWrap.style.display='none'; }
    var saLink = document.getElementById('speakingAudioLink'); if(saLink){ saLink.style.display='none'; saLink.href='#'; }
    var qt = document.getElementById('questionType'); if(qt) qt.value='';
    ensureLessonSkill(function(){ applySkillVisibility(); });
}

async function saveCauHoi(){
    var uls = new URL(document.URL);
    var id = uls.searchParams.get('exam');
    var title = document.getElementById('title');
    if(!title || title.value.trim()===''){ toastr.error('Vui lòng nhập tên câu hỏi!'); return; }
    // Đã loại bỏ hoàn toàn writingType, chỉ dùng questionType cho mọi thao tác
    var effectiveQuestionType = null;
    if(currentSkill()==='WRITING'){
        effectiveQuestionType = writingType || null;
    } else if(currentSkill()==='SPEAKING'){
        effectiveQuestionType = null;
    } else {
        effectiveQuestionType = document.getElementById('questionType')?.value || null;
    }
    var speakingNoteEl = document.getElementById('speakingNote');
    var speakingVoiceEl = document.getElementById('speakingVoice');
    var speakingAudioEl = document.getElementById('speakingAudio');
    var linkAudio = speakingAudioEl && speakingAudioEl.src ? speakingAudioEl.src : null;
    var speakingNote = speakingNoteEl? speakingNoteEl.value : null;
    if(currentSkill() !== 'SPEAKING'){ linkAudio=null; speakingNote=null; }
    var speakingVoice = (currentSkill()==='SPEAKING' && speakingVoiceEl)? speakingVoiceEl.value : null;
    var cauhoi = {
        id: document.getElementById('idcauhoi')? document.getElementById('idcauhoi').value: '',
        title: title.value,
        // writingType: null, // đã loại bỏ khỏi payload
        linkAudio: linkAudio,
        speakingNote: speakingNote,
        speakingVoice: speakingVoice,
        questionType: effectiveQuestionType,
        lesson: { id: id }
    };
    const response = await fetch('https://lmsdtm-production.up.railway.app/api/question/admin/create-update', {
        method:'POST',
        headers: new Headers({ 'Authorization':'Bearer '+token, 'Content-Type':'application/json' }),
        body: JSON.stringify(cauhoi)
    });
    if(response.status < 300){ toastr.success('Thêm/sửa câu hỏi thành công!'); loadQuestion(); $('#addtk').modal('hide'); }
    else if(response.status === exceptionCode){ try { const result = await response.json(); toastr.warning(result.defaultMessage); } catch(e){ toastr.warning('Lỗi'); } }
    else { toastr.error('Lưu câu hỏi thất bại'); }
}

async function loadAQuestion(id){
    const resp = await fetch('https://lmsdtm-production.up.railway.app/api/question/public/findById?id=' + id);
    if(!resp.ok){ toastr.error('Không tải được câu hỏi'); return; }
    const result = await resp.json();
    var idEl = document.getElementById('idcauhoi'); if(idEl) idEl.value = result.id;
    var titleEl = document.getElementById('title'); if(titleEl) titleEl.value = result.title;
    // Không còn lấy/gán writingType từ/to DOM, chỉ dùng questionType
    var wt = document.getElementById('writingType'); if(wt) wt.value = result.questionType || '';
    var qTypeEl = document.getElementById('questionType'); if(qTypeEl) qTypeEl.value = result.questionType || '';
    if(result.lesson && result.lesson.skill && !lessonSkill){ lessonSkill = result.lesson.skill; }
    // Writing visibility
    var writingGroupEl = document.getElementById('writingTypeGroup');
    if(writingGroupEl){ writingGroupEl.style.display = (result.lesson && result.lesson.skill==='WRITING')? '' : 'none'; }
    if(result.lesson && result.lesson.skill!=='WRITING' && wt){ wt.value=''; }
    // Speaking
    var speakingGroupEl = document.getElementById('speakingGroup');
    var speakingNoteEl = document.getElementById('speakingNote');
    var speakingAudioWrapEl = document.getElementById('speakingAudioWrap');
    var speakingAudioEl = document.getElementById('speakingAudio');
    var speakingVoiceEl = document.getElementById('speakingVoice');
    if(result.lesson && result.lesson.skill==='SPEAKING'){
        if(speakingGroupEl) speakingGroupEl.style.display='';
        if(speakingNoteEl) speakingNoteEl.value = result.speakingNote || '';
        if(speakingAudioEl && result.linkAudio){ speakingAudioEl.src = result.linkAudio; if(speakingAudioWrapEl) speakingAudioWrapEl.style.display=''; } else { if(speakingAudioWrapEl) speakingAudioWrapEl.style.display='none'; }
        if(speakingVoiceEl) speakingVoiceEl.value = result.speakingVoice || '21m00Tcm4TlvDq8ikWAM';
    } else {
        if(speakingGroupEl) speakingGroupEl.style.display='none';
        if(speakingNoteEl) speakingNoteEl.value='';
        if(speakingAudioWrapEl) speakingAudioWrapEl.style.display='none';
    }
    updateSkillBadge();
    applySkillVisibility();
}

function setIdQuestion(id){
    var idQ = document.getElementById('idquestion'); if(idQ) idQ.value = id;
    var idAns = document.getElementById('iddapan'); if(idAns) idAns.value='';
    var tCtl = document.getElementById('tieudectl'); if(tCtl) tCtl.value='';
    var isTrue = document.getElementById('istrue'); if(isTrue) isTrue.checked=false;
}

async function deleteQuestion(id){
    if(!confirm('Bạn chắc chắn muốn xóa câu hỏi này?')) return;
    var url = 'https://lmsdtm-production.up.railway.app/api/question/admin/delete?id=' + id;
    const resp = await fetch(url, { method:'DELETE', headers: new Headers({ 'Authorization':'Bearer '+token }) });
    if(resp.status < 300){ toastr.success('Xóa thành công!'); loadQuestion(); }
    else if(resp.status === exceptionCode){ try { const r = await resp.json(); toastr.warning(r.defaultMessage); } catch(e){ toastr.warning('Lỗi'); } }
    else { toastr.error('Xóa thất bại'); }
}

async function deleteAnw(id){
    if(!confirm('Bạn chắc chắn muốn xóa câu trả lời này?')) return;
    const resp = await fetch('https://lmsdtm-production.up.railway.app/api/answer/admin/delete?id=' + id, { method:'DELETE', headers: new Headers({ 'Authorization':'Bearer '+token }) });
    if(resp.status < 300){ toastr.success('Xóa thành công!'); loadQuestion(); }
    else if(resp.status === exceptionCode){ try { const r = await resp.json(); toastr.warning(r.defaultMessage); } catch(e){ toastr.warning('Lỗi'); } }
    else { toastr.error('Xóa đáp án thất bại'); }
}

async function saveCauTraLoi(){
    const qId = document.getElementById('idquestion')? document.getElementById('idquestion').value : null;
    if(!qId){ toastr.error('Thiếu ID câu hỏi'); return; }
    let qType = null;
    try { const resp = await fetch('https://lmsdtm-production.up.railway.app/api/question/public/findById?id=' + qId); if(resp.ok){ const q = await resp.json(); qType = (q.questionType||'').toUpperCase(); } } catch(e){ }
    const txtMcqEl = document.getElementById('tieudectl');
    const txtFillEl = document.getElementById('tieudectl_text');
    let rawTitle=''; let isFill=false;
    if(qType==='FILL'){ isFill=true; rawTitle = (txtFillEl && txtFillEl.style.display!=='none')? (txtFillEl.value||'') : (txtMcqEl? txtMcqEl.value||'' : ''); }
    else { rawTitle = txtMcqEl? (txtMcqEl.value||'') : ''; }
    if(rawTitle.trim()===''){ toastr.error('Vui lòng nhập nội dung đáp án'); return; }
    const payload = {
        id: document.getElementById('iddapan')? document.getElementById('iddapan').value || null : null,
        title: rawTitle.trim(),
        isTrue: isFill? true : (document.getElementById('istrue')? document.getElementById('istrue').checked : false),
        question: { id: qId },
        answerType: isFill? 'FILL' : null
    };
    const resp = await fetch('https://lmsdtm-production.up.railway.app/api/answer/admin/create-update', { method:'POST', headers: new Headers({ 'Authorization':'Bearer '+token, 'Content-Type':'application/json' }), body: JSON.stringify(payload) });
    if(resp.status < 300){ toastr.success('Thêm/sửa đáp án thành công'); loadQuestion(); $('#addcautl').modal('hide'); }
    else if(resp.status === exceptionCode){ try { const err = await resp.json(); toastr.warning(err.defaultMessage||'Lỗi'); } catch(e){ toastr.warning('Lỗi'); } }
    else { toastr.error('Lưu đáp án thất bại'); }
}

async function loadAAnsewr(id, idquestion){
    const aResp = await fetch('https://lmsdtm-production.up.railway.app/api/answer/public/findById?id=' + id);
    if(!aResp.ok){ toastr.error('Không tải được đáp án'); return; }
    const result = await aResp.json();
    var idAns = document.getElementById('iddapan'); if(idAns) idAns.value = result.id;
    var idQ = document.getElementById('idquestion'); if(idQ) idQ.value = idquestion;
    let qType = null;
    try { const qResp = await fetch('https://lmsdtm-production.up.railway.app/api/question/public/findById?id=' + idquestion); if(qResp.ok){ const q = await qResp.json(); qType = (q.questionType||'').toUpperCase(); } } catch(e){}
    const txtMcqEl = document.getElementById('tieudectl');
    const txtFillEl = document.getElementById('tieudectl_text');
    const hint = document.getElementById('hintFill');
    const isTrueEl = document.getElementById('istrue');
    if(qType==='FILL'){
        if(txtFillEl){ txtFillEl.style.display=''; txtFillEl.value = result.title || ''; }
        if(txtMcqEl){ txtMcqEl.style.display='none'; txtMcqEl.value=''; }
        if(isTrueEl){ isTrueEl.checked=true; }
        if(hint){ hint.style.display='block'; hint.innerText='Dạng ô trống (tự động đúng).'; }
    } else {
        if(txtMcqEl){ txtMcqEl.style.display=''; txtMcqEl.value = result.title || ''; }
        if(txtFillEl){ txtFillEl.style.display='none'; txtFillEl.value=''; }
        if(isTrueEl){ isTrueEl.checked = !!result.isTrue; }
        if(hint){ hint.style.display='none'; }
    }
}

async function generateSpeakingAudio(){
    if(currentSkill() !== 'SPEAKING'){ toastr.warning('Không phải phần thi SPEAKING'); return; }
    var text = (document.getElementById('speakingNote')?.value || document.getElementById('title')?.value || '').trim();
    if(!text){ toastr.warning('Nhập prompt hoặc câu hỏi trước'); return; }
    var voiceId = document.getElementById('speakingVoice')?.value || '21m00Tcm4TlvDq8ikWAM';
    var btn = document.getElementById('btnGenVoice'); if(btn){ btn.disabled=true; btn.innerText='Đang tạo...'; }
    try {
        const aiRes = await fetch('/api/ai/speech/generate?voiceId=' + encodeURIComponent(voiceId) + '&text=' + encodeURIComponent(text), { method:'POST' });
        if(!aiRes.ok){ let errTxt = await aiRes.text(); toastr.error('AI thất bại ('+aiRes.status+'): '+(errTxt||'Không rõ')); return; }
        const blob = await aiRes.blob();
        const fd = new FormData(); fd.append('file', new File([blob], 'speaking-q.mp3', { type:'audio/mpeg' }));
        const upRes = await fetch('https://lmsdtm-production.up.railway.app/api/public/upload-file', { method:'POST', body: fd });
        if(!upRes.ok){ let t = await upRes.text(); toastr.error('Upload audio thất bại ('+upRes.status+'): '+t); return; }
        const link = await upRes.text();
        var sa = document.getElementById('speakingAudio'); if(sa){ sa.src = link; }
        var saWrap = document.getElementById('speakingAudioWrap'); if(saWrap){ saWrap.style.display=''; }
        var aLink = document.getElementById('speakingAudioLink'); if(aLink){ aLink.href=link; aLink.style.display='inline-block'; }
        toastr.success('Đã tạo audio AI');
    } catch(e){ toastr.error('Lỗi tạo audio: '+ (e.message||e)); }
    finally { if(btn){ btn.disabled=false; btn.innerText='Tạo voice AI'; } }
}

function removeSpeakingAudio(){
    var sa = document.getElementById('speakingAudio'); if(sa){ sa.src=''; }
    var wrap = document.getElementById('speakingAudioWrap'); if(wrap){ wrap.style.display='none'; }
    var aLink = document.getElementById('speakingAudioLink'); if(aLink){ aLink.style.display='none'; aLink.href='#'; }
    toastr.info('Đã xóa audio tạm, lưu câu hỏi để cập nhật');
}

// Init hooks on DOM ready
(function(){
    document.addEventListener('DOMContentLoaded', function(){
        try {
            var u = new URL(document.URL);
            if(!u.searchParams.get('exam') && u.searchParams.get('lesson')){
                u.searchParams.set('exam', u.searchParams.get('lesson'));
                window.history.replaceState({}, '', u.toString());
            }
        } catch(e){}
        ensureLessonSkill(function(){ loadQuestion(); });
        var modalAdd = document.getElementById('addtk');
        if(modalAdd){ modalAdd.addEventListener('show.bs.modal', function(){ ensureLessonSkill(function(){ applySkillVisibility(); }); }); }
    });
})();
