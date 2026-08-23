// 知途 V2 — 极简高级感设计
// Full-slide gradient backgrounds + massive typography + vast negative space
const pptxgen = require("pptxgenjs");
const path = require("path");
const fs = require("fs");

const BG = "E:\\Q1.1\\output\\bg";

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10" x 5.625"

// ═══ Premium Design System ═══
const GOLD = "C9A96E";
const WHITE = "FFFFFF";
const WARM = "C8C4BB";   // warm off-white
const MUTED = "8A8578";  // muted gray
const DARK = "0D0D0D";

// ═══ Fonts: Georgia for titles (elegant serif), Segoe UI for body (clean sans) ═══
const F = {
  display: "Georgia",          // serif elegance
  title:   "Segoe UI Light",   // clean modern
  body:    "Segoe UI",         // readable
  number:  "Georgia",          // numbers in serif
};

// ═══ Reusable patterns ═══

// Full-slide dark background with gold accent line
function darkSlide(bgFile) {
  const s = pres.addSlide();
  s.background = { path: path.join(BG, bgFile) };
  return s;
}

// Gold horizontal accent line (the "path" motif)
function goldLine(s, x, y, w) {
  s.addShape(pres.shapes.LINE, {
    x, y, w: w || 2.0, h: 0,
    line: { color: GOLD, width: 0.8 }
  });
}

// Page number — subtle, bottom right
function pn(s, n) {
  s.addText(String(n), {
    x: 9.2, y: 5.1, w: 0.5, h: 0.3,
    fontSize: 8, fontFace: F.body, color: MUTED, align: "right"
  });
}

// ═══════════════════════════════════════════
// SLIDE 1 — COVER
// ═══════════════════════════════════════════
{
  const s = darkSlide("01_cover.png");

  // Gold path line
  goldLine(s, 1.2, 1.6, 3.2);
  // Small gold dot at end of path
  s.addShape(pres.shapes.OVAL, {
    x: 4.5, y: 1.55, w: 0.1, h: 0.1,
    fill: { color: GOLD }
  });

  // Massive title
  s.addText("知途", {
    x: 1.2, y: 1.9, w: 6, h: 1.4,
    fontSize: 72, fontFace: F.display, color: WHITE, bold: true, margin: 0
  });

  // Subtitle — lightweight, generous letter spacing
  s.addText("AI 通识智研与算法赋能空间", {
    x: 1.2, y: 3.3, w: 6, h: 0.5,
    fontSize: 18, fontFace: "Segoe UI Light", color: WARM, margin: 0
  });

  // Tagline in gold italic
  s.addText("知者不惑，途者不迷", {
    x: 1.2, y: 3.85, w: 5, h: 0.4,
    fontSize: 13, fontFace: F.display, color: GOLD, italic: true, margin: 0
  });

  // Bottom line — event info
  s.addText("2026 中国国际大学生创新大赛  ·  高教主赛道 / 新工科类  ·  2026年4月", {
    x: 1.2, y: 5.0, w: 7, h: 0.3,
    fontSize: 9, fontFace: F.body, color: MUTED, margin: 0
  });
}

// ═══════════════════════════════════════════
// SLIDE 2 — Project Summary
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png");
  pn(s, 2);

  s.addText("项目摘要", {
    x: 1.2, y: 0.7, w: 5, h: 0.5,
    fontSize: 10, fontFace: F.body, color: GOLD, charSpacing: 8, margin: 0
  });
  goldLine(s, 1.2, 1.3, 1.0);

  // Body — generous spacing, limited width for readability
  s.addText("高等教育普及化进程中，全国3000余万在校大学生面临学术资源获取的结构性困境——竞赛信息离散分布，技能习得缺乏路径导航，学术产出与能力建构脱节。", {
    x: 1.2, y: 1.7, w: 5.5, h: 1.2,
    fontSize: 15, fontFace: "Segoe UI Light", color: WARM, margin: 0, lineSpacingMultiple: 1.7
  });

  s.addText("知途以知识图谱与大语言模型为技术基座，构建覆盖竞赛发现、技能建构、学术产出的三元融合算法赋能空间。致力于以\"算法平权\"为技术伦理立场——让每一位大学生都能获得同等质量的学术成长路径规划。", {
    x: 1.2, y: 3.1, w: 5.5, h: 1.2,
    fontSize: 15, fontFace: "Segoe UI Light", color: WARM, margin: 0, lineSpacingMultiple: 1.7
  });

  // Right side — 3 big stat callouts
  const stats = [
    { num: "覆盖 X 所", label: "高校" },
    { num: "服务 XXXX", label: "注册用户" },
    { num: "XX%", label: "月留存率" },
  ];
  stats.forEach((st, i) => {
    const yy = 1.7 + i * 1.1;
    goldLine(s, 7.2, yy + 0.38, 0.6);
    s.addText(st.num, {
      x: 7.2, y: yy, w: 2.4, h: 0.4,
      fontSize: 30, fontFace: F.number, color: WHITE, margin: 0
    });
    s.addText(st.label, {
      x: 7.2, y: yy + 0.5, w: 2.4, h: 0.3,
      fontSize: 10, fontFace: F.body, color: MUTED, margin: 0
    });
  });
}

