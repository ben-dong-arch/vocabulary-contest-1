// 示例词汇数据
const vocabularyData = {
    P1: [
        {english: 'apple', chinese: '苹果'},
        {english: 'book', chinese: '书'},
        {english: 'cat', chinese: '猫'},
        {english: 'dog', chinese: '狗'},
        {english: 'egg', chinese: '鸡蛋'},
        {english: 'fish', chinese: '鱼'},
        {english: 'green', chinese: '绿色'},
        {english: 'house', chinese: '房子'},
        {english: 'ice', chinese: '冰'},
        {english: 'juice', chinese: '果汁'}
    ],
    P2: [
        {english: 'computer', chinese: '电脑'},
        {english: 'beautiful', chinese: '美丽的'},
        {english: 'important', chinese: '重要的'},
        {english: 'different', chinese: '不同的'},
        {english: 'education', chinese: '教育'},
        {english: 'government', chinese: '政府'},
        {english: 'information', chinese: '信息'},
        {english: 'development', chinese: '发展'},
        {english: 'environment', chinese: '环境'},
        {english: 'technology', chinese: '技术'}
    ],
    P3: [
        {english: 'sophisticated', chinese: '复杂的'},
        {english: 'phenomenon', chinese: '现象'},
        {english: 'architecture', chinese: '建筑学'},
        {english: 'psychology', chinese: '心理学'},
        {english: 'philosophy', chinese: '哲学'},
        {english: 'democracy', chinese: '民主'},
        {english: 'economy', chinese: '经济'},
        {english: 'literature', chinese: '文学'},
        {english: 'mathematics', chinese: '数学'},
        {english: 'scientific', chinese: '科学的'}
    ],
    P4: [
        {english: 'entrepreneurship', chinese: '企业家精神'},
        {english: 'metamorphosis', chinese: '变形'},
        {english: 'pharmaceutical', chinese: '制药的'},
        {english: 'bureaucracy', chinese: '官僚主义'},
        {english: 'epistemology', chinese: '认识论'},
        {english: 'anthropology', chinese: '人类学'},
        {english: 'neuroscience', chinese: '神经科学'},
        {english: 'biotechnology', chinese: '生物技术'},
        {english: 'sustainability', chinese: '可持续性'},
        {english: 'globalization', chinese: '全球化'}
    ]
};

// 全局变量
let currentUser = null;
let isAdmin = false;
let currentContest = null;
let contestTimer = null;
let selectedOption = null;
let currentQuestionIndex = 0;
let contestQuestions = [];
let contestAnswers = [];
let contestStartTime = null;
let currentLeaderboardLevel = 'all';
let authMode = 'login'; // 'login' 或 'register'
let users = {}; // 存储用户数据 {username: {password: '', isAdmin: false}}

// 显示消息
function showMessage(message, type = 'info') {
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(messageDiv, container.firstChild);
    
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 3000);
}

// 切换排行榜等级
function switchLeaderboardLevel(level) {
    currentLeaderboardLevel = level;
    
    // 更新标签状态
    document.querySelectorAll('.level-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // 找到并激活对应的标签
    const tabs = document.querySelectorAll('.level-tab');
    tabs.forEach(tab => {
        if (tab.textContent.trim() === level || 
            (level === 'all' && tab.textContent.trim() === '全部')) {
            tab.classList.add('active');
        }
    });
    
    // 加载对应等级的排行榜
    loadLeaderboard();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 加载用户数据
    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
        users = JSON.parse(savedUsers);
        
        // 数据迁移：将旧的admin账户迁移到baobaoxiong
        if (users['admin'] && !users['baobaoxiong']) {
            users['baobaoxiong'] = {
                password: '123456abc',
                isAdmin: true,
                scores: users['admin'].scores || []
            };
            delete users['admin'];
            localStorage.setItem('users', JSON.stringify(users));
            
            // 如果当前登录的是admin，更新为baobaoxiong
            if (localStorage.getItem('currentUser') === 'admin') {
                localStorage.setItem('currentUser', 'baobaoxiong');
            }
        }
        
        // 确保baobaoxiong账户存在且密码正确
        if (!users['baobaoxiong']) {
            users['baobaoxiong'] = {
                password: '123456abc',
                isAdmin: true
            };
            localStorage.setItem('users', JSON.stringify(users));
        } else if (users['baobaoxiong'].password !== '123456abc') {
            // 更新密码为新密码
            users['baobaoxiong'].password = '123456abc';
            localStorage.setItem('users', JSON.stringify(users));
        }
    } else {
        // 创建默认管理员账户
        users = {
            'baobaoxiong': {
                password: '123456abc',
                isAdmin: true
            }
        };
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    // 检查本地存储中的当前用户信息
    const savedUser = localStorage.getItem('currentUser');
    const savedAdmin = localStorage.getItem('isAdmin') === 'true';
    
    if (savedUser && users[savedUser]) {
        currentUser = savedUser;
        isAdmin = savedAdmin;
        
        // 安全地更新UI元素
        const currentUsernameSpan = document.getElementById('current-username');
        const userInfo = document.getElementById('user-info');
        const authSection = document.getElementById('auth-section');
        const adminBadge = document.getElementById('admin-badge');
        const adminNav = document.querySelector('[onclick="showSection(\'admin\')"]');
        
        if (currentUsernameSpan) currentUsernameSpan.textContent = savedUser;
        if (userInfo) userInfo.style.display = 'block';
        if (authSection) authSection.style.display = 'none';
        
        // 显示管理员标识
        if (isAdmin) {
            if (adminBadge) adminBadge.style.display = 'inline';
            if (adminNav) adminNav.style.display = 'block';
        }
    }
    
    // 初始化排行榜示例数据（仅在首次访问时）
    initializeLeaderboardData();
    
    // 初始化排行榜
    loadLeaderboard();
});

