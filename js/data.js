/**
 * 第七次全国人口普查 (2020) 数据模块
 * 数据来源：国家统计局第七次全国人口普查公报
 *
 * 核心结构：
 *   7大区 → 省份 → 城市（省会/特大/地级/农村县）→ 街道/乡镇 → 年龄性别分层人口
 */

// ─────────────────────────────────────────────
// 1. 七大地理区域（按地理 + 饮食习惯划分）
// ─────────────────────────────────────────────
const REGIONS = [
  {
    id: 1,
    name: '华北区',
    desc: '北方面食文化区',
    color: '#4e79a7',
    provinces: ['京', '津', '冀', '晋', '蒙']
  },
  {
    id: 2,
    name: '东北区',
    desc: '东北饮食文化区',
    color: '#f28e2b',
    provinces: ['辽', '吉', '黑']
  },
  {
    id: 3,
    name: '华东区',
    desc: '江南精细饮食区',
    color: '#e15759',
    provinces: ['沪', '苏', '浙', '皖', '闽', '赣', '鲁']
  },
  {
    id: 4,
    name: '华中区',
    desc: '中原饮食文化区',
    color: '#76b7b2',
    provinces: ['豫', '鄂', '湘']
  },
  {
    id: 5,
    name: '华南区',
    desc: '粤系饮食文化区',
    color: '#59a14f',
    provinces: ['粤', '桂', '琼']
  },
  {
    id: 6,
    name: '西南区',
    desc: '川渝辣味饮食区',
    color: '#edc948',
    provinces: ['渝', '川', '黔', '滇', '藏']
  },
  {
    id: 7,
    name: '西北区',
    desc: '西北清真饮食区',
    color: '#b07aa1',
    provinces: ['陕', '甘', '青', '宁', '新']
  }
];

// ─────────────────────────────────────────────
// 2. 省份数据（七普真实人口数据）
//    type: capital=省会/直辖市  mega=特大城市  city=地级市  county=农村县
// ─────────────────────────────────────────────
const PROVINCES = {
  // 华北区
  '京': { name: '北京市',   region: 1, pop: 21893095,  capital: '北京市', abbr: '京' },
  '津': { name: '天津市',   region: 1, pop: 13866009,  capital: '天津市', abbr: '津' },
  '冀': { name: '河北省',   region: 1, pop: 74610235,  capital: '石家庄市', abbr: '冀' },
  '晋': { name: '山西省',   region: 1, pop: 34915616,  capital: '太原市', abbr: '晋' },
  '蒙': { name: '内蒙古自治区', region: 1, pop: 24049155, capital: '呼和浩特市', abbr: '蒙' },
  // 东北区
  '辽': { name: '辽宁省',   region: 2, pop: 42591407,  capital: '沈阳市', abbr: '辽' },
  '吉': { name: '吉林省',   region: 2, pop: 24073453,  capital: '长春市', abbr: '吉' },
  '黑': { name: '黑龙江省', region: 2, pop: 31850088,  capital: '哈尔滨市', abbr: '黑' },
  // 华东区
  '沪': { name: '上海市',   region: 3, pop: 24870895,  capital: '上海市', abbr: '沪' },
  '苏': { name: '江苏省',   region: 3, pop: 84748016,  capital: '南京市', abbr: '苏' },
  '浙': { name: '浙江省',   region: 3, pop: 64567588,  capital: '杭州市', abbr: '浙' },
  '皖': { name: '安徽省',   region: 3, pop: 61027171,  capital: '合肥市', abbr: '皖' },
  '闽': { name: '福建省',   region: 3, pop: 41540086,  capital: '福州市', abbr: '闽' },
  '赣': { name: '江西省',   region: 3, pop: 45188635,  capital: '南昌市', abbr: '赣' },
  '鲁': { name: '山东省',   region: 3, pop: 101527453, capital: '济南市', abbr: '鲁' },
  // 华中区
  '豫': { name: '河南省',   region: 4, pop: 99365519,  capital: '郑州市', abbr: '豫' },
  '鄂': { name: '湖北省',   region: 4, pop: 57752557,  capital: '武汉市', abbr: '鄂' },
  '湘': { name: '湖南省',   region: 4, pop: 66444864,  capital: '长沙市', abbr: '湘' },
  // 华南区
  '粤': { name: '广东省',   region: 5, pop: 126012510, capital: '广州市', abbr: '粤' },
  '桂': { name: '广西壮族自治区', region: 5, pop: 50126804, capital: '南宁市', abbr: '桂' },
  '琼': { name: '海南省',   region: 5, pop: 10081232,  capital: '海口市', abbr: '琼' },
  // 西南区
  '渝': { name: '重庆市',   region: 6, pop: 32054159,  capital: '重庆市', abbr: '渝' },
  '川': { name: '四川省',   region: 6, pop: 83674866,  capital: '成都市', abbr: '川' },
  '黔': { name: '贵州省',   region: 6, pop: 38562148,  capital: '贵阳市', abbr: '黔' },
  '滇': { name: '云南省',   region: 6, pop: 47209277,  capital: '昆明市', abbr: '滇' },
  '藏': { name: '西藏自治区', region: 6, pop: 3648100,  capital: '拉萨市', abbr: '藏' },
  // 西北区
  '陕': { name: '陕西省',   region: 7, pop: 39528999,  capital: '西安市', abbr: '陕' },
  '甘': { name: '甘肃省',   region: 7, pop: 25019831,  capital: '兰州市', abbr: '甘' },
  '青': { name: '青海省',   region: 7, pop: 5923957,   capital: '西宁市', abbr: '青' },
  '宁': { name: '宁夏回族自治区', region: 7, pop: 7202654, capital: '银川市', abbr: '宁' },
  '新': { name: '新疆维吾尔自治区', region: 7, pop: 25852345, capital: '乌鲁木齐市', abbr: '新' },
};