// ═══════════════════════════════════════════
// SLIDE 3 — Part 1 Section Divider
// ═══════════════════════════════════════════
{
  const s = darkSlide("02_section_dark.png");
  s.addText("01", {
    x: 1.2, y: 1.2, w: 3, h: 0.6,
    fontSize: 14, fontFace: F.body, color: GOLD, charSpacing: 6, margin: 0
  });
  goldLine(s, 1.2, 1.9, 2.5);
  s.addText("项目背景", {
    x: 1.2, y: 2.2, w: 8, h: 1.0,
    fontSize: 40, fontFace: F.display, color: WHITE, margin: 0
  });
  s.addText("政策驱动 · 市场缺口 · 用户痛点  —  为什么必须做？", {
    x: 1.2, y: 3.3, w: 8, h: 0.4,
    fontSize: 14, fontFace: "Segoe UI Light", color: WARM, margin: 0
  });
}

// ═══════════════════════════════════════════
// SLIDE 4 — Market Problem (Key Insight)
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png");
  pn(s, 4);

  s.addText("核心洞察", {
    x: 1.2, y: 1.2, w: 4, h: 0.5,
    fontSize: 10, fontFace: F.body, color: GOLD, charSpacing: 8, margin: 0
  });
  goldLine(s, 1.2, 1.8, 1.0);

  s.addText("市场不缺内容，\n缺的是算法中介的\n智能导航层。", {
    x: 1.2, y: 2.2, w: 7, h: 2.0,
    fontSize: 34, fontFace: F.display, color: WHITE, margin: 0, lineSpacingMultiple: 1.3
  });

  // 3 data points
  const ds = [
    { n: "3,000万", l: "全国在校大学生（教育部2025）" },
    { n: "87%", l: "曾尝试报名至少1项竞赛" },
    { n: "40%", l: "错过竞赛报名的核心原因：信息碎片化" },
  ];
  ds.forEach((d, i) => {
    const yy = 1.3 + i * 0.9;
    s.addText(d.n, {
      x: 6.0, y: yy, w: 3.5, h: 0.4,
      fontSize: 28, fontFace: F.number, color: GOLD, margin: 0
    });
    s.addText(d.l, {
      x: 6.0, y: yy + 0.42, w: 3.5, h: 0.3,
      fontSize: 10, fontFace: F.body, color: MUTED, margin: 0
    });
  });
}

// ═══════════════════════════════════════════
// SLIDE 5 — Three Pain Points
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png");
  pn(s, 5);
  s.addText("三大痛点", {
    x: 1.2, y: 0.6, w: 4, h: 0.5,
    fontSize: 10, fontFace: F.body, color: GOLD, charSpacing: 8, margin: 0
  });
  goldLine(s, 1.2, 1.15, 0.8);

  const pains = [
    { n: "01", title: "信息熵增", desc: "信息越多，决策越难。\n数百个渠道，碎片化分布。", quote: "\"关注了十几个公众号，\n还是错过了数模报名。\"", color: GOLD },
    { n: "02", title: "路径失序", desc: "有目标，没有地图。\n从新手到获奖的道路不清晰。", quote: "\"收藏了20门课，\n学完3门就不知道下一步了。\"", color: WHITE },
    { n: "03", title: "知识孤岛", desc: "竞赛、技能、论文各有各的\n生态，互不相连。", quote: "\"比完赛才发现如果看过\n那几篇论文，方案会好很多。\"", color: GOLD },
  ];
  pains.forEach((p, i) => {
    const xx = 1.0 + i * 3.0;
    // Number
    s.addText(p.n, {
      x: xx, y: 1.6, w: 1.5, h: 0.5,
      fontSize: 14, fontFace: F.number, color: GOLD, margin: 0
    });
    // Thin separator
    goldLine(s, xx, 2.1, 0.8);
    // Title
    s.addText(p.title, {
      x: xx, y: 2.3, w: 2.6, h: 0.5,
      fontSize: 24, fontFace: F.display, color: WHITE, margin: 0
    });
    // Description
    s.addText(p.desc, {
      x: xx, y: 2.8, w: 2.6, h: 1.0,
      fontSize: 12, fontFace: "Segoe UI Light", color: WARM, margin: 0, lineSpacingMultiple: 1.5
    });
    // Quote
    s.addText(p.quote, {
      x: xx, y: 4.2, w: 2.6, h: 0.8,
      fontSize: 10, fontFace: F.display, color: MUTED, italic: true, margin: 0, lineSpacingMultiple: 1.4
    });
  });
}

