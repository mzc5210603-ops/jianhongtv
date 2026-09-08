import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATEGORIES = [
  { key: 'funny', name: '搞笑' },
  { key: 'cute', name: '可爱' },
  { key: 'silly', name: '沙雕' },
  { key: 'anime', name: '动漫' },
  { key: 'pet', name: '萌宠' },
  { key: 'roast', name: '怼人' },
  { key: 'flirt', name: '撩妹' },
  { key: 'panda', name: '熊猫头' },
  { key: 'mushroom', name: '蘑菇头' },
  { key: 'cat', name: '猫咪' },
  { key: 'workplace', name: '职场' },
  { key: 'other', name: '其他' }
];

const COLLECTIONS = [
  { name: '热门斗图合集', count: 8 },
  { name: '节日特辑', count: 6 },
  { name: '猫咪大全', count: 7 },
  { name: '职场必备', count: 6 },
  { name: '撩妹语录', count: 5 },
  { name: '怼人神器', count: 8 },
  { name: '可爱萌宠', count: 6 },
  { name: '动漫精选', count: 7 }
];

const AUTHORS = ['表情包大王', '搞笑达人', '萌宠博主', '二次元少女', '职场老炮', '沙雕网友', '撩妹高手', '怼人专家', '熊猫控', '蘑菇头控', '猫咪爱好者', 'GIF制作师'];
const FORMATS = ['JPG', 'PNG', 'GIF', 'WEBP'];
const TAGS_POOL = [
  '搞笑', '哈哈', '笑死人', '笑哭', '滑稽', '搞怪', '逗比',
  '可爱', '萌', '萌萌哒', '卡哇伊', '软萌', '甜心',
  '沙雕', '智障', '奇葩', '二货', '蠢萌',
  '动漫', '二次元', '日系', 'ACG', '番剧',
  '萌宠', '狗狗', '猫咪', '仓鼠', '兔兔',
  '怼人', '撕逼', '吐槽', '毒舌', '犀利',
  '撩妹', '撩汉', '情话', '表白', '甜蜜',
  '熊猫头', '熊猫', '国宝',
  '蘑菇头', '蚊子动漫',
  '猫咪', '橘猫', '英短', '布偶',
  '职场', '上班', '加班', '打工人', '摸鱼',
  '生气', '愤怒', '发飙',
  '开心', '快乐', '兴奋',
  '难过', '伤心', '委屈',
  '无语', '无奈', '摊手',
  '点赞', '牛批', '666',
  '收到', 'OK', '没问题'
];

const NAMES_POOL = {
  funny: ['哈哈哈笑死我了', '你是来搞笑的吗', '笑到肚子疼', '这也太逗了', '沙雕本雕', '笑出鹅叫', '逗比日常', '我笑疯了', '笑到劈叉', '原地笑炸', '笑到头掉', '救命好搞笑'],
  cute: ['小可爱出现了', '萌化了我的心', '软萌软萌哒', '卡哇伊内~', '亲亲抱抱', '举高高', '小甜心', '萌到犯规', '可爱暴击', '心都化了', '小乖乖', '么么哒'],
  silly: ['本沙雕在此', '智商已下线', '二哈附体', '脑子是个好东西', '我是谁我在哪', '风中凌乱', '沙雕日常', '智障儿童欢乐多', '二到深处自然萌', '精神小伙', '憨憨本憨', '不太聪明的亚子'],
  anime: ['我妻由乃式微笑', '火影跑', '欧拉欧拉', '木大木大', 'JOJO立', '东京吃货', '进击的巨人', '鬼灭之刃', '咒术回战', '间谍过家家', '阿尼亚脸', '皮卡丘十万伏特'],
  pet: ['柯基电臀', '柴犬微笑', '二哈拆家', '橘猫警告', '布偶仙女', '法斗皱脸', '萨摩耶天使', '金毛暖男', '边牧智商碾压', '仓鼠瓜子', '兔兔吃草', '猫咪凝视'],
  roast: ['你脑子进水了', '滚犊子', '关我屁事', '你行你上', '垃圾', '废物', '给爷爬', '我劝你善良', '脸呢？', '要点脸行吗', '呵呵哒', '你在教我做事？'],
  flirt: ['今晚月色真美', '我喜欢你', '做我女朋友吧', '撩你一下', '心动的感觉', '你是我的唯一', '土味情话', '被你迷住了', '想你了', '亲亲', '抱抱', '爱你哟'],
  panda: ['熊猫头点赞', '熊猫头OK', '熊猫头无奈', '熊猫头偷笑', '熊猫头生气', '熊猫头鄙视', '熊猫头嘲讽', '熊猫头摊手', '熊猫头委屈', '熊猫头吃瓜', '熊猫头疑惑', '熊猫头躺平'],
  mushroom: ['蘑菇头得意', '蘑菇头坏笑', '蘑菇头嫌弃', '蘑菇头无语', '蘑菇头嚣张', '蘑菇头欠揍', '蘑菇头装逼', '蘑菇头搞怪', '蘑菇头挑衅', '蘑菇头邪笑', '蘑菇头装傻', '蘑菇头牛逼'],
  cat: ['猫咪鄙视', '猫咪暗中观察', '猫咪疑惑', '猫咪炸毛', '猫咪撒娇', '猫咪求抚摸', '猫咪伸懒腰', '猫咪打哈欠', '猫咪磨爪子', '猫咪踩奶', '猫咪咬人', '猫咪碰瓷'],
  workplace: ['打工人打工魂', '不想上班', '加班使我快乐', '摸鱼中勿扰', '工资到手', '甲方爸爸', '需求又变了', 'Bug又来了', '上线倒计时', '周五下午', '周一综合症', '下班万岁'],
  other: ['其他分类表情1', '其他分类表情2', '其他分类表情3', '其他分类表情4', '其他分类表情5', '其他分类表情6', '其他分类表情7', '其他分类表情8', '其他分类表情9', '其他分类表情10', '杂项表情A', '万能表情包']
};

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr, n) {
  const result = [];
  const copy = [...arr];
  for (let i = 0; i < n && copy.length > 0; i++) {
    result.push(copy.splice(rand(0, copy.length - 1), 1)[0]);
  }
  return result;
}