// 切换认证模式
function switchAuthMode(mode) {
    const authTabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authTitle = document.getElementById('auth-title');
    
    authTabs.forEach(tab => tab.classList.remove('active'));
    
    if (mode === 'login') {
        authTabs[0].classList.add('active');
        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
        if (authTitle) authTitle.textContent = '用户登录';
        authMode = 'login';
    } else {
        authTabs[1].classList.add('active');
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
        if (authTitle) authTitle.textContent = '用户注册';
        authMode = 'register';
    }
}

// 处理认证（登录/注册）
function handleAuth() {
    if (authMode === 'register') {
        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (!username || !password || !confirmPassword) {
            showMessage('请填写所有字段', 'error');
            return;
        }
        
        if (password.length < 6) {
            showMessage('密码长度至少6位', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage('两次输入的密码不一致', 'error');
            return;
        }
        
        // 检查用户是否已存在
        const existingUsers = JSON.parse(localStorage.getItem('users') || '{}');
        if (existingUsers[username]) {
            showMessage(`❌ 用户名 "${username}" 已被占用，请尝试其他用户名`, 'error');
            
            // 提供一些建议的用户名
            const suggestions = [
                `${username}123`,
                `${username}_2024`,
                `${username}_user`,
                `my_${username}`
            ];
            
            setTimeout(() => {
                showMessage(`💡 建议尝试：${suggestions.join('、')}`, 'info');
            }, 2000);
            
            return;
        }
        
        // 注册新用户
        existingUsers[username] = { password: password, scores: [] };
        localStorage.setItem('users', JSON.stringify(existingUsers));
        
        currentUser = username;
        isAdmin = (username === 'baobaoxiong');
        localStorage.setItem('currentUser', username);
        localStorage.setItem('isAdmin', isAdmin.toString());
        
        showUserInfo();
        showMessage(`注册成功，欢迎 ${username}！`, 'success');
        
    } else {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const adminCheckbox = document.getElementById('admin-checkbox');
        const isAdminLogin = adminCheckbox ? adminCheckbox.checked : false;
        
        if (!username || !password) {
            showMessage('请输入用户名和密码', 'error');
            return;
        }
        
        const existingUsers = JSON.parse(localStorage.getItem('users') || '{}');
        
        // 如果勾选了管理员登录，验证管理员账户
        if (isAdminLogin) {
            // 只允许 baobaoxiong 用户名登录管理员
            if (username !== 'baobaoxiong') {
                showMessage('❌ 只有 baobaoxiong 用户可以登录管理员', 'error');
                return;
            }
            
            // 验证 baobaoxiong 用户的密码
            const user = existingUsers[username];
            if (user && user.password === password) {
                currentUser = username;
                isAdmin = true;
            } else {
                showMessage('管理员密码错误', 'error');
                return;
            }
        } else {
            // 普通用户登录
            if (!existingUsers[username]) {
                showMessage('用户不存在', 'error');
                return;
            }
            
            if (existingUsers[username].password !== password) {
                showMessage('密码错误', 'error');
                return;
            }
            
            currentUser = username;
            isAdmin = false;
        }
        
        localStorage.setItem('currentUser', username);
        localStorage.setItem('isAdmin', isAdmin.toString());
        
        // 清空管理员复选框
        if (adminCheckbox) {
            adminCheckbox.checked = false;
        }
        
        showUserInfo();
        showMessage(isAdmin ? '管理员登录成功！' : `欢迎回来，${username}！`, 'success');
    }
}

// 显示用户信息
function showUserInfo() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('user-info').style.display = 'block';
    document.getElementById('current-username').textContent = currentUser;
    
    // 更新管理员徽章
    const adminBadge = document.getElementById('admin-badge');
    if (adminBadge) {
        adminBadge.style.display = isAdmin ? 'inline' : 'none';
    }
    
    // 更新管理员导航按钮
    const adminNav = document.querySelector('[onclick="showSection(\'admin\')"]');
    if (adminNav) {
        adminNav.style.display = isAdmin ? 'block' : 'none';
    }
}

// 退出登录
function logout() {
    currentUser = null;
    isAdmin = false;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAdmin');
    
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('user-info').style.display = 'none';
    
    // 清空表单
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('register-username').value = '';
    document.getElementById('register-password').value = '';
    document.getElementById('confirm-password').value = '';
    
    // 清空管理员复选框
    const adminCheckbox = document.getElementById('admin-checkbox');
    if (adminCheckbox) {
        adminCheckbox.checked = false;
    }
    
    // 隐藏管理员功能
    const adminBadge = document.getElementById('admin-badge');
    if (adminBadge) {
        adminBadge.style.display = 'none';
    }
    
    const adminNav = document.querySelector('[onclick="showSection(\'admin\')"]');
    if (adminNav) {
        adminNav.style.display = 'none';
    }
    
    // 切换回登录模式
    switchAuthMode('login');
    
    showMessage('已退出登录', 'info');
}

// 显示指定的页面部分
function showSection(sectionId) {
    // 隐藏所有部分
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // 移除所有导航按钮的active类
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 显示指定部分
    document.getElementById(sectionId).classList.add('active');
    
    // 激活对应的导航按钮
    const targetBtn = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }
    
    // 根据页面加载相应数据
    if (sectionId === 'upload') {
        loadVocabularyStats();
    } else if (sectionId === 'leaderboard') {
        loadLeaderboard();
    }
}