// ═══════════════════════════════════════════
// SLIDE 6 — Part 2 Section Divider
// ═══════════════════════════════════════════
{
  const s = darkSlide("02_section_dark.png");
  s.addText("02", {
    x: 1.2, y: 1.2, w: 3, h: 0.6,
    fontSize: 14, fontFace: F.body, color: GOLD, charSpacing: 6, margin: 0
  });
  goldLine(s, 1.2, 1.9, 2.5);
  s.addText("解决方案", {
    x: 1.2, y: 2.2, w: 8, h: 1.0,
    fontSize: 40, fontFace: F.display, color: WHITE, margin: 0
  });
  s.addText("三个创新点 × 三大理论根基  —  我们怎么解决？", {
    x: 1.2, y: 3.3, w: 8, h: 0.4,
    fontSize: 14, fontFace: "Segoe UI Light", color: WARM, margin: 0
  });
}

// ═══════════════════════════════════════════
// SLIDE 7 — Product Definition
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png");
  pn(s, 7);

  s.addText("知途是什么", {
    x: 1.2, y: 0.7, w: 5, h: 0.5,
    fontSize: 10, fontFace: F.body, color: GOLD, charSpacing: 8, margin: 0
  });
  goldLine(s, 1.2, 1.3, 0.8);

  s.addText("以知识图谱为语义骨架、\n以大语言模型为交互界面、\n以协同过滤为推荐引擎的\n三元融合算法赋能空间。", {
    x: 1.2, y: 1.8, w: 5.5, h: 3.2,
    fontSize: 26, fontFace: F.display, color: WHITE, margin: 0, lineSpacingMultiple: 1.5
  });

  // Five modules on right side
  const mods = [
    { n: "竞赛发现", sub: "信息降熵" },
    { n: "技能建构", sub: "认知脚手架" },
    { n: "学术资源", sub: "知识关联" },
    { n: "AI智研", sub: "语义理解" },
    { n: "算法实训", sub: "实践验证" },
  ];
  mods.forEach((m, i) => {
    const yy = 1.2 + i * 0.8;
    goldLine(s, 7.0, yy + 0.3, 1.0);
    s.addText(m.n, {
      x: 7.0, y: yy, w: 2.5, h: 0.3,
      fontSize: 18, fontFace: F.display, color: WHITE, margin: 0
    });
    s.addText(m.sub, {
      x: 7.0, y: yy + 0.35, w: 2.5, h: 0.25,
      fontSize: 9, fontFace: F.body, color: MUTED, margin: 0
    });
  });
}

// ═══════════════════════════════════════════
// SLIDE 8 — Innovation 1
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png");
  pn(s, 8);

  s.addText("创新点 ①", {
    x: 1.2, y: 0.7, w: 3, h: 0.5,
    fontSize: 10, fontFace: F.body, color: GOLD, charSpacing: 8, margin: 0
  });
  goldLine(s, 1.2, 1.3, 0.8);

  s.addText("AI降熵推荐引擎", {
    x: 1.2, y: 1.6, w: 7, h: 0.7,
    fontSize: 32, fontFace: F.display, color: WHITE, margin: 0
  });
  s.addText("对应痛点：信息熵增 → Shannon信息熵 → 最小化用户决策成本", {
    x: 1.2, y: 2.3, w: 7, h: 0.3,
    fontSize: 11, fontFace: F.body, color: GOLD, margin: 0
  });

  // Left — Before/After
  s.addText("传统方式", {
    x: 1.2, y: 2.9, w: 3, h: 0.3,
    fontSize: 11, fontFace: F.body, color: MUTED, margin: 0
  });
  s.addText("平均45分钟\n跨渠道搜索+甄别\n错过率 ~40%", {
    x: 1.2, y: 3.2, w: 3, h: 1.2,
    fontSize: 14, fontFace: "Segoe UI Light", color: WARM, margin: 0, lineSpacingMultiple: 1.8
  });

  s.addText("知途方案", {
    x: 5.0, y: 2.9, w: 3, h: 0.3,
    fontSize: 11, fontFace: F.body, color: GOLD, margin: 0
  });
  const results = [
    "首页推荐 30秒",
    "错过率 < 5%",
    "用户画像 + NLP摘要",
    "日历自动调度 + 提醒",
  ];
  results.forEach((r, i) => {
    s.addText(r, {
      x: 5.0, y: 3.25 + i * 0.35, w: 4, h: 0.3,
      fontSize: 14, fontFace: "Segoe UI Light", color: WHITE, margin: 0
    });
  });
}

