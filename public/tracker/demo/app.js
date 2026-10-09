const TODAY = '2026-10-09';
const WEEK_START = '2026-10-05';
const WEEK_END = '2026-10-11';
const STORAGE_KEY = 'youshu-home-prototype-v1';
const $ = (selector) => document.querySelector(selector);
const clone = (value) => JSON.parse(JSON.stringify(value));
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const uid = () => crypto.randomUUID();
const templates = [
  { id: 'basketball', name: '篮球', unit: '次', metric: 'count', timed: true, aliases: ['篮球'] },
  { id: 'gaming', name: '游戏', unit: '次', metric: 'count', timed: true, aliases: ['游戏'] },
  { id: 'drinks', name: '饮料', unit: '杯', metric: 'count', timed: false, aliases: ['饮料', '奶茶'] },
  { id: 'fitness', name: '健身', unit: '次', metric: 'count', timed: true, aliases: ['健身'] },
  { id: 'reading', name: '阅读', unit: '次', metric: 'minutes', timed: true, aliases: ['阅读', '读书'] },
  { id: 'running', name: '跑步', unit: '次', metric: 'count', timed: true, aliases: ['跑步'] },
  { id: 'study', name: '学习', unit: '次', metric: 'count', timed: true, aliases: ['学习'] },
  { id: 'videos', name: '短视频', unit: '次', metric: 'minutes', timed: true, aliases: ['短视频', '刷视频'] },
  { id: 'takeaway', name: '外卖', unit: '次', metric: 'count', timed: false, aliases: ['外卖'] },
  { id: 'sleep', name: '睡眠', unit: '次', metric: 'minutes', timed: true, aliases: ['睡眠', '睡觉'] },
];
const record = (id, day, minutes, quantity = 1) => ({ id, day, minutes, quantity });
const seeds = [
  { template: 'basketball', name: '篮球', unit: '次', timed: true, rule: { mode: 'min', metric: 'count', period: 'week', target: 3, sessionMinutes: null }, records: [record('b1', '2026-10-06', 60), record('b2', '2026-10-08', 60)] },
  { template: 'drinks', name: '饮料', unit: '杯', timed: false, rule: { mode: 'max', metric: 'count', period: 'week', target: 2, sessionMinutes: null }, records: [record('d1', '2026-10-08', null)] },
  { template: 'gaming', name: '游戏', unit: '次', timed: true, rule: { mode: 'max', metric: 'count', period: 'week', target: 3, sessionMinutes: 120 }, records: [record('g1', '2026-10-06', 85), record('g2', '2026-10-08', 135)] },
  { template: 'fitness', name: '健身', unit: '次', timed: true, rule: { mode: 'min', metric: 'count', period: 'week', target: 3, sessionMinutes: 30 }, records: [record('f1', '2026-10-05', 45), record('f2', '2026-10-07', 40), record('f3', '2026-10-09', 60)] },
  { template: 'reading', name: '阅读', unit: '次', timed: true, rule: { mode: 'min', metric: 'minutes', period: 'week', target: 150, sessionMinutes: null }, records: [record('r1', '2026-10-06', 30), record('r2', '2026-10-07', 25), record('r3', '2026-10-08', 25)] },
  { template: 'running', name: '跑步', unit: '次', timed: true, rule: { mode: 'min', metric: 'count', period: 'week', target: 2, sessionMinutes: null }, records: [record('rn1', '2026-10-07', 35)] },
].map((activity) => ({ ...activity, id: activity.template }));

let state = { version: 1, activities: clone(seeds) };
try {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (stored?.version === 1 && Array.isArray(stored.activities) && stored.activities.length <= 50 && stored.activities.every((activity) => typeof activity.id === 'string' && typeof activity.name === 'string' && activity.rule && Array.isArray(activity.records))) state = stored;
} catch { /* A fresh prototype also works with unavailable or malformed storage. */ }
let filter = 'all';
let undoState = null;
let toastTimer;
let recordActivityId = null;
let goalActivityId = null;
let goalTemplate = null;