// 文件上传
async function uploadFile() {
    const fileInput = document.getElementById('file-input');
    const levelSelect = document.getElementById('level-select');
    
    if (!fileInput.files[0]) {
        showMessage('请选择文件', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('level', levelSelect.value);
    
    try {
        showMessage('正在上传文件...', 'info');
        
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(data.message, 'success');
            loadVocabularyStats();
            fileInput.value = '';
        } else {
            showMessage(data.error || '上传失败', 'error');
        }
    } catch (error) {
        console.error('上传错误:', error);
        showMessage('网络错误，请重试', 'error');
    }
}

// 开始竞赛
function startContest() {
    if (!currentUser) {
        showMessage('请先注册/登录', 'error');
        return;
    }
    
    const level = document.getElementById('contest-level').value;
    const words = vocabularyData[level];
    
    if (!words || words.length === 0) {
        showMessage(`${level} 级别暂无词汇数据`, 'error');
        return;
    }
    
    // 生成题目
    contestQuestions = generateQuestions(words, 100);
    contestAnswers = [];
    currentQuestionIndex = 0;
    contestStartTime = new Date();
    
    // 显示竞赛界面
    document.getElementById('contest-setup').style.display = 'none';
    document.getElementById('contest-active').style.display = 'block';
    document.getElementById('contest-result').style.display = 'none';
    
    // 开始计时
    startTimer(10 * 60 * 1000); // 10分钟
    
    // 显示第一题
    displayQuestion(contestQuestions[0]);
    updateProgress(1, contestQuestions.length);
    
    showMessage('竞赛开始！', 'success');
}

// 生成题目
function generateQuestions(words, count) {
    const shuffled = words.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(count, words.length));
    
    const questions = [];
    const questionTypes = ['chinese_to_english', 'english_to_chinese', 'fill_blank'];
    
    selected.forEach((word, index) => {
        const type = questionTypes[index % questionTypes.length];
        
        switch (type) {
            case 'chinese_to_english':
                questions.push({
                    id: index + 1,
                    type: 'chinese_to_english',
                    question: `请翻译：${word.chinese}`,
                    answer: word.english.toLowerCase(),
                    options: generateOptions(word.english, words, 'english')
                });
                break;
            
            case 'english_to_chinese':
                questions.push({
                    id: index + 1,
                    type: 'english_to_chinese',
                    question: `请翻译：${word.english}`,
                    answer: word.chinese,
                    options: generateOptions(word.chinese, words, 'chinese')
                });
                break;
            
            case 'fill_blank':
                const blankedWord = createBlankWord(word.english);
                questions.push({
                    id: index + 1,
                    type: 'fill_blank',
                    question: `填空：${blankedWord} (${word.chinese})`,
                    answer: word.english.toLowerCase()
                });
                break;
        }
    });
    
    return questions;
}

// 生成选项
function generateOptions(correct, allWords, type) {
    const options = [correct];
    const otherWords = allWords.filter(w => w[type] !== correct);
    
    while (options.length < 4 && otherWords.length > 0) {
        const randomIndex = Math.floor(Math.random() * otherWords.length);
        const option = otherWords[randomIndex][type];
        if (!options.includes(option)) {
            options.push(option);
        }
        otherWords.splice(randomIndex, 1);
    }
    
    return options.sort(() => 0.5 - Math.random());
}

// 创建填空题
function createBlankWord(word) {
    const length = word.length;
    const blankCount = Math.max(1, Math.floor(length * 0.4));
    const positions = [];
    
    while (positions.length < blankCount) {
        const pos = Math.floor(Math.random() * length);
        if (!positions.includes(pos)) {
            positions.push(pos);
        }
    }
    
    let blankedWord = word.split('');
    positions.forEach(pos => {
        blankedWord[pos] = '_';
    });
    
    return blankedWord.join('');
}

// 提交答案
function submitAnswer() {
    let answer = '';
    
    if (document.getElementById('multiple-choice').style.display !== 'none') {
        if (selectedOption === null) {
            showMessage('请选择一个答案', 'error');
            return;
        }
        
        const optionBtns = document.querySelectorAll('.option-btn');
        answer = optionBtns[selectedOption].textContent;
    } else {
        answer = document.getElementById('answer-input').value.trim();
        if (!answer) {
            showMessage('请输入答案', 'error');
            return;
        }
    }
    
    const question = contestQuestions[currentQuestionIndex];
    const isCorrect = answer.toLowerCase().trim() === question.answer.toLowerCase().trim();
    
    contestAnswers.push({
        questionId: question.id,
        userAnswer: answer,
        correctAnswer: question.answer,
        isCorrect,
        timestamp: new Date()
    });
    
    currentQuestionIndex++;
    
    if (currentQuestionIndex >= contestQuestions.length) {
        finishContest();
    } else {
        displayQuestion(contestQuestions[currentQuestionIndex]);
        updateProgress(currentQuestionIndex + 1, contestQuestions.length);
        resetAnswerInterface();
    }
}

// 开始计时器
function startTimer(timeLimit) {
    let timeLeft = timeLimit;
    
    contestTimer = setInterval(() => {
        timeLeft -= 1000;
        
        if (timeLeft <= 0) {
            clearInterval(contestTimer);
            finishContest();
            return;
        }
        
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        document.getElementById('timer-display').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // 最后一分钟变红色
        if (timeLeft <= 60000) {
            document.getElementById('timer-display').style.color = '#e53e3e';
        }
    }, 1000);
}