// ═══════════════════════════════════════════
// SLIDE 9 — Innovation 2
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png");
  pn(s, 9);

  s.addText("创新点 ②", {
    x: 1.2, y: 0.7, w: 3, h: 0.5,
    fontSize: 10, fontFace: F.body, color: GOLD, charSpacing: 8, margin: 0
  });
  goldLine(s, 1.2, 1.3, 0.8);

  s.addText("三元知识图谱", {
    x: 1.2, y: 1.6, w: 7, h: 0.7,
    fontSize: 32, fontFace: F.display, color: WHITE, margin: 0
  });
  s.addText("对应痛点：路径失序 → 最近发展区(ZPD) → 算法化的认知脚手架", {
    x: 1.2, y: 2.25, w: 7, h: 0.3,
    fontSize: 11, fontFace: F.body, color: GOLD, margin: 0
  });

  // KG triple illustration
  const nodes = [
    { name: "竞赛", x: 1.8, color: GOLD },
    { name: "技能", x: 4.5, color: WHITE },
    { name: "论文", x: 7.2, color: GOLD },
  ];
  nodes.forEach(n => {
    s.addShape(pres.shapes.OVAL, {
      x: n.x, y: 3.0, w: 1.4, h: 1.4,
      fill: { color: DARK },
      line: { color: n.color, width: 1 }
    });
    s.addText(n.name, {
      x: n.x, y: 3.0, w: 1.4, h: 1.4,
      fontSize: 18, fontFace: F.display, color: n.color, align: "center", valign: "middle", margin: 0
    });
  });

  // Connecting lines
  [3.2, 5.9].forEach(x => {
    s.addShape(pres.shapes.LINE, {
      x, y: 3.7, w: 1.3, h: 0,
      line: { color: MUTED, width: 0.5 }
    });
  });

  s.addText("输入\"我想参加数模竞赛\" → 反向KG查询 → 所需技能序列 + 前置练习赛 + 参考论文 → 最优成长路径", {
    x: 1.2, y: 4.7, w: 8, h: 0.5,
    fontSize: 12, fontFace: "Segoe UI Light", color: WARM, margin: 0
  });
}

// ═══════════════════════════════════════════
// SLIDE 10 — Innovation 3
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png");
  pn(s, 10);

  s.addText("创新点 ③", {
    x: 1.2, y: 0.7, w: 3, h: 0.5,
    fontSize: 10, fontFace: F.body, color: GOLD, charSpacing: 8, margin: 0
  });
  goldLine(s, 1.2, 1.3, 0.8);

  s.addText("\"学—练—评—产\"\n全链路AI闭环", {
    x: 1.2, y: 1.6, w: 7, h: 1.2,
    fontSize: 32, fontFace: F.display, color: WHITE, margin: 0, lineSpacingMultiple: 1.3
  });
  s.addText("对应痛点：知识孤岛 → 联通主义(Connectivism) → 学习即建立节点连接", {
    x: 1.2, y: 2.8, w: 7, h: 0.3,
    fontSize: 11, fontFace: F.body, color: GOLD, margin: 0
  });

  // Four phases in a row
  const phases = [
    { icon: "学", name: "Learn", items: "课程学习\nAI问答\n论文阅读" },
    { icon: "练", name: "Train", items: "代码实训\n在线OJ\n项目实战" },
    { icon: "评", name: "Assess", items: "自动评测\n排行榜\n技能认证" },
    { icon: "产", name: "Produce", items: "竞赛获奖\n论文发表\n经验分享" },
  ];
  phases.forEach((p, i) => {
    const xx = 1.0 + i * 2.2;
    s.addShape(pres.shapes.RECTANGLE, {
      x: xx, y: 3.2, w: 1.9, h: 2.0,
      fill: { color: i === 3 ? GOLD : "1A1A22" }
    });
    s.addText(p.icon, {
      x: xx, y: 3.3, w: 1.9, h: 0.4,
      fontSize: 24, fontFace: F.display, color: i === 3 ? DARK : GOLD, align: "center", margin: 0
    });
    s.addText(p.name, {
      x: xx, y: 3.7, w: 1.9, h: 0.3,
      fontSize: 13, fontFace: F.body, color: i === 3 ? DARK : WHITE, align: "center", margin: 0
    });
    s.addText(p.items, {
      x: xx + 0.1, y: 4.1, w: 1.7, h: 0.9,
      fontSize: 10, fontFace: "Segoe UI Light", color: i === 3 ? DARK : WARM, align: "center", margin: 0, lineSpacingMultiple: 1.5
    });
    // Arrow
    if (i < 3) {
      s.addText("→", {
        x: xx + 1.92, y: 4.0, w: 0.24, h: 0.4,
        fontSize: 16, color: GOLD, align: "center", valign: "middle", margin: 0
      });
    }
  });
}

