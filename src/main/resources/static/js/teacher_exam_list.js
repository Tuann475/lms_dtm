var token = localStorage.getItem('token');
let examTableInstance = null; // cache instance
let allExams = []; // cache fetched exams for client-side filtering

async function loadCourseFilter(){
  const sel = document.getElementById('khoahocbaithi');
  const spin = document.getElementById('courseSpinner');
  if(!sel){ return; }
  try{
    if(spin){ spin.style.display='inline-block'; }
    sel.disabled = true;
    const res = await fetch('/api/course/public/find-all');
    if(!res.ok){ return; }
    const list = await res.json();
    sel.innerHTML = '<option value="">(Tất cả)</option>' + list.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
    // Preselect from URL param if present
    const uls = new URL(document.URL);
    const courseParam = uls.searchParams.get('course');
    if(courseParam && sel.querySelector(`option[value="${courseParam}"]`)){
      sel.value = courseParam;
    }
    // Auto-filter on change: refetch exams by course ID
    sel.addEventListener('change', () => { loadTeacherExams(); });
  }catch(e){ /* ignore */ }
  finally{
    sel.disabled = false;
    if(spin){ spin.style.display='none'; }
  }

  // Bind course name search input
  const searchInput = document.getElementById('courseSearch');
  if(searchInput){
    searchInput.addEventListener('input', () => {
      // Re-render using cached exams filtered by name
      renderExams(applyFilters(allExams));
    });
  }
}

function toDateTimeMs(e) {
  const d = e.examDate || '';
  const t = e.examTime || '';
  const tStr = (''+t).length >= 8 ? (''+t).substring(0,8) : (''+t).padEnd(8,'0');
  const s = d ? (d + 'T' + tStr) : '';
  const dt = s ? new Date(s) : new Date(0);
  return dt.getTime();
}

function applyFilters(source){
  // Filter by course name substring
  const searchInput = document.getElementById('courseSearch');
  const q = (searchInput && searchInput.value) ? searchInput.value.trim().toLowerCase() : '';
  let arr = Array.isArray(source) ? [...source] : [];
  if(q){
    arr = arr.filter(e => {
      const name = e.course && e.course.name ? e.course.name.toLowerCase() : '';
      return name.includes(q);
    });
  }
  // Sort ascending by date then time (top-down)
  arr.sort((a,b) => toDateTimeMs(a) - toDateTimeMs(b));
  return arr;
}

function renderExams(exams){
  // Destroy DataTable before manipulating DOM
  if(examTableInstance){ examTableInstance.destroy(); examTableInstance = null; }
  let html='';
  exams.forEach(e => {
      const examTime = e.examTime? (''+e.examTime).substring(0,5): '';
      const locked = e.locked===true;
      html += `<tr class="${locked?'table-warning':''}">
          <td>${e.id ?? ''}</td>
          <td>${e.name || ''} ${locked? '<span class="badge bg-danger ms-1">Khóa</span>':''}</td>
          <td>${e.limitTime || 0} phút</td>
          <td>${e.examDate || ''}</td>
          <td>${examTime}</td>
          <td><span class="course-text">${e.course? (e.course.id+' - '+(e.course.name||'')) : ''}</span></td>
          <td>${e.lessons? e.lessons.length:0}</td>
          <td>
             <select onchange="updateTrangThaiTeacher(this,${e.id})" class="form-select form-select-sm" ${locked?'disabled':''}>
                <option value="CHUA_THI" ${e.trangThai==='CHUA_THI'?'selected':''}>Chưa thi</option>
                <option value="DANG_THI" ${e.trangThai==='DANG_THI'?'selected':''}>Đang thi</option>
                <option value="DA_KET_THUC" ${e.trangThai==='DA_KET_THUC'?'selected':''}>Đã kết thúc</option>
             </select>
          </td>
          <td>
             <div class="d-flex flex-column">
               <div class="d-flex align-items-center gap-2 mb-2">
                 <button onclick="deleteExam(${e.id})" class="btn btn-sm btn-danger" title="Xóa" ${locked?'disabled':''}><i class='fa fa-trash'></i></button>
                 <button onclick="editExam(${e.id})" class="btn btn-sm btn-warning" title="Sửa" ${locked?'disabled':''}><i class='fa fa-edit'></i></button>
               </div>
               <button onclick="openLessons(${e.id})" class="btn btn-sm btn-primary w-100 text-center mb-2" title="Phần thi" data-bs-toggle="modal" data-bs-target="#phanthimodal">Phần thi</button>
               <button onclick="viewResult(${e.id})" class="btn btn-sm btn-primary w-100 text-center mb-2" title="Kết quả">Kết quả</button>
               <button onclick="viewPracticeResult(${e.id})" class="btn btn-sm btn-primary w-100 text-center mb-2" title="KQ ôn luyện">KQ ôn luyện</button>
             </div>
          </td>
      </tr>`;
  });
  const tbody = document.getElementById('examRows');
  if(!tbody){ console.error('Missing #examRows tbody'); return; }
  tbody.innerHTML = html || '<tr><td colspan="9">Không có bài thi</td></tr>';

  // Re-init DataTable (keep current order)
  const tableEl = $('#examTable');
  if(tableEl && tableEl.length){
      examTableInstance = tableEl.DataTable({
          order: [],
          paging: true,
          pageLength: 10,
          lengthChange: true,
          autoWidth: false,
          columnDefs: [
              { targets: 0, width: '50px', className: 'col-id text-center' },
              { targets: 5, width: '140px', className: 'col-course' },
              { targets: 8, width: '100px', className: 'col-actions' }
          ],
          language: {
              search: 'Tìm kiếm:',
              lengthMenu: 'Hiển thị _MENU_ dòng',
              info: 'Hiển thị _START_ đến _END_ trong tổng _TOTAL_ dòng',
              infoEmpty: 'Không có dữ liệu',
              zeroRecords: 'Không tìm thấy kết quả phù hợp',
              paginate: { first: 'Đầu', last: 'Cuối', next: 'Sau', previous: 'Trước' }
          }
      });
  }
}

