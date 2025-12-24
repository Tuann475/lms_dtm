var token = localStorage.getItem('token');
var listPhanThi = [];
var lessonLink = '';

async function loadCourseSelectTeacher(){
  const url = 'http://localhost:8080/api/course/public/find-all';
  const res = await fetch(url, { method:'GET' });
  if(!res.ok){ return; }
  const list = await res.json();
  let main='';
  list.forEach(c => { main += `<option value="${c.id}">${c.name}</option>`; });
  const sel = document.getElementById('khoahocbaithi');
  if(sel){ sel.innerHTML = main; }
}

async function loadCategoriesLesson(){
  try{
    const res = await fetch('http://localhost:8080/api/category/public/find-by-type?type=PHAN_THI');
    if(!res.ok) return;
    const list = await res.json();
    const selAdd = document.getElementById('danhmucphanthi');
    const selUpd = document.getElementById('danhmucphanthiupdate');
    if(selAdd){ selAdd.innerHTML = list.map(c=>`<option value="${c.id}">${c.name}</option>`).join(''); }
    if(selUpd){ selUpd.innerHTML = list.map(c=>`<option value="${c.id}">${c.name}</option>`).join(''); }
  }catch(e){ console.warn('Load category fail', e); }
}

function applySkillLayout(skillSelectId, fileWrapId, editorWrapId){
  const skill = document.getElementById(skillSelectId)?.value;
  const fileWrap = document.getElementById(fileWrapId);
  if(!skill || !fileWrap) return;
  if(skill === 'LISTENING' || skill === 'SPEAKING'){
    fileWrap.style.display='block';
  } else {
    fileWrap.style.display='none';
  }
}

document.addEventListener('change', (e)=>{
  if(e.target && e.target.id==='kynang'){ applySkillLayout('kynang','wrapFileNew','wrapEditorNew'); }
  if(e.target && e.target.id==='kynangupdate'){ applySkillLayout('kynangupdate','wrapFileUpdate','wrapEditorUpdate'); }
});

function renderFilePreviewUpdate(link){
  const previewDiv = document.getElementById('filePreviewUpdate');
  if(!previewDiv) return;
  if(!link){ previewDiv.style.display='none'; previewDiv.innerHTML=''; return; }
  const lower = link.toLowerCase();
  let html='';
  if(lower.endsWith('.mp4')){
    html = `<video controls style="max-width:420px;width:100%"><source src="${link}" type="video/mp4"></video>`;
  } else if(lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.ogg')){
    html = `<audio controls style="width:100%;max-width:420px"><source src="${link}">Audio không hỗ trợ.</audio>`;
  } else {
    html = `<a href='${link}' target='_blank'>File hiện tại</a>`;
  }
  previewDiv.innerHTML = html;
  previewDiv.style.display='block';
}

async function loadTeacherExam(){
  var id = new URL(document.URL).searchParams.get('id');
  await loadCourseSelectTeacher();
  await loadCategoriesLesson();
  if(!id){ return; }
  document.getElementById('btnthemdethi').innerText = 'Cập nhật đề thi';
  const res = await fetch('/api/exam/public/findById?id='+id);
  if(!res.ok){ return; }
  const exam = await res.json();
  document.getElementById('tenbaithi').value = exam.name || '';
  document.getElementById('limittime').value = exam.limitTime || 0;
  document.getElementById('ngaythi').value = exam.examDate || '';
  document.getElementById('giothi').value = (exam.examTime||'').toString().substring(0,5);
  if(exam.course && document.getElementById('khoahocbaithi')){
    document.getElementById('khoahocbaithi').value = exam.course.id;
  }
  await loadExistingLessons(id); // call without lock flag
}

async function loadExistingLessons(examId){
  const listTempDiv = document.getElementById('listphanthidathem');
  try{
    const res = await fetch('/api/lesson/public/find-by-exam?id='+examId);
    if(!res.ok){ return; }
    const lessons = await res.json();
    let cards='';
    lessons.forEach(l=>{
      const skillBadge = `<span class='badge bg-secondary'>${l.skill}</span>`;
      cards += `<div class='singlebonho'>Tên phần thi: ${l.name} - ${l.category? l.category.name:''} ${skillBadge} <i onclick='deleteLesson(${l.id})' class='fa fa-trash iconxoabn'></i> <i onclick='prefillUpdateLesson(${l.id})' data-bs-toggle='modal' data-bs-target='#suaphanthi' class='fa fa-edit iconedit'></i></div>`;
    });
    if(listTempDiv) listTempDiv.innerHTML = cards || '';
  }catch(e){ /* ignore */ }
}