// ═══════════════════════════════════════════
// SLIDE 11 — Part 3 Section Divider
// ═══════════════════════════════════════════
{
  const s = darkSlide("02_section_dark.png");
  s.addText("03", {
    x: 1.2, y: 1.2, w: 3, h: 0.6,
    fontSize: 14, fontFace: F.body, color: GOLD, charSpacing: 6, margin: 0
  });
  goldLine(s, 1.2, 1.9, 2.5);
  s.addText("成果验证", {
    x: 1.2, y: 2.2, w: 8, h: 1.0,
    fontSize: 40, fontFace: F.display, color: WHITE, margin: 0
  });
  s.addText("原型演示 · 落地数据 · 竞品分析  —  证明给我们看", {
    x: 1.2, y: 3.3, w: 8, h: 0.4,
    fontSize: 14, fontFace: "Segoe UI Light", color: WARM, margin: 0
  });
}

// ═══════════════════════════════════════════
// SLIDE 12 — Metrics Dashboard
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png");
  pn(s, 12);

  s.addText("落地验证", {
    x: 1.2, y: 0.7, w: 4, h: 0.5,
    fontSize: 10, fontFace: F.body, color: GOLD, charSpacing: 8, margin: 0
  });
  goldLine(s, 1.2, 1.3, 0.8);

  const metrics = [
    { v: "XXX", l: "种子用户", u: "人" },
    { v: "X", l: "覆盖高校", u: "所" },
    { v: "XX%", l: "7日留存", u: "行业20-25%" },
    { v: "XX%", l: "30日留存", u: "行业10-15%" },
    { v: "XX%", l: "报名转化率", u: "" },
    { v: "XX%", l: "课程完成率", u: "MOOC 5-10%" },
    { v: "XX", l: "NPS 净推荐值", u: "行业30-40" },
    { v: "XX", l: "日均使用时长", u: "分钟" },
  ];
  metrics.forEach((m, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const xx = 0.8 + col * 2.2;
    const yy = 1.7 + row * 1.8;
    goldLine(s, xx, yy + 0.4, 0.8);
    s.addText(m.v, {
      x: xx, y: yy, w: 2.0, h: 0.45,
      fontSize: 38, fontFace: F.number, color: WHITE, margin: 0
    });
    s.addText(m.l, {
      x: xx, y: yy + 0.55, w: 2.0, h: 0.25,
      fontSize: 10, fontFace: F.body, color: MUTED, margin: 0
    });
    if (m.u) {
      s.addText(m.u, {
        x: xx, y: yy + 0.8, w: 2.0, h: 0.2,
        fontSize: 8, fontFace: F.body, color: GOLD, margin: 0
      });
    }
  });
}

// ═══════════════════════════════════════════
// SLIDE 13 — Competitor Analysis
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png");
  pn(s, 13);

  s.addText("竞品分析", {
    x: 1.2, y: 0.7, w: 4, h: 0.5,
    fontSize: 10, fontFace: F.body, color: GOLD, charSpacing: 8, margin: 0
  });
  goldLine(s, 1.2, 1.3, 0.8);

  // Simplified competitor comparison
  const dims = [
    { d: "竞赛信息聚合", z: "★★★★★", zs: "赛氪 ★★★★" },
    { d: "AI个性化推荐", z: "★★★★★", zs: "行业 ★★" },
    { d: "技能学习路径", z: "★★★★★", zs: "MOOC ★★★★" },
    { d: "竞赛-技能-论文打通", z: "★★★★★", zs: "竞品均不足★★" },
    { d: "知识图谱", z: "★★★★★", zs: "行业空白" },
    { d: "AI对话深度", z: "★★★★★", zs: "行业 ★★" },
  ];
  dims.forEach((d, i) => {
    const yy = 1.7 + i * 0.6;
    s.addText(d.d, {
      x: 1.2, y: yy, w: 4, h: 0.3,
      fontSize: 14, fontFace: F.display, color: WHITE, margin: 0
    });
    s.addText(d.z, {
      x: 5.5, y: yy, w: 2, h: 0.3,
      fontSize: 12, fontFace: F.body, color: GOLD, margin: 0
    });
    s.addText(d.zs, {
      x: 7.2, y: yy, w: 2.5, h: 0.3,
      fontSize: 10, fontFace: F.body, color: MUTED, margin: 0
    });
  });

  // Bottom insight
  s.addText("唯一用知识图谱+大模型打通竞赛-技能-论文三场景的平台", {
    x: 1.2, y: 5.0, w: 8, h: 0.4,
    fontSize: 14, fontFace: F.display, color: GOLD, margin: 0
  });
}

