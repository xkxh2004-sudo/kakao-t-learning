(() => {
'use strict';
const C=window.COURSE, $=s=>document.querySelector(s), KEY='kakao-t-learning-v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state={done:[],phone:{},ready:[],selfChecks:[],last:'welcome',big:false,result:null}, storageOK=true;
try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(x&&typeof x==='object'){state.done=Array.isArray(x.done)?x.done.filter(id=>C.pages.some(p=>p.id===id)):[];state.phone=x.phone&&typeof x.phone==='object'?x.phone:{};state.ready=Array.isArray(x.ready)?x.ready:[];state.selfChecks=Array.isArray(x.selfChecks)?x.selfChecks:[];state.last=C.pages.some(p=>p.id===x.last)?x.last:'welcome';state.big=x.big===true;state.result=x.result&&Array.isArray(x.result.answers)&&x.result.answers.length===8&&x.result.answers.every((a,i)=>Number.isInteger(a)&&a>=0&&a<C.quiz[i].choices.length)?x.result:null;}}catch(e){storageOK=false;}
let quizAnswers=Array(8).fill(null),quizIndex=0, mapX=110,mapY=-70,drag=null;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){storageOK=false;} updateProgress();}
function updateProgress(){const percent=Math.round(state.done.length/C.pages.length*100);$('#progress').value=percent;$('#progressText').textContent=`설명 ${state.done.length} / ${C.pages.length}개 확인 · ${percent}%`;document.body.classList.toggle('big',state.big);$('#font').setAttribute('aria-pressed',String(state.big));$('#font').textContent=state.big?'가 기본 글씨':'가 글씨 크게';}
function menu(active){$('#menu').innerHTML=`<a href="#home" class="${active==='home'?'active':''}"><span class="nav-num">⌂</span>학습 첫 화면</a>`+C.groups.map((g,i)=>{let ps=C.pages.filter(p=>p.group===g.id),done=ps.every(p=>state.done.includes(p.id));return `<a href="#${ps[0].id}" class="${active===g.id?'active ':''}${done?'done':''}"><span class="nav-num">${done?'✓':i+1}</span><span>${g.title}<br><small>약 ${g.time}분</small></span></a>`;}).join('')+`<a href="#quiz" class="${active==='quiz'?'active':''}"><span class="nav-num">7</span>스스로 확인하기 · 10분</a><a href="#results" class="${active==='results'?'active':''}"><span class="nav-num">✓</span>나의 학습 결과</a><a href="#guide" class="${active==='guide'?'active':''}"><span class="nav-num">↓</span>따라하기 안내서</a>`;updateProgress();}
function renderCapture(page) {
  const marks = C.captureMarks[page.id];
  const boxes = marks.map(([left, top, width, height], index) => `
    <span class="capture-mark" style="left:${left}%;top:${top}%;width:${width}%;height:${height}%" aria-hidden="true">
      <span>${index + 1}</span>
    </span>`).join('');
  const directions = marks.map(([, , , , label]) => `<li>${esc(label)}</li>`).join('');
  return `<div class="capture-body">
    <div class="annotated-capture"><img src="assets/${page.image}.webp" alt="${esc(page.alt)}">${boxes}</div>
    <ol class="capture-steps" aria-label="화면에 표시한 위치">${directions}</ol>
  </div>`;
}

function figure(page) {
  if (!page.image) return '';
  return `<figure class="screen">
    ${renderCapture(page)}
    <button data-enlarge="${page.id}">＋ 화면 크게 보기</button>
    <figcaption>번호와 테두리로 누르거나 확인할 곳을 표시했어요.<br>내 스마트폰 화면과 다를 수 있습니다.</figcaption>
  </figure>`;
}

function renderSelfCheck(page, isLastInGroup) {
  const items = C.selfChecks[page.group];
  if (!items) return '';

  const checks = Object.entries(items).map(([id, label]) => {
    const key = `${page.group}:${id}`;
    const checked = state.selfChecks.includes(key) ? 'checked' : '';
    return `<label class="checkline"><input type="checkbox" data-self-check="${key}" ${checked}><span>${esc(label)}</span></label>`;
  }).join('');

  return `<details id="lessonSelfCheck" class="lesson-self-check" ${isLastInGroup ? 'open' : ''}>
    <summary>이 구간에서 배운 것 스스로 확인하기</summary>
    <p>혼자 할 수 있거나 설명할 수 있는 항목에 체크하세요. 아직 어려운 항목은 설명을 다시 보세요.</p>
    <div class="checklist">${checks}</div>
    <p class="self-check-count" role="status"></p>
  </details>`;
}

