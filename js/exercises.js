/**
 * FitTrack 完整动作库
 * 包含动作名称、肌肉部位、器械、难度、说明、要点、视频链接
 */
const EXERCISES = {
  chest: [
    { 
      name: '杠铃卧推', 
      muscle: '胸', 
      equipment: '杠铃', 
      difficulty: '中级',
      description: '经典胸肌训练动作，主要锻炼胸大肌、三角肌前束和肱三头肌',
      tips: '保持肩胛骨收紧，胸部挺起，杠铃下落至胸部中段',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '哑铃飞鸟', 
      muscle: '胸', 
      equipment: '哑铃', 
      difficulty: '中级',
      description: '孤立训练胸大肌，增强胸肌中缝和外沿',
      tips: '手臂微屈，感受胸肌拉伸，合拢时用力挤压',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '俯卧撑', 
      muscle: '胸', 
      equipment: '自重', 
      difficulty: '初级',
      description: '基础自重胸肌训练，可多种变式增加难度',
      tips: '身体保持一条直线，胸部贴近地面',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '上斜哑铃卧推', 
      muscle: '上胸', 
      equipment: '哑铃', 
      difficulty: '中级',
      description: '针对上胸部的训练，塑造饱满上胸',
      tips: '凳子角度30-45度，哑铃在胸部上方推起',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '双杠臂屈伸', 
      muscle: '下胸', 
      equipment: '自重', 
      difficulty: '高级',
      description: '训练下胸和三头肌，增强上肢推力',
      tips: '身体前倾，手肘向外，下落至大臂平行地面',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '器械夹胸', 
      muscle: '胸', 
      equipment: '器械', 
      difficulty: '初级',
      description: '安全的胸肌孤立训练，适合新手',
      tips: '挺胸收腹，双手在胸前合拢',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '龙门架夹胸', 
      muscle: '胸', 
      equipment: '绳索', 
      difficulty: '中级',
      description: '持续张力的胸肌训练，可调整角度',
      tips: '身体前倾，手臂微屈，在胸前画弧线',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '窄距卧推', 
      muscle: '内胸', 
      equipment: '杠铃', 
      difficulty: '中级',
      description: '侧重胸肌内侧和三头肌',
      tips: '双手间距与肩同宽，杠铃下落至胸部下方',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '蝴蝶机夹胸', 
      muscle: '胸', 
      equipment: '器械', 
      difficulty: '初级',
      description: '固定轨迹的胸肌训练，安全性高',
      tips: '调整座椅高度，手肘与肩同高',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '俯卧撑击掌', 
      muscle: '胸', 
      equipment: '自重', 
      difficulty: '高级',
      description: '爆发力训练，增强胸肌力量和速度',
      tips: '推起时用力击掌，落地时缓冲',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
  ],
  back: [
    { 
      name: '引体向上', 
      muscle: '背', 
      equipment: '自重', 
      difficulty: '中级',
      description: '最佳背部训练动作，锻炼背阔肌、菱形肌',
      tips: '挺胸沉肩，拉至下巴过杠',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '杠铃划船', 
      muscle: '背', 
      equipment: '杠铃', 
      difficulty: '中级',
      description: '增厚背部的经典动作',
      tips: '俯身45度，杠铃拉向腹部',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '高位下拉', 
      muscle: '背', 
      equipment: '器械', 
      difficulty: '初级',
      description: '引体向上的替代动作，适合无法完成引体的人',
      tips: '挺胸，手肘向后下方拉',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '哑铃单臂划船', 
      muscle: '背', 
      equipment: '哑铃', 
      difficulty: '中级',
      description: '单侧训练，纠正左右不平衡',
      tips: '背部保持水平，拉向腰侧',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '硬拉', 
      muscle: '下背', 
      equipment: '杠铃', 
      difficulty: '高级',
      description: '全身力量训练，强化后链肌群',
      tips: '保持背部挺直，髋关节主导发力',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '坐姿划船', 
      muscle: '背', 
      equipment: '器械', 
      difficulty: '初级',
      description: '安全的背部厚度训练',
      tips: '挺胸收腹，拉向腹部',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: 'T杠划船', 
      muscle: '背', 
      equipment: '杠铃', 
      difficulty: '中级',
      description: '大重量背部训练，增加背部厚度',
      tips: '俯身保持稳定，拉向胸部',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '直臂下压', 
      muscle: '背', 
      equipment: '绳索', 
      difficulty: '初级',
      description: '孤立训练背阔肌',
      tips: '手臂微屈，下压至大腿前侧',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '山羊挺身', 
      muscle: '下背', 
      equipment: '自重', 
      difficulty: '初级',
      description: '强化下背部和竖脊肌',
      tips: '动作缓慢，感受下背部发力',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '反向飞鸟', 
      muscle: '后肩', 
      equipment: '哑铃', 
      difficulty: '中级',
      description: '训练后三角肌和菱形肌',
      tips: '俯身，手臂微屈，向两侧展开',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
  ],
  legs: [
    { 
      name: '杠铃深蹲', 
      muscle: '腿', 
      equipment: '杠铃', 
      difficulty: '中级',
      description: '腿部训练之王，锻炼股四头肌、臀大肌',
      tips: '膝盖与脚尖方向一致，蹲至大腿平行地面',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '罗马尼亚硬拉', 
      muscle: '腘绳肌', 
      equipment: '杠铃', 
      difficulty: '中级',
      description: '强化腘绳肌和臀部',
      tips: '微屈膝，髋关节后移，感受大腿后侧拉伸',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '腿举', 
      muscle: '腿', 
      equipment: '器械', 
      difficulty: '初级',
      description: '安全的腿部大重量训练',
      tips: '背部紧贴靠垫，膝盖不要锁死',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '弓步蹲', 
      muscle: '腿', 
      equipment: '哑铃', 
      difficulty: '中级',
      description: '单侧腿部训练，增强平衡和协调',
      tips: '前膝不超过脚尖，后膝接近地面',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '腿弯举', 
      muscle: '腘绳肌', 
      equipment: '器械', 
      difficulty: '初级',
      description: '孤立训练腘绳肌',
      tips: '动作缓慢，顶峰收缩',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '腿屈伸', 
      muscle: '股四头肌', 
      equipment: '器械', 
      difficulty: '初级',
      description: '孤立训练股四头肌',
      tips: '伸直时顶峰收缩，缓慢下放',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '保加利亚分腿蹲', 
      muscle: '腿', 
      equipment: '哑铃', 
      difficulty: '高级',
      description: '高强度单侧腿部训练',
      tips: '后脚搭在凳子上，下蹲至前腿平行地面',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '相扑深蹲', 
      muscle: '内收肌', 
      equipment: '杠铃', 
      difficulty: '中级',
      description: '针对大腿内侧的深蹲变式',
      tips: '双脚宽距站立，脚尖外展',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '臀桥', 
      muscle: '臀', 
      equipment: '自重', 
      difficulty: '初级',
      description: '激活臀部，改善久坐问题',
      tips: '顶峰挤压臀部，保持2秒',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '小腿提踵', 
      muscle: '小腿', 
      equipment: '器械', 
      difficulty: '初级',
      description: '训练小腿三头肌',
      tips: '充分拉伸，顶峰收缩',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
  ],
  shoulders: [
    { 
      name: '杠铃推举', 
      muscle: '肩', 
      equipment: '杠铃', 
      difficulty: '中级',
      description: '肩部力量训练的基础动作',
      tips: '核心收紧，推至头顶上方',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '哑铃侧平举', 
      muscle: '肩', 
      equipment: '哑铃', 
      difficulty: '初级',
      description: '训练三角肌中束，增加肩宽',
      tips: '手肘微屈，向两侧举至肩高',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '面拉', 
      muscle: '肩', 
      equipment: '绳索', 
      difficulty: '中级',
      description: '训练后三角肌和肩袖肌群',
      tips: '拉向面部，手肘向外打开',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '阿诺德推举', 
      muscle: '肩', 
      equipment: '哑铃', 
      difficulty: '中级',
      description: '全方位刺激三角肌',
      tips: '起始位置掌心朝内，推举时旋转',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '哑铃前平举', 
      muscle: '前肩', 
      equipment: '哑铃', 
      difficulty: '初级',
      description: '训练三角肌前束',
      tips: '手臂微屈，举至肩高',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '俯身飞鸟', 
      muscle: '后肩', 
      equipment: '哑铃', 
      difficulty: '中级',
      description: '训练三角肌后束',
      tips: '俯身，手臂向两侧展开',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '器械推肩', 
      muscle: '肩', 
      equipment: '器械', 
      difficulty: '初级',
      description: '安全的肩部推举训练',
      tips: '调整座椅高度，推至头顶',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '侧平举', 
      muscle: '肩', 
      equipment: '绳索', 
      difficulty: '中级',
      description: '持续张力的肩部训练',
      tips: '身体微倾，向侧方举至肩高',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
  ],
  arms: [
    { 
      name: '杠铃弯举', 
      muscle: '二头', 
      equipment: '杠铃', 
      difficulty: '初级',
      description: '二头肌基础训练动作',
      tips: '上臂固定，弯举至顶峰收缩',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '三头下压', 
      muscle: '三头', 
      equipment: '绳索', 
      difficulty: '初级',
      description: '三头肌基础训练',
      tips: '上臂固定，下压至手臂伸直',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '锤式弯举', 
      muscle: '二头', 
      equipment: '哑铃', 
      difficulty: '初级',
      description: '训练肱肌和前臂',
      tips: '掌心相对，弯举至肩前',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '窄距卧推', 
      muscle: '三头', 
      equipment: '杠铃', 
      difficulty: '中级',
      description: '三头肌复合训练',
      tips: '双手间距与肩同宽，杠铃下落至胸部',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '哑铃弯举', 
      muscle: '二头', 
      equipment: '哑铃', 
      difficulty: '初级',
      description: '单侧二头肌训练',
      tips: '上臂固定，旋转手腕增加收缩',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '过头臂屈伸', 
      muscle: '三头', 
      equipment: '哑铃', 
      difficulty: '中级',
      description: '拉伸三头肌长头',
      tips: '上臂贴近耳朵，下落至颈后',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '集中弯举', 
      muscle: '二头', 
      equipment: '哑铃', 
      difficulty: '初级',
      description: '孤立二头肌训练',
      tips: '上臂靠在大腿内侧，弯举至顶峰',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '碎颅者', 
      muscle: '三头', 
      equipment: '杠铃', 
      difficulty: '中级',
      description: '三头肌孤立训练',
      tips: '上臂固定，弯曲手肘下落至额头',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
  ],
  core: [
    { 
      name: '平板支撑', 
      muscle: '核心', 
      equipment: '自重', 
      difficulty: '初级',
      description: '核心稳定性训练的基础动作',
      tips: '身体保持一条直线，收紧腹部',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '卷腹', 
      muscle: '腹直肌', 
      equipment: '自重', 
      difficulty: '初级',
      description: '训练腹直肌上部',
      tips: '下背部贴地，用腹部力量卷起',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '俄罗斯转体', 
      muscle: '腹斜肌', 
      equipment: '自重', 
      difficulty: '中级',
      description: '训练腹斜肌和核心旋转力量',
      tips: '身体后倾，左右转动躯干',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '悬垂举腿', 
      muscle: '下腹', 
      equipment: '自重', 
      difficulty: '高级',
      description: '高强度下腹训练',
      tips: '保持身体稳定，举腿至水平',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '仰卧交替抬腿', 
      muscle: '下腹', 
      equipment: '自重', 
      difficulty: '初级',
      description: '训练下腹部和髋屈肌',
      tips: '下背部贴地，交替抬腿',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '死虫式', 
      muscle: '核心', 
      equipment: '自重', 
      difficulty: '初级',
      description: '核心稳定性训练',
      tips: '对侧手脚同时伸展，保持腰部贴地',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '登山跑', 
      muscle: '核心', 
      equipment: '自重', 
      difficulty: '中级',
      description: '核心力量和心肺训练',
      tips: '保持臀部稳定，交替提膝',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '侧平板支撑', 
      muscle: '腹斜肌', 
      equipment: '自重', 
      difficulty: '中级',
      description: '训练侧腹和核心稳定性',
      tips: '身体呈一条直线，收紧侧腹',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
  ],
  cardio: [
    { 
      name: '跑步', 
      muscle: '有氧', 
      equipment: '跑步机', 
      difficulty: '初级',
      description: '最基础的有氧运动',
      tips: '保持匀速，调整呼吸节奏',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '跳绳', 
      muscle: '有氧', 
      equipment: '跳绳', 
      difficulty: '中级',
      description: '高效燃脂的有氧运动',
      tips: '前脚掌着地，手腕发力',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '波比跳', 
      muscle: '全身', 
      equipment: '自重', 
      difficulty: '高级',
      description: '全身性高强度训练',
      tips: '动作连贯，跳跃时充分伸展',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '开合跳', 
      muscle: '有氧', 
      equipment: '自重', 
      difficulty: '初级',
      description: '热身和有氧的基础动作',
      tips: '手脚协调，保持节奏',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '高抬腿', 
      muscle: '有氧', 
      equipment: '自重', 
      difficulty: '中级',
      description: '提升心率和腿部力量',
      tips: '膝盖抬至腰部高度，保持节奏',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '椭圆机', 
      muscle: '有氧', 
      equipment: '器械', 
      difficulty: '初级',
      description: '低冲击有氧训练',
      tips: '保持背部挺直，用力蹬踏',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '划船机', 
      muscle: '全身', 
      equipment: '器械', 
      difficulty: '中级',
      description: '全身有氧和力量训练',
      tips: '腿部先发力，背部后拉',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '战绳', 
      muscle: '全身', 
      equipment: '绳索', 
      difficulty: '高级',
      description: '高强度全身训练',
      tips: '核心收紧，双臂交替摆动',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
  ],
  forearm: [
    { 
      name: '腕弯举', 
      muscle: '前臂', 
      equipment: '杠铃', 
      difficulty: '初级',
      description: '训练前臂屈肌群',
      tips: '前臂放在凳子上，手腕下垂后弯举',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '反向腕弯举', 
      muscle: '前臂', 
      equipment: '杠铃', 
      difficulty: '初级',
      description: '训练前臂伸肌群',
      tips: '掌心向下，手腕上抬',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '农夫行走', 
      muscle: '前臂', 
      equipment: '哑铃', 
      difficulty: '中级',
      description: '提升握力和核心稳定性',
      tips: '挺胸收腹，保持稳定步伐',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '握力器训练', 
      muscle: '前臂', 
      equipment: '握力器', 
      difficulty: '初级',
      description: '针对性训练握力',
      tips: '缓慢握紧，保持2秒',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
  ],
  flexibility: [
    { 
      name: '瑜伽下犬式', 
      muscle: '全身', 
      equipment: '自重', 
      difficulty: '初级',
      description: '全身拉伸，增强柔韧性',
      tips: '手掌和脚跟尽量踩地，臀部向上',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '泡沫轴放松', 
      muscle: '全身', 
      equipment: '泡沫轴', 
      difficulty: '初级',
      description: '肌肉放松和恢复',
      tips: '缓慢滚动，找到痛点停留',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '鸽子式拉伸', 
      muscle: '臀', 
      equipment: '自重', 
      difficulty: '中级',
      description: '深度拉伸臀部和髋关节',
      tips: '前腿弯曲，后腿伸直，身体前倾',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
    { 
      name: '胸椎旋转', 
      muscle: '背部', 
      equipment: '自重', 
      difficulty: '初级',
      description: '改善胸椎灵活性',
      tips: '侧卧，手臂打开带动躯干旋转',
      video: 'https://www.bilibili.com/video/BV1GJ411x7h7'
    },
  ],
};

/**
 * 训练目标配置
 */
const GOAL_CONFIG = {
  muscle: { 
    sets: 4, 
    reps: '8-12', 
    rest: 90, 
    label: '增肌塑形',
    description: '通过中等重量、多次数训练刺激肌肉生长',
    tips: '控制离心阶段，保持肌肉张力'
  },
  fat: { 
    sets: 3, 
    reps: '12-15', 
    rest: 60, 
    label: '减脂燃脂',
    description: '高次数、短休息时间，最大化热量消耗',
    tips: '保持心率在燃脂区间，组间休息不要过长'
  },
  strength: { 
    sets: 5, 
    reps: '3-6', 
    rest: 180, 
    label: '力量提升',
    description: '大重量、低次数，提升绝对力量',
    tips: '确保动作标准，需要充分热身和保护'
  },
  endurance: { 
    sets: 3, 
    reps: '15-20', 
    rest: 45, 
    label: '耐力训练',
    description: '高次数、短休息，提升肌肉耐力',
    tips: '选择较轻重量，注重动作质量'
  },
  definition: {
    sets: 4,
    reps: '10-12',
    rest: 75,
    label: '塑形定义',
    description: '中等重量，注重肌肉收缩感',
    tips: '顶峰收缩，控制动作节奏'
  },
  power: {
    sets: 6,
    reps: '2-4',
    rest: 240,
    label: '爆发力',
    description: '大重量、低次数，提升爆发力',
    tips: '快速发力，需要良好基础'
  },
};

/**
 * 分化训练模板
 */
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
  7: [
    { name: '第1天', focus: '胸', groups: ['chest'] },
    { name: '第2天', focus: '背', groups: ['back'] },
    { name: '第3天', focus: '肩', groups: ['shoulders'] },
    { name: '第4天', focus: '腿', groups: ['legs'] },
    { name: '第5天', focus: '手臂', groups: ['arms'] },
    { name: '第6天', focus: '核心', groups: ['core'] },
    { name: '第7天', focus: '有氧 + 拉伸', groups: ['cardio', 'flexibility'] },
  ],
};

/**
 * 各级别每组动作数量
 */
const LEVEL_EXERCISE_COUNT = {
  beginner: 4,
  intermediate: 5,
  advanced: 6,
};

/**
 * 肌肉部位颜色映射（用于热力图）
 */
const MUSCLE_COLORS = {
  chest: '#e74c3c',
  back: '#3498db',
  legs: '#2ecc71',
  shoulders: '#f39c12',
  arms: '#9b59b6',
  core: '#1abc9c',
  cardio: '#e67e22',
  forearm: '#95a5a6',
  flexibility: '#16a085',
};

/**
 * 动作难度等级
 */
const DIFFICULTY_LEVELS = {
  '初级': { color: '#2ecc71', description: '适合新手，技术要求低' },
  '中级': { color: '#f39c12', description: '需要一定基础和协调性' },
  '高级': { color: '#e74c3c', description: '需要良好基础和力量' },
};

/**
 * 周期化训练模板
 */
const PERIODIZATION_TEMPLATES = {
  strength: {
    name: '力量周期',
    phases: [
      { name: '适应期', weeks: 2, sets: 3, reps: '12-15', intensity: '60%' },
      { name: '增长期', weeks: 3, sets: 4, reps: '8-10', intensity: '75%' },
      { name: '峰值期', weeks: 2, sets: 5, reps: '3-5', intensity: '90%' },
      { name: '恢复期', weeks: 1, sets: 2, reps: '15-20', intensity: '50%' },
    ],
  },
  hypertrophy: {
    name: '增肌周期',
    phases: [
      { name: '基础期', weeks: 3, sets: 3, reps: '10-12', intensity: '70%' },
      { name: '强化期', weeks: 4, sets: 4, reps: '8-12', intensity: '80%' },
      { name: '冲刺期', weeks: 2, sets: 5, reps: '6-10', intensity: '85%' },
      { name: '减载期', weeks: 1, sets: 2, reps: '15-20', intensity: '50%' },
    ],
  },
  fatLoss: {
    name: '减脂周期',
    phases: [
      { name: '适应期', weeks: 2, sets: 3, reps: '12-15', intensity: '60%' },
      { name: '燃脂期', weeks: 4, sets: 4, reps: '15-20', intensity: '65%' },
      { name: '冲刺期', weeks: 2, sets: 5, reps: '20-25', intensity: '55%' },
      { name: '恢复期', weeks: 1, sets: 2, reps: '15-20', intensity: '50%' },
    ],
  },
};

/**
 * 获取所有动作名称
 */
function getAllExerciseNames() {
  const names = new Set();
  Object.values(EXERCISES).forEach(group => {
    group.forEach(ex => names.add(ex.name));
  });
  return [...names];
}

/**
 * 根据名称获取动作详情
 */
function getExerciseByName(name) {
  for (const group of Object.values(EXERCISES)) {
    const found = group.find(ex => ex.name === name);
    if (found) return found;
  }
  return null;
}

/**
 * 根据难度筛选动作
 */
function getExercisesByDifficulty(difficulty) {
  const result = [];
  Object.values(EXERCISES).forEach(group => {
    group.forEach(ex => {
      if (ex.difficulty === difficulty) result.push(ex);
    });
  });
  return result;
}

/**
 * 根据器械筛选动作
 */
function getExercisesByEquipment(equipment) {
  const result = [];
  Object.values(EXERCISES).forEach(group => {
    group.forEach(ex => {
      if (ex.equipment === equipment) result.push(ex);
    });
  });
  return result;
}

/**
 * 根据肌肉部位筛选动作
 */
function getExercisesByMuscle(muscle) {
  const result = [];
  Object.values(EXERCISES).forEach(group => {
    group.forEach(ex => {
      if (ex.muscle === muscle) result.push(ex);
    });
  });
  return result;
}

/**
 * 智能推荐动作（根据用户历史和目标）
 */
function recommendExercises(goal, completedExercises = []) {
  const completedSet = new Set(completedExercises);
  const recommendations = [];
  
  Object.values(EXERCISES).forEach(group => {
    group.forEach(ex => {
      if (!completedSet.has(ex.name)) {
        let score = 0;
        if (goal === 'muscle' && ex.difficulty === '中级') score += 2;
        if (goal === 'fat' && ex.equipment === '自重') score += 2;
        if (goal === 'strength' && ex.difficulty === '高级') score += 2;
        if (goal === 'endurance' && ex.equipment === '自重') score += 1;
        recommendations.push({ ...ex, score });
      }
    });
  });
  
  return recommendations.sort((a, b) => b.score - a.score).slice(0, 10);
}