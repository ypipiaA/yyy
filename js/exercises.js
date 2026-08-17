const EXERCISES = {
  chest: [
    { name: '杠铃卧推', muscle: '胸大肌', equipment: '杠铃' },
    { name: '哑铃飞鸟', muscle: '胸大肌', equipment: '哑铃' },
    { name: '俯卧撑', muscle: '胸大肌', equipment: '自重' },
    { name: '上斜哑铃卧推', muscle: '上胸', equipment: '哑铃' },
    { name: '双杠臂屈伸', muscle: '下胸', equipment: '自重' },
  ],
  back: [
    { name: '引体向上', muscle: '背阔肌', equipment: '自重' },
    { name: '杠铃划船', muscle: '背阔肌', equipment: '杠铃' },
    { name: '高位下拉', muscle: '背阔肌', equipment: '器械' },
    { name: '哑铃单臂划船', muscle: '背阔肌', equipment: '哑铃' },
    { name: '硬拉', muscle: '竖脊肌', equipment: '杠铃' },
  ],
  legs: [
    { name: '杠铃深蹲', muscle: '股四头肌', equipment: '杠铃' },
    { name: '罗马尼亚硬拉', muscle: '腘绳肌', equipment: '杠铃' },
    { name: '腿举', muscle: '股四头肌', equipment: '器械' },
    { name: '弓步蹲', muscle: '股四头肌', equipment: '哑铃' },
    { name: '腿弯举', muscle: '腘绳肌', equipment: '器械' },
  ],
  shoulders: [
    { name: '杠铃推举', muscle: '三角肌', equipment: '杠铃' },
    { name: '哑铃侧平举', muscle: '三角肌中束', equipment: '哑铃' },
    { name: '面拉', muscle: '三角肌后束', equipment: '绳索' },
    { name: '阿诺德推举', muscle: '三角肌', equipment: '哑铃' },
  ],
  arms: [
    { name: '杠铃弯举', muscle: '肱二头肌', equipment: '杠铃' },
    { name: '三头下压', muscle: '肱三头肌', equipment: '绳索' },
    { name: '锤式弯举', muscle: '肱二头肌', equipment: '哑铃' },
    { name: '窄距卧推', muscle: '肱三头肌', equipment: '杠铃' },
  ],
  core: [
    { name: '平板支撑', muscle: '核心', equipment: '自重' },
    { name: '卷腹', muscle: '腹直肌', equipment: '自重' },
    { name: '俄罗斯转体', muscle: '腹斜肌', equipment: '自重' },
    { name: '悬垂举腿', muscle: '下腹部', equipment: '自重' },
  ],
  cardio: [
    { name: '跑步', muscle: '有氧', equipment: '跑步机' },
    { name: '跳绳', muscle: '有氧', equipment: '跳绳' },
    { name: '波比跳', muscle: '全身', equipment: '自重' },
    { name: '登山跑', muscle: '有氧', equipment: '自重' },
    { name: '椭圆机', muscle: '有氧', equipment: '器械' },
  ],
};

const GOAL_CONFIG = {
  muscle: { sets: 4, reps: '8-12', rest: 90, label: '增肌塑形' },
  fat: { sets: 3, reps: '12-15', rest: 60, label: '减脂燃脂' },
  strength: { sets: 5, reps: '3-6', rest: 180, label: '力量提升' },
  endurance: { sets: 3, reps: '15-20', rest: 45, label: '耐力训练' },
};

const SPLIT_TEMPLATES = {
  3: [
    { name: '第1天', focus: '推（胸/肩/三头）', groups: ['chest', 'shoulders', 'arms'] },
    { name: '第2天', focus: '拉（背/二头）', groups: ['back', 'arms'] },
    { name: '第3天', focus: '腿（股四/腘绳/核心）', groups: ['legs', 'core'] },
  ],
  4: [
    { name: '第1天', focus: '胸 + 三头', groups: ['chest', 'arms'] },
    { name: '第2天', focus: '背 + 二头', groups: ['back', 'arms'] },
    { name: '第3天', focus: '肩 + 核心', groups: ['shoulders', 'core'] },
    { name: '第4天', focus: '腿', groups: ['legs'] },
  ],
  5: [
    { name: '第1天', focus: '胸', groups: ['chest'] },
    { name: '第2天', focus: '背', groups: ['back'] },
    { name: '第3天', focus: '肩', groups: ['shoulders'] },
    { name: '第4天', focus: '腿', groups: ['legs'] },
    { name: '第5天', focus: '手臂 + 核心', groups: ['arms', 'core'] },
  ],
  6: [
    { name: '第1天', focus: '胸', groups: ['chest'] },
    { name: '第2天', focus: '背', groups: ['back'] },
    { name: '第3天', focus: '肩', groups: ['shoulders'] },
    { name: '第4天', focus: '腿', groups: ['legs'] },
    { name: '第5天', focus: '手臂', groups: ['arms'] },
    { name: '第6天', focus: '核心 + 有氧', groups: ['core', 'cardio'] },
  ],
};

const LEVEL_EXERCISE_COUNT = {
  beginner: 4,
  intermediate: 5,
  advanced: 6,
};