async function prefillUpdateLesson(id){
  try{
    const res = await fetch('/api/lesson/public/findById?id='+id);
    if(!res.ok) return;
    const l = await res.json();
    document.getElementById('idlesson').value = l.id;
    document.getElementById('tenphanthiupdate').value = l.name;
    document.getElementById('danhmucphanthiupdate').value = l.category? l.category.id:'';
    document.getElementById('kynangupdate').value = l.skill;
    document.getElementById('editorupdate').value = l.content || '';
    lessonLink = l.linkFile || '';
    applySkillLayout('kynangupdate','wrapFileUpdate','wrapEditorUpdate');
    renderFilePreviewUpdate(lessonLink);
  }catch(e){ toastr.error('Không tải được phần thi'); }
}

function refreshTempLessonList(){
  const box = document.getElementById('listphanthidathem');
  if(!box){ return; }
  let html='';
  listPhanThi.forEach((l,i)=>{
    html += `<div class='singlebonho'>Tên phần thi: ${l.name} <span class='badge bg-secondary'>${l.skill}</span> <i class='fa fa-trash iconxoabn' onclick='deletePhanThiTemp(${i})'></i></div>`;
  });
  box.innerHTML = html;
  // Attempt AI generation for any SPEAKING without file
  listPhanThi.forEach((l,i)=>{ if(l.skill==='SPEAKING' && !l.linkFile){ generateSpeakingAudioIfNeeded(i); } });
}

function deletePhanThiTemp(index){
  if(index < 0 || index >= listPhanThi.length) return;
  listPhanThi.splice(index, 1);
  toastr.success('Đã xóa phần thi tạm');
  refreshTempLessonList();
}

// After add temp, just update list and UI instead of reloading the page
async function addPhanThiTempModal(){
  const ten = document.getElementById('tenphanthi').value;
  const skill = document.getElementById('kynang').value;
  const catId = document.getElementById('danhmucphanthi').value;
  const fileInput = document.getElementById('chonfilennghe');
  const content = document.getElementById('editor').value;
  let linkFile='';
  if(!ten || !skill || !catId){ toastr.warning('Điền đủ thông tin bắt buộc'); return; }
  if((skill==='LISTENING' || skill==='SPEAKING') && fileInput.files && fileInput.files.length>0){
    try{
      const fd = new FormData(); fd.append('file', fileInput.files[0]);
      const upRes = await fetch('/api/public/upload-file',{ method:'POST', body: fd });
      if(upRes.ok){ linkFile = await upRes.text(); } else toastr.warning('Upload file thất bại');
    }catch(e){ toastr.error('Lỗi upload file'); }
  }
  listPhanThi.push({ name:ten, skill:skill, content:content, linkFile:linkFile, category:{ id:catId } });
  toastr.success('Thêm phần thi thành công');
  refreshTempLessonList();
  // Optionally clear modal inputs
  // document.getElementById('tenphanthi').value='';
  // document.getElementById('editor').value='';
  // if(fileInput) fileInput.value='';
}