// ═══════════════════════════════════════════
// SLIDE 14 — Tech Barriers
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png");
  pn(s, 14);

  s.addText("技术壁垒", {
    x: 1.2, y: 0.7, w: 4, h: 0.5,
    fontSize: 10, fontFace: F.body, color: GOLD, charSpacing: 8, margin: 0
  });
  goldLine(s, 1.2, 1.3, 0.8);

  const barriers = [
    { layer: "架构层", desc: "全栈自研 Vue 3 + Express + SQLite\n前后端解耦，微服务化预备", level: "中" },
    { layer: "算法层", desc: "自研混合推荐 + 三元知识图谱\n需领域知识积累与标注数据", level: "高" },
    { layer: "数据层", desc: "用户行为数据闭环\n冷启动→热启动，推荐持续精进", level: "高" },
    { layer: "生态层", desc: "竞赛+课程+论文+UGC四维\n多边网络效应，后来者门槛极高", level: "极高" },
  ];
  barriers.forEach((b, i) => {
    const xx = 0.7 + i * 2.3;
    s.addShape(pres.shapes.RECTANGLE, {
      x: xx, y: 1.6, w: 2.1, h: 2.8,
      fill: { color: "15151C" }
    });
    s.addText(b.layer, {
      x: xx + 0.15, y: 1.75, w: 1.8, h: 0.35,
      fontSize: 13, fontFace: F.title, color: WHITE, margin: 0
    });
    goldLine(s, xx + 0.15, 2.15, 0.6);
    s.addText(b.desc, {
      x: xx + 0.15, y: 2.4, w: 1.8, h: 1.2,
      fontSize: 10, fontFace: "Segoe UI Light", color: WARM, margin: 0, lineSpacingMultiple: 1.6
    });
    s.addText("壁垒 " + b.level, {
      x: xx + 0.15, y: 3.9, w: 1.8, h: 0.3,
      fontSize: 14, fontFace: F.number, color: GOLD, margin: 0
    });
  });

  s.addText("知识产权：软件著作权 X 项  |  技术专利 X 项（如适用）", {
    x: 1.2, y: 4.85, w: 8, h: 0.3,
    fontSize: 11, fontFace: F.body, color: MUTED, margin: 0
  });
}

// ═══════════════════════════════════════════
// SLIDE 15 — Part 4 Section Divider
// ═══════════════════════════════════════════
{
  const s = darkSlide("02_section_dark.png");
  s.addText("04", {
    x: 1.2, y: 1.2, w: 3, h: 0.6,
    fontSize: 14, fontFace: F.body, color: GOLD, charSpacing: 6, margin: 0
  });
  goldLine(s, 1.2, 1.9, 2.5);
  s.addText("产业价值", {
    x: 1.2, y: 2.2, w: 8, h: 1.0,
    fontSize: 40, fontFace: F.display, color: WHITE, margin: 0
  });
  s.addText("商业模式 · 财务预测 · 融资计划  —  为什么值得投资？", {
    x: 1.2, y: 3.3, w: 8, h: 0.4,
    fontSize: 14, fontFace: "Segoe UI Light", color: WARM, margin: 0
  });
}

// ═══════════════════════════════════════════
// SLIDE 16 — Business Model
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png");
  pn(s, 16);

  s.addText("商业模式", {
    x: 1.2, y: 0.7, w: 4, h: 0.5,
    fontSize: 10, fontFace: F.body, color: GOLD, charSpacing: 8, margin: 0
  });
  goldLine(s, 1.2, 1.3, 0.8);

  const bms = [
    { mode: "B2C 基础", desc: "竞赛信息 + 基础课程\n免费 · 用户增长引擎", rev: "" },
    { mode: "B2C 增值", desc: "AI深度路径规划\n无限AI问答", rev: "会员订阅\nXX元/月" },
    { mode: "B2B 高校", desc: "竞赛管理平台\n数据看板", rev: "SaaS年费\nXX万/校" },
    { mode: "B2B2C", desc: "官方报名通道\n数据分析报告", rev: "项目制\n收费" },
  ];
  bms.forEach((b, i) => {
    const yy = 1.7 + i * 0.95;
    goldLine(s, 1.2, yy + 0.35, 0.6);
    s.addText(b.mode, {
      x: 1.2, y: yy, w: 2.5, h: 0.4,
      fontSize: 18, fontFace: F.display, color: WHITE, margin: 0
    });
    s.addText(b.desc, {
      x: 4.0, y: yy, w: 3.0, h: 0.8,
      fontSize: 12, fontFace: "Segoe UI Light", color: WARM, margin: 0, lineSpacingMultiple: 1.5
    });
    s.addText(b.rev, {
      x: 7.5, y: yy, w: 2.0, h: 0.8,
      fontSize: 14, fontFace: F.number, color: GOLD, margin: 0, lineSpacingMultiple: 1.5
    });
  });
}