// 停止计时器
function stopTimer() {
    if (contestTimer) {
        clearInterval(contestTimer);
        contestTimer = null;
    }
}

// 显示题目
function displayQuestion(question) {
    document.getElementById('question-text').textContent = question.question;
    
    // 根据题目类型显示不同的答题界面
    if (question.type === 'fill_blank') {
        // 填空题
        document.getElementById('question-type').textContent = '📝 单词填空';
        document.getElementById('multiple-choice').style.display = 'none';
        document.getElementById('text-input').style.display = 'block';
        
        if (question.hint) {
            document.getElementById('question-hint').textContent = `提示：${question.hint}`;
            document.getElementById('question-hint').style.display = 'block';
        } else {
            document.getElementById('question-hint').style.display = 'none';
        }
    } else {
        // 选择题
        if (question.type === 'chinese_to_english') {
            document.getElementById('question-type').textContent = '🇨🇳➡️🇺🇸 中译英';
        } else {
            document.getElementById('question-type').textContent = '🇺🇸➡️🇨🇳 英译中';
        }
        
        document.getElementById('multiple-choice').style.display = 'block';
        document.getElementById('text-input').style.display = 'none';
        document.getElementById('question-hint').style.display = 'none';
        
        // 显示选项
        const optionBtns = document.querySelectorAll('.option-btn');
        question.options.forEach((option, index) => {
            optionBtns[index].textContent = option;
            optionBtns[index].classList.remove('selected');
        });
    }
    
    selectedOption = null;
}

// 选择选项
function selectOption(index) {
    const optionBtns = document.querySelectorAll('.option-btn');
    
    // 移除之前的选择
    optionBtns.forEach(btn => btn.classList.remove('selected'));
    
    // 选择当前选项
    optionBtns[index].classList.add('selected');
    selectedOption = index;
}

// 完成竞赛
function finishContest() {
    if (contestTimer) {
        clearInterval(contestTimer);
        contestTimer = null;
    }
    
    const endTime = new Date();
    const duration = endTime - contestStartTime;
    const correctAnswers = contestAnswers.filter(a => a.isCorrect).length;
    const totalQuestions = contestQuestions.length;
    const accuracy = (correctAnswers / totalQuestions) * 100;
    
    // 显示结果
    document.getElementById('contest-active').style.display = 'none';
    document.getElementById('contest-result').style.display = 'block';
    
    document.getElementById('final-accuracy').textContent = `${accuracy.toFixed(1)}%`;
    document.getElementById('final-correct').textContent = `${correctAnswers}/${totalQuestions}`;
    
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    document.getElementById('final-duration').textContent = `${minutes}分${seconds}秒`;
    
    // 添加到排行榜（演示）
    addToLeaderboard(currentUser, accuracy, duration);
    
    // 显示成功消息，提示用户成绩已添加到排行榜
    showMessage('🎉 竞赛完成！成绩已添加到排行榜', 'success');
}

// 添加到排行榜
function addToLeaderboard(username, accuracy, duration) {
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    const timeStr = `${minutes}分${seconds}秒`;
    const dateStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
    const level = document.getElementById('contest-level').value;
    
    // 创建新的记录
    const newRecord = {
        username: username,
        level: level,
        accuracy: accuracy,
        time: timeStr,
        duration: duration, // 保存原始时长用于排序
        date: dateStr,
        timestamp: Date.now()
    };
    
    // 从localStorage获取现有记录
    let leaderboardData = JSON.parse(localStorage.getItem('leaderboardData') || '[]');
    
    // 添加新记录
    leaderboardData.push(newRecord);
    
    // 按正确率降序排序，如果正确率相同则按时间升序排序
    leaderboardData.sort((a, b) => {
        if (b.accuracy !== a.accuracy) {
            return b.accuracy - a.accuracy;
        }
        return a.duration - b.duration;
    });
    
    // 保存到localStorage
    localStorage.setItem('leaderboardData', JSON.stringify(leaderboardData));
    
    // 重新加载排行榜显示
    loadLeaderboard();
}

// 重置答题界面
function resetAnswerInterface() {
    selectedOption = null;
    document.getElementById('answer-input').value = '';
    document.getElementById('submit-btn').disabled = false;
    document.getElementById('submit-btn').textContent = '提交答案';
    
    // 移除选项的选中状态
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
}

// 更新进度
function updateProgress(current, total) {
    document.getElementById('question-progress').textContent = `${current}/${total}`;
}

// 重置竞赛
function resetContest() {
    currentContest = null;
    contestQuestions = [];
    contestAnswers = [];
    currentQuestionIndex = 0;
    
    document.getElementById('contest-setup').style.display = 'block';
    document.getElementById('contest-active').style.display = 'none';
    document.getElementById('contest-result').style.display = 'none';
    
    document.getElementById('timer-display').textContent = '10:00';
    document.getElementById('timer-display').style.color = '#e53e3e';
    document.getElementById('question-progress').textContent = '1/10';
    
    resetAnswerInterface();
}

// 重新开始竞赛
function restartContest() {
    resetContest();
}