async function updateLessonBasicModal(){
  const id = document.getElementById('idlesson').value;
  const ten = document.getElementById('tenphanthiupdate').value;
  const catId = document.getElementById('danhmucphanthiupdate').value;
  const skill = document.getElementById('kynangupdate').value;
  const content = document.getElementById('editorupdate').value;
  const fileInput = document.getElementById('chonfilenngheupdate');
  let finalLink = lessonLink;
  if(!ten || !catId || !skill){ toastr.warning('Điền đủ thông tin'); return; }
  if((skill==='LISTENING' || skill==='SPEAKING') && fileInput.files && fileInput.files.length>0){
    try{
      const fd = new FormData(); fd.append('file', fileInput.files[0]);
      const upRes = await fetch('/api/public/upload-file',{ method:'POST', body: fd });
      if(upRes.ok){ finalLink = await upRes.text(); } else toastr.warning('Upload file thất bại');
    }catch(e){ toastr.error('Lỗi upload file'); }
  }
  const examId = new URL(document.URL).searchParams.get('id');
  const body = { id: parseInt(id), name:ten, content:content, linkFile:finalLink, skill:skill,
    exam:{ id: examId? parseInt(examId): null }, category:{ id: catId } };
  const res = await fetch('/api/lesson/teacher/update',{ method:'POST', headers:{ 'Content-Type':'application/json','Authorization':'Bearer '+ token }, body: JSON.stringify(body) });
  if(res.status<300){
    toastr.success('Sửa phần thi thành công');
    // Close modal without reloading
    const modalEl = document.getElementById('suaphanthi');
    if(modalEl){
      if(typeof bootstrap !== 'undefined' && bootstrap.Modal){
        const inst = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        inst.hide();
      } else if(window.$){ $('#suaphanthi').modal('hide'); }
    }
    // Reload existing lessons list from server
    if(examId){ await loadExistingLessons(examId); }
  } else {
    toastr.warning('Cập nhật thất bại');
  }
}

// Update exam status like admin
async function updateTrangThaiTeacher(sel){
  const id = new URL(document.URL).searchParams.get('id');
  const status = sel.value;
  const res = await fetch(`/api/exam/teacher/update-trangthai?id=${id}&trangthai=${status}`, { method:'POST', headers:{ 'Authorization':'Bearer '+ token } });
  if(res.ok){ alert('Cập nhật trạng thái thành công'); }
}

// Save exam with unified payload
async function saveExamTeacher(){
  const idParam = new URL(document.URL).searchParams.get('id');
  const name = document.getElementById('tenbaithi').value.trim();
  const limitTime = parseInt(document.getElementById('limittime').value);
  const examDate = document.getElementById('ngaythi').value;
  const examTime = document.getElementById('giothi').value;
  const courseId = parseInt(document.getElementById('khoahocbaithi').value);
  // Reset errors
  ['error-tenbaithi','error-limittime','error-ngaythi','error-giothi','error-khoahoc','error-phanthi'].forEach(id=>{ const el=document.getElementById(id); if(el) el.style.display='none'; });
  let hasError=false;
  if(!name){ document.getElementById('error-tenbaithi').style.display='block'; hasError=true; }
  if(!limitTime || limitTime<=0){ document.getElementById('error-limittime').style.display='block'; hasError=true; }
  if(!examDate){ document.getElementById('error-ngaythi').style.display='block'; hasError=true; }
  if(!examTime){ document.getElementById('error-giothi').style.display='block'; hasError=true; }
  if(!courseId){ document.getElementById('error-khoahoc').style.display='block'; hasError=true; }
  if(!idParam && listPhanThi.length===0){ document.getElementById('error-phanthi').style.display='block'; hasError=true; }
  if(hasError){ toastr.error('Vui lòng kiểm tra các trường bắt buộc'); return; }
  // For any temp lessons that used TinyMCE editor, re-sync content if TinyMCE present
  if(window.tinymce){
    const ed = tinymce.get('editor');
    if(ed && listPhanThi.length>0){
      // last added might rely on raw textarea; leave as is unless we track specific index
    }
  }
  // Build payload matching CreateExamRequest format
  const payload = {
    id: idParam? parseInt(idParam): null,
    name: name,
    limitTime: limitTime,
    examDate: examDate,
    examTime: examTime,
    courseId: courseId,
    lessons: listPhanThi.map(l=>({
      name: l.name,
      skill: l.skill,
      content: l.content,
      linkFile: l.linkFile,
      category: { id: l.category.id }
    }))
  };
  try{
    const res = await fetch('/api/exam/teacher/create',{ method:'POST', headers:{ 'Content-Type':'application/json','Authorization':'Bearer '+ token }, body: JSON.stringify(payload) });
    if(res.status<300){
      swal({ title:'Thành công', text:'Đã lưu bài thi', type:'success' }, function(){ window.location.href='/teacher/baithi'; });
    } else {
      const t = await res.text(); toastr.warning('Lưu thất bại: '+ t); }
  }catch(e){ toastr.error('Lỗi kết nối server'); }
}

// Alias for legacy template functions
function saveExam(){ return saveExamTeacher(); }
function addPhanThi(){ return addPhanThiTempModal(); }
