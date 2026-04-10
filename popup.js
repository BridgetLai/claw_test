// Recall Timer - Popup Logic

const STORAGE_KEY = 'recall-timer-alarms';
const TOTAL_SETS_KEY = 'recall-timer-total-sets';

// 遗忘曲线时间点（分钟）
const EBBINGHAUS_CURVE = [
  { minutes: 5, label: '首次复习' },
  { minutes: 30, label: '二次巩固' },
  { minutes: 720, label: '12小时后' },
  { minutes: 1440, label: '1天后' },
  { minutes: 4320, label: '3天后' },
  { minutes: 10080, label: '7天后' },
  { minutes: 21600, label: '15天后' },
  { minutes: 43200, label: '30天后' }
];

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  checkPermission();
  loadAlarms();
  updateStats();
  // 每秒更新倒计时
  setInterval(updateCountdowns, 1000);
});

// 检查通知权限
function checkPermission() {
  if (!('Notification' in window)) {
    document.getElementById('permissionTip').style.display = 'block';
    document.getElementById('permissionTip').textContent = '⚠️ 您的浏览器不支持通知功能';
    return;
  }
  
  if (Notification.permission === 'default') {
    document.getElementById('permissionTip').style.display = 'block';
  } else if (Notification.permission === 'denied') {
    document.getElementById('permissionTip').style.display = 'block';
    document.getElementById('permissionTip').textContent = '⚠️ 通知被禁用，请到浏览器设置中开启';
  }
}

// 请求通知权限
async function requestPermission() {
  const permission = await Notification.requestPermission();
  checkPermission();
  if (permission === 'granted') {
    showNotification('权限已开启', 'Recall Timer 已准备就绪！');
  }
}

// 设置遗忘曲线闹钟
function setEbbinghausCurve() {
  const alarms = getAlarms();
  const now = Date.now();
  let addedCount = 0;

  EBBINGHAUS_CURVE.forEach((item, index) => {
    const id = `curve-${Date.now()}-${index}`;
    const triggerTime = now + item.minutes * 60 * 1000;
    
    // 检查是否已存在相同时间的闹钟
    const exists = alarms.some(a => a.triggerTime === triggerTime);
    if (!exists) {
      alarms.push({
        id,
        triggerTime,
        label: item.label,
        type: 'curve',
        createdAt: now
      });
      addedCount++;
    }
  });

  saveAlarms(alarms);
  incrementTotalSets();
  loadAlarms();
  updateStats();
  
  if (addedCount > 0) {
    showNotification('闹钟已设置', `已添加 ${addedCount} 个遗忘曲线复习提醒`);
  } else {
    showNotification('提示', '所有遗忘曲线闹钟已存在');
  }
}

// 设置自定义间隔闹钟
function setCustomInterval() {
  const intervalHours = parseFloat(document.getElementById('intervalHours').value);
  const alarmCount = parseInt(document.getElementById('alarmCount').value);
  
  if (!intervalHours || intervalHours <= 0) {
    showNotification('错误', '请输入有效的间隔时间');
    return;
  }
  
  if (!alarmCount || alarmCount <= 0 || alarmCount > 20) {
    showNotification('错误', '闹钟个数需在 1-20 之间');
    return;
  }

  const alarms = getAlarms();
  const now = Date.now();
  const intervalMs = intervalHours * 60 * 60 * 1000;

  for (let i = 0; i < alarmCount; i++) {
    const id = `custom-${Date.now()}-${i}`;
    const triggerTime = now + intervalMs * (i + 1);
    
    alarms.push({
      id,
      triggerTime,
      label: `第 ${i + 1} 次提醒 (${intervalHours}小时)`,
      type: 'custom',
      createdAt: now
    });
  }

  saveAlarms(alarms);
  incrementTotalSets();
  loadAlarms();
  updateStats();
  
  showNotification('闹钟已设置', `已添加 ${alarmCount} 个间隔闹钟 (每 ${intervalHours}小时)`);
}

// 获取闹钟列表
function getAlarms() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

// 保存闹钟列表
function saveAlarms(alarms) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
}

// 增加设置轮次
function incrementTotalSets() {
  const current = parseInt(localStorage.getItem(TOTAL_SETS_KEY) || '0');
  localStorage.setItem(TOTAL_SETS_KEY, (current + 1).toString());
}

// 获取设置轮次
function getTotalSets() {
  return parseInt(localStorage.getItem(TOTAL_SETS_KEY) || '0');
}