function bindSelfCheck() {
  const panel = $('#lessonSelfCheck');
  if (!panel) return;

  const checks = [...panel.querySelectorAll('input[data-self-check]')];
  const count = panel.querySelector('.self-check-count');
  function updateCount() {
    const checked = checks.filter(input => input.checked).length;
    count.textContent = `${checked} / ${checks.length}개 확인했습니다.`;
  }

  updateCount();
  for (const input of checks) {
    input.addEventListener('change', () => {
      const key = input.dataset.selfCheck;
      state.selfChecks = state.selfChecks.filter(saved => saved !== key);
      if (input.checked) state.selfChecks.push(key);
      save();
      updateCount();
    });
  }
}
function feedback(msg,ok=true){const el=$('#feedback');if(el){el.className=`feedback ${ok?'ok':'retry'}`;el.textContent=msg;}}
function options(items,action='choice'){return `<div class="options">${items.map((t,i)=>`<button class="option" data-${action}="${i}">${esc(t)}</button>`).join('')}</div>`;}
function home() {
  menu('home');
  const scenes = [
    '복지관 갈 시간이네. 오늘은 택시 타고 가야겠다.',
    '한참 기다렸는데… 빈 택시가 안 오네.',
    '카카오T로 택시를 부를 수 있다던데, 한 번도 안 써 봤네.',
    '카카오T를 열면 어디부터 눌러야 하지?'
  ];
  const steps = [
    '카카오T 찾기', '카카오T 열기', '복지관 검색하기', '출발지 맞추기',
    '일반호출 고르기', '등록 카드 적용하기', '호출하기 알아보기', '비밀번호 화면 알아보기'
  ];
  const hasProgress = state.done.length > 0;
  const startPage = hasProgress ? state.last : 'welcome';
  const startLabel = hasProgress ? '이어서 배우기' : '배움 시작하기';

  $('#main').innerHTML = `
    <section class="hero home-hero" aria-labelledby="homeTitle">
      <span class="eyebrow">어르신을 위한 생활 속 스마트폰 배움</span>
      <h1 id="homeTitle">복지관 가는 길, 이제 내가 불러요.</h1>
      <p class="lead">카카오T로 택시 부르기. 한 화면씩 차근차근 함께 배워요.</p>
      <section class="opening-story" aria-labelledby="openingStoryTitle">
        <h2 id="openingStoryTitle">집 앞에서 택시가 안 잡힌다면?</h2>
        <ol class="story-panels" role="list">
          ${scenes.map((scene, index) => `
            <li class="story-panel">
              <div class="story-picture story-picture-${index + 1}" aria-hidden="true">
                <span class="story-number">${index + 1}</span>
              </div>
              <p class="story-dialogue"><q>${esc(scene)}</q></p>
            </li>`).join('')}
        </ol>
      </section>
      <div class="actions">
        <a class="button primary" href="#${startPage}">${startLabel} →</a>
        <a class="button" href="#guide">안내서 먼저 보기</a>
      </div>
      <div class="meta">
        <span class="pill">한국어 · 약 60분</span>
        <span class="pill">컴퓨터 + 내 스마트폰</span>
        <span class="pill">로그인 없이 무료 학습</span>
      </div>
    </section>
    <div class="cards">
      <article class="card"><span class="number">01 · 컴퓨터로 보기</span><h3>크게 보고, 천천히 읽어요</h3><p>짧은 설명과 실제 화면으로 한 단계씩 알아봅니다.</p></article>
      <article class="card"><span class="number">02 · 스마트폰으로 해보기</span><h3>내 손으로 익혀요</h3><p>호출 준비까지 직접 따라 하고, 어려우면 다시 봅니다.</p></article>
      <article class="card"><span class="number">03 · 스스로 확인하기</span><h3>내가 배운 것을 알아봐요</h3><p>문제를 풀고, 다시 배울 단계를 확인합니다.</p></article>
    </div>
    <section class="panel">
      <h2>오늘 배우는 8단계</h2>
      <div class="mini-steps">${steps.map((step, index) => `<div><strong>${index + 1}.</strong> ${step}</div>`).join('')}</div>
    </section>
    ${!storageOK ? '<div class="notice warning">이 브라우저에서는 기록 저장이 어려울 수 있습니다. 결과를 내려받아 보관해 주세요.</div>' : ''}`;
}

