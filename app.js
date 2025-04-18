// 应用主要功能
document.addEventListener('DOMContentLoaded', function() {
    // DOM 元素
    const addCardBtn = document.getElementById('addCardBtn');
    const syncBtn = document.getElementById('syncBtn');
    const installBtn = document.getElementById('installBtn');
    const cardsList = document.getElementById('cardsList');
    const addCardModal = document.getElementById('addCardModal');
    const closeModalBtn = document.querySelector('.close');
    const cardForm = document.getElementById('cardForm');

    // 卡片数据
    let cards = [];
    let deferredPrompt; // 用于PWA安装提示

    // 初始化
    init();

    // 添加事件监听器
    addCardBtn.addEventListener('click', openAddCardModal);
    closeModalBtn.addEventListener('click', closeAddCardModal);
    cardForm.addEventListener('submit', saveCard);
    syncBtn.addEventListener('click', syncData);
    installBtn.addEventListener('click', installPWA);

    // 监听 PWA 安装事件
    window.addEventListener('beforeinstallprompt', (e) => {
        // 阻止 Chrome 67 及更早版本自动显示安装提示
        e.preventDefault();
        // 保存事件，以便稍后触发
        deferredPrompt = e;
        // 显示安装按钮
        installBtn.style.display = 'block';
    });

    // 初始化函数
    function init() {
        loadCards();
        renderCards();
        // 启动自动备份
        setupAutoBackup();
    }

    // 打开添加卡片模态框
    function openAddCardModal() {
        addCardModal.style.display = 'block';
        document.getElementById('word').focus();
    }

    // 关闭添加卡片模态框
    function closeAddCardModal() {
        addCardModal.style.display = 'none';
        cardForm.reset();
    }

    // 保存卡片
    function saveCard(e) {
        e.preventDefault();
        
        const word = document.getElementById('word').value;
        const translation = document.getElementById('translation').value;
        const example = document.getElementById('example').value;
        
        const newCard = {
            id: Date.now(),
            word,
            translation,
            example,
            created: new Date().toISOString(),
            lastReviewed: null
        };
        
        cards.push(newCard);
        saveCards();
        renderCards();
        closeAddCardModal();
        
        // 触发自动备份
        triggerAutoBackup();
    }

    // 保存所有卡片到本地存储
    function saveCards() {
        localStorage.setItem('flashcards', JSON.stringify(cards));
    }

    // 从本地存储加载卡片
    function loadCards() {
        const savedCards = localStorage.getItem('flashcards');
        if (savedCards) {
            cards = JSON.parse(savedCards);
        }
    }

    // 渲染卡片列表
    function renderCards() {
        if (cards.length === 0) {
            cardsList.innerHTML = '<p class="no-cards">没有卡片，点击"添加卡片"开始学习</p>';
            return;
        }
        
        cardsList.innerHTML = '';
        cards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            cardEl.innerHTML = `
                <div class="card-front">
                    <h3>${card.word}</h3>
                    <small>点击查看详情</small>
                </div>
                <div class="card-back">
                    <p><strong>翻译:</strong> ${card.translation}</p>
                    ${card.example ? `<p><strong>例句:</strong> ${card.example}</p>` : ''}
                    <div class="card-actions">
                        <button class="delete-btn" data-id="${card.id}">删除</button>
                        <button class="review-btn" data-id="${card.id}">标记为已复习</button>
                    </div>
                </div>
            `;
            
            // 点击卡片显示/隐藏详情
            cardEl.addEventListener('click', function(e) {
                if (!e.target.classList.contains('delete-btn') && !e.target.classList.contains('review-btn')) {
                    this.classList.toggle('show-back');
                }
            });
            
            cardsList.appendChild(cardEl);
        });
        
        // 添加删除和复习按钮的事件监听
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', deleteCard);
        });
        
        document.querySelectorAll('.review-btn').forEach(btn => {
            btn.addEventListener('click', markAsReviewed);
        });
    }

    // 删除卡片
    function deleteCard(e) {
        const cardId = parseInt(e.target.getAttribute('data-id'));
        cards = cards.filter(card => card.id !== cardId);
        saveCards();
        renderCards();
        // 触发自动备份
        triggerAutoBackup();
    }

    // 标记卡片为已复习
    function markAsReviewed(e) {
        const cardId = parseInt(e.target.getAttribute('data-id'));
        cards = cards.map(card => {
            if (card.id === cardId) {
                return {
                    ...card,
                    lastReviewed: new Date().toISOString()
                };
            }
            return card;
        });
        saveCards();
        renderCards();
        // 触发自动备份
        triggerAutoBackup();
    }

    // 自动备份设置
    function setupAutoBackup() {
        // 每天自动备份一次
        const now = new Date();
        const lastBackup = localStorage.getItem('lastBackup');
        
        if (lastBackup) {
            const lastBackupDate = new Date(lastBackup);
            const oneDayInMs = 24 * 60 * 60 * 1000;
            
            if (now - lastBackupDate > oneDayInMs) {
                syncData();
            }
        } else {
            // 首次使用，立即备份
            syncData();
        }
    }

    // 触发自动备份（在卡片变更后）
    function triggerAutoBackup() {
        // 数据变更超过5项后自动备份
        const lastSyncCount = parseInt(localStorage.getItem('lastSyncCount') || '0');
        const currentCount = cards.length;
        
        if (Math.abs(currentCount - lastSyncCount) >= 5) {
            syncData();
        }
    }

    // 同步数据到GitHub Gist
    function syncData() {
        // 显示同步状态
        const syncStatus = document.createElement('span');
        syncStatus.className = 'sync-status';
        syncStatus.textContent = '正在同步...';
        syncBtn.parentNode.appendChild(syncStatus);
        
        // 获取GitHub访问令牌（这里应该通过更安全的方式处理）
        const token = localStorage.getItem('githubToken');
        
        if (!token) {
            // 首次使用，需要用户授权
            const newToken = prompt('请输入您的GitHub访问令牌以启用自动备份：');
            if (newToken) {
                localStorage.setItem('githubToken', newToken);
                syncToGitHub(newToken, syncStatus);
            } else {
                syncStatus.textContent = '同步取消：未提供访问令牌';
                setTimeout(() => {
                    syncBtn.parentNode.removeChild(syncStatus);
                }, 3000);
            }
        } else {
            // 使用已保存的令牌
            syncToGitHub(token, syncStatus);
        }
    }

    // 实际执行同步到GitHub的函数
    function syncToGitHub(token, statusElement) {
        // 准备要备份的数据
        const backupData = {
            cards,
            lastBackup: new Date().toISOString(),
            version: '1.0'
        };
        
        // 检查是否有现有的Gist
        const gistId = localStorage.getItem('backupGistId');
        const method = gistId ? 'PATCH' : 'POST';
        const url = gistId ? `https://api.github.com/gists/${gistId}` : 'https://api.github.com/gists';
        
        // 准备Gist内容
        const gistContent = {
            description: "英语单词卡片应用自动备份",
            public: false,
            files: {
                "flashcards_backup.json": {
                    content: JSON.stringify(backupData, null, 2)
                }
            }
        };
        
        // 发送请求到GitHub API
        fetch(url, {
            method: method,
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gistContent)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`GitHub API错误: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // 保存Gist ID以便未来更新
            if (!gistId) {
                localStorage.setItem('backupGistId', data.id);
            }
            
            // 更新同步状态
            localStorage.setItem('lastBackup', new Date().toISOString());
            localStorage.setItem('lastSyncCount', cards.length.toString());
            
            statusElement.textContent = '同步成功！';
            setTimeout(() => {
                syncBtn.parentNode.removeChild(statusElement);
            }, 3000);
        })
        .catch(error => {
            console.error('同步错误:', error);
            statusElement.textContent = `同步失败: ${error.message}`;
            setTimeout(() => {
                syncBtn.parentNode.removeChild(statusElement);
            }, 5000);
        });
    }

    // 安装PWA应用
    function installPWA() {
        if (deferredPrompt) {
            // 显示安装提示
            deferredPrompt.prompt();
            
            // 等待用户做出选择
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('用户接受了安装');
                    // 隐藏安装按钮
                    installBtn.style.display = 'none';
                } else {
                    console.log('用户拒绝了安装');
                }
                // 清除保存的提示，因为它只能使用一次
                deferredPrompt = null;
            });
        }
    }

    // 从GitHub恢复备份
    function restoreFromBackup() {
        const token = localStorage.getItem('githubToken');
        const gistId = localStorage.getItem('backupGistId');
        
        if (!token || !gistId) {
            alert('无法恢复：未找到备份信息');
            return;
        }
        
        fetch(`https://api.github.com/gists/${gistId}`, {
            headers: {
                'Authorization': `token ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`GitHub API错误: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const backupContent = data.files['flashcards_backup.json'].content;
            const backupData = JSON.parse(backupContent);
            
            // 恢复卡片数据
            cards = backupData.cards;
            saveCards();
            renderCards();
            
            alert('成功从云端恢复备份！');
        })
        .catch(error => {
            console.error('恢复错误:', error);
            alert(`恢复失败: ${error.message}`);
        });
    }

    // 添加右上角菜单按钮
    const menuBtn = document.createElement('button');
    menuBtn.textContent = '菜单';
    menuBtn.id = 'menuBtn';
    menuBtn.style.marginLeft = '10px';
    document.querySelector('.app-actions').appendChild(menuBtn);
    
    menuBtn.addEventListener('click', function() {
        const option = prompt('选择操作：\n1. 从云端恢复备份\n2. 清除所有数据\n3. 取消');
        
        if (option === '1') {
            restoreFromBackup();
        } else if (option === '2') {
            if (confirm('确定要删除所有卡片吗？此操作不可撤销！')) {
                cards = [];
                saveCards();
                renderCards();
                localStorage.removeItem('lastSyncCount');
                alert('所有数据已清除');
            }
        }
    });
});