/**
 * 从 HYG v4.1 CSV 构建 stars-full.json
 * 
 * 全量输出：仅过滤掉太阳 (id=0) 及无星等/无坐标的行
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

// ---- CSV 解析 ----
function parseCsvLine(line) {
  const cols = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      cols.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cols.push(current.trim());
  return cols;
}

// ---- 主流程 ----
function build() {
  const csvPath = path.join(__dirname, 'hygdata_v3.csv');
  const outputPath = path.join(__dirname, '..', 'public', 'stars-full.json');

  console.log('Reading CSV:', csvPath);
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n');
  console.log('Total rows:', lines.length);

  // 解析表头定位字段索引
  const header = parseCsvLine(lines[0]);
  const idx = {
    id: header.indexOf('id'),
    proper: header.indexOf('proper'),
    ra: header.indexOf('ra'),
    dec: header.indexOf('dec'),
    dist: header.indexOf('dist'),
    mag: header.indexOf('mag'),
    spect: header.indexOf('spect'),
    bayer: header.indexOf('bayer'),
    flam: header.indexOf('flam'),
    con: header.indexOf('con'),
  };
  console.log('Field indices:', idx);

  // 去掉太阳 (id=0)
  const stars = [];
  let skippedNoMag = 0;
  let skippedNoCoord = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = parseCsvLine(line);
    const id = cols[idx.id];
    if (!id || id === '0') continue;

    const magStr = cols[idx.mag];
    if (!magStr || magStr === '') { skippedNoMag++; continue; }
    const mag = parseFloat(magStr);
    if (isNaN(mag)) { skippedNoMag++; continue; }

    const ra = parseFloat(cols[idx.ra]);
    const dec = parseFloat(cols[idx.dec]);
    if (isNaN(ra) || isNaN(dec)) { skippedNoCoord++; continue; }

    const dist = parseFloat(cols[idx.dist]) || 0;
    const spect = cols[idx.spect] || '';
    const proper = cols[idx.proper] || '';
    const bayer = cols[idx.bayer] || '';
    const flam = cols[idx.flam] || '';
    const conAbbr = cols[idx.con] || '';
    const constellation = CON_TO_CN[conAbbr] || conAbbr;

    // 生成 id: 优先用 proper 名，否则用 HIP 或 HD 编号
    const hip = cols[1] || '';
    const hd = cols[2] || '';
    const starId = proper || (hip ? `HIP${hip}` : `HD${hd}`);

    // 生成 name（中文名）：没有 proper 名就用星座缩写 + 编号
    const nameEn = proper || starId;
    const name = nameEn;

    // 合并 bayer 和 flam 到 bf 字段
    let bf = ''
    if (bayer) {
      // 保留原始 bayer 前缀（如 "Alp", "Bet"），供前端解析
      bf = bayer
    } else if (flam) {
      // Flamsteed 编号
      bf = flam
    }

    stars.push({
      id: starId,
      name,
      nameEn,
      bf,
      con: conAbbr,
      ra,
      dec,
      dist,
      mag,
      spect,
      constellation,
    });
  }

  console.log(`\n过滤统计:`);
  console.log(`  无 mag 数据: ${skippedNoMag}`);
  console.log(`  无坐标: ${skippedNoCoord}`);
  console.log(`  输出星数: ${stars.length}`);

  // 写入 JSON
  const json = JSON.stringify(stars);
  fs.writeFileSync(outputPath, json, 'utf8');
  const sizeMB = (Buffer.byteLength(json, 'utf8') / 1024 / 1024).toFixed(2);
  console.log(`\n写入: ${outputPath} (${sizeMB} MB)`);
}

build();