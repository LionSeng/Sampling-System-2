/**
 * 抽样引擎 - 严格按照四阶段规格实现
 *
 * 第一阶段：7大区 → PPS 随机抽取 2-3 个省份
 * 第二阶段：每省 → PPS 抽取 1省会/特大 + 1地级市 + 2县级行政区
 * 第三阶段：每城市/县 → 随机抽取 4 个街道/乡镇
 * 第四阶段：每街道/乡镇 → 按年龄×性别分层，随机抽取 250 人
 */

const SamplingEngine = {

  // 当前抽样结果（分阶段存储）
  state: {
    stage: 0,            // 0=未开始  1~4=进行中  5=完成
    regions: [],         // 7大区
    sampledProvinces: [], // 第一阶段结果
    sampledCities: [],   // 第二阶段结果
    sampledStreets: [],  // 第三阶段结果
    sampledPeople: [],   // 第四阶段结果
  },

  // 抽样配置
  config: {
    strategy: 'pps',    // pps | boost | log | equal
    boostFactor: 1.5,   // 人口加成系数
    boostThreshold: 5000000, // 加成阈值（人口大于此值才加成）
  },

  history: [],           // 历史记录

  // ─────────────────────────────────────────────
  // PPS 抽样：按 pop 字段加权，抽 n 个不重复
  // 支持多种加权策略
  // ─────────────────────────────────────────────
  ppsSample(pool, n, options = {}) {
    // 边界保护：如果池子为空或 n<=0，返回空数组
    if (!pool || pool.length === 0 || n <= 0) return [];
    
    // 如果 n >= pool.length，改为抽取全部
    if (pool.length <= n) {
      // 打乱顺序后返回
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      return shuffled;
    }

    const cfg = { ...this.config, ...options };
    const result = [];
    let remaining = [...pool];

    for (let i = 0; i < n; i++) {
      // 计算每个单元的加权权重
      const weights = remaining.map(u => this._calcWeight(u.pop || 1, cfg));
      const totalWeight = weights.reduce((s, w) => s + w, 0);

      // 随机抽
      let rand = Math.random() * totalWeight;
      let idx = 0;
      for (; idx < remaining.length - 1; idx++) {
        rand -= weights[idx];
        if (rand <= 0) break;
      }
      result.push(remaining[idx]);
      remaining.splice(idx, 1);
    }
    return result;
  },

  // 根据策略计算权重
  _calcWeight(pop, cfg) {
    switch (cfg.strategy) {
      case 'equal':
        // 平等权重：每个单元等概率
        return 1;

      case 'boost':
        // 人口加成：高人口区域获得加成系数
        if (pop >= cfg.boostThreshold) {
          return pop * cfg.boostFactor;
        }
        return pop;

      case 'log':
        // 对数加成：缩小极值差异，但保持相对大小
        return Math.log10(pop + 1) * 100000;

      case 'pps':
      default:
        // 纯PPS：直接按人口比例
        return pop;
    }
  },

  // 获取策略说明
  getStrategyDesc() {
    const cfg = this.config;
    const names = {
      pps: '纯PPS（按人口比例）',
      boost: `人口加成（≥${(cfg.boostThreshold/10000).toFixed(0)}万人口 ×${cfg.boostFactor}）`,
      log: '对数加成（缩小极值差异）',
      equal: '平等权重（等概率）',
    };
    return names[cfg.strategy] || names.pps;
  },

  // 设置策略
  setStrategy(strategy, boostFactor = 1.5, boostThreshold = 5000000) {
    this.config.strategy = strategy;
    this.config.boostFactor = boostFactor;
    this.config.boostThreshold = boostThreshold;
  },

  // 简单随机不重复抽样
  srsWithoutReplacement(pool, n) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(n, pool.length));
  },

  // ─────────────────────────────────────────────
  // 第一阶段：每个大区 PPS 抽 provincesPerRegion 个省
  // ─────────────────────────────────────────────
  runStage1(provincesPerRegion = [2, 3]) {
    const regions = DataHelper.getRegions();
    const result = [];

    for (const region of regions) {
      const provinces = DataHelper.getProvincesByRegion(region.id);
      // 每区随机抽 2 或 3 个（range: provincesPerRegion）
      const n = provincesPerRegion[0] + Math.round(Math.random() * (provincesPerRegion[1] - provincesPerRegion[0]));
      const sampled = this.ppsSample(provinces, n);
      result.push({
        region,
        provinces: sampled.map(p => ({ ...p, sampledFrom: region.name })),
      });
    }

    this.state.sampledProvinces = result.flatMap(r => r.provinces.map(p => ({ ...p, region: r.region })));
    this.state.regionGroups = result;
    this.state.stage = 1;
    return result;
  },

  // ─────────────────────────────────────────────
  // 第二阶段：每省 PPS 抽城市组合
  //   规则：1个省会/特大城市 + 1个地级市 + 2个县级行政区
  // ─────────────────────────────────────────────
  runStage2() {
    const result = [];

    for (const prov of this.state.sampledProvinces) {
      const allCities = DataHelper.getCities(prov.abbr);
      const capitals = allCities.filter(c => c.type === 'capital');
      const cities   = allCities.filter(c => c.type === 'city');
      const counties = allCities.filter(c => c.type === 'county');

      const sampledCapital  = this.ppsSample(capitals, 1);
      const sampledCity     = this.ppsSample(cities,   1);
      const sampledCounties = this.ppsSample(counties, 2);

      const combo = [
        ...sampledCapital.map(c  => ({ ...c, cityRole: '省会/特大城市' })),
        ...sampledCity.map(c     => ({ ...c, cityRole: '地级市' })),
        ...sampledCounties.map(c => ({ ...c, cityRole: '县级行政区' })),
      ];

      result.push({ province: prov, cities: combo });
    }

    this.state.sampledCities = result;
    this.state.stage = 2;
    return result;
  },

  // ─────────────────────────────────────────────
  // 第三阶段：每城市/县随机抽 4 个街道/乡镇
  // ─────────────────────────────────────────────
  runStage3(streetsPerCity = 4) {
    const result = [];

    for (const { province, cities } of this.state.sampledCities) {
      for (const city of cities) {
        const pool = DataHelper.getStreets(city.type, province.abbr);
        const sampled = this.srsWithoutReplacement(pool, streetsPerCity)
          .map((name, idx) => ({
            id: `${city.id}_s${idx}`,
            name,
            cityName: city.name,
            cityType: city.type,
            cityRole: city.cityRole,
            province: province.name,
            provinceAbbr: province.abbr,
          }));
        result.push({ province, city, streets: sampled });
      }
    }

    this.state.sampledStreets = result;
    this.state.stage = 3;
    return result;
  },

  // ─────────────────────────────────────────────
  // 第四阶段：每街道按年龄×性别分层随机抽 250 人
  // ─────────────────────────────────────────────
  runStage4(peoplePerStreet = 250) {
    const result = [];

    for (const { province, city, streets } of this.state.sampledStreets) {
      for (const street of streets) {
        const people = DataHelper.generate250People(street.name, peoplePerStreet);
        result.push({
          province,
          city,
          street,
          people,
          // 汇总统计
          summary: this._summarizePeople(people),
        });
      }
    }

    this.state.sampledPeople = result;
    this.state.stage = 4;
    this._saveHistory();
    return result;
  },

  // ─────────────────────────────────────────────
  // 一键执行全部四阶段
  // ─────────────────────────────────────────────
  async runAll(onProgress) {
    this.resetState();

    onProgress && onProgress(1, '第一阶段：PPS抽取省份...');
    await this._delay(600);
    this.runStage1([2, 3]);

    onProgress && onProgress(2, '第二阶段：抽取城市组合...');
    await this._delay(600);
    this.runStage2();

    onProgress && onProgress(3, '第三阶段：抽取街道/乡镇...');
    await this._delay(600);
    this.runStage3(4);

    onProgress && onProgress(4, '第四阶段：分层抽取250人...');
    await this._delay(600);
    this.runStage4(250);

    onProgress && onProgress(5, '抽样完成');
    return this.state;
  },

  // ─────────────────────────────────────────────
  // 辅助：汇总一个街道的人群统计
  // ─────────────────────────────────────────────
  _summarizePeople(people) {
    const total = people.length;
    const male  = people.filter(p => p.sex === '男').length;
    const female = total - male;
    // 按年龄段分组
    const ageDist = {};
    for (const p of people) {
      ageDist[p.ageGroup] = (ageDist[p.ageGroup] || 0) + 1;
    }
    return { total, male, female, maleRatio: (male / total * 100).toFixed(1), ageDist };
  },

  // 计算全局汇总
  getGlobalSummary() {
    const state = this.state;
    const totalProvinces = state.sampledProvinces.length;
    const totalCities    = state.sampledCities.reduce((s, r) => s + r.cities.length, 0);
    const totalStreets   = state.sampledStreets.reduce((s, r) => s + r.streets.length, 0);
    const totalPeople    = state.sampledPeople.reduce((s, r) => s + r.people.length, 0);
    const maleTotal      = state.sampledPeople.reduce((s, r) => s + r.summary.male, 0);
    // 各区域省份分布
    const regionDist = {};
    for (const p of state.sampledProvinces) {
      const rname = p.region?.name || '未知';
      regionDist[rname] = (regionDist[rname] || 0) + 1;
    }
    return { totalProvinces, totalCities, totalStreets, totalPeople, maleTotal, regionDist };
  },

  // 重置状态
  resetState() {
    this.state = {
      stage: 0,
      sampledProvinces: [],
      sampledCities: [],
      sampledStreets: [],
      sampledPeople: [],
      regionGroups: [],
    };
  },

  // 保存历史
  _saveHistory() {
    const summary = this.getGlobalSummary();
    this.history.unshift({ time: new Date().toISOString(), summary, state: JSON.parse(JSON.stringify(this.state)) });
    if (this.history.length > 20) this.history.length = 20;
    try { localStorage.setItem('samplingHistory_v2', JSON.stringify(this.history)); } catch {}
  },

  loadHistory() {
    try {
      const raw = localStorage.getItem('samplingHistory_v2');
      if (raw) this.history = JSON.parse(raw);
    } catch {}
  },

  _delay(ms) { return new Promise(r => setTimeout(r, ms)); },
};

SamplingEngine.loadHistory();
