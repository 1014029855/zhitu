// 专小著智能悬浮窗
(function() {
  'use strict';

  // 配置
  const CONFIG = {
    STORAGE_KEY: 'xiaozhu_chat_history',
    API_ENDPOINT: '/api/xiaozhu/chat',
    MAX_HISTORY: 100
  };

  // 知识库
  const KNOWLEDGE_BASE = {
    competition: {
      keywords: ['竞赛', '比赛', '数学建模', '蓝桥杯', 'ACM', '挑战杯', '互联网+', '电子设计', '机器人'],
      answers: [
        '关于竞赛问题，我可以帮你解答各类竞赛相关问题。我们平台提供丰富的竞赛资源，包括全国大学生数学建模竞赛、蓝桥杯全国软件和信息技术专业人才大赛、ACM-ICPC国际大学生程序设计竞赛、"挑战杯"全国大学生课外学术科技作品竞赛、中国国际"互联网+"大学生创新创业大赛等。你想了解哪个竞赛的具体信息呢？',
        '竞赛问题是我们的专长！我们的平台涵盖数学建模类竞赛、程序设计类竞赛、创新创业类竞赛、电子设计类竞赛等多个领域。你可以访问竞赛页面查看详细信息，或者告诉我你具体想了解哪个竞赛的备赛策略、历年真题或参赛经验？'
      ]
    },
    paper: {
      keywords: ['论文', '写作', '选题', '结构', '文献', '摘要', '关键词', '参考文献'],
      answers: [
        '关于论文写作，我可以提供以下帮助：1. 论文选题建议 2. 论文结构规划 3. 文献检索技巧 4. 摘要和关键词写作 5. 参考文献格式 6. 各学科论文写作规范。你需要哪方面的指导呢？',
        '论文写作是学术研究的重要环节。建议你：1. 先明确研究问题和创新点 2. 构建清晰的论文结构 3. 充分调研相关文献 4. 保证逻辑严密，论据充分 5. 注意语言表达的准确性和专业性。有什么具体问题吗？'
      ]
    },
    skill: {
      keywords: ['技能', '学习', '编程', '算法', '数据结构', 'Python', 'Java', 'C++', '前端', '后端'],
      answers: [
        '关于技能学习，我们的平台提供丰富的学习资源！包括Python编程基础、JavaScript全栈开发、Java面向对象编程、数据结构与算法、机器学习与人工智能等多个领域。你可以访问技能页面开始学习，或者告诉我你想学习哪方面的技能？',
        '技能学习建议循序渐进。我们推荐的学习路径是：1. 先掌握一门编程语言基础 2. 学习数据结构与算法 3. 选择一个方向深入学习（前端/后端/AI等）4. 多做项目实践 5. 持续学习新技术。你现在处于什么阶段呢？'
      ]
    },
    greeting: {
      keywords: ['你好', '您好', 'hi', 'hello', 'hi', '嗨', '在吗', '有人吗'],
      answers: [
        '你好！我是专小著，你的专属智能学术助手！我可以帮助你解答竞赛、论文写作、技能学习等方面的问题。有什么我可以帮你的吗？',
        'Hi！我是专小著，很高兴为你服务！我精通竞赛知识、论文写作指导、技能学习推荐。请告诉我你的需求吧！'
      ]
    },
    thanks: {
      keywords: ['谢谢', '感谢', 'thanks', 'thank you', '多谢', '谢了'],
      answers: [
        '不客气！能帮到你我很开心。如果还有其他问题，随时可以问我哦！',
        '不用谢~ 有任何问题随时来找我！祝你学习顺利！'
      ]
    }
  };

  // 状态
  let state = {
    isOpen: false,
    isTyping: false,
    messages: []
  };

  // 初始化
  function init() {
    loadHistory();
    createUI();
    bindEvents();
  }

  // 创建UI
  function createUI() {
    const container = document.createElement('div');
    container.className = 'xiaozhu-float';
    container.id = 'xiaozhu-chatbot';
    
    container.innerHTML = `
      <!-- 最小化图标 -->
      <div class="xiaozhu-minimize" id="xiaozhu-minimize">
        <i class="fas fa-robot"></i>
        <div class="xiaozhu-badge" id="xiaozhu-badge" style="display: none;">1</div>
      </div>
      
      <!-- 对话窗口 -->
      <div class="xiaozhu-window xiaozhu-hidden" id="xiaozhu-window">
        <!-- 头部 -->
        <div class="xiaozhu-header">
          <div class="xiaozhu-header-left">
            <div class="xiaozhu-avatar xiaozhu-avatar-bot">
              <i class="fas fa-robot"></i>
            </div>
            <div class="xiaozhu-title">
              <h3>专小著</h3>
              <span class="xiaozhu-status">
                <span class="xiaozhu-status-dot"></span>
                在线
              </span>
            </div>
          </div>
          <div class="xiaozhu-header-controls">
            <button class="xiaozhu-control-btn" id="xiaozhu-clear" title="清除对话">
              <i class="fas fa-trash-alt"></i>
            </button>
            <button class="xiaozhu-control-btn" id="xiaozhu-minimize-btn" title="最小化">
              <i class="fas fa-minus"></i>
            </button>
          </div>
        </div>
        
        <!-- 快捷菜单 -->
        <div style="padding: 12px 16px 0; background: #f8fafc;">
          <div class="xiaozhu-quick-menu">
            <div class="xiaozhu-quick-item" data-question="如何准备数学建模竞赛？">竞赛备赛</div>
            <div class="xiaozhu-quick-item" data-question="论文怎么选题？">论文选题</div>
            <div class="xiaozhu-quick-item" data-question="怎么学习编程？">技能学习</div>
          </div>
        </div>
        
        <!-- 消息区域 -->
        <div class="xiaozhu-messages" id="xiaozhu-messages">
        </div>
        
        <!-- 输入区域 -->
        <div class="xiaozhu-input-area">
          <div class="xiaozhu-input-wrapper">
            <textarea 
              class="xiaozhu-input" 
              id="xiaozhu-input"
              placeholder="问我关于竞赛、论文或技能的问题..."
              rows="1"
            ></textarea>
          </div>
          <button class="xiaozhu-send-btn" id="xiaozhu-send" disabled>
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
  }

  // 绑定事件
  function bindEvents() {
    const minimize = document.getElementById('xiaozhu-minimize');
    const minimizeBtn = document.getElementById('xiaozhu-minimize-btn');
    const clearBtn = document.getElementById('xiaozhu-clear');
    const sendBtn = document.getElementById('xiaozhu-send');
    const input = document.getElementById('xiaozhu-input');
    const quickMenu = document.querySelector('.xiaozhu-quick-menu');

    // 展开/收起
    minimize.addEventListener('click', toggleWindow);
    minimizeBtn.addEventListener('click', toggleWindow);

    // 清除对话
    clearBtn.addEventListener('click', clearChat);

    // 发送消息
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // 输入框自动调整高度
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      sendBtn.disabled = !input.value.trim();
    });

    // 快捷问题
    quickMenu.addEventListener('click', (e) => {
      if (e.target.classList.contains('xiaozhu-quick-item')) {
        const question = e.target.dataset.question;
        input.value = question;
        input.dispatchEvent(new Event('input'));
        sendMessage();
      }
    });

    // 加载历史消息
    renderMessages();
  }

  // 切换窗口显示
  function toggleWindow() {
    state.isOpen = !state.isOpen;
    const window = document.getElementById('xiaozhu-window');
    const badge = document.getElementById('xiaozhu-badge');
    
    if (state.isOpen) {
      window.classList.remove('xiaozhu-hidden');
      badge.style.display = 'none';
      setTimeout(() => {
        const messages = document.getElementById('xiaozhu-messages');
        messages.scrollTop = messages.scrollHeight;
      }, 100);
    } else {
      window.classList.add('xiaozhu-hidden');
    }
  }

  // 发送消息
  async function sendMessage() {
    const input = document.getElementById('xiaozhu-input');
    const text = input.value.trim();
    
    if (!text || state.isTyping) return;

    // 添加用户消息
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: text,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };
    
    state.messages.push(userMessage);
    renderMessages();
    
    // 清空输入
    input.value = '';
    input.style.height = 'auto';
    document.getElementById('xiaozhu-send').disabled = true;

    // 显示正在输入
    showTyping();

    // 模拟AI响应
    setTimeout(() => {
      hideTyping();
      const botResponse = generateResponse(text);
      const botMessage = {
        id: Date.now(),
        type: 'bot',
        text: botResponse,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      };
      
      state.messages.push(botMessage);
      saveHistory();
      renderMessages();
    }, 1000 + Math.random() * 1000);
  }

  // 生成响应
  function generateResponse(question) {
    const lowerQuestion = question.toLowerCase();
    
    // 匹配分类
    for (const [category, data] of Object.entries(KNOWLEDGE_BASE)) {
      for (const keyword of data.keywords) {
        if (lowerQuestion.includes(keyword.toLowerCase())) {
          return data.answers[Math.floor(Math.random() * data.answers.length)];
        }
      }
    }
    
    // 默认响应
    return `你好！我是专小著，你的智能学术助手。我可以帮助你解答：

1. **竞赛相关问题** - 各类学科竞赛的规则、备赛策略、真题分析
2. **论文写作指导** - 选题建议、结构规划、文献检索、写作技巧
3. **技能学习推荐** - 编程、设计、语言等各类技能的学习路径

请告诉我你想了解哪方面的内容，或者访问我们平台的竞赛、技能、论文页面获取更多资源！`;
  }

  // 显示正在输入
  function showTyping() {
    state.isTyping = true;
    const messages = document.getElementById('xiaozhu-messages');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'xiaozhu-typing-indicator';
    typingDiv.className = 'xiaozhu-message';
    typingDiv.innerHTML = `
      <div class="xiaozhu-message-avatar xiaozhu-avatar-bot">
        <i class="fas fa-robot"></i>
      </div>
      <div>
        <div class="xiaozhu-typing">
          <div class="xiaozhu-typing-dot"></div>
          <div class="xiaozhu-typing-dot"></div>
          <div class="xiaozhu-typing-dot"></div>
        </div>
      </div>
    `;
    messages.appendChild(typingDiv);
    messages.scrollTop = messages.scrollHeight;
  }

  // 隐藏正在输入
  function hideTyping() {
    state.isTyping = false;
    const typing = document.getElementById('xiaozhu-typing-indicator');
    if (typing) typing.remove();
  }

  // 渲染消息
  function renderMessages() {
    const container = document.getElementById('xiaozhu-messages');
    container.innerHTML = '';
    
    state.messages.forEach(msg => {
      const msgDiv = document.createElement('div');
      msgDiv.className = `xiaozhu-message xiaozhu-${msg.type}`;
      
      const avatar = msg.type === 'user' 
        ? '<div class="xiaozhu-message-avatar xiaozhu-avatar-user"><i class="fas fa-user"></i></div>'
        : '<div class="xiaozhu-message-avatar xiaozhu-avatar-bot"><i class="fas fa-robot"></i></div>';
      
      const bubbleClass = msg.type === 'user' ? 'xiaozhu-user-bubble' : 'xiaozhu-bot-bubble';
      
      msgDiv.innerHTML = `
        ${avatar}
        <div>
          <div class="xiaozhu-message-bubble ${bubbleClass}">${formatMessage(msg.text)}</div>
          <div class="xiaozhu-message-time">${msg.time}</div>
        </div>
      `;
      
      container.appendChild(msgDiv);
    });
    
    container.scrollTop = container.scrollHeight;
  }

  // 格式化消息
  function formatMessage(text) {
    let formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/(?:\r\n|\r|\n)/g, '<br>');
    
    return formatted;
  }

  // 保存历史
  function saveHistory() {
    try {
      const history = state.messages.slice(-CONFIG.MAX_HISTORY);
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('保存对话历史失败:', e);
    }
  }

  // 加载历史
  function loadHistory() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (saved) {
        state.messages = JSON.parse(saved);
      }
    } catch (e) {
      console.error('加载对话历史失败:', e);
    }
  }

  // 清除对话
  function clearChat() {
    if (confirm('确定要清除所有对话记录吗？')) {
      state.messages = [];
      saveHistory();
      renderMessages();
    }
  }

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 暴露到全局
  window.XiaozhuChatbot = {
    clear: clearChat,
    open: () => {
      if (!state.isOpen) toggleWindow();
    },
    close: () => {
      if (state.isOpen) toggleWindow();
    }
  };

})();