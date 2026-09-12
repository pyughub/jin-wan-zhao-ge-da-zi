(function () {
  'use strict';

  var STORAGE = 'buddy_wall_v1';
  var TYPES = ['自习', '跑步', '作业组队'];
  var PLACES = ['东中院', '图书馆', '霍英东', '南体', '电院', '一餐'];
  var CODES = ['咖啡', '灯管', '晚风', '闸机', '跑道', '占座', '热水', '操场灯'];
  var TILTS = ['-1.2deg', '0.8deg', '-0.4deg', '1.3deg', '0.2deg', '-1deg'];

  var SEEDS = [
    { id: 's1', type: '作业组队', place: '东中院', start: '20:00', end: '21:30', seats: 1, joined: 1, need: '高数作业结对，带讲义第 2 节', owner: 'seed', code: '东中院-咖啡' },
    { id: 's2', type: '跑步', place: '南体', start: '19:00', end: '20:00', seats: 2, joined: 0, need: '慢跑 3 公里，新手，别配速杀我', owner: 'seed', code: '南体-跑道' },
    { id: 's3', type: '自习', place: '图书馆', start: '18:30', end: '21:00', seats: 1, joined: 2, need: '占一张四人桌，安静写英语朗读', owner: 'seed', code: '图书馆-灯管' },
    { id: 's4', type: '作业组队', place: '电院', start: '19:30', end: '21:00', seats: 2, joined: 1, need: '码道微认证互相盯进度', owner: 'seed', code: '电院-闸机' },
    { id: 's5', type: '自习', place: '东中院', start: '19:00', end: '21:00', seats: 1, joined: 0, need: '线代作业，卡题只写疑问', owner: 'seed', code: '东中院-占座' },
    { id: 's6', type: '跑步', place: '霍英东', start: '21:00', end: '21:40', seats: 1, joined: 1, need: '泳馆门口拉伸，去不去都行', owner: 'seed', code: '霍英东-晚风' },
    { id: 's7', type: '作业组队', place: '一餐', start: '18:00', end: '19:00', seats: 2, joined: 0, need: '学院问卷两个人一起填完', owner: 'seed', code: '一餐-热水' },
    { id: 's8', type: '自习', place: '霍英东', start: '20:00', end: '22:00', seats: 1, joined: 0, need: '大厅沙发改简历，可低声讨论', owner: 'seed', code: '霍英东-操场灯' }
  ];

  var els = {
    wall: document.getElementById('wall'),
    empty: document.getElementById('empty'),
    typeChips: document.getElementById('typeChips'),
    placeChips: document.getElementById('placeChips'),
    crashOn: document.getElementById('crashOn'),
    freeStart: document.getElementById('freeStart'),
    freeEnd: document.getElementById('freeEnd'),
    postBtn: document.getElementById('postBtn'),
    postDialog: document.getElementById('postDialog'),
    postForm: document.getElementById('postForm'),
    postCancel: document.getElementById('postCancel'),
    postType: document.getElementById('postType'),
    postPlace: document.getElementById('postPlace'),
    postStart: document.getElementById('postStart'),
    postEnd: document.getElementById('postEnd'),
    postSeats: document.getElementById('postSeats'),
    postNeed: document.getElementById('postNeed'),
    cardDialog: document.getElementById('cardDialog'),
    meetNeed: document.getElementById('meetNeed'),
    meetPlace: document.getElementById('meetPlace'),
    meetTime: document.getElementById('meetTime'),
    meetCode: document.getElementById('meetCode'),
    meetCount: document.getElementById('meetCount'),
    copyCard: document.getElementById('copyCard'),
    cardClose: document.getElementById('cardClose'),
    mineBtn: document.getElementById('mineBtn'),
    mineDialog: document.getElementById('mineDialog'),
    mineClose: document.getElementById('mineClose'),
    mineList: document.getElementById('mineList')
  };

  var state = {
    posts: [],
    joined: {},
    type: '',
    place: '',
    viewing: null
  };

  function minutes(hhmm) {
    var parts = String(hhmm || '00:00').split(':');
    return Number(parts[0]) * 60 + Number(parts[1] || 0);
  }

  function overlaps(aStart, aEnd, bStart, bEnd) {
    return minutes(aStart) < minutes(bEnd) && minutes(bStart) < minutes(aEnd);
  }

  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORAGE) || 'null');
      if (raw && raw.posts && raw.posts.length) {
        state.posts = raw.posts;
        state.joined = raw.joined || {};
        return;
      }
    } catch (e) {}
    state.posts = SEEDS.map(function (item) { return Object.assign({}, item); });
    state.joined = {};
    save();
  }

  function save() {
    localStorage.setItem(STORAGE, JSON.stringify({
      posts: state.posts,
      joined: state.joined
    }));
  }

  function fillSelect(select, items) {
    select.innerHTML = items.map(function (item) {
      return '<option value="' + item + '">' + item + '</option>';
    }).join('');
  }

  function paintChips(box, items, current, onPick) {
    box.innerHTML = '<button type="button" class="chip" data-value="" aria-pressed="' + (current === '') + '">全部</button>' +
      items.map(function (item) {
        return '<button type="button" class="chip" data-value="' + item + '" aria-pressed="' + (current === item) + '">' + item + '</button>';
      }).join('');
    box.onclick = function (event) {
      var btn = event.target.closest('.chip');
      if (!btn) return;
      onPick(btn.getAttribute('data-value') || '');
    };
  }

  function visiblePosts() {
    var crash = els.crashOn.checked;
    var list = state.posts.filter(function (post) {
      if (state.type && post.type !== state.type) return false;
      if (state.place && post.place !== state.place) return false;
      return true;
    }).map(function (post) {
      post = Object.assign({}, post);
      post.crash = crash && overlaps(post.start, post.end, els.freeStart.value, els.freeEnd.value);
      return post;
    });
    list.sort(function (a, b) {
      if (a.crash !== b.crash) return a.crash ? -1 : 1;
      return minutes(a.start) - minutes(b.start);
    });
    return list;
  }

  function renderWall() {
    paintChips(els.typeChips, TYPES, state.type, function (value) {
      state.type = value;
      renderWall();
    });
    paintChips(els.placeChips, PLACES, state.place, function (value) {
      state.place = value;
      renderWall();
    });
    var list = visiblePosts();
    els.empty.hidden = list.length > 0;
    els.wall.innerHTML = list.map(function (post, index) {
      var mine = post.owner === 'me';
      var went = !!state.joined[post.id];
      var left = Math.max(0, post.seats - post.joined);
      var label = went ? '看集合卡' : (mine ? '我发的' : (left ? '我去' : '人满了'));
      var disabled = !went && (mine || left === 0);
      return '<article class="slip' + (post.crash ? ' is-overlap' : '') + (mine ? ' is-mine' : '') + '" style="--tilt:' + TILTS[index % TILTS.length] + '">' +
        '<span class="stamp">' + post.type + '</span>' +
        '<h3>' + escapeHtml(post.need) + '</h3>' +
        '<p class="meta">' + post.place + '<br>' + post.start + '–' + post.end +
        (post.crash ? '<br>和你的空闲撞上了' : '') +
        '<br>还缺 ' + left + ' 人 · 已有 ' + post.joined + ' 人应约</p>' +
        '<button type="button" class="go" data-id="' + post.id + '"' + (disabled ? ' disabled' : '') + '>' + label + '</button>' +
        '</article>';
    }).join('');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function findPost(id) {
    for (var i = 0; i < state.posts.length; i++) {
      if (state.posts[i].id === id) return state.posts[i];
    }
    return null;
  }

  function makeCode(place) {
    return place + '-' + CODES[Math.floor(Math.random() * CODES.length)];
  }

  function showCard(post) {
    state.viewing = post;
    els.meetNeed.textContent = post.need;
    els.meetPlace.textContent = post.place;
    els.meetTime.textContent = post.start + '–' + post.end;
    els.meetCode.textContent = post.code;
    els.meetCount.textContent = post.joined + ' 人';
    if (!els.cardDialog.open) els.cardDialog.showModal();
  }

  function joinPost(id) {
    var post = findPost(id);
    if (!post) return;
    if (state.joined[id]) {
      showCard(post);
      return;
    }
    if (post.owner === 'me') return;
    if (post.joined >= post.seats) return;
    post.joined += 1;
    state.joined[id] = true;
    save();
    renderWall();
    showCard(post);
  }

  function renderMine() {
    var mine = state.posts.filter(function (post) {
      return post.owner === 'me' || state.joined[post.id];
    });
    if (!mine.length) {
      els.mineList.innerHTML = '<p>还没有。去墙上应一张，或自己发一张。</p>';
      return;
    }
    els.mineList.innerHTML = mine.map(function (post) {
      var tag = post.owner === 'me' ? '我发的' : '我应过';
      return '<div class="mine-item"><strong>' + escapeHtml(post.need) + '</strong>' +
        '<p class="meta">' + tag + ' · ' + post.place + ' · ' + post.start + '–' + post.end + ' · ' + post.code + '</p>' +
        '<button type="button" class="go" data-open="' + post.id + '">看集合卡</button></div>';
    }).join('');
  }

  els.wall.addEventListener('click', function (event) {
    var btn = event.target.closest('[data-id]');
    if (!btn || btn.disabled) return;
    joinPost(btn.getAttribute('data-id'));
  });

  els.crashOn.addEventListener('change', renderWall);
  els.freeStart.addEventListener('change', renderWall);
  els.freeEnd.addEventListener('change', renderWall);

  els.postBtn.addEventListener('click', function () {
    if (!els.postDialog.open) els.postDialog.showModal();
  });
  els.postCancel.addEventListener('click', function () { els.postDialog.close(); });
  els.postForm.addEventListener('submit', function (event) {
    event.preventDefault();
    var post = {
      id: 'p' + Date.now(),
      type: els.postType.value,
      place: els.postPlace.value,
      start: els.postStart.value,
      end: els.postEnd.value,
      seats: Math.max(1, Number(els.postSeats.value) || 1),
      joined: 0,
      need: els.postNeed.value.trim(),
      owner: 'me',
      code: makeCode(els.postPlace.value)
    };
    if (!post.need) return;
    state.posts.unshift(post);
    save();
    els.postDialog.close();
    els.postNeed.value = '';
    renderWall();
    showCard(post);
  });

  els.cardClose.addEventListener('click', function () { els.cardDialog.close(); });
  els.copyCard.addEventListener('click', function () {
    var post = state.viewing;
    if (!post) return;
    var text = post.place + ' ' + post.start + '–' + post.end + ' 口令 ' + post.code;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        els.copyCard.textContent = '已复制';
        setTimeout(function () { els.copyCard.textContent = '复制口令'; }, 1200);
      });
    }
  });

  els.mineBtn.addEventListener('click', function () {
    renderMine();
    if (!els.mineDialog.open) els.mineDialog.showModal();
  });
  els.mineClose.addEventListener('click', function () { els.mineDialog.close(); });
  els.mineList.addEventListener('click', function (event) {
    var btn = event.target.closest('[data-open]');
    if (!btn) return;
    var post = findPost(btn.getAttribute('data-open'));
    if (post) showCard(post);
  });

  fillSelect(els.postType, TYPES);
  fillSelect(els.postPlace, PLACES);
  load();
  renderWall();
})();