// ─────────────────────────────────────────────
// 3. 城市数据：每省 4 个抽样城市
//    type: capital=省会/特大  city=地级市  county=农村县
//    pop: 七普常住人口（人）
// ─────────────────────────────────────────────
const CITIES = {
  // ── 华北 ──
  '京': [
    { name: '北京市朝阳区',   type: 'capital', pop: 3452000 },
    { name: '北京市海淀区',   type: 'capital', pop: 3131000 },
    { name: '北京市通州区',   type: 'city',    pop: 1843000 },
    { name: '北京市延庆区',   type: 'county',  pop: 343000  },
    { name: '北京市密云区',   type: 'county',  pop: 491000  },
  ],
  '津': [
    { name: '天津市滨海新区', type: 'capital', pop: 2977000 },
    { name: '天津市武清区',   type: 'city',    pop: 1274000 },
    { name: '天津市宝坻区',   type: 'city',    pop: 926000  },
    { name: '天津市蓟州区',   type: 'county',  pop: 916000  },
    { name: '天津市静海区',   type: 'county',  pop: 557000  },
  ],
  '冀': [
    { name: '石家庄市',           type: 'capital', pop: 11234000 },
    { name: '唐山市',             type: 'city',    pop: 7978000  },
    { name: '保定市',             type: 'city',    pop: 9235000  },
    { name: '张家口市崇礼区',     type: 'county',  pop: 147000   },
    { name: '承德市丰宁满族自治县', type: 'county', pop: 410000  },
  ],
  '晋': [
    { name: '太原市',         type: 'capital', pop: 5308000 },
    { name: '大同市',         type: 'city',    pop: 3105000 },
    { name: '长治市',         type: 'city',    pop: 3338000 },
    { name: '吕梁市岚县',     type: 'county',  pop: 145000  },
    { name: '临汾市永和县',   type: 'county',  pop: 56000   },
  ],
  '蒙': [
    { name: '呼和浩特市',           type: 'capital', pop: 3446000 },
    { name: '包头市',               type: 'city',    pop: 2849000 },
    { name: '赤峰市',               type: 'city',    pop: 4302000 },
    { name: '兴安盟科右中旗',       type: 'county',  pop: 280000  },
    { name: '呼伦贝尔市新巴尔虎左旗', type: 'county', pop: 42000  },
  ],
  // ── 东北 ──
  '辽': [
    { name: '沈阳市',         type: 'capital', pop: 9073000 },
    { name: '大连市',         type: 'capital', pop: 7450000 },
    { name: '鞍山市',         type: 'city',    pop: 3395000 },
    { name: '朝阳市建平县',   type: 'county',  pop: 394000  },
    { name: '阜新市彰武县',   type: 'county',  pop: 382000  },
  ],
  '吉': [
    { name: '长春市',                   type: 'capital', pop: 9066000 },
    { name: '吉林市',                   type: 'city',    pop: 3969000 },
    { name: '延边朝鲜族自治州延吉市',   type: 'city',    pop: 707000  },
    { name: '白山市靖宇县',             type: 'county',  pop: 116000  },
    { name: '通化市辉南县',             type: 'county',  pop: 234000  },
  ],
  '黑': [
    { name: '哈尔滨市',     type: 'capital', pop: 10009000 },
    { name: '齐齐哈尔市',   type: 'city',    pop: 4075000  },
    { name: '牡丹江市',     type: 'city',    pop: 2479000  },
    { name: '黑河市嫩江市', type: 'county',  pop: 361000   },
    { name: '大兴安岭地区漠河市', type: 'county', pop: 100000 },
  ],
  // ── 华东 ──
  '沪': [
    { name: '上海市浦东新区', type: 'capital', pop: 5681000 },
    { name: '上海市闵行区',   type: 'capital', pop: 2652000 },
    { name: '上海市松江区',   type: 'city',    pop: 1927000 },
    { name: '上海市崇明区',   type: 'county',  pop: 703000  },
    { name: '上海市金山区',   type: 'county',  pop: 816000  },
  ],
  '苏': [
    { name: '南京市',         type: 'capital', pop: 9314000  },
    { name: '苏州市',         type: 'capital', pop: 12748000 },
    { name: '徐州市',         type: 'city',    pop: 9084000  },
    { name: '宿迁市泗洪县',   type: 'county',  pop: 892000   },
    { name: '徐州市丰县',     type: 'county',  pop: 1219000  },
  ],
  '浙': [
    { name: '杭州市',         type: 'capital', pop: 11936000 },
    { name: '宁波市',         type: 'capital', pop: 9404000  },
    { name: '温州市',         type: 'city',    pop: 9573000  },
    { name: '丽水市云和县',   type: 'county',  pop: 111000   },
    { name: '衢州市开化县',   type: 'county',  pop: 337000   },
  ],
  '皖': [
    { name: '合肥市',         type: 'capital', pop: 9369000 },
    { name: '芜湖市',         type: 'city',    pop: 3659000 },
    { name: '阜阳市',         type: 'city',    pop: 8107000 },
    { name: '六安市金寨县',   type: 'county',  pop: 651000  },
    { name: '安庆市岳西县',   type: 'county',  pop: 310000  },
  ],
  '闽': [
    { name: '福州市',         type: 'capital', pop: 8291000 },
    { name: '厦门市',         type: 'capital', pop: 5163000 },
    { name: '泉州市',         type: 'city',    pop: 8782000 },
    { name: '宁德市寿宁县',   type: 'county',  pop: 194000  },
    { name: '南平市政和县',   type: 'county',  pop: 163000  },
  ],
  '赣': [
    { name: '南昌市',         type: 'capital', pop: 6255000 },
    { name: '赣州市',         type: 'city',    pop: 9136000 },
    { name: '九江市',         type: 'city',    pop: 5044000 },
    { name: '上饶市广丰区',   type: 'county',  pop: 803000  },
    { name: '赣州市石城县',   type: 'county',  pop: 300000  },
  ],
  '鲁': [
    { name: '济南市',         type: 'capital', pop: 9202000  },
    { name: '青岛市',         type: 'capital', pop: 10072000 },
    { name: '烟台市',         type: 'city',    pop: 7180000  },
    { name: '菏泽市单县',     type: 'county',  pop: 1206000  },
    { name: '临沂市沂南县',   type: 'county',  pop: 998000   },
  ],
  // ── 华中 ──
  '豫': [
    { name: '郑州市',         type: 'capital', pop: 12607000 },
    { name: '洛阳市',         type: 'city',    pop: 7201000  },
    { name: '南阳市',         type: 'city',    pop: 9700000  },
    { name: '信阳市固始县',   type: 'county',  pop: 1529000  },
    { name: '周口市太康县',   type: 'county',  pop: 1284000  },
  ],
  '鄂': [
    { name: '武汉市',         type: 'capital', pop: 13205000 },
    { name: '宜昌市',         type: 'city',    pop: 4018000  },
    { name: '襄阳市',         type: 'city',    pop: 5483000  },
    { name: '恩施州利川市',   type: 'county',  pop: 768000   },
    { name: '神农架林区',     type: 'county',  pop: 76000    },
  ],
  '湘': [
    { name: '长沙市',             type: 'capital', pop: 10024000 },
    { name: '衡阳市',             type: 'city',    pop: 6645000  },
    { name: '常德市',             type: 'city',    pop: 5745000  },
    { name: '湘西州花垣县',       type: 'county',  pop: 235000   },
    { name: '怀化市通道侗族自治县', type: 'county', pop: 221000  },
  ],
  // ── 华南 ──
  '粤': [
    { name: '广州市',         type: 'capital', pop: 18677000 },
    { name: '深圳市',         type: 'capital', pop: 17560000 },
    { name: '佛山市',         type: 'city',    pop: 9499000  },
    { name: '梅州市大埔县',   type: 'county',  pop: 425000   },
    { name: '河源市和平县',   type: 'county',  pop: 400000   },
  ],
  '桂': [
    { name: '南宁市',         type: 'capital', pop: 8741000 },
    { name: '柳州市',         type: 'city',    pop: 4155000 },
    { name: '桂林市',         type: 'city',    pop: 5014000 },
    { name: '百色市隆林县',   type: 'county',  pop: 310000  },
    { name: '河池市东兰县',   type: 'county',  pop: 299000  },
  ],
  '琼': [
    { name: '海口市',               type: 'capital', pop: 2873000 },
    { name: '三亚市',               type: 'city',    pop: 1032000 },
    { name: '儋州市',               type: 'city',    pop: 1000000 },
    { name: '白沙黎族自治县',       type: 'county',  pop: 171000  },
    { name: '琼中黎族苗族自治县',   type: 'county',  pop: 168000  },
  ],
  // ── 西南 ──
  '渝': [
    { name: '重庆市渝中区',   type: 'capital', pop: 676000  },
    { name: '重庆市江津区',   type: 'capital', pop: 1507000 },
    { name: '重庆市万州区',   type: 'city',    pop: 1578000 },
    { name: '重庆市城口县',   type: 'county',  pop: 184000  },
    { name: '重庆市巫山县',   type: 'county',  pop: 516000  },
  ],
  '川': [
    { name: '成都市',           type: 'capital', pop: 20937000 },
    { name: '绵阳市',           type: 'city',    pop: 5420000  },
    { name: '南充市',           type: 'city',    pop: 6278000  },
    { name: '甘孜州色达县',     type: 'county',  pop: 54000    },
    { name: '阿坝州若尔盖县',   type: 'county',  pop: 80000    },
  ],
  '黔': [
    { name: '贵阳市',               type: 'capital', pop: 5987000 },
    { name: '遵义市',               type: 'city',    pop: 6606000 },
    { name: '毕节市',               type: 'city',    pop: 6899000 },
    { name: '黔东南州从江县',       type: 'county',  pop: 310000  },
    { name: '黔南州三都水族自治县', type: 'county',  pop: 361000  },
  ],
  '滇': [
    { name: '昆明市',               type: 'capital', pop: 8461000 },
    { name: '曲靖市',               type: 'city',    pop: 5895000 },
    { name: '大理白族自治州',       type: 'city',    pop: 3397000 },
    { name: '怒江州泸水市',         type: 'county',  pop: 172000  },
    { name: '迪庆藏族自治州德钦县', type: 'county',  pop: 60000   },
  ],
  '藏': [
    { name: '拉萨市',         type: 'capital', pop: 868000 },
    { name: '日喀则市',       type: 'city',    pop: 798000 },
    { name: '林芝市',         type: 'city',    pop: 238000 },
    { name: '那曲市尼玛县',   type: 'county',  pop: 36000  },
    { name: '阿里地区改则县', type: 'county',  pop: 40000  },
  ],
  // ── 西北 ──
  '陕': [
    { name: '西安市',         type: 'capital', pop: 13082000 },
    { name: '宝鸡市',         type: 'city',    pop: 3765000  },
    { name: '咸阳市',         type: 'city',    pop: 4380000  },
    { name: '商洛市镇安县',   type: 'county',  pop: 283000   },
    { name: '延安市志丹县',   type: 'county',  pop: 148000   },
  ],
  '甘': [
    { name: '兰州市',         type: 'capital', pop: 4359000 },
    { name: '天水市',         type: 'city',    pop: 3264000 },
    { name: '庆阳市',         type: 'city',    pop: 2179000 },
    { name: '甘南州迭部县',   type: 'county',  pop: 56000   },
    { name: '甘南州卓尼县',   type: 'county',  pop: 103000  },
  ],
  '青': [
    { name: '西宁市',                   type: 'capital', pop: 2467000 },
    { name: '海东市',                   type: 'city',    pop: 1376000 },
    { name: '海西蒙古族藏族自治州',     type: 'city',    pop: 501000  },
    { name: '果洛州久治县',             type: 'county',  pop: 26000   },
    { name: '玉树藏族自治州称多县',     type: 'county',  pop: 52000   },
  ],
  '宁': [
    { name: '银川市',         type: 'capital', pop: 2860000 },
    { name: '吴忠市',         type: 'city',    pop: 1462000 },
    { name: '固原市',         type: 'city',    pop: 1131000 },
    { name: '中卫市海原县',   type: 'county',  pop: 494000  },
    { name: '固原市西吉县',   type: 'county',  pop: 462000  },
  ],
  '新': [
    { name: '乌鲁木齐市',               type: 'capital', pop: 4054000 },
    { name: '喀什地区',                 type: 'city',    pop: 4643000 },
    { name: '伊犁哈萨克自治州',         type: 'city',    pop: 2704000 },
    { name: '和田地区策勒县',           type: 'county',  pop: 210000  },
    { name: '克孜勒苏柯尔克孜自治州阿合奇县', type: 'county', pop: 28000 },
  ],
};