// New: generic fetch with retry & JSON parsing
async function fetchJsonWithRetry(url, options = {}, retries = 2, delayMs = 600){
    for(let attempt=0; attempt<=retries; attempt++){
        try{
            const res = await fetch(url, options);
            if(res.status === 401){ return { unauthorized:true, status:401 }; }
            if(res.status === 403){
                const txt = await res.text().catch(()=> '');
                return { forbidden:true, status:403, body:txt };
            }
            if(!res.ok){
                const txt = await res.text().catch(()=> '');
                if(attempt === retries){
                    return { error:true, status:res.status, body:txt };
                }
            } else {
                let data;
                try { data = await res.json(); }
                catch(parseErr){
                    return { error:true, status:res.status, body:'JSON parse error' };
                }
                return { data, status:res.status };
            }
        }catch(networkErr){
            if(attempt === retries){
                return { error:true, status:0, body:networkErr.message || 'Network error' };
            }
        }
        // backoff
        await new Promise(r=>setTimeout(r, delayMs * (attempt+1)));
    }
}

// Helper to show/hide error banner
function showExamError(msg){
    const box = document.getElementById('examError');
    if(!box) return;
    if(msg){
        box.textContent = msg;
        box.style.display='block';
    } else {
        box.textContent='';
        box.style.display='none';
    }
}

async function loadTeacherExams(){
    const sel = document.getElementById('khoahocbaithi');
    const spin = document.getElementById('courseSpinner');
    const tbody = document.getElementById('examRows');
    showExamError(null);

    const courseId = sel ? sel.value : '';
    let url = '/api/exam/teacher/find-own' + (courseId ? ('?course=' + courseId) : '');
    const headers = {};
    if(token){ headers['Authorization'] = 'Bearer ' + token; }

    if(tbody){ tbody.innerHTML = '<tr><td colspan="9">Đang tải...</td></tr>'; }
    if(sel){ sel.disabled = true; }
    if(spin){ spin.style.display='inline-block'; }

    const result = await fetchJsonWithRetry(url, { headers }, 2, 500);

    if(sel){ sel.disabled = false; }
    if(spin){ spin.style.display='none'; }

    if(result.unauthorized){
        showExamError('Phiên đăng nhập hết hạn. Đang chuyển hướng...');
        setTimeout(()=> window.location.replace('/login'), 800);
        return;
    }
    if(result.forbidden){
        const tbodyMsg = 'Không có quyền truy cập danh sách bài thi (403). Vui lòng kiểm tra quyền giáo viên hoặc đăng nhập lại.';
        if(tbody){ tbody.innerHTML = `<tr><td colspan="9">${tbodyMsg}</td></tr>`; }
        showExamError('Không tải được dữ liệu (mã: 403). ' + (result.body || ''));
        return;
    }
    if(result.error){
        const statusNote = result.status ? (' (mã: ' + result.status + ')') : '';
        if(tbody){ tbody.innerHTML = '<tr><td colspan="9">Lỗi tải dữ liệu</td></tr>'; }
        showExamError('Không tải được dữ liệu' + statusNote + '. ' + (result.body || ''));
        return;
    }

    let raw = result.data;
    const exams = Array.isArray(raw)
        ? raw
        : (raw && Array.isArray(raw.content) ? raw.content : []);

    // Keep existing filters & rendering pipeline
    allExams = exams;
    renderExams(applyFilters(allExams));
}

