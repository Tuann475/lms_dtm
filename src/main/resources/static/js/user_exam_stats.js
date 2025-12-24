var userExamChartInstance;
var userPracticeChartInstance;

async function loadUserExamStats() {
    var msgEl = document.getElementById('userExamChartMessage');
    if (msgEl) {
        msgEl.innerText = 'Đang tải thống kê bài thi...';
    }
    try {
        // Gọi lại API thống kê điểm trung bình theo ngày (toàn bộ hệ thống hoặc theo user nếu backend hỗ trợ)
        var url = 'https://lmsdtm-production.up.railway.app/api/exam/statistic/avg-by-date';
        var response = await fetch(url, { method: 'GET' });
        if (!response.ok) {
            throw new Error('Request failed: ' + response.status);
        }
        var data = await response.json();
        var labels = data.labels || [];
        var scores = data.data || [];

        if (!labels.length) {
            if (msgEl) {
                msgEl.innerText = 'Chưa có dữ liệu điểm trung bình bài thi.';
            }
            if (userExamChartInstance) {
                userExamChartInstance.destroy();
                userExamChartInstance = null;
            }
            return;
        }

        if (msgEl) {
            msgEl.innerText = '';
        }

        var canvas = document.getElementById('userExamChart');
        if (!canvas) {
            return;
        }
        var ctx = canvas.getContext('2d');

        if (userExamChartInstance) {
            userExamChartInstance.destroy();
        }

        userExamChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Điểm trung bình theo ngày',
                    data: scores,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.2,
                    pointRadius: 3,
                    pointBackgroundColor: 'rgba(75, 192, 192, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        suggestedMax: 9,
                        title: {
                            display: true,
                            text: 'Điểm trung bình (0-9)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Ngày chấm bài'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                var v = context.parsed.y;
                                return 'Điểm: ' + (v != null ? v.toFixed(2) : 'N/A');
                            }
                        }
                    },
                    legend: {
                        display: true
                    }
                }
            }
        });
    } catch (e) {
        console.error(e);
        if (msgEl) {
            msgEl.innerText = 'Lỗi khi tải thống kê bài thi.';
        }
    }
}

async function loadUserPracticeStats() {
    var msgEl = document.getElementById('userPracticeChartMessage');
    if (msgEl) {
        msgEl.innerText = 'Đang tải thống kê ôn luyện...';
    }
    try {
        var url = 'https://lmsdtm-production.up.railway.app/api/practice/user/stats-by-day';
        var response = await fetch(url, { method: 'GET' });
        if (!response.ok) {
            throw new Error('Request failed: ' + response.status);
        }
        var data = await response.json();
        var labels = data.labels || [];
        var scores = data.data || []; // điểm 0-9 từ backend

        if (!labels.length) {
            if (msgEl) {
                msgEl.innerText = 'Chưa có dữ liệu thống kê ôn luyện.';
            }
            if (userPracticeChartInstance) {
                userPracticeChartInstance.destroy();
                userPracticeChartInstance = null;
            }
            return;
        }

        if (msgEl) {
            msgEl.innerText = '';
        }

        var canvas = document.getElementById('userPracticeChart');
        if (!canvas) {
            return;
        }
        var ctx = canvas.getContext('2d');

        if (userPracticeChartInstance) {
            userPracticeChartInstance.destroy();
        }

        userPracticeChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Điểm ôn luyện trung bình theo ngày (0-9)',
                    data: scores,
                    borderColor: 'rgba(255, 159, 64, 1)',
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.2,
                    pointRadius: 3,
                    pointBackgroundColor: 'rgba(255, 159, 64, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 9,
                        title: {
                            display: true,
                            text: 'Điểm ôn luyện (0-9)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Ngày'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                var v = context.parsed.y;
                                return 'Điểm: ' + (v != null ? v.toFixed(1) : '0');
                            }
                        }
                    },
                    legend: {
                        display: true
                    }
                }
            }
        });
    } catch (e) {
        console.error(e);
        if (msgEl) {
            msgEl.innerText = 'Lỗi khi tải thống kê ôn luyện.';
        }
    }
}

async function loadUserPracticeTotalSessions() {
    try {
        var el = document.getElementById('stat2-total-practices');
        var response = await fetch('https://lmsdtm-production.up.railway.app/api/practice/user/total-sessions', { method: 'GET' });
        if (!response.ok) {
            throw new Error('Request failed: ' + response.status);
        }
        var data = await response.json();
        if (el) {
            el.innerText = (data && data.total != null) ? data.total : 0;
        }
    } catch (e) {
        console.error(e);
    }
}

async function loadUserPracticeAverageScore() {
    try {
        var el = document.getElementById('stat2-avg-practice-score');
        var response = await fetch('https://lmsdtm-production.up.railway.app/api/practice/user/overall-average', { method: 'GET' });
        if (!response.ok) {
            throw new Error('Request failed: ' + response.status);
        }
        var data = await response.json();
        if (el) {
            var v = (data && data.average != null) ? Number(data.average) : 0;
            el.innerText = v.toFixed(1);
        }
    } catch (e) {
        console.error(e);
    }
}

// Gọi cả hai khi trang tài khoản load
async function loadUserExamStatsAll() {
    await loadUserExamStats();
    await loadUserPracticeStats();
    await loadUserPracticeTotalSessions();
    await loadUserPracticeAverageScore();
}