// 显示详细结果
function showDetailedResults() {
    if (!contestAnswers || contestAnswers.length === 0) return;
    
    const modal = document.getElementById('result-modal');
    const detailedResults = document.getElementById('detailed-results');
    
    let html = '';
    
    contestAnswers.forEach((answer, index) => {
        const question = contestQuestions[index];
        const isCorrect = answer.isCorrect;
        
        html += `
            <div class="detailed-result-item ${isCorrect ? 'correct' : 'incorrect'}">
                <div class="question-info">
                    <strong>第${index + 1}题：</strong>${question.question}
                </div>
                <div class="answer-info">
                    <div class="user-answer">
                        <strong>你的答案：</strong>${answer.userAnswer}
                    </div>
                    <div class="${isCorrect ? 'correct-answer' : 'incorrect-answer'}">
                        <strong>正确答案：</strong>${answer.correctAnswer}
                    </div>
                </div>
            </div>
        `;
    });
    
    detailedResults.innerHTML = html;
    modal.style.display = 'block';
}

// 加载词汇统计
function loadVocabularyStats() {
    // 计算词汇统计
    const stats = {
        P1: vocabularyData.P1 ? vocabularyData.P1.length : 0,
        P2: vocabularyData.P2 ? vocabularyData.P2.length : 0,
        P3: vocabularyData.P3 ? vocabularyData.P3.length : 0,
        P4: vocabularyData.P4 ? vocabularyData.P4.length : 0
    };
    
    const total = stats.P1 + stats.P2 + stats.P3 + stats.P4;
    
    // 更新统计显示
    const totalWordsElement = document.getElementById('total-words');
    const p1WordsElement = document.getElementById('p1-words');
    const p2WordsElement = document.getElementById('p2-words');
    const p3WordsElement = document.getElementById('p3-words');
    const p4WordsElement = document.getElementById('p4-words');
    
    if (totalWordsElement) totalWordsElement.textContent = total;
    if (p1WordsElement) p1WordsElement.textContent = stats.P1;
    if (p2WordsElement) p2WordsElement.textContent = stats.P2;
    if (p3WordsElement) p3WordsElement.textContent = stats.P3;
    if (p4WordsElement) p4WordsElement.textContent = stats.P4;
}

// 关闭模态框
function closeModal() {
    document.getElementById('result-modal').style.display = 'none';
}

// 初始化排行榜示例数据
function initializeLeaderboardData() {
    // 检查是否已有数据
    const existingData = localStorage.getItem('leaderboardData');
    if (existingData && JSON.parse(existingData).length > 0) {
        return; // 已有数据，不需要初始化
    }
    
    // 添加一些示例数据
    const sampleData = [
        {
            username: 'Alice',
            level: 'P3',
            accuracy: 95.5,
            time: '3分45秒',
            duration: 225000,
            date: '2024-01-15 14:30',
            timestamp: Date.now() - 86400000 // 1天前
        },
        {
            username: 'Bob',
            level: 'P2',
            accuracy: 92.0,
            time: '4分12秒',
            duration: 252000,
            date: '2024-01-15 13:45',
            timestamp: Date.now() - 172800000 // 2天前
        },
        {
            username: 'Charlie',
            level: 'P4',
            accuracy: 88.5,
            time: '5分30秒',
            duration: 330000,
            date: '2024-01-15 12:20',
            timestamp: Date.now() - 259200000 // 3天前
        },
        {
            username: 'Diana',
            level: 'P1',
            accuracy: 85.0,
            time: '3分20秒',
            duration: 200000,
            date: '2024-01-15 11:15',
            timestamp: Date.now() - 345600000 // 4天前
        }
    ];
    
    localStorage.setItem('leaderboardData', JSON.stringify(sampleData));
}