function persist() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Keep this session usable when storage is disabled. */ } }
function activityById(id) { return state.activities.find((activity) => activity.id === id); }
function duration(minutes) {
  if (!minutes) return '0分钟';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}小时${rest ? `${rest}分钟` : ''}` : `${rest}分钟`;
}
function briefDuration(minutes) { return minutes >= 60 ? `${Math.floor(minutes / 60)}h${minutes % 60 ? `${minutes % 60}m` : ''}` : `${minutes}分`; }
function ruleLabel(activity) {
  const rule = activity.rule;
  const period = rule.period === 'day' ? '每天' : '每周';
  if (rule.mode === 'none') return `${period}记录${rule.metric === 'minutes' ? '时长' : activity.unit === '杯' ? '杯数' : '次数'}`;
  const direction = rule.mode === 'max' ? '最多' : '至少';
  const amount = rule.metric === 'minutes' ? duration(rule.target) : `${rule.target}${activity.unit}`;
  return `${period}${direction}${amount}${rule.sessionMinutes ? ` · 每次${direction}${duration(rule.sessionMinutes)}` : ''}`;
}
function summary(activity) {
  const { rule } = activity;
  const records = activity.records.filter((item) => rule.period === 'day' ? item.day === TODAY : item.day >= WEEK_START && item.day <= WEEK_END);
  const rawCount = records.reduce((sum, item) => sum + item.quantity, 0);
  const minutes = records.reduce((sum, item) => sum + (item.minutes || 0), 0);
  const qualifiedCount = rule.mode === 'min' && rule.sessionMinutes ? records.filter((item) => item.minutes >= rule.sessionMinutes).reduce((sum, item) => sum + item.quantity, 0) : rawCount;
  const value = rule.metric === 'minutes' ? minutes : qualifiedCount;
  const badSessions = rule.mode === 'max' && rule.sessionMinutes ? records.filter((item) => item.minutes > rule.sessionMinutes) : [];
  const overAmount = rule.mode === 'max' ? Math.max(0, value - rule.target) : 0;
  const over = overAmount > 0 || badSessions.length > 0;
  const atLimit = rule.mode === 'max' && value === rule.target && !over;
  const done = rule.mode === 'min' && value >= rule.target;
  const todo = rule.mode === 'min' && !done;
  const status = over ? 'over' : atLimit ? 'near' : done ? 'done' : todo ? 'progress' : 'neutral';
  const statusLabel = !records.length ? '未记录' : over ? '需留意' : atLimit ? '额度已用完' : done ? '已达成' : todo ? '进行中' : rule.mode === 'none' ? '仅统计' : '额度内';
  const unit = rule.metric === 'minutes' ? '分钟' : activity.unit;
  let remaining = rule.mode === 'none' ? '按自己的节奏记录' : done ? '本周期目标已达成' : rule.mode === 'min' ? `还差${Math.max(0, rule.target - value)}${unit}` : overAmount ? `超额${overAmount}${unit}` : `剩余${Math.max(0, rule.target - value)}${unit}`;
  if (badSessions.length && !overAmount) remaining = `还有${Math.max(0, rule.target - value)}${unit}额度`;
  let help = rule.metric === 'minutes' ? `已记录${rawCount}次` : activity.timed ? `已记录时长${duration(minutes)}` : rule.mode === 'max' ? '超过上限后会标红，记录仍会保留' : '记录每一次发生的事';
  if (badSessions.length) help = `${badSessions.length}次超过单次上限，最长超时${Math.max(...badSessions.map((item) => item.minutes - rule.sessionMinutes))}分钟`;
  else if (rule.mode === 'min' && rule.sessionMinutes && rawCount !== qualifiedCount) help = `已记录${rawCount}次，其中${qualifiedCount}次满足时长条件`;
  if (!records.length) help = '还没有记录，随时可以开始';
  const ratio = rule.mode === 'none' ? 0 : Math.min(1, value / rule.target);
  return { records, rawCount, minutes, value, over, atLimit, done, todo, status, statusLabel, remaining, help, ratio, unit, badSessions };
}
function cardMarkup(activity) {
  const info = summary(activity);
  const { rule } = activity;
  const scope = rule.period === 'day' ? '今天' : '本周';
  const caption = rule.metric === 'minutes' ? `${scope}已记录` : rule.mode === 'min' && rule.sessionMinutes ? `${scope}满足条件` : `${scope}已记录`;
  const target = rule.mode !== 'none' ? `<span class="value-divider">/</span><span class="value-target">${rule.target}</span>` : '';
  let progress = `<div class="progress-track" role="progressbar" aria-label="${escape(activity.name)}${rule.mode === 'max' ? '额度使用' : '目标进度'}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(info.ratio * 100)}" aria-valuetext="${escape(`${info.value}${info.unit}，${info.remaining}`)}"><div class="progress-fill" style="transform:scaleX(${info.ratio})"></div></div>`;
  if (rule.mode === 'none') progress = '';
  if (rule.mode === 'max' && rule.metric === 'count' && rule.sessionMinutes && rule.target <= 6) {
    const slots = Array.from({ length: rule.target }, (_, index) => {
      const item = info.records[index];
      const className = !item ? 'empty' : item.minutes > rule.sessionMinutes ? 'over' : '';
      return `<span class="session-slot ${className}">${item ? briefDuration(item.minutes) : '未使用'}</span>`;
    }).join('');
    progress = `<div class="session-slots" aria-label="每次记录与剩余次数">${slots}</div>`;
  }
  return `<article class="activity-card ${info.status}" data-activity="${escape(activity.id)}" aria-labelledby="title-${escape(activity.id)}"><div class="card-top"><h3 class="card-title" id="title-${escape(activity.id)}">${escape(activity.name)}</h3><span class="status-pill ${info.status}">${info.done ? '<span aria-hidden="true">✓</span>' : ''}${info.statusLabel}</span></div><p class="card-rule">${escape(ruleLabel(activity))}</p><div class="card-main"><div class="card-value"><p class="value-caption">${caption}</p><div class="value-line"><strong class="value-primary">${info.value}</strong>${target}<span class="value-unit">${escape(info.unit)}</span></div></div><div class="icon-slot" role="img" aria-label="${escape(activity.name)}图标预留位置"><span>图标位</span></div></div><div class="card-progress"><div class="progress-caption"><strong>${escape(info.remaining)}</strong><span>${rule.mode === 'min' ? `${Math.round(info.ratio * 100)}%` : rule.mode === 'none' ? '自由记录' : `${scope}额度`}</span></div>${progress}<p class="progress-help ${info.badSessions.length || info.over ? 'over' : ''}">${escape(info.help)}</p></div><div class="card-bottom"><button class="card-record" type="button" data-record="${escape(activity.id)}"><span aria-hidden="true">＋</span>${rule.metric === 'minutes' ? '记录时长' : activity.unit === '杯' ? '记一杯' : '记一次'}</button><button type="button" class="card-detail" data-detail="${escape(activity.id)}">详情 ↗</button></div></article>`;
}
function render() {
  const counts = { all: state.activities.length, todo: 0, attention: 0, done: 0 };
  const visible = state.activities.filter((activity) => {
    const info = summary(activity);
    if (info.todo) counts.todo++;
    if (info.over || info.atLimit) counts.attention++;
    if (info.done) counts.done++;
    return filter === 'all' || (filter === 'todo' && info.todo) || (filter === 'attention' && (info.over || info.atLimit)) || (filter === 'done' && info.done);
  });
  $('#activity-grid').innerHTML = visible.map(cardMarkup).join('');
  $('#activity-grid').hidden = !visible.length;
  $('#empty-filter').hidden = !!visible.length;
  const emptyLabels = { attention: '当前没有需要留意的活动', done: '目标正在慢慢积累中', todo: '当前没有待达成的目标', all: '从一个小目标开始' };
  $('#empty-title').textContent = emptyLabels[filter];
  $('#activity-count').textContent = `${counts.all}项日常`;
  document.querySelectorAll('[data-count]').forEach((element) => { element.textContent = counts[element.dataset.count]; });
  document.querySelectorAll('[data-filter]').forEach((element) => { element.setAttribute('aria-pressed', String(element.dataset.filter === filter)); });
}
function notify(message, undo = false) {
  clearTimeout(toastTimer);
  $('#toast-message').textContent = message;
  $('#undo-button').hidden = !undo;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 8000);
}
function commit(change, message) {
  undoState = clone(state);
  change();
  persist();
  render();
  notify(message, true);
}
function closeDialogs() { document.querySelectorAll('dialog[open]').forEach((dialog) => dialog.close()); }
function openDialog(id) { closeDialogs(); $(id).showModal(); }
function showRecord(id) {
  const activity = activityById(id);
  if (!activity) return;
  if (!activity.timed && activity.rule.metric === 'count') {
    commit(() => { activity.records.push(record(uid(), TODAY, null)); }, `${activity.name}已记录1${activity.unit}`);
    return;
  }
  recordActivityId = id;
  $('#record-title').textContent = `记录${activity.name}`;
  $('#record-rule').textContent = ruleLabel(activity);
  $('#record-quantity-field').hidden = activity.timed || activity.rule.metric === 'minutes';
  $('#record-minutes-field').hidden = !activity.timed && activity.rule.metric !== 'minutes';
  $('#record-quantity').value = '1';
  $('#record-minutes').value = String(activity.rule.sessionMinutes || 30);
  $('#record-minutes').required = activity.timed || activity.rule.metric === 'minutes';
  $('#record-unit').textContent = activity.unit;
  $('#record-date').value = TODAY;
  openDialog('#record-dialog');
  $('#record-minutes').focus();
  $('#record-minutes').select();
}
function showLibrary() {
  $('#library-grid').innerHTML = templates.map((template) => {
    const added = state.activities.some((activity) => activity.template === template.id);
    return `<button type="button" class="library-item" data-template="${template.id}" ${added ? 'disabled' : ''}><span class="library-icon" aria-hidden="true">图标</span><span><strong>${template.name}</strong><small>${added ? '已添加' : template.metric === 'minutes' ? '记录时长' : template.timed ? '次数与时长' : `记录${template.unit === '杯' ? '杯数' : '次数'}`}</small></span></button>`;
  }).join('');
  openDialog('#library-dialog');
}
function updateGoalFields() {
  const mode = $('#goal-mode').value;
  const metric = $('#goal-metric').value;
  const hasTarget = mode !== 'none';
  $('#goal-target-field').hidden = !hasTarget;
  $('#goal-target').disabled = !hasTarget;
  $('#goal-target').required = hasTarget;
  $('#goal-target-unit').textContent = metric === 'minutes' ? '分钟' : goalTemplate?.unit || '次';
  $('#goal-session-field').hidden = !hasTarget || metric !== 'count' || !goalTemplate?.timed;
  $('#goal-session').disabled = $('#goal-session-field').hidden;
}
function showGoal(template, existingId = null, parsedRule = null) {
  goalTemplate = template;
  goalActivityId = existingId;
  const existing = existingId ? activityById(existingId) : null;
  const rule = parsedRule || existing?.rule || { period: 'week', metric: template.metric, mode: 'none', target: 3, sessionMinutes: null };
  $('#goal-dialog-title').textContent = existing ? '修改目标' : '添加活动';
  $('#activity-name').value = existing?.name || template.name;
  $('#goal-period').value = rule.period;
  $('#goal-metric').value = rule.metric;
  $('#goal-mode').value = rule.mode;
  $('#goal-target').value = String(rule.target || 3);
  $('#goal-session').value = rule.sessionMinutes || '';
  updateGoalFields();
  openDialog('#goal-dialog');
}
function showHistory(id = null) {
  const selected = id ? activityById(id) : null;
  $('#history-title').textContent = selected ? `${selected.name}的记录` : '最近记录';
  $('#history-description').textContent = selected ? ruleLabel(selected) : '示例记录与本机新增记录';
  const items = (selected ? [selected] : state.activities).flatMap((activity) => activity.records.map((item) => ({ ...item, activity })));
  items.sort((a, b) => b.day.localeCompare(a.day));
  const rows = items.map((item) => {
    const { activity } = item;
    const amount = activity.rule.metric === 'minutes' ? duration(item.minutes || 0) : `${item.quantity}${activity.unit}${item.minutes ? ` · ${duration(item.minutes)}` : ''}`;
    const issue = activity.rule.mode === 'max' && activity.rule.sessionMinutes && item.minutes > activity.rule.sessionMinutes ? `单次超额${item.minutes - activity.rule.sessionMinutes}分钟` : '';
    return `<div class="history-row"><strong>${escape(activity.name)}</strong><span class="history-amount">${escape(amount)}</span><small>${item.day === TODAY ? '今天' : `${Number(item.day.slice(5, 7))}月${Number(item.day.slice(8, 10))}日`}</small><small class="history-issue">${issue}</small></div>`;
  }).join('');
  $('#history-list').innerHTML = `${selected ? `<div class="history-actions"><button type="button" class="button button-secondary" data-edit="${escape(selected.id)}">修改目标</button></div>` : ''}${rows || '<p class="dialog-description">还没有记录，随时可以开始。</p>'}`;
  openDialog('#history-dialog');
}
function numberOf(text) {
  if (/^\d+(\.\d+)?$/.test(text)) return Number(text);
  if (text === '半') return 0.5;
  const digits = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  if (text.includes('十')) { const [tens, ones] = text.split('十'); return (tens ? digits[tens] : 1) * 10 + (ones ? digits[ones] : 0); }
  return digits[text];
}
function parseGoal(text) {
  const matches = templates.filter((template) => template.aliases.some((alias) => text.includes(alias)));
  if (matches.length !== 1) return { error: matches.length ? '一次先说一个活动吧，这次想给哪个活动设目标？' : '这份预览先支持活动库里的十种活动，也可以从活动库创建自己的活动。' };
  const template = matches[0];
  const [main, session = ''] = text.split('每次');
  const daily = /每天|每日|一天/.test(main);
  const weekly = /每周|每星期|一周/.test(main);
  if (daily === weekly) return { error: '这个目标想按每天，还是每周统计？' };
  const upper = /最多|不超过|上限|只能/.test(main);
  const lower = /至少|不少于|最少/.test(main);
  const justTrack = /只记录|仅记录|只统计|仅统计/.test(main);
  if (!justTrack && upper === lower) return { error: '希望设置“最多”的上限，还是“至少”的目标？' };
  const amountPattern = /([0-9]+(?:\.[0-9]+)?|[零一二两三四五六七八九十半]+)\s*(杯|次|分钟|小时)/;
  const amount = main.match(amountPattern);
  if (!amount && !justTrack) return { error: '具体希望记录多少次，或者多长时间？例如“每周至少学习三次”。' };
  const targetValue = amount ? numberOf(amount[1]) : null;
  const metric = amount && /分钟|小时/.test(amount[2]) ? 'minutes' : amount ? 'count' : template.metric;
  const target = amount ? targetValue * (amount[2] === '小时' ? 60 : 1) : null;
  if (!justTrack && (!Number.isFinite(target) || target < 1 || target > 10000 || (metric === 'count' && !Number.isInteger(target)))) return { error: '请用一个明确的正数设置目标，次数需要是整数。' };
  if (metric === 'count' && amount && amount[2] !== template.unit) return { error: `${template.name}按“${template.unit}”记录，请确认一下单位。` };
  const sessionAmount = session.match(amountPattern);
  if (session && (!sessionAmount || !/分钟|小时/.test(sessionAmount[2]) || metric !== 'count' || !template.timed)) return { error: '单次条件请描述为明确的时长，例如“每次至少半小时”。' };
  const oppositeSession = session && ((upper && /至少|最少|不少于/.test(session)) || (lower && /最多|不超过|上限/.test(session)));
  if (oppositeSession) return { error: '这份预览先演示同方向的组合规则，混合上下限可以在后续原型中补充。' };
  const sessionMinutes = sessionAmount ? numberOf(sessionAmount[1]) * (sessionAmount[2] === '小时' ? 60 : 1) : null;
  if (sessionMinutes !== null && (!Number.isFinite(sessionMinutes) || sessionMinutes < 1 || sessionMinutes > 1440)) return { error: '请填写明确的单次时长，例如30分钟或2小时。' };
  return { template, rule: { period: daily ? 'day' : 'week', metric, mode: justTrack ? 'none' : upper ? 'max' : 'min', target: justTrack ? null : target, sessionMinutes } };
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.hasAttribute('data-close')) { button.closest('dialog').close(); return; }
  if (button.dataset.filter) { filter = button.dataset.filter; render(); return; }
  if (button.dataset.record) { showRecord(button.dataset.record); return; }
  if (button.dataset.detail) { showHistory(button.dataset.detail); return; }
  if (button.dataset.template) { showGoal(templates.find((template) => template.id === button.dataset.template)); return; }
  if (button.dataset.edit) {
    const activity = activityById(button.dataset.edit);
    showGoal(templates.find((template) => template.id === activity.template) || { id: activity.template, name: activity.name, unit: activity.unit, timed: activity.timed, metric: activity.rule.metric }, activity.id);
    return;
  }
  if (button.dataset.example) { $('#goal-input').value = button.dataset.example; $('#goal-input').focus(); $('#composer-feedback').hidden = true; return; }
  const action = button.dataset.action;
  if (action === 'library') showLibrary();
  if (action === 'history') showHistory();
  if (action === 'custom') showGoal({ id: 'custom', name: '', unit: '次', metric: 'count', timed: true });
  if (action === 'show-all' || action === 'home') { filter = 'all'; render(); if (action === 'home') window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
  if (action === 'reset') { filter = 'all'; commit(() => { state = { version: 1, activities: clone(seeds) }; }, '已恢复首页示例'); }
});
document.querySelectorAll('dialog').forEach((dialog) => dialog.addEventListener('click', (event) => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
}));
$('#record-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const activity = activityById(recordActivityId);
  if (!activity) return;
  const timed = activity.timed || activity.rule.metric === 'minutes';
  const minutes = timed ? Number($('#record-minutes').value) : null;
  const quantity = timed ? 1 : Number($('#record-quantity').value);
  const day = $('#record-date').value;
  if (!day || day > TODAY || !Number.isInteger(quantity) || quantity < 1 || quantity > 100 || (timed && (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440))) return;
  commit(() => { activity.records.push(record(uid(), day, minutes, quantity)); }, `${activity.name}已记录${timed ? duration(minutes) : `${quantity}${activity.unit}`}`);
  $('#record-dialog').close();
});
['#goal-mode', '#goal-metric'].forEach((selector) => $(selector).addEventListener('change', updateGoalFields));
$('#goal-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = $('#activity-name').value.trim();
  if (!name) return;
  if (state.activities.some((activity) => activity.name === name && activity.id !== goalActivityId)) { notify('已有同名活动，可以在它的详情中修改目标'); return; }
  const mode = $('#goal-mode').value;
  const metric = $('#goal-metric').value;
  const rule = { mode, metric, period: $('#goal-period').value, target: mode === 'none' ? null : Number($('#goal-target').value), sessionMinutes: !$('#goal-session').disabled && $('#goal-session').value ? Number($('#goal-session').value) : null };
  const existing = goalActivityId ? activityById(goalActivityId) : null;
  const activity = existing || { id: uid(), template: goalTemplate.id, unit: goalTemplate.unit, records: [], timed: goalTemplate.timed };
  commit(() => { activity.name = name; activity.rule = rule; activity.timed = goalTemplate.timed || metric === 'minutes'; if (!existing) state.activities.push(activity); }, `${name}${existing ? '目标已更新' : '已添加'}`);
  filter = 'all'; render();
  $('#goal-dialog').close();
});
$('#goal-composer-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = $('#goal-input').value.trim();
  const parsed = parseGoal(input);
  const feedback = $('#composer-feedback');
  feedback.hidden = !parsed.error;
  if (parsed.error) { feedback.textContent = parsed.error; return; }
  const { template, rule } = parsed;
  const existing = state.activities.find((activity) => activity.template === template.id);
  if (existing) {
    if (JSON.stringify(existing.rule) === JSON.stringify(rule)) { notify(`已有这个目标：${ruleLabel(existing)}`); return; }
    showGoal(template, existing.id, rule);
    return;
  }
  const activity = { id: uid(), template: template.id, name: template.name, unit: template.unit, timed: template.timed || rule.metric === 'minutes', rule, records: [] };
  filter = 'all';
  commit(() => { state.activities.push(activity); }, `已设置：${activity.name}，${ruleLabel(activity)}`);
  $('#goal-input').value = '';
});
$('#undo-button').addEventListener('click', () => {
  if (!undoState) return;
  state = undoState; undoState = null; persist(); render(); notify('已撤销刚才的操作');
});
$('#dismiss-toast').addEventListener('click', () => { $('#toast').hidden = true; });
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $('#theme-button').textContent = theme === 'light' ? '深色' : '浅色';
  $('#theme-button').setAttribute('aria-label', `切换${theme === 'light' ? '深色' : '浅色'}外观`);
  try { localStorage.setItem(`${STORAGE_KEY}-theme`, theme); } catch { /* Theme still changes for this visit. */ }
}
let preferredTheme;
try { preferredTheme = localStorage.getItem(`${STORAGE_KEY}-theme`); } catch { /* Use system appearance. */ }
setTheme(preferredTheme === 'dark' || preferredTheme === 'light' ? preferredTheme : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
$('#theme-button').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
render();
