const $ = id => document.getElementById(id);
const countValue = $('count-value');
const progressFill = $('progress-fill');
const goalLabel = $('goal-label');
const shiftTotal = $('shift-total');
const lastEntry = $('last-entry');
const avgEntry = $('avg-entry');
const totalEntries = $('total-entries');
const historyList = $('history-list');
const trendIndicator = $('trend-indicator');
const shiftStartLabel = $('shift-start');
const stationLabel = $('station-label');
const stationInput = $('station-input');
const goalInput = $('goal-input');
const lineSelect = $('line-select');
const themeToggle = $('theme-toggle');

const STORAGE_KEY = 'passenger-counter-pro';

let state = {
    count:0,
    total:0,
    goal:120,
    station:'Downtown Hub',
    line:'Orange',
    shiftStart:new Date().toISOString(),
    entries:[],
    theme:'dark'
};

function loadState(){
    const saved = localStorage.getItem(STORAGE_KEY);
    if(saved){
        const parsed = JSON.parse(saved);
        state = Object.assign(state, parsed);
    }
}

function persist(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatTime(value){
    const d = new Date(value);
    if(Number.isNaN(d.getTime())) return '--';
    return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
}

function formatDate(value){
    const d = new Date(value);
    if(Number.isNaN(d.getTime())) return '--';
    return d.toLocaleDateString([], {month:'short', day:'numeric'}) + ' • ' + formatTime(value);
}

function render(){
    countValue.textContent = state.count;
    goalLabel.textContent = state.goal;
    shiftTotal.textContent = state.total;
    lastEntry.textContent = state.entries.length ? formatTime(state.entries[state.entries.length - 1].time) : '--';
    avgEntry.textContent = state.entries.length ? Math.round(state.total / state.entries.length) : 0;
    totalEntries.textContent = state.entries.length;
    shiftStartLabel.textContent = formatDate(state.shiftStart);
    stationLabel.textContent = state.station;
    stationInput.value = state.station;
    goalInput.value = state.goal;
    lineSelect.value = state.line;
    const progress = Math.min(100, state.total / state.goal * 100 || 0);
    progressFill.style.width = progress + '%';
    document.body.classList.toggle('light', state.theme === 'light');
    historyList.innerHTML = '';
    state.entries.slice().reverse().forEach(entry => {
        const li = document.createElement('li');
        const left = document.createElement('div');
        left.innerHTML = `<strong>${entry.value} passengers</strong><span>${entry.station} • ${entry.line} Line</span>`;
        const right = document.createElement('div');
        right.innerHTML = `<span>${formatTime(entry.time)}</span>`;
        li.appendChild(left);
        li.appendChild(right);
        historyList.appendChild(li);
    });
    updateTrend();
}

function updateTrend(){
    const latest = state.entries.slice(-3).map(e => e.value);
    const avg = latest.length ? latest.reduce((a,b)=>a+b,0) / latest.length : 0;
    if(avg >= 20){
        trendIndicator.textContent = 'Surge incoming';
        trendIndicator.style.background = 'rgba(255,95,109,0.2)';
        trendIndicator.style.color = '#ff5f6d';
    } else if(avg >= 10){
        trendIndicator.textContent = 'Healthy flow';
        trendIndicator.style.background = 'rgba(39,197,128,0.2)';
        trendIndicator.style.color = '#27c580';
    } else {
        trendIndicator.textContent = 'Steady flow';
        trendIndicator.style.background = 'rgba(255,183,3,0.2)';
        trendIndicator.style.color = '#ffb703';
    }
}

function animateCount(){
    countValue.animate([{transform:'scale(1)'},{transform:'scale(1.08)'},{transform:'scale(1)'}],{duration:220});
}

function increment(){
    state.count += 1;
    animateCount();
    persist();
    render();
}

function decrement(){
    if(state.count === 0) return;
    state.count -= 1;
    animateCount();
    persist();
    render();
}

function quickAdd(){
    state.count += 5;
    animateCount();
    persist();
    render();
}

function resetCount(){
    state.count = 0;
    persist();
    render();
}

function saveEntry(){
    if(state.count === 0) return;
    const now = new Date().toISOString();
    state.entries.push({value:state.count, station:state.station, line:state.line, time:now});
    state.total += state.count;
    state.count = 0;
    persist();
    render();
}

function undo(){
    if(!state.entries.length) return;
    const entry = state.entries.pop();
    state.total = Math.max(0, state.total - entry.value);
    state.count = entry.value;
    persist();
    render();
}

function clearHistory(){
    state.entries = [];
    state.total = 0;
    persist();
    render();
}

function exportCSV(){
    if(!state.entries.length) return;
    const rows = [['Value','Station','Line','Time']];
    state.entries.forEach(entry => {
        rows.push([entry.value, entry.station, entry.line, entry.time]);
    });
    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.station.replace(/\s+/g,'_')}_log.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function setStation(value){
    state.station = value.trim() || 'Downtown Hub';
    persist();
    render();
}

function setGoal(value){
    const parsed = Number(value);
    if(!Number.isFinite(parsed) || parsed < 10) return;
    state.goal = parsed;
    persist();
    render();
}

function setLine(value){
    state.line = value;
    persist();
    render();
}

function toggleTheme(){
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    persist();
    render();
}

$('increment-btn').addEventListener('click', increment);
$('decrement-btn').addEventListener('click', decrement);
$('quick-add-btn').addEventListener('click', quickAdd);
$('save-btn').addEventListener('click', saveEntry);
$('reset-btn').addEventListener('click', resetCount);
$('undo-btn').addEventListener('click', undo);
$('clear-history').addEventListener('click', clearHistory);
$('export-btn').addEventListener('click', exportCSV);
stationInput.addEventListener('input', e => setStation(e.target.value));
goalInput.addEventListener('change', e => setGoal(e.target.value));
lineSelect.addEventListener('change', e => setLine(e.target.value));
themeToggle.addEventListener('click', toggleTheme);

document.addEventListener('keydown', e => {
    if(e.key === 'Enter'){ saveEntry(); }
    if(e.key === '+'){ increment(); }
    if(e.key === '-'){ decrement(); }
});

loadState();
render();