// ═══════════════════════════════════════════
// SLIDE 17 — Funding Plan
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png");
  pn(s, 17);

  s.addText("融资计划", {
    x: 1.2, y: 0.7, w: 4, h: 0.5,
    fontSize: 10, fontFace: F.body, color: GOLD, charSpacing: 8, margin: 0
  });
  goldLine(s, 1.2, 1.3, 0.8);

  // Key terms
  const terms = [
    { l: "本轮融资", v: "XX 轮" },
    { l: "融资金额", v: "XXX 万元" },
    { l: "出让股权", v: "X%" },
    { l: "资金用途", v: "研发 + 市场 + 内容 + 运营" },
  ];
  terms.forEach((t, i) => {
    const yy = 1.8 + i * 0.7;
    s.addText(t.l, {
      x: 1.2, y: yy, w: 2.5, h: 0.3,
      fontSize: 11, fontFace: F.body, color: MUTED, margin: 0
    });
    s.addText(t.v, {
      x: 3.8, y: yy, w: 5, h: 0.45,
      fontSize: 28, fontFace: F.number, color: WHITE, margin: 0
    });
    goldLine(s, 1.2, yy + 0.5, 3.0);
  });

  s.addText("财务预测：Y1 → Y2 → Y3  收入从 XX万 → XXX万 → XXXX万  第X年实现盈亏平衡", {
    x: 1.2, y: 4.8, w: 8, h: 0.4,
    fontSize: 11, fontFace: "Segoe UI Light", color: WARM, margin: 0
  });
}

// ═══════════════════════════════════════════
// SLIDE 18 — Part 5 Section Divider
// ═══════════════════════════════════════════
{
  const s = darkSlide("02_section_dark.png");
  s.addText("05", {
    x: 1.2, y: 1.2, w: 3, h: 0.6,
    fontSize: 14, fontFace: F.body, color: GOLD, charSpacing: 6, margin: 0
  });
  goldLine(s, 1.2, 1.9, 2.5);
  s.addText("项目团队", {
    x: 1.2, y: 2.2, w: 8, h: 1.0,
    fontSize: 40, fontFace: F.display, color: WHITE, margin: 0
  });
  s.addText("负责人 · 核心成员 · 指导教师  —  凭什么这个团队能做？", {
    x: 1.2, y: 3.3, w: 8, h: 0.4,
    fontSize: 14, fontFace: "Segoe UI Light", color: WARM, margin: 0
  });
}

// ═══════════════════════════════════════════
// SLIDE 19 — Team
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png");
  pn(s, 19);

  s.addText("核心团队", {
    x: 1.2, y: 0.7, w: 4, h: 0.5,
    fontSize: 10, fontFace: F.body, color: GOLD, charSpacing: 8, margin: 0
  });
  goldLine(s, 1.2, 1.3, 0.8);

  const members = [
    { name: "XXX", role: "项目负责人/全栈架构师", skills: "Vue · Node.js · ML · 团队管理" },
    { name: "XXX", role: "前端工程师", skills: "Vue 3 · TypeScript · UI设计" },
    { name: "XXX", role: "算法工程师", skills: "Python · KG · LLM · NLP" },
    { name: "XXX", role: "后端工程师", skills: "Express · SQLite · DevOps" },
    { name: "XXX", role: "产品运营", skills: "用户增长 · 品牌 · BD" },
    { name: "XXX", role: "UI/UX设计", skills: "Figma · 交互 · 视觉" },
  ];
  members.forEach((m, i) => {
    const yy = 1.7 + i * 0.55;
    goldLine(s, 1.2, yy + 0.32, 0.4);
    s.addText(m.name, {
      x: 1.2, y: yy, w: 2.0, h: 0.35,
      fontSize: 16, fontFace: F.display, color: WHITE, margin: 0
    });
    s.addText(m.role, {
      x: 3.5, y: yy + 0.02, w: 3.0, h: 0.3,
      fontSize: 12, fontFace: "Segoe UI Light", color: WARM, margin: 0
    });
    s.addText(m.skills, {
      x: 6.5, y: yy + 0.02, w: 3.0, h: 0.3,
      fontSize: 10, fontFace: F.body, color: GOLD, margin: 0
    });
  });

  s.addText("六人团队覆盖 计算机 × AI × 管理 × 设计 四大学科 · 全栈执行力", {
    x: 1.2, y: 5.05, w: 8, h: 0.3,
    fontSize: 12, fontFace: F.display, color: GOLD, margin: 0
  });
}

// ═══════════════════════════════════════════
// SLIDE 20 — Part 6 Section Divider
// ═══════════════════════════════════════════
{
  const s = darkSlide("02_section_dark.png");
  s.addText("06", {
    x: 1.2, y: 1.2, w: 3, h: 0.6,
    fontSize: 14, fontFace: F.body, color: GOLD, charSpacing: 6, margin: 0
  });
  goldLine(s, 1.2, 1.9, 2.5);
  s.addText("教育引领", {
    x: 1.2, y: 2.2, w: 8, h: 1.0,
    fontSize: 40, fontFace: F.display, color: WHITE, margin: 0
  });
  s.addText("教育公平 · 带动就业 · 未来规划  —  社会价值与远见", {
    x: 1.2, y: 3.3, w: 8, h: 0.4,
    fontSize: 14, fontFace: "Segoe UI Light", color: WARM, margin: 0
  });
}