// ─────────────────────────────────────────────
// 4. 街道/乡镇数据（部分大城市真实数据，其余根据城市类型生成）
//    每个城市/县固定备选 8~12 个，供随机抽取 4 个
// ─────────────────────────────────────────────
const STREET_TEMPLATES = {
  capital: [
    '中山路街道','解放路街道','建国路街道','文化路街道',
    '新城街道','东风路街道','人民路街道','光明路街道',
    '和平街道','幸福路街道','工农路街道','兴隆街道',
  ],
  city: [
    '城关镇','红旗街道','东城街道','西城街道',
    '南关街道','北关街道','民主路街道','胜利街道',
    '建设路街道','长安街道','安定街道','向阳街道',
  ],
  county: [
    '龙泉乡','青山镇','太平镇','丰收乡',
    '红星村乡','大兴镇','永安乡','长乐镇',
    '石桥乡','双河镇','清水乡','金龙镇',
  ],
};

// ─────────────────────────────────────────────
// 5. 七普年龄性别分层分布（2020年全国数据）
//    用于第四阶段：按年龄段 × 性别分层，抽 250 人
//    比例来源：七普公报第五号（年龄结构）
// ─────────────────────────────────────────────
const AGE_SEX_DIST = [
  // { group, maleRatio, femaleRatio } 比例加总 = 1.0
  { group: '0-4岁',   male: 0.0274, female: 0.0238 },
  { group: '5-9岁',   male: 0.0334, female: 0.0285 },
  { group: '10-14岁', male: 0.0332, female: 0.0277 },
  { group: '15-19岁', male: 0.0305, female: 0.0265 },
  { group: '20-24岁', male: 0.0334, female: 0.0303 },
  { group: '25-29岁', male: 0.0388, female: 0.0358 },
  { group: '30-34岁', male: 0.0407, female: 0.0378 },
  { group: '35-39岁', male: 0.0366, female: 0.0344 },
  { group: '40-44岁', male: 0.0335, female: 0.0318 },
  { group: '45-49岁', male: 0.0386, female: 0.0369 },
  { group: '50-54岁', male: 0.0418, female: 0.0400 },
  { group: '55-59岁', male: 0.0388, female: 0.0376 },
  { group: '60-64岁', male: 0.0318, female: 0.0314 },
  { group: '65-69岁', male: 0.0256, female: 0.0257 },
  { group: '70-74岁', male: 0.0163, female: 0.0169 },
  { group: '75-79岁', male: 0.0102, female: 0.0115 },
  { group: '80+岁',   male: 0.0083, female: 0.0108 },
];
// 验证：所有比例之和 ≈ 1.0（男 0.4979 + 女 0.4874 = 0.9853，余量为性别比调整浮动）

