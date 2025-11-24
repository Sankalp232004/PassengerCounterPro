const el = sel => document.getElementById(sel);
const teamAName = el('teamA-name');
const teamBName = el('teamB-name');
const teamAScore = el('teamA-score');
const teamBScore = el('teamB-score');
const historyList = el('history-list');
const quarterEl = el('quarter');
const timerEl = el('timer');
const possessionEl = el('possession');
const startStop = el('start-stop');
const resetClock = el('reset-clock');
const nextQuarter = el('next-quarter');
const undoBtn = el('undo');
const clearBtn = el('clear-game');
const exportBtn = el('export-btn');
const themeToggle = el('theme-toggle');

let state = {
    A:0,
    B:0,
    quarter:1,
    timer:600,
    running:false,
    possession:'A',
    history:[],
    stack:[]
};

function persist(){
    localStorage.setItem('bb_scorecard', JSON.stringify(state));
}

function load(){
    const raw = localStorage.getItem('bb_scorecard');
    if(!raw) return;
    const s = JSON.parse(raw);
    state = Object.assign(state, s);
}

function render(){
    teamAScore.textContent = state.A;
    teamBScore.textContent = state.B;
    quarterEl.textContent = state.quarter;
    timerEl.textContent = formatTime(state.timer);
    possessionEl.textContent = state.possession;
    historyList.innerHTML = '';
    for(const h of state.history.slice().reverse()){
        const li = document.createElement('li');
        li.textContent = `${h.time} • Q${h.q} • ${h.team} +${h.pts} — ${h.note || ''}`;
        historyList.appendChild(li);
    }
}

function formatTime(sec){
    const m = Math.floor(sec/60).toString().padStart(2,'0');
    const s = (sec%60).toString().padStart(2,'0');
    return `${m}:${s}`;
}

function addPoints(team, pts){
    const t = team === 'A' ? 'Home' : 'Away';
    state.stack.push(JSON.stringify(state));
    state[team] += pts;
    state.history.push({team:t,pts, q:state.quarter, time:formatTime(state.timer)});
    state.possession = team === 'A' ? 'B' : 'A';
    persist();
    render();
    pulse(team === 'A' ? teamAScore : teamBScore);
}

function pulse(node){
    node.classList.add('pulse');
    setTimeout(()=>node.classList.remove('pulse'),300);
}

function undo(){
    if(state.stack.length===0) return;
    const prev = JSON.parse(state.stack.pop());
    state = prev;
    persist();
    render();
}

function clearGame(){
    state = {A:0,B:0,quarter:1,timer:600,running:false,possession:'A',history:[],stack:[]};
    persist();
    render();
}

let timerInterval = null;

function tick(){
    if(state.timer>0){
        state.timer -=1;
        render();
    } else {
        clearInterval(timerInterval);
        state.running=false;
        persist();
    }
}

function startStopToggle(){
    state.running = !state.running;
    if(state.running){
        timerInterval = setInterval(tick,1000);
        startStop.textContent = 'Pause';
    } else {
        clearInterval(timerInterval);
        startStop.textContent = 'Start';
    }
    persist();
}

function resetClockToDefault(){
    state.timer = 600;
    state.running = false;
    clearInterval(timerInterval);
    startStop.textContent = 'Start';
    persist();
    render();
}

function nextQ(){
    state.quarter +=1;
    state.timer = 600;
    state.running = false;
    clearInterval(timerInterval);
    startStop.textContent = 'Start';
    persist();
    render();
}

function exportCSV(){
    const rows = [['Quarter','Time','Team','Points','Note']];
    for(const h of state.history){rows.push([h.q,h.time,h.team,h.pts,h.note||'']);}
    const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(teamAName.value||'TeamA')}_vs_${(teamBName.value||'TeamB')}_plays.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function toggleTheme(){
    const el = document.documentElement;
    if(el.style.getPropertyValue('--bg')===''){
        el.style.setProperty('--bg','#f7f7f7');
        el.style.setProperty('--card','#ffffff');
        el.style.setProperty('--muted','#6b7280');
        el.style.setProperty('--accent','#f97316');
        document.body.style.background = 'linear-gradient(180deg,#f8fafc,#e6eef6)';
        document.body.style.color = '#071226';
    } else {
        el.style.removeProperty('--bg');
        el.style.removeProperty('--card');
        el.style.removeProperty('--muted');
        el.style.removeProperty('--accent');
        document.body.style.background = '';
        document.body.style.color = '';
    }
}

document.addEventListener('click', e=>{
    const p = e.target.closest('.point');
    if(p){
        const team = p.getAttribute('data-team');
        const pts = Number(p.getAttribute('data-points'));
        addPoints(team, pts);
    }
});

startStop.addEventListener('click', startStopToggle);
resetClock.addEventListener('click', resetClockToDefault);
nextQuarter.addEventListener('click', nextQ);
undoBtn.addEventListener('click', undo);
clearBtn.addEventListener('click', ()=>{clearGame();});
exportBtn.addEventListener('click', exportCSV);
themeToggle.addEventListener('click', toggleTheme);

window.addEventListener('beforeunload', persist);

load();
render();

