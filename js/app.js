/**
 * 主 UI 控制器
 * 负责：Tab切换 / 各阶段渲染 / 进度轨道更新 / 导出
 */
const UI = {

  // ── 初始化 ──────────────────────────────────
  init() {
    // Tab 切换
    document.querySelectorAll('.tab').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    // 抽样策略选择器
    const strategySelect = document.getElementById('samplingStrategy');
    const boostConfig = document.getElementById('boostConfig');
    const boostFactorRow = document.getElementById('boostFactorRow');
    const boostFactorSlider = document.getElementById('boostFactor');
    const boostFactorVal = document.getElementById('boostFactorVal');

    strategySelect.addEventListener('change', (e) => {
      const strategy = e.target.value;
      const isBoost = strategy === 'boost';
      boostConfig.style.display = isBoost ? 'flex' : 'none';
      boostFactorRow.style.display = isBoost ? 'flex' : 'none';
      this.updateStrategyHint(strategy);
      this.applyStrategy();
    });

    boostFactorSlider.addEventListener('input', (e) => {
      boostFactorVal.textContent = e.target.value;
      this.applyStrategy();
    });

    document.getElementById('boostThreshold').addEventListener('change', () => this.applyStrategy());

    // 初始化七普年龄分布参考图
    this.renderAgeDistRef();
    // 加载历史
    this.renderHistory();
    // 初始化策略提示
    this.updateStrategyHint('pps');
  },

  // 更新策略提示
  updateStrategyHint(strategy) {
    const hints = {
      pps: '纯PPS（按人口比例）',
      boost: '人口加成（提升大省被抽概率）',
      log: '对数加成（缩小极值差异）',
      equal: '平等权重（等概率抽取）'
    };
    const hint = hints[strategy] || hints.pps;
    document.getElementById('currentStrategy').textContent = hint;
    const stage2Hint = document.getElementById('stage2Strategy');
    if (stage2Hint) stage2Hint.textContent = hint;
  },

  // 应用策略到抽样引擎
  applyStrategy() {
    const strategy = document.getElementById('samplingStrategy').value;
    const boostFactor = parseFloat(document.getElementById('boostFactor').value) || 1.5;
    const boostThreshold = (parseInt(document.getElementById('boostThreshold').value) || 500) * 10000;
    SamplingEngine.setStrategy(strategy, boostFactor, boostThreshold);
  },

  // ── Tab 切换 ──────────────────────────────────
  switchTab(name) {
    document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.id === `tab-${name}`));
  },

  // ── 进度轨道 ──────────────────────────────────
  updateTrack(stage) {
    for (let i = 1; i <= 4; i++) {
      const node = document.getElementById(`sn${i}`);
      const line = document.getElementById(`sl${i}`);
      node.classList.remove('active', 'done');
      if (line) line.classList.remove('done');
      if (i < stage)  { node.classList.add('done'); if (line) line.classList.add('done'); }
      if (i === stage) node.classList.add('active');
    }
  },

  // ── Banner 统计 ──────────────────────────────────
  updateBanner(summary) {
    const s = summary || {};
    document.getElementById('bstat-prov').textContent   = s.totalProvinces ?? '—';
    document.getElementById('bstat-city').textContent   = s.totalCities    ?? '—';
    document.getElementById('bstat-street').textContent = s.totalStreets   ?? '—';
    document.getElementById('bstat-people').textContent = s.totalPeople != null
      ? s.totalPeople.toLocaleString() : '—';
  },

  // ── 阶段按钮状态 ──────────────────────────────────
  setStageButtons(completedStage) {
    for (let i = 1; i <= 4; i++) {
      const btn = document.getElementById(`btn-stage${i}`);
      btn.disabled = i > completedStage + 1;
      btn.classList.toggle('done', i <= completedStage);
    }
  },

  // ── 加载遮罩 ──────────────────────────────────
  showLoading(text = '正在执行...') {
    document.getElementById('loadingMask').classList.add('show');
    document.getElementById('loadingText').textContent = text;
  },
  hideLoading() {
    document.getElementById('loadingMask').classList.remove('show');
  },

  // ────────────────────────────────────────────
  // 分阶段执行入口
  // ────────────────────────────────────────────
  async runStage(stage) {
    const engine = SamplingEngine;
    const cfg = this.getConfig();

    // 应用抽样策略
    this.applyStrategy();

    // 检查前置阶段
    if (stage > 1 && engine.state.stage < stage - 1) {
      alert(`请先完成第 ${stage - 1} 阶段`);
      return;
    }

    this.showLoading(`正在执行第 ${stage} 阶段...`);
    await sleep(200);

    try {
      if (stage === 1) {
        engine.resetState();
        engine.runStage1([cfg.provMin, cfg.provMax]);
        this.renderStage1(engine.state);
        this.setStageButtons(1);
        this.updateTrack(1);
        this.switchTab('stage1');
      }
      else if (stage === 2) {
        engine.runStage2();
        this.renderStage2(engine.state);
        this.setStageButtons(2);
        this.updateTrack(2);
        this.switchTab('stage2');
      }
      else if (stage === 3) {
        engine.runStage3(cfg.streetsCount);
        this.renderStage3(engine.state);
        this.setStageButtons(3);
        this.updateTrack(3);
        this.switchTab('stage3');
      }
      else if (stage === 4) {
        engine.runStage4(cfg.peopleCount);
        this.renderStage4(engine.state);
        this.renderSummary();
        this.renderHistory();
        this.setStageButtons(4);
        this.updateTrack(5); // 5 = all done
        this.updateBanner(engine.getGlobalSummary());
        this.switchTab('stage4');
      }
    } catch(e) {
      console.error(e);
      alert('执行出错：' + e.message);
    } finally {
      this.hideLoading();
    }
  },

  // 一键全部
  async runAll() {
    const cfg = this.getConfig();
    const engine = SamplingEngine;

    // 应用抽样策略
    this.applyStrategy();
    engine.resetState();

    await engine.runAll(async (stage, text) => {
      this.showLoading(text);
      this.updateTrack(stage);
      await sleep(100);
    });

    this.renderStage1(engine.state);
    this.renderStage2(engine.state);
    this.renderStage3(engine.state);
    this.renderStage4(engine.state);
    this.renderSummary();
    this.renderHistory();
    this.setStageButtons(4);
    this.updateBanner(engine.getGlobalSummary());
    this.hideLoading();
    this.switchTab('summary');
  },

  // 重置
  reset() {
    if (!confirm('确认重置所有抽样结果？')) return;
    SamplingEngine.resetState();
    this.setStageButtons(0);
    this.updateTrack(0);
    this.updateBanner(null);
    document.getElementById('region-grid').innerHTML = '<div class="empty-hint">点击左侧「第一阶段」按钮开始抽样</div>';
    document.getElementById('city-list').innerHTML   = '<div class="empty-hint">请先完成第一阶段</div>';
    document.getElementById('street-list').innerHTML = '<div class="empty-hint">请先完成第二阶段</div>';
    document.getElementById('people-list').innerHTML = '<div class="empty-hint">请先完成第三阶段</div>';
    document.getElementById('summary-content').innerHTML = '<div class="empty-hint">完成全部四阶段后查看</div>';
    this.switchTab('stage1');
  },

  // 获取配置
  getConfig() {
    return {
      provMin:       parseInt(document.getElementById('provMin').value)      || 2,
      provMax:       parseInt(document.getElementById('provMax').value)      || 3,
      streetsCount:  parseInt(document.getElementById('streetsCount').value) || 4,
      peopleCount:   parseInt(document.getElementById('peopleCount').value)  || 250,
    };
  },

  // ────────────────────────────────────────────
  // 渲染：第一阶段
  // ────────────────────────────────────────────
  renderStage1(state) {
    const grid = document.getElementById('region-grid');
    if (!state.regionGroups || !state.regionGroups.length) {
      grid.innerHTML = '<div class="empty-hint">无数据</div>';
      return;
    }

    const regionColors = ['--r1','--r2','--r3','--r4','--r5','--r6','--r7'];

    grid.innerHTML = state.regionGroups.map((rg, i) => {
      const color = `var(${regionColors[i % regionColors.length]})`;
      // 所有省份（含未抽中）
      const allProvs = DataHelper.getProvincesByRegion(rg.region.id);
      const sampledCodes = new Set(rg.provinces.map(p => p.abbr));

      const provTags = allProvs.map(p => {
        const sampled = sampledCodes.has(p.abbr);
        const popM = (p.pop / 1e6).toFixed(0);
        return `<div class="prov-tag ${sampled ? 'sampled' : ''}">
          ${p.name}
          <span class="prov-pop">${popM}万</span>
          ${sampled ? '✓' : ''}
        </div>`;
      }).join('');

      return `<div class="region-card">
        <div class="region-header" style="background:${color}">
          <div>
            <div class="rh-name">${rg.region.name}</div>
            <div class="rh-desc">${rg.region.desc}</div>
          </div>
          <div class="rh-count">${rg.provinces.length}</div>
        </div>
        <div class="region-provinces">${provTags}</div>
      </div>`;
    }).join('');
  },

  // ────────────────────────────────────────────
  // 渲染：第二阶段
  // ────────────────────────────────────────────
  renderStage2(state) {
    const container = document.getElementById('city-list');
    if (!state.sampledCities || !state.sampledCities.length) {
      container.innerHTML = '<div class="empty-hint">无数据</div>';
      return;
    }

    container.innerHTML = state.sampledCities.map(({ province, cities }) => {
      const cityCards = cities.map(c => {
        const roleClass = c.type === 'capital' ? 'capital' : (c.type === 'city' ? 'city' : 'county');
        const popStr = c.pop >= 1e6 ? `${(c.pop/1e6).toFixed(1)} 万人` : `${(c.pop/1e4).toFixed(0)} 万人`;
        return `<div class="city-card">
          <span class="city-role-badge ${roleClass}">${c.cityRole}</span>
          <div class="city-name">${c.name}</div>
          <div class="city-pop">👥 ${popStr}</div>
        </div>`;
      }).join('');

      return `<div class="city-province-block">
        <div class="city-prov-title">
          🏛 ${province.name}
          <span style="font-size:11px;color:var(--gray-60);font-weight:400">${province.region?.name}</span>
        </div>
        <div class="city-row-grid">${cityCards}</div>
      </div>`;
    }).join('');
  },

  // ────────────────────────────────────────────
  // 渲染：第三阶段
  // ────────────────────────────────────────────
  renderStage3(state) {
    const container = document.getElementById('street-list');
    if (!state.sampledStreets || !state.sampledStreets.length) {
      container.innerHTML = '<div class="empty-hint">无数据</div>';
      return;
    }

    // 按省份+城市分组
    const blocks = {};
    for (const { province, city, streets } of state.sampledStreets) {
      const key = `${province.name}__${city.name}`;
      if (!blocks[key]) blocks[key] = { province, city, streets: [] };
      blocks[key].streets.push(...streets);
    }

    container.innerHTML = Object.values(blocks).map(({ province, city, streets }) => {
      const tags = streets.map(s => {
        const isRural = city.type === 'county' || s.name.includes('乡') || s.name.includes('镇');
        return `<div class="street-tag ${isRural ? 'rural' : 'urban'}">
          <span class="st-icon">${isRural ? '🌾' : '🏙'}</span>
          ${s.name}
        </div>`;
      }).join('');

      const roleClass = city.type === 'capital' ? 'capital' : (city.type === 'city' ? 'city' : 'county');
      return `<div class="street-city-block">
        <div class="street-city-title">
          ${province.name} ·
          <span class="city-role-badge ${roleClass}" style="padding:2px 6px;font-size:10px;">${city.cityRole}</span>
          ${city.name}
        </div>
        <div class="street-tags">${tags}</div>
      </div>`;
    }).join('');
  },

  // ────────────────────────────────────────────
  // 渲染：第四阶段（年龄分层抽人）
  // ────────────────────────────────────────────
  renderStage4(state) {
    const container = document.getElementById('people-list');
    if (!state.sampledPeople || !state.sampledPeople.length) {
      container.innerHTML = '<div class="empty-hint">无数据</div>';
      return;
    }

    container.innerHTML = state.sampledPeople.map((block, idx) => {
      const { province, city, street, people, summary } = block;

      // 每个年龄段统计
      const ageRows = Object.entries(summary.ageDist).map(([grp, cnt]) => {
        const males   = people.filter(p => p.ageGroup === grp && p.sex === '男').length;
        const females = cnt - males;
        return `<tr>
          <td>${grp}</td>
          <td class="sex-male">${males}</td>
          <td class="sex-female">${females}</td>
          <td>${cnt}</td>
          <td>${(cnt / summary.total * 100).toFixed(1)}%</td>
        </tr>`;
      }).join('');

      return `<div class="people-block">
        <div class="people-block-header">
          <div class="people-block-title">
            ${province.name} · ${city.name} · ${street.name}
          </div>
          <div class="people-block-meta">
            共 <strong>${summary.total}</strong> 人 |
            男 <strong>${summary.male}</strong>（${summary.maleRatio}%）|
            女 <strong>${summary.female}</strong>
          </div>
        </div>
        <div class="people-table-wrap">
          <table class="people-table">
            <thead>
              <tr><th>年龄组</th><th>男</th><th>女</th><th>小计</th><th>占比</th></tr>
            </thead>
            <tbody>${ageRows}</tbody>
          </table>
        </div>
      </div>`;
    }).join('');
  },

  // ────────────────────────────────────────────
  // 渲染：七普年龄性别分布参考图
  // ────────────────────────────────────────────
  renderAgeDistRef() {
    const dist = DataHelper.getAgeSexDist();
    const maxRatio = Math.max(...dist.map(d => d.male + d.female));

    const bars = dist.map(d => {
      const mW = (d.male   / maxRatio * 100).toFixed(1);
      const fW = (d.female / maxRatio * 100).toFixed(1);
      const maleN   = Math.round(d.male   * 250);
      const femaleN = Math.round(d.female * 250);
      return `<div class="age-bar-row">
        <span class="age-bar-label">${d.group}</span>
        <div class="age-bar-male"   style="width:${mW}%" title="男 ≈${maleN}人"></div>
        <div class="age-bar-female" style="width:${fW}%" title="女 ≈${femaleN}人"></div>
        <span class="age-bar-total">≈${maleN+femaleN}人</span>
      </div>`;
    }).join('');

    document.getElementById('ageDistRef').innerHTML = `
      <h4>七普年龄性别分层参考（250人份额）<span style="color:#4a90d9;font-weight:400;margin-left:8px">■ 男</span><span style="color:#e87c7c;font-weight:400;margin-left:8px">■ 女</span></h4>
      <div class="age-bars">${bars}</div>`;
  },

  // ────────────────────────────────────────────
  // 渲染：汇总统计
  // ────────────────────────────────────────────
  renderSummary() {
    const el = document.getElementById('summary-content');
    const s = SamplingEngine.getGlobalSummary();

    const regionBars = Object.entries(s.regionDist || {}).map(([name, cnt]) => {
      const maxCnt = Math.max(...Object.values(s.regionDist));
      const w = (cnt / maxCnt * 100).toFixed(0);
      const colors = ['#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f','#edc948','#b07aa1'];
      const i = DataHelper.getRegions().findIndex(r => r.name === name);
      const color = colors[i] || '#1d72e8';
      return `<div class="region-dist-bar">
        <span class="rdb-label">${name}</span>
        <div class="rdb-bar-wrap">
          <div class="rdb-bar" style="width:${w}%;background:${color};"></div>
        </div>
        <span class="rdb-n">${cnt} 省</span>
      </div>`;
    }).join('');

    const femaleTotal = s.totalPeople - (s.maleTotal || 0);
    const maleRatio = s.totalPeople > 0 ? (s.maleTotal / s.totalPeople * 100).toFixed(1) : 0;

    el.innerHTML = `
      <div class="summary-stat-grid">
        <div class="sum-card"><div class="sum-n">${s.totalProvinces}</div><div class="sum-l">抽样省份</div></div>
        <div class="sum-card"><div class="sum-n">${s.totalCities}</div><div class="sum-l">抽样城市/县</div></div>
        <div class="sum-card"><div class="sum-n">${s.totalStreets}</div><div class="sum-l">抽样街道/乡镇</div></div>
        <div class="sum-card"><div class="sum-n" style="font-size:28px;">${s.totalPeople.toLocaleString()}</div><div class="sum-l">抽样总人数</div></div>
      </div>
      <div class="sum-card" style="margin-bottom:20px;display:flex;gap:40px;align-items:center;padding:16px 24px;">
        <div><span style="font-size:22px;font-weight:700;color:#4a90d9;">${s.maleTotal?.toLocaleString()}</span> <span style="font-size:12px;color:var(--gray-60);">男性</span></div>
        <div style="font-size:13px;color:var(--gray-60);">性别比 ${maleRatio}% : ${(100-parseFloat(maleRatio)).toFixed(1)}%</div>
        <div><span style="font-size:22px;font-weight:700;color:#e87c7c;">${femaleTotal?.toLocaleString()}</span> <span style="font-size:12px;color:var(--gray-60);">女性</span></div>
      </div>
      <div class="summary-region-dist">
        <h4>各大区抽样省份分布</h4>
        ${regionBars}
      </div>`;
  },

  // ────────────────────────────────────────────
  // 渲染：历史记录
  // ────────────────────────────────────────────
  renderHistory() {
    const el = document.getElementById('history-list');
    const hist = SamplingEngine.history;
    if (!hist || hist.length === 0) {
      el.innerHTML = '<div class="empty-hint">暂无历史记录</div>';
      return;
    }
    el.innerHTML = hist.map((h, i) => {
      const s = h.summary || {};
      return `<div class="history-card">
        <div>
          <div class="history-time">${new Date(h.time).toLocaleString('zh-CN')}</div>
          <div class="history-nums">
            <span>省份 <strong>${s.totalProvinces || 0}</strong></span>
            <span>城市 <strong>${s.totalCities || 0}</strong></span>
            <span>街道 <strong>${s.totalStreets || 0}</strong></span>
            <span>人数 <strong>${(s.totalPeople || 0).toLocaleString()}</strong></span>
          </div>
        </div>
        <div class="history-actions">
          <button class="btn-sm" onclick="UI.restoreHistory(${i})">恢复</button>
          <button class="btn-sm" onclick="UI.deleteHistory(${i})">删除</button>
        </div>
      </div>`;
    }).join('');
  },

  restoreHistory(idx) {
    const h = SamplingEngine.history[idx];
    if (!h) return;
    SamplingEngine.state = h.state;
    this.renderStage1(h.state);
    this.renderStage2(h.state);
    this.renderStage3(h.state);
    this.renderStage4(h.state);
    this.renderSummary();
    this.setStageButtons(4);
    this.updateTrack(5);
    this.updateBanner(h.summary);
    this.switchTab('summary');
  },

  deleteHistory(idx) {
    if (!confirm('删除此条历史记录？')) return;
    SamplingEngine.history.splice(idx, 1);
    try { localStorage.setItem('samplingHistory_v2', JSON.stringify(SamplingEngine.history)); } catch {}
    this.renderHistory();
  },

  // ────────────────────────────────────────────
  // 导出
  // ────────────────────────────────────────────
  exportCSV() {
    const state = SamplingEngine.state;
    if (!state.sampledPeople || !state.sampledPeople.length) {
      alert('请先完成第四阶段抽样'); return;
    }
    const bom = '\ufeff';
    let csv = bom + '大区,省份,城市,城市角色,街道/乡镇,年龄组,性别\n';
    for (const block of state.sampledPeople) {
      for (const p of block.people) {
        csv += `${block.province.region?.name || ''},${block.province.name},${block.city.name},${block.city.cityRole},${block.street.name},${p.ageGroup},${p.sex}\n`;
      }
    }
    this._download(csv, `抽样结果_${dateStr()}.csv`, 'text/csv');
  },

  exportJSON() {
    const state = SamplingEngine.state;
    if (!state.sampledPeople || !state.sampledPeople.length) {
      alert('请先完成第四阶段抽样'); return;
    }
    const data = state.sampledPeople.map(b => ({
      province: b.province.name,
      region:   b.province.region?.name,
      city:     b.city.name,
      cityRole: b.city.cityRole,
      street:   b.street.name,
      summary:  b.summary,
      people:   b.people,
    }));
    this._download(JSON.stringify(data, null, 2), `抽样结果_${dateStr()}.json`, 'application/json');
  },

  _download(content, filename, mime) {
    const blob = new Blob([content], { type: mime + ';charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  },
};

// ── 工具函数 ──
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function dateStr() { return new Date().toISOString().slice(0, 10); }

// ── 启动 ──
document.addEventListener('DOMContentLoaded', () => UI.init());