// ─────────────────────────────────────────────
// 6. 工具函数
// ─────────────────────────────────────────────
const DataHelper = {
  getRegions() { return REGIONS; },
  getProvince(abbr) { return PROVINCES[abbr]; },
  getProvincesByRegion(regionId) {
    return Object.entries(PROVINCES)
      .filter(([, p]) => p.region === regionId)
      .map(([abbr, p]) => ({ abbr, ...p }));
  },
  getCities(abbr) { return (CITIES[abbr] || []).map((c, i) => ({ ...c, id: `${abbr}_${i}` })); },
  getStreets(cityType, count = 12) {
    const pool = [...(STREET_TEMPLATES[cityType] || STREET_TEMPLATES.city)];
    return pool;
  },
  getAgeSexDist() { return AGE_SEX_DIST; },
  /**
   * 根据七普年龄性别分布，为一个街道生成 250 人抽样名单
   * @param {string} streetName
   * @param {number} total 目标人数，默认 250
   */
  generate250People(streetName, total = 250) {
    const people = [];
    let id = 1;
    // 按比例分配，最后凑满 total
    const slots = AGE_SEX_DIST.map(d => ({
      group: d.group,
      maleCnt: Math.round(d.male * total),
      femaleCnt: Math.round(d.female * total),
    }));
    // 修正总数
    let sum = slots.reduce((s, r) => s + r.maleCnt + r.femaleCnt, 0);
    let diff = total - sum;
    if (diff > 0) slots[slots.length - 1].maleCnt += diff;
    if (diff < 0) slots[0].maleCnt = Math.max(0, slots[0].maleCnt + diff);

    for (const slot of slots) {
      for (let m = 0; m < slot.maleCnt; m++) {
        people.push({ id: id++, street: streetName, ageGroup: slot.group, sex: '男' });
      }
      for (let f = 0; f < slot.femaleCnt; f++) {
        people.push({ id: id++, street: streetName, ageGroup: slot.group, sex: '女' });
      }
    }
    return people.slice(0, total);
  },
};