function lesson(page) {
  menu(page.group);
  state.last = page.id;
  save();

  const index = C.pages.indexOf(page);
  const group = C.groups.find(group => group.id === page.group);
  const previous = C.pages[index - 1];
  const next = C.pages[index + 1];
  const isLastInGroup = next?.group !== page.group;
  const phonePractice = page.phone ? `
    <section class="completion">
      <h2>이제 내 스마트폰으로 해보세요</h2>
      <label><input type="checkbox" id="phoneCheck" ${state.phone[page.id] ? 'checked' : ''}><span>${esc(page.phone)}</span></label>
      <p class="muted">이 체크는 본인의 연습 기록입니다. 컴퓨터 문제의 정답과 별도로 저장됩니다.</p>
    </section>` : '';

  $('#main').innerHTML = `
    <div class="lesson-head">
      <span>${esc(group.title)} · 약 ${group.time}분</span>
      <span>설명 ${index + 1} / ${C.pages.length}${page.step ? ` · 전체 8단계 중 ${page.step}단계` : ''}</span>
    </div>
    <h1>${esc(page.title)}</h1>
    <p class="lead">${esc(page.intro)}</p>
    <div class="${page.image ? 'lesson-layout' : ''}">
      <section><ol class="instructions">${page.lines.map(line => `<li>${esc(line)}</li>`).join('')}</ol></section>
      ${figure(page)}
    </div>
    <section class="practice" aria-labelledby="practiceTitle">
      <div class="label">${page.group === 'call' ? '화면으로 알아보기' : '컴퓨터에서 해보는 연습'}</div>
      <div id="activity"></div>
      <div id="feedback" class="feedback" role="status" aria-live="polite"></div>
    </section>
    ${phonePractice}
    ${renderSelfCheck(page, isLastInGroup)}
    <div class="completion">
      <label><input type="checkbox" id="doneCheck" ${state.done.includes(page.id) ? 'checked' : ''}><span>이 설명과 연습을 확인했습니다.</span></label>
    </div>
    <div class="lesson-nav">
      <a class="button" href="#${previous?.id ?? 'home'}">← 이전</a>
      <a class="button primary" href="#${next?.id ?? 'quiz'}">${next ? '다음으로' : '스스로 확인하기'} →</a>
    </div>`;

  renderActivity(page);
  bindSelfCheck();
  $('#doneCheck').onchange = event => {
    state.done = state.done.filter(id => id !== page.id);
    if (event.target.checked) state.done.push(page.id);
    save();
    menu(page.group);
  };
  const phoneCheck = $('#phoneCheck');
  if (phoneCheck) phoneCheck.onchange = event => {
    state.phone[page.id] = event.target.checked;
    save();
  };
}
function renderActivity(p){const a=$('#activity');const question=(prompt,choices,correct,why)=>{a.innerHTML=`<h2 id="practiceTitle">${prompt}</h2>${options(choices)}`;a.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{a.querySelectorAll('button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');let ok=+b.dataset.choice===correct;feedback(ok?'맞습니다. '+why:'다시 생각해 볼까요? '+why,ok);});};
switch(p.kind){
case 'orientation': a.innerHTML='<h2 id="practiceTitle">먼저 화면 이동을 연습해요</h2><p>아래 버튼을 눌러 연습 화면을 열고, 다시 돌아와 보세요.</p><button id="navDemo" class="primary">연습 화면 열기 →</button>';$('#navDemo').onclick=()=>{a.innerHTML='<h2 id="practiceTitle">연습 화면에 잘 오셨어요</h2><p>이전 버튼으로 돌아올 수 있습니다. 왼쪽 목차에서도 배운 내용을 다시 열 수 있어요.</p><button id="navBack">← 이전 연습 화면으로</button>';$('#navBack').onclick=()=>{renderActivity(p);feedback('화면 이동 연습을 마쳤습니다. 아래 확인 체크를 하고 다음으로 가세요.');};};break;
case 'readiness': {const labels=['인터넷이 연결된 컴퓨터와 스마트폰이 있습니다.','스마트폰에서 터치와 밀기를 할 수 있습니다.','스마트폰에 카카오T가 설치되어 있고 로그인되어 있습니다.','카카오T에 사용할 신용/체크카드가 이미 등록되어 있습니다.','이 모듈의 이전·다음·목차 이동 방법을 연습했습니다.'];a.innerHTML='<h2 id="practiceTitle">준비된 항목에 체크해 주세요</h2><div class="checklist">'+labels.map((s,i)=>`<label class="checkline"><input type="checkbox" data-ready="${i}" ${state.ready.includes(i)?'checked':''}><span>${s}</span></label>`).join('')+'</div><p id="readyStatus" class="readiness-status" role="status"></p>';let status=()=>{$('#readyStatus').textContent=state.ready.length===5?'준비가 되었습니다. 다음 단계로 가세요.':`${state.ready.length} / 5개 준비됨. 아직 체크하지 못한 항목은 먼저 준비해 주세요.`;};status();a.querySelectorAll('[data-ready]').forEach(el=>el.onchange=()=>{state.ready=[...a.querySelectorAll('input:checked')].map(x=>+x.dataset.ready);save();status();});break;}
case 'icons': a.innerHTML='<h2 id="practiceTitle">카카오T 아이콘을 골라주세요</h2><div class="icon-options">'+['icon-tmap','icon-subway','icon-t','icon-map'].map((x,i)=>`<button class="icon-option" data-icon="${i}"><img src="assets/${x}.png" alt="${['T맵','카카오지하철','카카오 T','카카오맵'][i]}"><span>${['T맵','카카오지하철','카카오 T','카카오맵'][i]}</span></button>`).join('')+'</div>';a.querySelectorAll('[data-icon]').forEach(b=>b.onclick=()=>feedback(+b.dataset.icon===2?'맞습니다. 앱 이름도 카카오 T인지 확인해 주세요.':'이 앱은 카카오T와 달라요. 짙은 바탕의 노란 T와 앱 이름을 함께 확인해 주세요.',+b.dataset.icon===2));break;
case 'screenTypes':question('설치된 앱 전체를 모아 보는 곳은 어디인가요?',['홈 화면','앱스 화면 또는 앱 보관함','카카오T 결제 화면'],1,'홈 화면은 자주 쓰는 앱을 놓는 기본 화면이고, 앱스 화면·앱 보관함에서는 설치된 앱을 모아 볼 수 있습니다.');a.insertAdjacentHTML('beforeend','<details><summary>말로도 설명해 볼까요?</summary><p>“홈 화면은 무엇인가요?”, “앱스 화면은 무엇인가요?”를 내 말로 설명해 보세요. 뜻이 같으면 됩니다.</p><p>내 스마트폰에서 앱 전체 목록을 여는 버튼이나 동작도 찾아보세요.</p></details>');break;
case 'appSearch':a.innerHTML='<h2 id="practiceTitle">앱 목록에서 검색해 보세요</h2><button id="openApps">설치된 앱 화면 열기</button><div id="appSearchBox"></div>';$('#openApps').onclick=()=>{$('#appSearchBox').innerHTML='<form id="appSearchForm"><label class="field">앱 이름<input id="appTerm" autocomplete="off" placeholder="앱 이름 입력" aria-label="검색할 앱 이름"></label><button class="primary">검색</button></form><div id="appFound"></div>';$('#appSearchForm').onsubmit=e=>{e.preventDefault();let t=$('#appTerm').value.replace(/\s/g,'').toLowerCase();if(t==='카카오t'||t==='kakaot'){$('#appFound').innerHTML='<div class="actions"><button id="foundApp"><img src="assets/icon-t.png" width="44" height="44" alt="">카카오 T 열기</button></div>';$('#foundApp').onclick=()=>feedback('카카오T를 찾아 열었습니다. 이번에는 내 스마트폰에서도 같은 방법으로 검색해 보세요.');feedback('카카오T를 찾았습니다. 검색 결과의 앱을 눌러 열어보세요.');}else{$('#appFound').innerHTML='';feedback('검색창에 카카오 T를 입력해 보세요. 글자를 확인한 뒤 다시 검색할 수 있습니다.',false);}};};break;
case 'openApp':a.innerHTML='<h2 id="practiceTitle">찾은 앱을 한 번 눌러보세요</h2><button id="openPractice"><img width="52" height="52" src="assets/icon-t.png" alt="카카오T 아이콘">카카오 T</button>';$('#openPractice').onclick=()=>{a.innerHTML='<h2 id="practiceTitle">연습 앱을 열었습니다</h2><div class="sample"><strong>카카오T 처음 화면 · 연습용</strong><p>어디로 갈까요?</p></div><button id="openAgain">다시 열기 연습</button>';$('#openAgain').onclick=()=>{renderActivity(p);feedback('');};feedback('앱을 여는 동작을 확인했습니다. 스마트폰에서 실제 카카오T를 열어보세요.');};break;
case 'destinationSearch':a.innerHTML='<h2 id="practiceTitle">도착지를 검색해 보세요</h2><button id="whereTo">어디로 갈까요? · 검색창 누르기</button><div id="destinationFormBox"></div>';$('#whereTo').onclick=()=>{$('#destinationFormBox').innerHTML='<form id="destForm"><label class="field">도착지 이름<input id="destTerm" autocomplete="off" placeholder="복지관 이름을 입력하세요"></label><button class="primary">도착지 검색</button></form>';$('#destForm').onsubmit=e=>{e.preventDefault();let ok=$('#destTerm').value.replace(/\s/g,'')===C.destination;feedback(ok?'동대문노인종합복지관을 검색했습니다. 다음 화면에서는 이름과 주소를 확인합니다.':'이름을 다시 확인해 주세요. 동대문노인종합복지관을 입력하고 검색해 보세요.',ok);};};break;
case 'destinationSelect':question('이름과 주소가 모두 맞는 복지관을 골라주세요.',['동대문노인종합복지관 개방화장실 · 제기로37길 28-2','동대문노인종합복지관 · 서울 동대문구 제기로33길 25','동대문노인종합복지관 고령자취업알선사업 · 제기로33길 25'],1,'오늘의 도착지는 복지관 자체입니다. 이름과 제기로33길 25 주소를 함께 확인합니다.');break;
case 'pickupBranch':{let branch=0;question('정문에서 타려고 하고, 핀도 정문에 있습니다. 어떻게 할까요?',['지도를 움직이지 않고 출발지로 설정합니다.','무조건 지도를 움직입니다.'],0,'핀이 맞으면 그대로 확정합니다.');a.insertAdjacentHTML('beforeend','<button id="otherBranch" style="margin-top:20px">핀이 틀린 경우도 연습하기 →</button>');$('#otherBranch').onclick=()=>{question('이번에는 정문에서 타려는데 핀이 후문에 있습니다. 어떻게 하나요?',['그대로 출발지로 설정합니다.','정문이 가운데 핀 아래에 오도록 지도를 움직입니다.'],1,'핀이 틀리면 내가 탈 위치를 찾아 맞춘 뒤 출발지로 설정합니다.');};break;}
case 'map': a.innerHTML='<h2 id="practiceTitle">정문을 가운데 핀 끝에 맞춰주세요</h2><p class="muted">예시 지도 · 실제 위치를 사용하지 않습니다. 주황색 핀은 움직이지 않습니다.</p><div class="map-stage" id="mapStage" role="group" aria-label="출발지 연습 지도. 마우스로 지도를 움직이거나 아래 방향 버튼을 사용하세요."><div class="map-world" id="mapWorld"><div class="building">연습 건물</div><div class="target-point"></div><span class="target-label">정문 · 탈 곳</span></div><div class="map-center"></div><div class="pin"></div></div><p class="muted">아래 버튼은 지도를 해당 방향으로 움직입니다.</p><div class="map-controls"><button data-move="left" aria-label="지도를 왼쪽으로">← 왼쪽</button><button data-move="right" aria-label="지도를 오른쪽으로">오른쪽 →</button><button data-move="up" aria-label="지도를 위로">↑ 위</button><button data-move="down" aria-label="지도를 아래로">↓ 아래</button></div><div class="actions"><button class="primary" id="confirmPickup">출발지로 설정</button><button id="resetMap">다시 연습</button></div>';mapX=110;mapY=-70;let paint=()=>{$('#mapWorld').style.transform=`translate(${mapX}px,${mapY}px)`;};paint();const stage=$('#mapStage');stage.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY,mx:mapX,my:mapY};stage.setPointerCapture(e.pointerId);};stage.onpointermove=e=>{if(drag){mapX=Math.max(-230,Math.min(230,drag.mx+e.clientX-drag.x));mapY=Math.max(-150,Math.min(150,drag.my+e.clientY-drag.y));paint();}};stage.onpointerup=stage.onpointercancel=()=>{drag=null;};a.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>{const v={left:[-20,0],right:[20,0],up:[0,-20],down:[0,20]}[b.dataset.move];mapX=Math.max(-230,Math.min(230,mapX+v[0]));mapY=Math.max(-150,Math.min(150,mapY+v[1]));paint();});$('#confirmPickup').onclick=()=>{let ok=Math.hypot(mapX+2,mapY+2)<27;feedback(ok?'출발지를 정문으로 설정했습니다. 핀이 맞는지 확인한 뒤 확정하는 순서를 익혔습니다.':'아직 정문이 핀 끝과 떨어져 있어요. 초록색 점이 가운데 원에 오도록 지도를 움직인 뒤 다시 설정해 주세요.',ok);};$('#resetMap').onclick=()=>{mapX=110;mapY=-70;paint();feedback('다른 방향으로도 지도를 움직여 보세요.');};break;
case 'taxi':question('주변의 일반 택시를 요청하려면?',['대리운전','택시 (일반호출)','벤티'],1,'택시 일반호출을 고릅니다. 실제 요금과 이용 조건은 앱에서 확인하세요.');a.insertAdjacentHTML('beforeend','<details><summary>내 말로 설명하기</summary><p>일반호출은 무슨 뜻인가요? “주변의 일반 택시를 부르는 선택”이라는 뜻이 들어가면 됩니다.</p></details>');break;
case 'paymentOpen':question('등록된 카드를 확인하려면 어느 곳을 먼저 누르나요?',['호출하기','결제수단 선택 또는 표시된 카드','도착지 이름'],1,'먼저 결제수단을 열어 원하는 카드가 있는지 확인합니다.');break;
case 'payment':{let chosen=false;let paint=()=>{a.innerHTML='<h2 id="practiceTitle">연습카드를 선택하고 적용해 주세요</h2><div class="sample"><strong>결제수단 · 연습용</strong><p>가상의 카드입니다. 실제 번호는 입력하지 않습니다.</p><div class="options"><button id="chooseCard" class="option '+(chosen?'selected':'')+'" aria-pressed="'+chosen+'">'+(chosen?'●':'○')+' 신용/체크카드 · 연습카드</button><button id="directPay" class="option">○ 직접결제</button></div><button class="primary" id="applyCard" style="margin-top:20px">적용</button></div>';$('#chooseCard').onclick=()=>{chosen=true;paint();feedback('연습카드를 골랐습니다. 적용을 눌러주세요.');};$('#directPay').onclick=()=>{chosen=false;paint();feedback('이번에는 이미 등록된 카드를 사용합니다. 연습카드를 골라주세요.',false);};$('#applyCard').onclick=()=>{if(!chosen){feedback('먼저 신용/체크카드의 연습카드를 선택해 주세요.',false);return;}a.innerHTML='<h2 id="practiceTitle">호출 준비 화면 · 연습용</h2><div class="sample"><p>도착지: 동대문노인종합복지관</p><p>택시: 일반호출</p><p><strong>결제수단: 연습카드 · 적용됨 ✓</strong></p></div><button id="paymentRetry" style="margin-top:16px">카드 선택 다시 연습</button>';$('#paymentRetry').onclick=()=>{chosen=false;paint();feedback('');};feedback('선택한 카드가 호출 준비 화면에 표시되었습니다. 선택 → 적용 → 표시 확인까지 마쳤어요.');};};paint();break;}
case 'beforeCall':a.innerHTML='<h2 id="practiceTitle">호출 전에 확인할 네 가지를 골라 체크해 주세요</h2><div class="checklist">'+['도착지 이름과 주소','택시를 탈 정확한 출발지','택시 일반호출','사용할 등록 카드'].map((t,i)=>`<label class="checkline"><input type="checkbox" data-before="${i}"><span>${t}</span></label>`).join('')+'</div>';a.querySelectorAll('input').forEach(b=>b.onchange=()=>{let n=a.querySelectorAll('input:checked').length;feedback(n===4?'네 가지를 모두 확인했습니다. 실제 이동할 때에도 호출 전에 확인해 주세요.':`${n} / 4가지 확인했습니다. 아직 남은 항목도 확인해 주세요.`,n===4);});break;
case 'callAction':question('실제 이동 준비가 끝났을 때 누를 버튼은?',['호출하기','카드 추가','도착지 삭제'],0,'호출하기를 누르면 실제 택시 요청으로 이어질 수 있습니다. 지금은 화면으로만 확인합니다.');break;
case 'password':question('비밀번호 화면이 나오면 어떻게 하나요?',['이 학습 사이트에 내 비밀번호를 입력합니다.','실제 이용 시 내 스마트폰의 카카오T에서 직접 입력합니다.','옆 사람에게 비밀번호를 알려줍니다.'],1,'이 사이트에는 실제 결제 비밀번호를 입력하지 않습니다. 앱 버전과 설정에 따라 추가 인증 화면은 다를 수 있습니다.');break;
case 'review':a.innerHTML='<h2 id="practiceTitle">평가를 시작할 준비가 되었나요?</h2><p>8개 화면 문제에 답한 뒤 한 번에 제출합니다. 시간 제한은 없습니다.</p><div class="actions"><a class="button primary" href="#quiz">스스로 확인하기 →</a><a class="button" href="assets/quick-guide.pdf" target="_blank" rel="noopener">따라하기 안내서 열기 ↗</a></div>';break;
}}
function quiz(){menu('quiz');$('#menu').innerHTML='<a href="#review">← 평가를 나가 설명 다시 보기</a><p class="muted">평가 중에는 설명과 정답을 숨깁니다. 따라하기 안내서는 사용할 수 있어요.</p>';const q=C.quiz[quizIndex];$('#main').innerHTML=`<span class="eyebrow">내가 이해한 순서 확인하기</span><h1>스스로 확인하기</h1><p>컴퓨터 화면 문제입니다. 실제 스마트폰 수행 결과와 구분합니다.</p><div class="quiz-nav" aria-label="평가 문항 이동">${C.quiz.map((_,i)=>`<button data-qnav="${i}" aria-label="${i+1}번 문제${quizAnswers[i]!==null?', 답변함':''}" class="${i===quizIndex?'current ':''}${quizAnswers[i]!==null?'answered':''}">${i+1}${quizAnswers[i]!==null?' ✓':''}</button>`).join('')}</div><section class="panel"><span class="eyebrow">문제 ${quizIndex+1} / 8</span><h2>${esc(q.title)}</h2><p>${esc(q.prompt)}</p>${q.image?`<img class="quiz-image" src="assets/${q.image}.webp" alt="${esc(q.title)}에 관한 교재 화면 예시">`:''}<div class="${q.icons?'icon-options':'options'}">${q.choices.map((c,i)=>`<button data-answer="${i}" class="${q.icons?'icon-option':'option'} ${quizAnswers[quizIndex]===i?'selected':''}" aria-pressed="${quizAnswers[quizIndex]===i}">${q.icons?`<img src="assets/${q.icons[i]}.png" alt="">`:''}<span>${esc(c)}</span></button>`).join('')}</div><p id="answerStatus" class="muted" role="status">${quizAnswers[quizIndex]===null?'아직 선택하지 않았습니다.':'답변을 선택했습니다. 제출 전까지 바꿀 수 있습니다.'}</p></section><div class="lesson-nav"><button id="qprev" ${quizIndex===0?'disabled':''}>← 이전 문제</button><button id="qnext" ${quizIndex===7?'disabled':''}>다음 문제 →</button></div><section class="notice"><p id="quizCount">${quizAnswers.filter(a=>a!==null).length} / 8개 답변함 · 해설은 제출 후에 나옵니다.</p><button id="submitQuiz" class="primary">8개 답변 제출하기</button><p id="submitStatus" role="alert"></p></section>`;document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{quizAnswers[quizIndex]=+b.dataset.answer;document.querySelectorAll('[data-answer]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b));});$('#answerStatus').textContent='답변을 선택했습니다. 제출 전까지 바꿀 수 있습니다.';$('#quizCount').textContent=`${quizAnswers.filter(a=>a!==null).length} / 8개 답변함 · 해설은 제출 후에 나옵니다.`;const n=$(`[data-qnav="${quizIndex}"]`);n.classList.add('answered');n.textContent=`${quizIndex+1} ✓`;});document.querySelectorAll('[data-qnav]').forEach(b=>b.onclick=()=>{quizIndex=+b.dataset.qnav;quiz();focusMain();});$('#qprev').onclick=()=>{if(quizIndex>0){quizIndex--;quiz();focusMain();}};$('#qnext').onclick=()=>{if(quizIndex<7){quizIndex++;quiz();focusMain();}};$('#submitQuiz').onclick=()=>{if(quizAnswers.includes(null)){$('#submitStatus').textContent='아직 답하지 않은 문제가 있습니다. 위의 문제 번호를 눌러 모두 답해 주세요.';return;}state.result={answers:[...quizAnswers],date:new Date().toISOString()};save();location.hash='results';};}
function resultSummary(){if(!state.result)return null;const answers=state.result.answers;const correct=C.quiz.map((q,i)=>answers[i]===q.answer);return{correct,score:correct.filter(Boolean).length};}
function results(){menu('results');const r=resultSummary();$('#main').innerHTML=`<span class="eyebrow">나의 학습 돌아보기</span><h1>나의 학습 결과</h1>${r?`<section class="panel"><p>화면으로 알아본 순서</p><div class="stat">${r.score} / 8단계</div><p>${r.score===8?'8단계의 화면 문제를 모두 맞혔습니다.':'아래에서 다시 배울 단계를 확인해 주세요.'}</p><p class="muted">최근 제출: ${esc(new Date(state.result.date).toLocaleString('ko-KR'))}<br>이 결과는 화면 문제의 이해도를 나타냅니다. 실제 스마트폰 수행이나 실제 호출 성공을 증명하지 않습니다.</p></section><ul class="result-list">${C.quiz.map((q,i)=>`<li><strong>${r.correct[i]?'✓ 확인됨':'↻ 다시 배우기'} · ${esc(q.title)}</strong><p>내 답: ${esc(q.choices[state.result.answers[i]])}<br>정답: ${esc(q.choices[q.answer])}</p><p>${esc(q.why)}</p><a href="#${q.page}">이 단계 다시 배우기 →</a></li>`).join('')}</ul><div class="actions"><button id="retryQuiz" class="primary">새로 평가해 보기</button><button id="downloadResults">결과 내려받기</button><button id="printResults">결과 인쇄하기</button></div>`:'<section class="panel"><p>아직 제출한 자기평가가 없습니다.</p><a class="button primary" href="#quiz">스스로 확인하기 →</a></section>'}<section class="panel" style="margin-top:28px"><h2>내 스마트폰으로 직접 해본 준비 과정</h2><p class="muted">아래 항목은 본인이 체크한 기록입니다. 다른 사람이 관찰한 수행 평가와는 다릅니다.</p><div class="checklist">${C.pages.filter(p=>p.phone).map(p=>`<label class="checkline"><input type="checkbox" data-result-phone="${p.id}" ${state.phone[p.id]?'checked':''}><span>${esc(p.phone)}</span></label>`).join('')}</div><div class="notice warning">호출하기와 결제 비밀번호는 화면으로만 배웠습니다. 실제 이동이 필요한 날 본인의 카카오T에서 수행하고, 내 힘으로 할 수 있었는지 별도로 확인해 보세요.</div></section><section class="download-box"><h2>다음 외출에도 함께 가져가세요</h2><p>따라하기 안내서를 스마트폰에 저장하거나 인쇄해 필요할 때 볼 수 있습니다.</p><a class="button" href="assets/quick-guide.pdf" download>따라하기 안내서 내려받기 ↓</a></section>`;document.querySelectorAll('[data-result-phone]').forEach(b=>b.onchange=()=>{state.phone[b.dataset.resultPhone]=b.checked;save();});if(r){$('#retryQuiz').onclick=()=>{quizAnswers=Array(8).fill(null);quizIndex=0;location.hash='quiz';};$('#downloadResults').onclick=downloadResults;$('#printResults').onclick=()=>window.print();}}
function downloadResults(){const r=resultSummary();if(!r)return;const text=['내 손안의 택시 · 나의 학습 결과',new Date(state.result.date).toLocaleString('ko-KR'),`화면 자기평가: ${r.score} / 8단계`,'이 결과는 화면 문제의 이해도이며 실제 스마트폰 수행을 증명하지 않습니다.','',...C.quiz.map((q,i)=>`${q.title}: ${r.correct[i]?'확인됨':'다시 배우기'}\n내 답: ${q.choices[state.result.answers[i]]}\n정답: ${q.choices[q.answer]}\n${q.why}`),'','내 스마트폰 연습 (본인 체크)',...C.pages.filter(p=>p.phone).map(p=>`${state.phone[p.id]?'[완료]':'[아직]'} ${p.phone}`),'','호출하기·비밀번호는 화면으로만 학습함. 실제 호출 성공 여부는 별도 확인.'].join('\r\n');const url=URL.createObjectURL(new Blob(['\ufeff'+text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='카카오T_나의학습결과.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function guide(){menu('guide');$('#main').innerHTML='<span class="eyebrow">필요할 때 다시 보는 8단계</span><h1>따라하기 안내서</h1><p class="lead">스마트폰에 저장하거나 종이에 인쇄해서 보세요.</p><div class="actions"><a class="button primary" href="assets/quick-guide.pdf" download>PDF 안내서 내려받기 ↓</a><a class="button" href="assets/quick-guide.pdf" target="_blank" rel="noopener">PDF 크게 열기 ↗</a><a class="button" href="guide.html" target="_blank" rel="noopener">글자로 된 안내서 ↗</a></div><div class="notice">파일이 바로 열리면, 열린 화면의 다운로드 또는 저장 버튼으로 보관할 수 있습니다.</div><div class="mini-steps">'+['카카오T 이름과 아이콘을 찾습니다. 없으면 설치된 앱 목록에서 검색합니다.','카카오T 아이콘을 한 번 눌러 엽니다.','동대문노인종합복지관을 검색합니다. 제기로33길 25 주소를 확인합니다.','내가 택시를 탈 곳에 핀이 있는지 확인하고 출발지로 설정합니다. 다르면 지도를 움직입니다.','택시 일반호출을 고릅니다.','결제수단에서 등록 카드를 고르고 적용합니다. 돌아온 화면의 카드를 확인합니다.','실제 이동할 때만 네 가지 정보를 확인하고 호출하기를 누릅니다.','비밀번호 화면이 나오면 본인의 스마트폰 카카오T에서 직접 입력합니다.'].map((s,i)=>`<div><h3>${i+1}단계</h3><p>${s}</p></div>`).join('')+'</div>';}
function about(){menu('');$('#main').innerHTML='<h1>자료와 이용 안내</h1><section class="panel"><h2>이 학습에 관하여</h2><p>설계·자료: 김영제. 딕앤캐리 모형을 바탕으로 작성한 DD3의 목표·연습·자기평가 계획을 온라인 학습으로 구현했습니다.</p><p>학습 목표: 동대문노인종합복지관까지 현재 위치에서 일반 택시를 부르는 순서를 익히고, 필요할 때 따라하기 안내서를 사용합니다.</p><p>카카오T 화면은 제공된 「3차보고서 최종」 교재에서 발췌했습니다. 카드 세부 정보는 가렸습니다. 화면은 당시의 예시이며 실제 앱의 버튼·화면 순서·요금·인증 방식과 다를 수 있습니다.</p><p>목적지 주소는 <a href="https://www.happysenior.or.kr/bbs/board.php?bo_table=0108" target="_blank" rel="noopener">복지관 공식 오시는 길</a> 및 <a href="https://www.ddm.go.kr/www/contents.do?key=693" target="_blank" rel="noopener">동대문구 시설 안내</a>로 확인했습니다.</p></section><section class="panel" style="margin-top:20px"><h2>학습 기록</h2><p>이 사이트에는 로그인, 교사 대시보드, 서버로 보내는 학습 결과, 광고·방문 분석 기능이 없습니다. 진도·스마트폰 연습·구간별 자기 점검·최근 평가 결과·글씨 크기는 이 브라우저에 저장됩니다.</p><p>다른 기기나 브라우저와 자동으로 공유되지 않습니다. 브라우저 기록 삭제나 시크릿 모드 사용 시 저장한 학습 기록이 사라질 수 있습니다.</p><p>카드 번호·주민등록번호·실제 결제 비밀번호를 수집하지 않습니다. 이 모듈은 카카오T와 연결되어 있지 않아 실제 호출이나 결제가 발생하지 않습니다.</p><p>이용이 어려우면 글씨 크게 또는 화면 크게 보기를 이용하고, 배운 단계로 돌아가 반복해 주세요.</p><button id="aboutReset">이 기기의 학습 기록 지우기</button></section>';$('#aboutReset').onclick=()=>$('#resetDialog').showModal();}
function focusMain(){window.scrollTo({top:0,behavior:'instant'});$('#main').focus({preventScroll:true});}
function route(){let id=decodeURIComponent(location.hash.slice(1)||'home');if(id==='home')home();else if(id==='quiz')quiz();else if(id==='results')results();else if(id==='guide')guide();else if(id==='about')about();else{let p=C.pages.find(p=>p.id===id);if(p)lesson(p);else home();}document.title=`${id==='home'?'카카오T 차근차근 배우기':(C.pages.find(p=>p.id===id)?.title||({quiz:'스스로 확인하기',results:'나의 학습 결과',guide:'따라하기 안내서',about:'자료와 이용 안내'}[id]||'학습'))} | 내 손안의 택시`;focusMain();}
document.addEventListener('click', event => {
  if (event.target.closest('.skip')) {
    event.preventDefault();
    $('#main').focus();
    $('#main').scrollIntoView();
    return;
  }
  const button = event.target.closest('[data-enlarge]');
  if (!button) return;

  const page = C.pages.find(page => page.id === button.dataset.enlarge);
  $('#largeCapture').innerHTML = renderCapture(page);
  const dialog = $('#imageDialog');
  dialog.showModal();
  dialog.scrollTop = 0;
});
$('#closeImage').onclick=()=>$('#imageDialog').close();$('#font').onclick=()=>{state.big=!state.big;save();};$('#reset').onclick=()=>$('#resetDialog').showModal();$('#cancelReset').onclick=()=>$('#resetDialog').close();$('#confirmReset').onclick=()=>{state={done:[],phone:{},ready:[],selfChecks:[],last:'welcome',big:state.big,result:null};quizAnswers=Array(8).fill(null);quizIndex=0;save();$('#resetDialog').close();if(location.hash==='#home')route();else location.hash='home';};window.addEventListener('hashchange',route);route();
})();