async function updateTrangThaiTeacher(sel, id){
    const status = sel.value;
    const res = await fetch(`/api/exam/teacher/update-trangthai?id=${id}&trangthai=${status}`,{ method:'POST', headers:{ 'Authorization':'Bearer '+ token }});
    if(res.ok){ console.log('Cập nhật trạng thái thành công'); } else { console.warn('Cập nhật trạng thái thất bại'); }
}

function editExam(id){ window.location.href = '/teacher/addbaithi?id=' + id; }
function viewResult(id){ window.location.href = '/teacher/ketqua?exam=' + id; }
function viewPracticeResult(id){ window.location.href = '/teacher/ketquaonluyen?exam=' + id; }

async function deleteExam(id){
    const ok = confirm('Bạn có chắc muốn xóa bài thi này?');
    if(!ok) return;
    const res = await fetch('/api/exam/teacher/delete?id='+id, { method:'DELETE', headers:{ 'Authorization':'Bearer '+ token }});
    if(res.status < 300){ alert('Đã xóa'); loadTeacherExams(); } else { alert('Xóa thất bại'); }
}

async function loadDsLessonTeacher(examId){
  const tbody = document.getElementById('listlesson');
  if(!tbody){ return; }
  tbody.innerHTML = '<tr><td colspan="7">Đang tải...</td></tr>';
  try{
    const res = await fetch('/api/lesson/public/find-by-exam?id='+examId);
    if(!res.ok){ tbody.innerHTML = '<tr><td colspan="7">Lỗi tải dữ liệu</td></tr>'; return; }
    const list = await res.json();
    let html='';
    list.forEach(l=>{
      let fileCell='';
      if(l.skill==='LISTENING' && l.linkFile){ fileCell = `<a href='${l.linkFile}' target='_blank'>File nghe</a>`; }
      else if(l.skill==='SPEAKING' && l.linkFile){ fileCell = `<a href='${l.linkFile}' target='_blank'>Audio speaking</a>`; }
      else if(l.skill==='WRITING'){ fileCell='Đề bài Writing'; }
      const contentCell = `<div class='noidunglesson'>${l.content||''}</div>`;
      html += `<tr>
        <td>${l.id}</td>
        <td>${l.name}</td>
        <td>${l.category? l.category.name:''}</td>
        <td>${fileCell}</td>
        <td>${contentCell}</td>
        <td>${l.questions? l.questions.length:0}</td>
        <td><a target='_blank' href='/teacher/cauhoi?lesson=${l.id}' class='btn btn-sm btn-primary'>Câu hỏi</a></td>
      </tr>`;
    });
    tbody.innerHTML = html || '<tr><td colspan="7">Không có phần thi</td></tr>';
  }catch(e){ tbody.innerHTML = '<tr><td colspan="7">Lỗi mạng</td></tr>'; }
}

function openLessons(examId) {
  // Load lessons and show modal
  loadDsLessonTeacher(examId);
  // Use Bootstrap 5 modal API to show
  const modal = document.getElementById('phanthimodal');
  if (modal) {
    const bsModal = bootstrap.Modal.getOrCreateInstance(modal);
    bsModal.show();
  }
}



// Remove duplicate init here; baithi.html handles initial calls
// document.addEventListener('DOMContentLoaded', async ()=>{ await loadCourseFilter(); await loadTeacherExams(); });
