/**
 * 将 d3-celestial 的星座连线数据转换为本项目格式
 *
 * d3-celestial 格式：
 *  - coordinates: [[raDeg, decDeg], ...]（连续折线）
 *  - id: 星座缩写（如 "Ori", "CMa"）
 *
 * 转换逻辑：
 *  1. 遍历每个星座的每段折线
 *  2. 用 (ra_deg, dec) 在 9000 颗星中找最近匹配
 *  3. 过滤无效连线
 *  4. 输出星座中文名 + 配对连线
 */

const fs = require('fs');
const path = require('path');

// ---- 星座缩写 → 中文名映射 ----
const CON_TO_CN = {
  'And': '仙女座', 'Ant': '唧筒座', 'Aps': '天燕座', 'Aql': '天鹰座',
  'Aqr': '宝瓶座', 'Ara': '天坛座', 'Ari': '白羊座', 'Aur': '御夫座',
  'Boo': '牧夫座', 'Cae': '雕具座', 'Cam': '鹿豹座', 'Cap': '摩羯座',
  'Car': '船底座', 'Cas': '仙后座', 'Cen': '半人马座', 'Cep': '仙王座',
  'Cet': '鲸鱼座', 'Cha': '蝘蜓座', 'Cir': '圆规座', 'CMa': '大犬座',
  'CMi': '小犬座', 'Cnc': '巨蟹座', 'Col': '天鸽座', 'Com': '后发座',
  'CrA': '南冕座', 'CrB': '北冕座', 'Crt': '巨爵座', 'Cru': '南十字座',
  'Crv': '乌鸦座', 'CVn': '猎犬座', 'Cyg': '天鹅座', 'Del': '海豚座',
  'Dor': '剑鱼座', 'Dra': '天龙座', 'Equ': '小马座', 'Eri': '波江座',
  'For': '天炉座', 'Gem': '双子座', 'Gru': '天鹤座', 'Her': '武仙座',
  'Hor': '时钟座', 'Hya': '长蛇座', 'Hyi': '水蛇座', 'Ind': '印第安座',
  'Lac': '蝎虎座', 'Leo': '狮子座', 'Lep': '天兔座', 'Lib': '天秤座',
  'LMi': '小狮座', 'Lup': '豺狼座', 'Lyn': '天猫座', 'Lyr': '天琴座',
  'Men': '山案座', 'Mic': '显微镜座', 'Mon': '麒麟座', 'Mus': '苍蝇座',
  'Nor': '矩尺座', 'Oct': '南极座', 'Oph': '蛇夫座', 'Ori': '猎户座',
  'Pav': '孔雀座', 'Peg': '飞马座', 'Per': '英仙座', 'Phe': '凤凰座',
  'Pic': '绘架座', 'PsA': '南鱼座', 'Psc': '双鱼座', 'Pup': '船尾座',
  'Pyx': '罗盘座', 'Ret': '网罟座', 'Scl': '玉夫座', 'Sco': '天蝎座',
  'Sct': '盾牌座', 'Ser': '巨蛇座', 'Sex': '六分仪座', 'Sge': '天箭座',
  'Sgr': '人马座', 'Tau': '金牛座', 'Tel': '望远镜座', 'TrA': '南三角座',
  'Tri': '三角座', 'Tuc': '杜鹃座', 'UMa': '大熊座', 'UMi': '小熊座',
  'Vel': '船帆座', 'Vir': '室女座', 'Vol': '飞鱼座', 'Vul': '狐狸座',
};

// ---- 查找最近星 ----
function findClosestStar(stars, raDeg, decDeg) {
  // 将 RA 从度转换为小时
  const raHour = raDeg / 15.0;

  let best = null;
  let bestDist = Infinity;
  const THRESHOLD = 2.0; // 度

  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    const dRA = (s.ra - raHour) * 15.0; // 转换为度
    const dDec = s.dec - decDeg;
    const dist = Math.sqrt(dRA * dRA + dDec * dDec);
    if (dist < bestDist) {
      bestDist = dist;
      best = s;
    }
  }

  if (bestDist < THRESHOLD) {
    return best;
  }
  return null;
}

// ---- 主流程 ----
function convert() {
  const starsPath = path.join(__dirname, '..', 'public', 'stars-full.json');
  const celestialPath = path.join(__dirname, '..', 'public', 'celestial-lines.json');
  const outputPath = path.join(__dirname, '..', 'src', 'data', 'constellationLines.json');

  console.log('Reading stars...');
  const stars = JSON.parse(fs.readFileSync(starsPath, 'utf8'));
  console.log('Stars:', stars.length);

  console.log('Reading d3-celestial lines...');
  const celestial = JSON.parse(fs.readFileSync(celestialPath, 'utf8'));
  console.log('Constellations:', celestial.features.length);

  const result = [];
  let totalSegments = 0;
  let matchedSegments = 0;
  let starsNotFound = 0;

  for (const feature of celestial.features) {
    const conAbbr = feature.id;
    const conCN = CON_TO_CN[conAbbr];
    if (!conCN) {
      console.log(`  Skipping unknown constellation: ${conAbbr}`);
      continue;
    }

    const coords = feature.geometry.coordinates; // [[[ra,dec],...],...]
    const lines = [];

    for (const polyline of coords) {
      // 折线 → 分段连线
      for (let i = 0; i < polyline.length - 1; i++) {
        totalSegments++;
        const [raA, decA] = polyline[i];
        const [raB, decB] = polyline[i + 1];

        const starA = findClosestStar(stars, raA, decA);
        const starB = findClosestStar(stars, raB, decB);

        if (starA && starB && starA.id !== starB.id) {
          lines.push([starA.id, starB.id]);
          matchedSegments++;
        } else {
          starsNotFound++;
        }
      }
    }

    // 去重
    const uniqueLines = [];
    const seen = new Set();
    for (const [a, b] of lines) {
      const key = a < b ? `${a}|${b}` : `${b}|${a}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueLines.push([a, b]);
      }
    }

    if (uniqueLines.length > 0) {
      result.push({ constellation: conCN, lines: uniqueLines });
    }
  }

  console.log(`\n统计:`);
  console.log(`  总线段: ${totalSegments}`);
  console.log(`  匹配线段: ${matchedSegments}`);
  console.log(`  匹配失败: ${starsNotFound}`);
  console.log(`  有连线的星座: ${result.length} / ${celestial.features.length}`);
  console.log(`  总连线数: ${result.reduce((s, c) => s + c.lines.length, 0)}`);

  // 写入输出
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`\n写入: ${outputPath}`);
}

convert();