// ═══════════════════════════════════════════
// SLIDE 21 — Education Equality
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png");
  pn(s, 21);

  s.addText("引领教育", {
    x: 1.2, y: 0.7, w: 4, h: 0.5,
    fontSize: 10, fontFace: F.body, color: GOLD, charSpacing: 8, margin: 0
  });
  goldLine(s, 1.2, 1.3, 0.8);

  s.addText("从\"接入公平\"走向\n\"算法公平\"", {
    x: 1.2, y: 1.6, w: 7, h: 1.0,
    fontSize: 34, fontFace: F.display, color: WHITE, margin: 0, lineSpacingMultiple: 1.2
  });

  s.addText("让每个人——无论所在高校的层级——都能获得同等质量的\n智能导航服务，而非在信息海洋中凭运气和家庭文化资本\"自我导航\"。", {
    x: 1.2, y: 2.7, w: 7, h: 0.8,
    fontSize: 15, fontFace: "Segoe UI Light", color: WARM, margin: 0, lineSpacingMultiple: 1.6
  });

  const dims = [
    "信息公平 — 算法为所有学生提供同等质量的竞赛推荐",
    "路径公平 — 知识图谱为每个学生生成个性化学习路径",
    "资源公平 — 平台整合公开资源 + AI助教降低学习门槛",
    "能力公平 — 浏览器内编程环境实现零门槛实训",
  ];
  dims.forEach((d, i) => {
    s.addText(d, {
      x: 1.2, y: 3.7 + i * 0.35, w: 8, h: 0.3,
      fontSize: 13, fontFace: "Segoe UI Light", color: GOLD, margin: 0
    });
  });
}

// ═══════════════════════════════════════════
// SLIDE 22 — Future Roadmap
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png");
  pn(s, 22);

  s.addText("三阶段规划", {
    x: 1.2, y: 0.7, w: 4, h: 0.5,
    fontSize: 10, fontFace: F.body, color: GOLD, charSpacing: 8, margin: 0
  });
  goldLine(s, 1.2, 1.3, 0.8);

  const phases = [
    { phase: "Phase 1  深耕", time: "2026 — 2027", items: "核心功能完整\nXX高校试点\nX万种子用户\n首轮融资", color: GOLD },
    { phase: "Phase 2  扩展", time: "2027 — 2028", items: "全网高校推广\n盈亏平衡\nA轮融资\n移动端App上线", color: WHITE },
    { phase: "Phase 3  引领", time: "2028 — 2029", items: "教育大模型\n自适应学习\nXXX万用户\n教育公平标杆", color: GOLD },
  ];
  phases.forEach((p, i) => {
    const xx = 1.0 + i * 3.0;
    goldLine(s, xx, 2.0, 1.5);
    s.addText(p.phase, {
      x: xx, y: 1.65, w: 2.8, h: 0.4,
      fontSize: 16, fontFace: F.display, color: WHITE, margin: 0
    });
    s.addText(p.time, {
      x: xx, y: 2.15, w: 2.8, h: 0.25,
      fontSize: 10, fontFace: F.body, color: MUTED, margin: 0
    });
    s.addText(p.items, {
      x: xx, y: 2.7, w: 2.5, h: 2.0,
      fontSize: 14, fontFace: "Segoe UI Light", color: WARM, margin: 0, lineSpacingMultiple: 2.0
    });
  });
}

// ═══════════════════════════════════════════
// SLIDE 23 — Closing
// ═══════════════════════════════════════════
{
  const s = darkSlide("01_cover.png");
  goldLine(s, 3.5, 1.8, 3.0);
  s.addShape(pres.shapes.OVAL, {
    x: 6.6, y: 1.75, w: 0.1, h: 0.1,
    fill: { color: GOLD }
  });
  s.addText("知途", {
    x: 0, y: 2.2, w: 10, h: 1.2,
    fontSize: 60, fontFace: F.display, color: WHITE, bold: true, align: "center", margin: 0
  });
  s.addText("AI 通识智研与算法赋能空间", {
    x: 0, y: 3.5, w: 10, h: 0.5,
    fontSize: 16, fontFace: "Segoe UI Light", color: WARM, align: "center", margin: 0
  });
  s.addText("知者不惑，途者不迷", {
    x: 0, y: 4.1, w: 10, h: 0.4,
    fontSize: 15, fontFace: F.display, color: GOLD, italic: true, align: "center", margin: 0
  });
  s.addText("[联系方式]  ·  [邮箱]  ·  [微信]", {
    x: 0, y: 4.9, w: 10, h: 0.3,
    fontSize: 10, fontFace: F.body, color: MUTED, align: "center", margin: 0
  });
}

// ═══════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════
const outPath = "E:\\Q1.1\\output\\知途-v2-premium.pptx";
pres.writeFile({ fileName: outPath }).then(() => {
  console.log("✅ 知途 V2 Premium PPT: " + outPath);
  console.log("📊 共 23 页 · 极简高级感设计");
}).catch(err => {
  console.error("❌", err.message);
  process.exit(1);
});