// 渲染闹钟列表
function loadAlarms() {
  const alarms = getAlarms();
  const listEl = document.getElementById('alarmList');
  
  // 按触发时间排序
  alarms.sort((a, b) => a.triggerTime - b.triggerTime);
  
  if (alarms.length === 0) {
    listEl.innerHTML = '<div class="empty-state">暂无闹钟，点击上方按钮添加</div>';
    return;
  }

  listEl.innerHTML = alarms.map(alarm => {
    const date = new Date(alarm.triggerTime);
    const timeStr = formatTime(date);
    const countdown = getCountdown(alarm.triggerTime);
    const isPast = alarm.triggerTime < Date.now();
    
    return `
      <div class="alarm-item" data-id="${alarm.id}">
        <div class="alarm-info">
          <div class="alarm-time" style="${isPast ? 'color: var(--text-dim)' : ''}">${timeStr}</div>
          <div class="alarm-label">${alarm.label}</div>
        </div>
        <div class="alarm-countdown" style="${isPast ? 'color: var(--text-dim)' : ''}">${countdown}</div>
        <button class="btn-delete" onclick="deleteAlarm('${alarm.id}')">删除</button>
      </div>
    `;
  }).join('');

  // 更新高亮当前阶段
  updateCurveHighlight(alarms);
}

// 更新遗忘曲线高亮
function updateCurveHighlight(alarms) {
  const now = Date.now();
  const items = document.querySelectorAll('.curve-item');
  items.forEach(item => {
    item.classList.remove('active');
  });

  // 找到最近的要执行的闹钟对应的阶段
  const nextAlarm = alarms.find(a => a.triggerTime > now && a.type === 'curve');
  if (nextAlarm) {
    const idx = EBBINGHAUS_CURVE.findIndex(c => {
      const targetTime = Date.now() + c.minutes * 60 * 1000;
      return Math.abs(targetTime - nextAlarm.triggerTime) < 60000; // 1分钟内
    });
    if (idx >= 0) {
      items[idx].classList.add('active');
    }
  }
}

// 获取倒计时
function getCountdown(triggerTime) {
  const diff = triggerTime - Date.now();
  
  if (diff <= 0) {
    return '已过期';
  }
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}天${hours % 24}小时`;
  } else if (hours > 0) {
    return `${hours}小时${minutes % 60}分`;
  } else if (minutes > 0) {
    return `${minutes}分`;
  } else {
    const seconds = Math.floor(diff / 1000);
    return `${seconds}秒`;
  }
}

// 更新所有倒计时
function updateCountdowns() {
  const alarms = getAlarms();
  const now = Date.now();
  
  alarms.forEach(alarm => {
    const el = document.querySelector(`.alarm-item[data-id="${alarm.id}"] .alarm-countdown`);
    if (el) {
      const countdown = getCountdown(alarm.triggerTime);
      el.textContent = countdown;
      
      if (alarm.triggerTime <= now) {
        el.style.color = 'var(--text-dim)';
        triggerAlarm(alarm);
      }
    }
  });
}

// 触发闹钟
function triggerAlarm(alarm) {
  // 显示通知
  showNotification('📚 复习提醒', alarm.label || '是时候复习了！');
  
  // 播放提示音
  playAlertSound();
  
  // 从列表中移除
  deleteAlarm(alarm.id);
}

// 播放提示音
function playAlertSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.log('Audio not supported');
  }
}

// 删除单个闹钟
function deleteAlarm(id) {
  const alarms = getAlarms();
  const filtered = alarms.filter(a => a.id !== id);
  saveAlarms(filtered);
  loadAlarms();
  updateStats();
}

// 清空所有闹钟
function clearAllAlarms() {
  if (confirm('确定要清空所有闹钟吗？')) {
    saveAlarms([]);
    loadAlarms();
    updateStats();
    showNotification('已清空', '所有闹钟已被删除');
  }
}

// 更新统计
function updateStats() {
  const alarms = getAlarms();
  const now = Date.now();
  const activeAlarms = alarms.filter(a => a.triggerTime > now);
  
  document.getElementById('totalAlarms').textContent = activeAlarms.length;
  document.getElementById('totalSets').textContent = getTotalSets();
  
  // 下一个闹钟
  if (activeAlarms.length > 0) {
    const next = activeAlarms[0];
    document.getElementById('nextAlarm').textContent = getCountdown(next.triggerTime);
  } else {
    document.getElementById('nextAlarm').textContent = '--';
  }
}

// 格式化时间
function formatTime(date) {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day} ${hours}:${minutes}`;
}

// 显示通知
function showNotification(title, body) {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: 'icon.png',
      badge: 'icon.png'
    });
  }
}

// 定期检查过期闹钟
setInterval(() => {
  const alarms = getAlarms();
  const now = Date.now();
  const hasExpired = alarms.some(a => a.triggerTime <= now);
  
  if (hasExpired) {
    loadAlarms();
    updateStats();
  }
}, 5000);
