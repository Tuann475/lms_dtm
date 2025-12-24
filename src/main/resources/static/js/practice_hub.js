var token = localStorage.getItem('token') || sessionStorage.getItem('token');
function authHeaders(){ return { 'Authorization': 'Bearer ' + token }; }
function escapeHtml(str){ if(!str) return ''; return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

async function loadPracticeHub(){
  if(!token){ $('#practiceHubLoading').removeClass('alert-info').addClass('alert-warning').text('Bạn cần đăng nhập để xem luyện đề.'); return; }
  try{
    const res = await fetch('http://localhost:8080/api/course-user/user/find-by-user', { headers: authHeaders() });
    if(!res.ok){ throw new Error('Không tải được khóa học'); }
    const courses = await res.json();
    if(courses.length===0){ $('#practiceHubLoading').removeClass('alert-info').addClass('alert-warning').text('Bạn chưa đăng ký khóa học nào.'); return; }
    $('#practiceHubLoading').hide(); $('#practiceHub').show();
    let html='';
    for(const cu of courses){
      const c = cu.course;
      html += `<div class="course-block" id="course-${c.id}">
        <div class="d-flex justify-content-between align-items-center">
          <h5 class="mb-2">${c.name}</h5>
          <button class="btn btn-sm btn-outline-secondary" onclick="toggleExams(${c.id})" id="btnToggle-${c.id}">Hiện đề</button>
        </div>
        <div class="small text-muted mb-2">ID: ${c.id} | Học viên: ${c.numUser}</div>
        <div class="exam-list" id="examList-${c.id}" style="display:none;">
          <div class="text-center text-muted py-2" id="examLoading-${c.id}">Đang tải đề...</div>
        </div>
      </div>`;
    }
    $('#practiceHub').html(html);
  }catch(e){ $('#practiceHubLoading').removeClass('alert-info').addClass('alert-danger').text('Lỗi tải dữ liệu'); }
}

async function toggleExams(courseId){
  const el = $('#examList-'+courseId);
  if(el.is(':visible')){ el.hide(); $('#btnToggle-'+courseId).text('Hiện đề'); return; }
  el.show(); $('#btnToggle-'+courseId).text('Ẩn đề');
  // If already loaded remove loading placeholder
  if(el.data('loaded')) return;
  try{
    const res = await fetch('http://localhost:8080/api/exam/user/find-by-course-and-user?course='+courseId, { headers: authHeaders() });
    if(!res.ok){ throw new Error('Không tải được đề thi'); }
    const exams = await res.json();
    let html='';
    if(exams.length===0){ html='<div class="text-muted">Không có đề thi nào.</div>'; }
    for(const ex of exams){
      html += renderExamRow(ex);
    }
    el.html(html); el.data('loaded', true);
  }catch(e){ $('#examLoading-'+courseId).removeClass('text-muted').addClass('text-danger').text('Lỗi tải đề thi'); }
}

function renderExamRow(ex){
  let statusBadge = '<span class="badge bg-secondary">Chưa thi</span>';
  if(ex.trangThai==='DANG_THI') statusBadge='<span class="badge bg-info">Đang thi</span>';
  if(ex.trangThai==='DA_KET_THUC') statusBadge='<span class="badge bg-success">Đã kết thúc</span>';
  return `<div class="exam-row" id="exam-${ex.id}">
    <div>
      <strong>Ôn luyện: ${escapeHtml(ex.name)}</strong><br>
      <span class="text-muted">${ex.limitTime} phút | ${ex.lessons.length} phần |</span><br>
      ${statusBadge}
    </div>
    <div class="exam-actions">
      <button class="btn btn-sm btn-warning" onclick="startPracticeFromExam(${ex.id})">Ôn luyện</button>
    </div>
  </div>`;
}

function viewExamResult(examId){ window.location.href='ketqua?exam='+examId; }

async function startPracticeFromExam(examId){
  if(!token){ toastr.warning('Bạn cần đăng nhập'); return; }
  try{
    // Lấy result để có resultId
    let res = await fetch('/api/result/user/find-by-user-exam?examId='+examId, { headers: authHeaders() });
    if(!res.ok){ if(res.status===404){ toastr.warning('Chưa có kết quả thi để ôn luyện'); return;} throw new Error('Không tìm thấy kết quả'); }
    let resultResp = await res.json();
    if(!resultResp || !resultResp.result || !resultResp.result.id){ toastr.warning('Không thể lấy resultId'); return; }
    let resultId = resultResp.result.id;
    // Tạo session ôn luyện
    res = await fetch('/api/practice/user/start?resultId='+resultId+'&mode=ALL_RANDOM', { method:'POST', headers: authHeaders() });
    if(!res.ok){ throw new Error('Không tạo được phiên ôn luyện'); }
    let session = await res.json();
    window.location.href='onluyen?sessionId='+session.id;
  }catch(e){ toastr.error(e.message); }
}

// New function: render hub giống 'Khóa học của tôi'
async function loadPracticeHubLikeMyCourse(){
  if(!token){ $('#practiceHubLoading').removeClass('alert-info').addClass('alert-warning').text('Bạn cần đăng nhập để xem luyện đề.'); return; }
  try {
    const res = await fetch('http://localhost:8080/api/course-user/user/find-by-user', { headers: authHeaders() });
    if(!res.ok){ throw new Error('Không tải được khóa học'); }
    const courses = await res.json();
    if(courses.length===0){ $('#practiceHubLoading').removeClass('alert-info').addClass('alert-warning').text('Bạn chưa đăng ký khóa học nào.'); return; }
    $('#practiceHubLoading').hide();
    let html='';
    courses.forEach(function(cu){
      const c = cu.course;
      html += `<div class="col-sm-4">
        <div class="singlekhoahoc" onclick="togglePracticeExams(${c.id})" style="user-select:none;">
          <img src="${c.image}" class="imgkhoahocct">
          <p class="tenkhoahoc">#${c.id}-${c.name}<br><span class='text-muted small'>Click để xem đề ôn luyện</span></p>
        </div>
        <div class="exam-list" id="practiceExamList-${c.id}" style="display:none; margin-top:6px; background:#fff; border:1px solid #ddd; border-radius:6px; padding:8px;">
          <div class="text-muted" id="practiceExamLoading-${c.id}">Đang tải đề...</div>
        </div>
      </div>`;
    });
    $('#listPracticeCourses').html(html);
    // Auto expand if course param
    const initialCourse = new URL(document.URL).searchParams.get('course');
    if(initialCourse){
      const cid = parseInt(initialCourse);
      if(!isNaN(cid)){
        setTimeout(()=>togglePracticeExams(cid), 200); // slight delay to ensure DOM ready
      }
    }
  } catch(e){ $('#practiceHubLoading').removeClass('alert-info').addClass('alert-danger').text('Lỗi tải dữ liệu'); }
}

// Toggle danh sách đề cho ôn luyện bên dưới từng khóa
async function togglePracticeExams(courseId){
  const box = $('#practiceExamList-'+courseId);
  const card = box.prev('.singlekhoahoc');
  // Close others
  $('.exam-list.open').not(box).removeClass('open').slideUp(0);
  $('.singlekhoahoc.focused').not(card).removeClass('focused');
  $('.singlekhoahoc').not(card).addClass('dimmed');
  card.addClass('focused');
  if(box.is(':visible')){ // collapse current
    box.removeClass('open').slideUp(200);
    card.removeClass('focused');
    $('.singlekhoahoc').removeClass('dimmed');
    return;
  }
  box.addClass('open').css('display','block');
  if(!box.data('loaded')){
    // skeleton
    box.html('<div class="skeleton-block"><div class="skeleton-line" style="width:70%"></div><div class="skeleton-line" style="width:55%"></div><div class="skeleton-line" style="width:60%"></div></div>');
    try {
      const res = await fetch('http://localhost:8080/api/exam/user/find-by-course-and-user?course='+courseId, { headers: authHeaders() });
      if(!res.ok){ throw new Error('Không tải được đề thi'); }
      const exams = await res.json();
      let html='';
      if(exams.length===0){ html='<div class="text-muted">Không có đề thi nào trong khóa này.</div>'; }
      exams.forEach((ex,idx)=>{ html += renderPracticeExamRow(ex, idx); });
      box.html(html);
      // stagger reveal
      box.find('.exam-row').each(function(i){
        const row = $(this);
        setTimeout(()=>row.addClass('show'), 80*i);
      });
      box.data('loaded', true);
    } catch(e){ box.html('<div class="text-danger">L��i tải đề</div>'); }
  } else {
    // already loaded, just fade rows if not visible
    box.find('.exam-row').each(function(i){
      const row = $(this);
      setTimeout(()=>row.addClass('show'), 60*i);
    });
  }
}

function renderPracticeExamRow(ex, idx){
  let statusBadge = '<span class="badge bg-secondary badge-status">Chưa thi</span>';
  if(ex.trangThai==='DANG_THI') statusBadge='<span class="badge bg-info badge-status">Đang thi</span>';
  if(ex.trangThai==='DA_KET_THUC') statusBadge='<span class="badge bg-success badge-status">Đã kết thúc</span>';
  return `<div class="exam-row fade-in-delay-${(idx%3)+1}" id="exam-${ex.id}">
    <div style="flex:1;">
      <strong>Ôn luyện: ${escapeHtml(ex.name)}</strong><br>
      <span class="text-muted">${ex.limitTime} phút | ${ex.lessons.length} phần</span><br>
      ${statusBadge}
    </div>
    <div class="exam-actions" style="white-space:nowrap;">
      <button class="btn btn-sm btn-warning" onclick="startPracticeFromExam(${ex.id})">Luyện đề</button>
      <button class="btn btn-sm btn-outline-secondary" onclick="viewPracticeHistory(${ex.id})">Lịch sử ôn luyện</button>
    </div>
  </div>`;
}

function viewPracticeHistory(examId){
  if(!examId){ window.location.href='lichsuonluyen'; return; }
  window.location.href='lichsuonluyen?examId='+encodeURIComponent(examId);
}