// 加载排行榜
function loadLeaderboard() {
    const content = document.getElementById('leaderboard-content');
    
    // 从localStorage获取排行榜数据
    let leaderboardData = JSON.parse(localStorage.getItem('leaderboardData') || '[]');
    
    // 根据当前选择的等级过滤数据
    let filteredData = leaderboardData;
    if (currentLeaderboardLevel !== 'all') {
        filteredData = leaderboardData.filter(record => record.level === currentLeaderboardLevel);
    }
    
    // 按正确率降序排序，如果正确率相同则按时间升序排序
    filteredData.sort((a, b) => {
        if (b.accuracy !== a.accuracy) {
            return b.accuracy - a.accuracy;
        }
        return a.duration - b.duration;
    });
    
    if (filteredData.length === 0) {
        content.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">暂无排行榜数据</p>';
        return;
    }
    
    let tableHTML = `
        <table class="leaderboard-table">
            <thead>
                <tr>
                    <th>排名</th>
                    <th>用户名</th>
                    <th>等级</th>
                    <th>正确率</th>
                    <th>用时</th>
                    <th>完成时间</th>
                </tr>
            </thead>
            <tbody id="leaderboard-body">
    `;
    
    filteredData.forEach((record, index) => {
        tableHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${record.username}</td>
                <td>${record.level}</td>
                <td>${record.accuracy.toFixed(1)}%</td>
                <td>${record.time}</td>
                <td>${record.date}</td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    content.innerHTML = tableHTML;
}

// 停止计时器
function stopTimer() {
    if (contestTimer) {
        clearInterval(contestTimer);
        contestTimer = null;
    }
}

// 显示消息
function showMessage(message, type = 'info') {
    // 移除现有消息
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // 创建新消息
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // 插入到页面顶部
    const container = document.querySelector('.container');
    container.insertBefore(messageDiv, container.firstChild);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 3000);
}

// 点击模态框外部关闭
window.onclick = function(event) {
    const modal = document.getElementById('result-modal');
    if (event.target === modal) {
        closeModal();
    }
}

// 管理员功能函数

// 手动添加词汇
function addWordManually(event) {
    event.preventDefault();
    
    if (!isAdmin) {
        showMessage('只有管理员可以添加词汇', 'error');
        return;
    }
    
    const english = document.getElementById('manual-english').value.trim();
    const chinese = document.getElementById('manual-chinese').value.trim();
    const level = document.getElementById('manual-level').value;
    
    if (!english || !chinese || !level) {
        showMessage('请填写完整的词汇信息', 'error');
        return;
    }
    
    // 检查词汇是否已存在
    const existingWord = vocabularyData[level].find(word => 
        word.english.toLowerCase() === english.toLowerCase()
    );
    
    if (existingWord) {
        showMessage('该词汇已存在', 'error');
        return;
    }
    
    // 添加词汇
    vocabularyData[level].push({
        english: english,
        chinese: chinese
    });
    
    // 保存到本地存储
    localStorage.setItem('vocabularyData', JSON.stringify(vocabularyData));
    
    // 清空表单
    document.getElementById('manual-english').value = '';
    document.getElementById('manual-chinese').value = '';
    document.getElementById('manual-level').value = '';
    
    // 更新统计
    loadVocabularyStats();
    
    showMessage(`成功添加词汇：${english} - ${chinese}`, 'success');
}

// 清空词汇库
function clearVocabulary() {
    if (!isAdmin) {
        showMessage('只有管理员可以清空词汇库', 'error');
        return;
    }
    
    if (!confirm('确定要清空所有词汇吗？此操作不可恢复！')) {
        return;
    }
    
    // 重置为初始数据
    Object.keys(vocabularyData).forEach(level => {
        vocabularyData[level] = [];
    });
    
    // 保存到本地存储
    localStorage.setItem('vocabularyData', JSON.stringify(vocabularyData));
    
    // 更新统计
    loadVocabularyStats();
    
    showMessage('词汇库已清空', 'success');
}

// 导出用户数据
function exportUserData() {
    if (!isAdmin) {
        showMessage('只有管理员可以导出用户数据', 'error');
        return;
    }
    
    const userData = {
        users: users,
        exportTime: new Date().toISOString(),
        totalUsers: Object.keys(users).length
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `user_data_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showMessage('用户数据导出成功', 'success');
}

// 重置所有成绩
function resetAllScores() {
    if (!isAdmin) {
        showMessage('只有管理员可以重置成绩', 'error');
        return;
    }
    
    if (!confirm('确定要重置所有用户的成绩吗？此操作不可恢复！')) {
        return;
    }
    
    // 清空排行榜数据
    localStorage.removeItem('leaderboard');
    
    // 重新加载排行榜
    loadLeaderboard();
    
    showMessage('所有成绩已重置', 'success');
}

// 重置管理员账户
function resetAdminAccount(event) {
    event.preventDefault();
    
    if (!isAdmin) {
        showMessage('只有管理员可以重置管理员账户', 'error');
        return;
    }
    
    const newUsername = document.getElementById('new-admin-username').value.trim();
    const newPassword = document.getElementById('new-admin-password').value;
    const confirmPassword = document.getElementById('confirm-admin-password').value;
    
    // 验证输入
    if (!newUsername || !newPassword || !confirmPassword) {
        showMessage('请填写所有字段', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showMessage('密码至少需要6位', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showMessage('两次输入的密码不一致', 'error');
        return;
    }
    
    // 从localStorage获取最新的用户数据
    const existingUsers = JSON.parse(localStorage.getItem('users') || '{}');
    
    // 只允许设置为 baobaoxiong 用户名
    if (newUsername !== 'baobaoxiong') {
        showMessage('❌ 管理员用户名只能设置为 baobaoxiong', 'error');
        return;
    }
    
    // 检查新用户名是否已存在（除了当前管理员）
    if (existingUsers[newUsername] && newUsername !== currentUser) {
        showMessage('该用户名已存在', 'error');
        return;
    }
    
    const confirmMessage = `🔐 确定要重置管理员账户吗？

📋 重置详情：
• 新用户名：${newUsername}（固定为 baobaoxiong）
• 新密码：${newPassword}

⚠️ 重要提醒：
• 只有 baobaoxiong 用户可以登录管理员
• 此操作立即生效，您将自动使用新账户登录
• 请务必牢记新的登录凭据

确定继续吗？`;

    if (!confirm(confirmMessage)) {
        return;
    }
    
    // 删除旧的管理员账户（如果用户名发生变化）
    if (newUsername !== currentUser && existingUsers[currentUser]) {
        delete existingUsers[currentUser];
    }
    
    // 创建新的管理员账户
    existingUsers[newUsername] = {
        password: newPassword,
        scores: existingUsers[newUsername]?.scores || [] // 保留原有成绩
    };
    
    // 更新全局users变量
    users = existingUsers;
    
    // 更新当前用户信息
    currentUser = newUsername;
    
    // 保存到本地存储
    localStorage.setItem('users', JSON.stringify(existingUsers));
    localStorage.setItem('currentUser', currentUser);
    
    // 更新UI显示
    document.getElementById('current-username').textContent = currentUser;
    
    // 清空表单
    document.getElementById('new-admin-username').value = '';
    document.getElementById('new-admin-password').value = '';
    document.getElementById('confirm-admin-password').value = '';
    
    // 显示详细的重置成功提示
    const successMessage = `🎉 管理员账户重置成功！
    
✅ 新管理员账户：${newUsername}
🔒 只有 baobaoxiong 用户可以登录管理员
⚠️ 请牢记新的登录凭据

您已自动使用新账户登录，无需重新输入密码。`;
    
    showMessage(successMessage, 'success');
}

// 恢复默认管理员账户功能已移除
// 现在只有 baobaoxiong 用户可以登录管理员

// 全局变量存储预览数据
let previewWords = [];

// 处理文件上传
function handleFileUpload(event) {
    if (!isAdmin) {
        showMessage('只有管理员可以上传词汇文件', 'error');
        return;
    }
    
    const file = event.target.files[0];
    if (!file) return;
    
    showMessage('正在解析文件...', 'info');
    
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // 处理Excel文件
        handleExcelFile(file);
    } else if (file.name.endsWith('.docx')) {
        // 处理Word文件
        handleWordFile(file);
    } else if (file.name.endsWith('.csv')) {
        // 处理CSV文件
        handleTextFile(file, 'csv');
    } else if (file.name.endsWith('.txt')) {
        // 处理TXT文件
        handleTextFile(file, 'txt');
    } else {
        showMessage('不支持的文件格式', 'error');
    }
}

// 处理Excel文件
function handleExcelFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
            
            const newWords = parseTableData(jsonData);
            processImportedWords(newWords);
            
        } catch (error) {
            console.error('Excel解析错误:', error);
            showMessage('Excel文件解析失败，请检查文件格式', 'error');
        }
    };
    reader.readAsArrayBuffer(file);
}

// 处理Word文件
function handleWordFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        mammoth.extractRawText({arrayBuffer: e.target.result})
            .then(function(result) {
                try {
                    const text = result.value;
                    const newWords = parseWordText(text);
                    processImportedWords(newWords);
                } catch (error) {
                    console.error('Word解析错误:', error);
                    showMessage('Word文件解析失败，请检查文件格式', 'error');
                }
            })
            .catch(function(error) {
                console.error('Word文件读取错误:', error);
                showMessage('Word文件读取失败', 'error');
            });
    };
    reader.readAsArrayBuffer(file);
}

// 处理文本文件（CSV和TXT）
function handleTextFile(file, type) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            let newWords = [];
            
            if (type === 'csv') {
                const lines = content.split('\n');
                const tableData = lines.map(line => line.split(',').map(s => s.trim()));
                newWords = parseTableData(tableData);
            } else if (type === 'txt') {
                newWords = parseWordText(content);
            }
            
            processImportedWords(newWords);
            
        } catch (error) {
            console.error('文本文件解析错误:', error);
            showMessage('文件解析失败，请检查文件格式', 'error');
        }
    };
    reader.readAsText(file);
}

// 解析表格数据（Excel和CSV）
function parseTableData(data) {
    if (!data || data.length < 2) {
        throw new Error('数据不足');
    }
    
    const newWords = [];
    const headers = data[0].map(h => String(h).toLowerCase().trim());
    
    // 智能匹配列
    let englishCol = -1, chineseCol = -1, levelCol = -1;
    
    // 查找英文列
    for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        if (header.includes('english') || header.includes('英文') || header.includes('单词') || 
            header.includes('word') || header === 'en') {
            englishCol = i;
            break;
        }
    }
    
    // 查找中文列
    for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        if (header.includes('chinese') || header.includes('中文') || header.includes('释义') || 
            header.includes('meaning') || header.includes('翻译') || header === 'cn') {
            chineseCol = i;
            break;
        }
    }
    
    // 查找级别列
    for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        if (header.includes('level') || header.includes('级别') || header.includes('难度') || 
            header.includes('等级')) {
            levelCol = i;
            break;
        }
    }
    
    // 如果没有找到明确的列，尝试按位置匹配
    if (englishCol === -1 && chineseCol === -1) {
        // 假设前两列是英文和中文
        if (headers.length >= 2) {
            englishCol = 0;
            chineseCol = 1;
            if (headers.length >= 3) {
                levelCol = 2;
            }
        }
    }
    
    if (englishCol === -1 || chineseCol === -1) {
        throw new Error('无法识别英文和中文列，请确保文件包含英文和中文词汇列');
    }
    
    // 解析数据行
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;
        
        const english = String(row[englishCol] || '').trim();
        const chinese = String(row[chineseCol] || '').trim();
        const level = levelCol !== -1 ? String(row[levelCol] || '').trim() : '';
        
        if (english && chinese) {
            // 标准化级别
            let normalizedLevel = 'P1'; // 默认级别
            if (level) {
                const levelUpper = level.toUpperCase();
                if (levelUpper.includes('P1') || levelUpper.includes('初') || levelUpper.includes('基础')) {
                    normalizedLevel = 'P1';
                } else if (levelUpper.includes('P2') || levelUpper.includes('中') || levelUpper.includes('进阶')) {
                    normalizedLevel = 'P2';
                } else if (levelUpper.includes('P3') || levelUpper.includes('高') || levelUpper.includes('高级')) {
                    normalizedLevel = 'P3';
                } else if (levelUpper.includes('P4') || levelUpper.includes('专') || levelUpper.includes('专业')) {
                    normalizedLevel = 'P4';
                }
            }
            
            newWords.push({
                english: english,
                chinese: chinese,
                level: normalizedLevel
            });
        }
    }
    
    return newWords;
}

// 解析Word文本
function parseWordText(text) {
    const newWords = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        // 尝试多种分隔符
        let english = '', chinese = '';
        
        if (trimmedLine.includes('\t')) {
            // Tab分隔
            const parts = trimmedLine.split('\t');
            if (parts.length >= 2) {
                english = parts[0].trim();
                chinese = parts[1].trim();
            }
        } else if (trimmedLine.includes(':')) {
            // 冒号分隔
            const parts = trimmedLine.split(':');
            if (parts.length >= 2) {
                english = parts[0].trim();
                chinese = parts[1].trim();
            }
        } else if (trimmedLine.includes('=')) {
            // 等号分隔
            const parts = trimmedLine.split('=');
            if (parts.length >= 2) {
                english = parts[0].trim();
                chinese = parts[1].trim();
            }
        } else if (trimmedLine.includes(' - ')) {
            // 短横线分隔
            const parts = trimmedLine.split(' - ');
            if (parts.length >= 2) {
                english = parts[0].trim();
                chinese = parts[1].trim();
            }
        } else {
            // 尝试空格分隔（假设第一个单词是英文，其余是中文）
            const parts = trimmedLine.split(/\s+/);
            if (parts.length >= 2) {
                english = parts[0].trim();
                chinese = parts.slice(1).join(' ').trim();
            }
        }
        
        if (english && chinese) {
            newWords.push({
                english: english,
                chinese: chinese,
                level: 'P1' // 默认级别
            });
        }
    }
    
    return newWords;
}

// 处理导入的词汇 - 显示预览
function processImportedWords(newWords) {
    if (newWords.length === 0) {
        showMessage('文件中没有找到有效的词汇数据', 'error');
        return;
    }
    
    // 存储预览数据
    previewWords = newWords.map((word, index) => ({
        ...word,
        id: index,
        selected: true // 默认全选
    }));
    
    // 显示预览界面
    showFilePreview();
    showMessage(`解析完成，找到 ${newWords.length} 个词汇`, 'success');
}

// 显示文件预览
function showFilePreview() {
    const previewSection = document.getElementById('file-preview-section');
    const previewCount = document.getElementById('preview-count');
    const tableBody = document.getElementById('preview-table-body');
    
    // 更新统计
    previewCount.textContent = previewWords.length;
    
    // 清空表格
    tableBody.innerHTML = '';
    
    // 生成预览表格
    previewWords.forEach(word => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="checkbox" 
                       id="word-${word.id}" 
                       ${word.selected ? 'checked' : ''} 
                       onchange="toggleWordSelection(${word.id})">
            </td>
            <td>${escapeHtml(word.english)}</td>
            <td>${escapeHtml(word.chinese)}</td>
            <td>
                <select id="level-${word.id}" class="form-select" style="font-size: 12px; padding: 4px;">
                    <option value="P1" ${word.level === 'P1' ? 'selected' : ''}>P1</option>
                    <option value="P2" ${word.level === 'P2' ? 'selected' : ''}>P2</option>
                    <option value="P3" ${word.level === 'P3' ? 'selected' : ''}>P3</option>
                    <option value="P4" ${word.level === 'P4' ? 'selected' : ''}>P4</option>
                </select>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // 显示预览区域
    previewSection.style.display = 'block';
    
    // 滚动到预览区域
    previewSection.scrollIntoView({ behavior: 'smooth' });
}

// HTML转义函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 切换单词选择状态
function toggleWordSelection(wordId) {
    const word = previewWords.find(w => w.id === wordId);
    if (word) {
        word.selected = !word.selected;
        updatePreviewStats();
    }
}

// 更新预览统计
function updatePreviewStats() {
    const selectedCount = previewWords.filter(w => w.selected).length;
    document.getElementById('preview-count').textContent = selectedCount;
}

// 全选词汇
function selectAllWords() {
    previewWords.forEach(word => {
        word.selected = true;
        const checkbox = document.getElementById(`word-${word.id}`);
        if (checkbox) checkbox.checked = true;
    });
    updatePreviewStats();
}

// 取消全选
function deselectAllWords() {
    previewWords.forEach(word => {
        word.selected = false;
        const checkbox = document.getElementById(`word-${word.id}`);
        if (checkbox) checkbox.checked = false;
    });
    updatePreviewStats();
}

// 导入选中的词汇
function importSelectedWords() {
    const selectedWords = previewWords.filter(w => w.selected);
    if (selectedWords.length === 0) {
        showMessage('请至少选择一个词汇进行导入', 'warning');
        return;
    }
    
    const importLevel = document.getElementById('import-level').value;
    let addedCount = 0;
    
    selectedWords.forEach(word => {
        // 获取最终难度
        let finalLevel = word.level;
        if (importLevel !== 'keep') {
            finalLevel = importLevel;
        } else {
            // 从下拉框获取用户修改的难度
            const levelSelect = document.getElementById(`level-${word.id}`);
            if (levelSelect) {
                finalLevel = levelSelect.value;
            }
        }
        
        if (vocabularyData[finalLevel]) {
            // 检查是否已存在
            const exists = vocabularyData[finalLevel].find(w => 
                w.english.toLowerCase() === word.english.toLowerCase()
            );
            if (!exists) {
                vocabularyData[finalLevel].push({
                    english: word.english,
                    chinese: word.chinese
                });
                addedCount++;
            }
        }
    });
    
    // 保存到本地存储
    localStorage.setItem('vocabularyData', JSON.stringify(vocabularyData));
    
    // 更新统计
    loadVocabularyStats();
    
    // 隐藏预览区域
    cancelImport();
    
    showMessage(`成功导入 ${addedCount} 个词汇（选择了 ${selectedWords.length} 个）`, 'success');
}

// 取消导入
function cancelImport() {
    const previewSection = document.getElementById('file-preview-section');
    previewSection.style.display = 'none';
    
    // 清空文件输入
    const fileInput = document.getElementById('file-input');
    fileInput.value = '';
    
    // 清空预览数据
    previewWords = [];
}