function randomDate() {
  const now = new Date();
  const past = new Date(now.getTime() - rand(1, 365) * 24 * 60 * 60 * 1000);
  return past.toISOString().split('T')[0];
}

function generateMemes() {
  const memes = [];
  let id = 1;

  CATEGORIES.forEach(cat => {
    const names = NAMES_POOL[cat.key] || NAMES_POOL.other;
    for (let i = 0; i < 12; i++) {
      const format = FORMATS[rand(0, FORMATS.length - 1)];
      const width = rand(200, 800);
      const height = rand(200, 800);
      const name = names[i % names.length] + (i >= names.length ? ` ${i + 1}` : '');
      const seed = `meme-${cat.key}-${id}`;
      const isHot = Math.random() < 0.3;
      const isNew = Math.random() < 0.2;
      const collectionsForMeme = pick(COLLECTIONS.map(c => c.name), rand(0, 2));

      memes.push({
        id: id++,
        name: name,
        imageUrl: `https://picsum.photos/seed/${seed}/${width}/${height}`,
        thumbnailUrl: `https://picsum.photos/seed/${seed}/400/400`,
        author: AUTHORS[rand(0, AUTHORS.length - 1)],
        uploadTime: randomDate(),
        tags: pick(TAGS_POOL, rand(3, 6)),
        category: cat.key,
        width: width,
        height: height,
        sizeKB: rand(20, 2000),
        format: format,
        likes: rand(10, 99999),
        downloads: rand(5, 50000),
        views: rand(100, 500000),
        collections: collectionsForMeme.length > 0 ? collectionsForMeme : null,
        isHot: isHot,
        isNew: isNew
      });
    }
  });

  const collectionsData = COLLECTIONS.map(col => {
    const collectionMemes = memes
      .filter(m => m.collections && m.collections.includes(col.name))
      .slice(0, col.count);
    let remaining = col.count - collectionMemes.length;
    if (remaining > 0) {
      const others = memes.filter(m => !m.collections || !m.collections.includes(col.name));
      const extras = pick(others, remaining);
      extras.forEach(e => {
        if (!e.collections) e.collections = [];
        if (!e.collections.includes(col.name)) e.collections.push(col.name);
      });
      return {
        name: col.name,
        memeIds: [...collectionMemes.map(m => m.id), ...extras.map(e => e.id)]
      };
    }
    return {
      name: col.name,
      memeIds: collectionMemes.map(m => m.id)
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    total: memes.length,
    categories: CATEGORIES,
    collections: collectionsData,
    memes: memes
  };
}

function fetchData() {
  return new Promise((resolve) => {
    try {
      const data = generateMemes();
      resolve(data);
    } catch (e) {
      console.log('Error generating data:', e.message);
      resolve(generateMemes());
    }
  });
}

async function main() {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const outputPath = path.join(dataDir, 'data.json');
  console.log('Generating meme data...');

  const data = await fetchData();
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(outputPath, json, 'utf-8');

  console.log(`✓ Generated ${data.memes.length} memes + ${data.collections.length} collections`);
  console.log(`✓ Saved to: ${outputPath}`);
}

main().catch(console.error);
