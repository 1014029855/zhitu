// 知途 V3 — 极简高级感 + DALL-E 图片嵌入
const pptxgen = require("pptxgenjs");
const path = require("path");
const fs = require("fs");

const BG = "E:\\Q1.1\\output\\bg";
const IMG = "E:\\Q1.1\\output\\images";

function img(name) { return path.join(IMG, name); }

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";

// ═══ Design System ═══
const G = "C9A96E"; // gold
const W = "FFFFFF"; // white
const M = "8A8578"; // muted gray
const D = "0D0D0D"; // dark
const C = "C8C4BB"; // cream/warm

const F = { display: "Georgia", title: "Segoe UI Light", body: "Segoe UI", num: "Georgia" };

function darkSlide(bgFile) { const s = pres.addSlide(); s.background = { path: path.join(BG, bgFile) }; return s; }
function imgSlide(imgFile) { const s = pres.addSlide(); s.background = { path: path.join(IMG, imgFile) }; return s; }
function goldLine(s, x, y, w) { s.addShape(pres.shapes.LINE, { x, y, w: w || 2, h: 0, line: { color: G, width: 0.8 } }); }
function pn(s, n) { s.addText(String(n), { x: 9.2, y: 5.1, w: 0.5, h: 0.3, fontSize: 8, fontFace: F.body, color: M, align: "right" }); }

// ═══════════════════════════════════════════
// SLIDE 1 — COVER with hero background
// ═══════════════════════════════════════════
{
  const s = imgSlide("01_hero_bg.png");
  // Semi-transparent overlay for text readability
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 2.5, h: 5.625, fill: { color: "000000", transparency: 40 } });

  goldLine(s, 1.2, 1.6, 2.5);
  s.addShape(pres.shapes.OVAL, { x: 3.8, y: 1.55, w: 0.1, h: 0.1, fill: { color: G } });

  s.addText("知途", { x: 1.2, y: 1.9, w: 6, h: 1.4, fontSize: 72, fontFace: F.display, color: W, bold: true, margin: 0 });
  s.addText("AI 通识智研与算法赋能空间", { x: 1.2, y: 3.3, w: 6, h: 0.5, fontSize: 18, fontFace: F.title, color: C, margin: 0 });
  s.addText("知者不惑，途者不迷", { x: 1.2, y: 3.85, w: 5, h: 0.4, fontSize: 13, fontFace: F.display, color: G, italic: true, margin: 0 });
  s.addText("2026 中国国际大学生创新大赛  ·  高教主赛道 / 新工科类  ·  2026年4月", { x: 1.2, y: 5.0, w: 7, h: 0.3, fontSize: 9, fontFace: F.body, color: M, margin: 0 });
}

// ═══════════════════════════════════════════
// SLIDE 2 — Project Summary
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png"); pn(s, 2);
  s.addText("项目摘要", { x: 1.2, y: 0.6, w: 5, h: 0.5, fontSize: 10, fontFace: F.body, color: G, charSpacing: 8, margin: 0 });
  goldLine(s, 1.2, 1.2, 1.0);
  s.addText("高等教育普及化进程中，全国3000余万在校大学生面临学术资源获取的结构性困境——竞赛信息离散分布，技能习得缺乏路径导航，学术产出与能力建构脱节。", { x: 1.2, y: 1.7, w: 5.5, h: 1.2, fontSize: 15, fontFace: F.title, color: C, margin: 0, lineSpacingMultiple: 1.7 });
  s.addText("知途以知识图谱与大语言模型为技术基座，构建覆盖竞赛发现、技能建构、学术产出的三元融合算法赋能空间。致力于以\"算法平权\"为技术伦理立场——让每一位大学生都能获得同等质量的学术成长路径规划。", { x: 1.2, y: 3.1, w: 5.5, h: 1.2, fontSize: 15, fontFace: F.title, color: C, margin: 0, lineSpacingMultiple: 1.7 });
  [{ n: "覆盖 X 所", l: "高校" }, { n: "服务 XXXX", l: "注册用户" }, { n: "XX%", l: "月留存率" }].forEach((st, i) => {
    const yy = 1.7 + i * 1.1;
    goldLine(s, 7.2, yy + 0.38, 0.6);
    s.addText(st.n, { x: 7.2, y: yy, w: 2.4, h: 0.4, fontSize: 30, fontFace: F.num, color: W, margin: 0 });
    s.addText(st.l, { x: 7.2, y: yy + 0.5, w: 2.4, h: 0.3, fontSize: 10, fontFace: F.body, color: M, margin: 0 });
  });
}

// ═══════════════════════════════════════════
// SLIDE 3 — Part 1 Section Divider
// ═══════════════════════════════════════════
{
  const s = darkSlide("02_section_dark.png");
  s.addText("01", { x: 1.2, y: 1.2, w: 3, h: 0.6, fontSize: 14, fontFace: F.body, color: G, charSpacing: 6, margin: 0 });
  goldLine(s, 1.2, 1.9, 2.5);
  s.addText("项目背景", { x: 1.2, y: 2.2, w: 8, h: 1.0, fontSize: 40, fontFace: F.display, color: W, margin: 0 });
  s.addText("政策驱动 · 市场缺口 · 用户痛点 — 为什么必须做？", { x: 1.2, y: 3.3, w: 8, h: 0.4, fontSize: 14, fontFace: F.title, color: C, margin: 0 });
}

// ═══════════════════════════════════════════
// SLIDE 4 — Three Pain Points (WITH IMAGE)
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png"); pn(s, 4);
  s.addText("三大痛点", { x: 1.2, y: 0.5, w: 4, h: 0.5, fontSize: 10, fontFace: F.body, color: G, charSpacing: 8, margin: 0 });
  goldLine(s, 1.2, 1.05, 0.8);

  // Pain point image - right side
  s.addImage({ path: img("09_pain_points.png"), x: 5.2, y: 0.5, w: 4.5, h: 4.8, sizing: { type: "contain", w: 4.5, h: 4.8 } });

  // Three text descriptions on left
  const pains = [
    { n: "01", title: "信息熵增", desc: "信息越多，决策越难。数百个渠道，碎片化分布。", quote: "\"关注了十几个公众号，还是错过了数模报名。\"" },
    { n: "02", title: "路径失序", desc: "有目标，没有地图。从新手到获奖的道路不清晰。", quote: "\"收藏了20门课，学完3门就不知道下一步了。\"" },
    { n: "03", title: "知识孤岛", desc: "竞赛、技能、论文各有各的生态，互不相连。", quote: "\"比完赛才发现如果看过那几篇论文，方案会好很多。\"" },
  ];
  pains.forEach((p, i) => {
    const yy = 1.35 + i * 1.45;
    goldLine(s, 1.2, yy + 0.2, 0.5);
    s.addText(p.n, { x: 1.2, y: yy, w: 0.5, h: 0.25, fontSize: 11, fontFace: F.num, color: G, margin: 0 });
    s.addText(p.title, { x: 1.8, y: yy, w: 3.2, h: 0.25, fontSize: 18, fontFace: F.display, color: W, margin: 0 });
    s.addText(p.desc, { x: 1.2, y: yy + 0.45, w: 3.8, h: 0.5, fontSize: 11, fontFace: F.title, color: C, margin: 0, lineSpacingMultiple: 1.4 });
    s.addText(p.quote, { x: 1.2, y: yy + 0.95, w: 3.8, h: 0.4, fontSize: 9, fontFace: F.display, color: M, italic: true, margin: 0 });
  });
}

// ═══════════════════════════════════════════
// SLIDE 5 — Part 2 Section Divider
// ═══════════════════════════════════════════
{
  const s = darkSlide("02_section_dark.png");
  s.addText("02", { x: 1.2, y: 1.2, w: 3, h: 0.6, fontSize: 14, fontFace: F.body, color: G, charSpacing: 6, margin: 0 });
  goldLine(s, 1.2, 1.9, 2.5);
  s.addText("解决方案", { x: 1.2, y: 2.2, w: 8, h: 1.0, fontSize: 40, fontFace: F.display, color: W, margin: 0 });
  s.addText("三个创新点 × 三大理论根基 — 我们怎么解决？", { x: 1.2, y: 3.3, w: 8, h: 0.4, fontSize: 14, fontFace: F.title, color: C, margin: 0 });
}

// ═══════════════════════════════════════════
// SLIDE 6 — Platform Modules (WITH IMAGE)
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png"); pn(s, 6);
  s.addText("知途是什么", { x: 1.2, y: 0.5, w: 5, h: 0.5, fontSize: 10, fontFace: F.body, color: G, charSpacing: 8, margin: 0 });
  goldLine(s, 1.2, 1.05, 0.8);

  // Platform image - full right area
  s.addImage({ path: img("10_platform_modules.png"), x: 5.0, y: 0.2, w: 5.0, h: 5.2, sizing: { type: "contain", w: 5.0, h: 5.2 } });

  s.addText("以知识图谱为语义骨架、以大语言模型为交互界面、以协同过滤为推荐引擎的三元融合算法赋能空间。", { x: 1.2, y: 1.5, w: 4.0, h: 2.0, fontSize: 20, fontFace: F.display, color: W, margin: 0, lineSpacingMultiple: 1.5 });

  ["竞赛发现 — 信息降熵层", "技能建构 — 认知脚手架层", "学术资源 — 知识关联层", "AI智研 — 语义理解层", "算法实训 — 实践验证层"].forEach((m, i) => {
    s.addText(m, { x: 1.2, y: 3.6 + i * 0.35, w: 4.0, h: 0.3, fontSize: 12, fontFace: F.title, color: i % 2 === 0 ? G : C, margin: 0 });
  });
}

// ═══════════════════════════════════════════
// SLIDE 7 — Innovation 1 (AI Recommendation)
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png"); pn(s, 7);
  s.addText("创新点 ①", { x: 1.2, y: 0.5, w: 3, h: 0.5, fontSize: 10, fontFace: F.body, color: G, charSpacing: 8, margin: 0 });
  goldLine(s, 1.2, 1.05, 0.8);
  s.addText("AI降熵推荐引擎", { x: 1.2, y: 1.4, w: 7, h: 0.7, fontSize: 32, fontFace: F.display, color: W, margin: 0 });
  s.addText("对应痛点 ① 信息熵增 → Shannon信息熵 → 最小化用户决策成本", { x: 1.2, y: 2.1, w: 7, h: 0.3, fontSize: 11, fontFace: F.body, color: G, margin: 0 });

  // Two-column comparison
  s.addText("传统方式", { x: 1.2, y: 2.7, w: 3, h: 0.3, fontSize: 11, fontFace: F.body, color: M, margin: 0 });
  s.addText("平均45分钟跨渠道搜索\n错过率约40%\n依赖学生自主关注", { x: 1.2, y: 3.0, w: 3.5, h: 1.2, fontSize: 13, fontFace: F.title, color: C, margin: 0, lineSpacingMultiple: 1.8 });

  s.addText("知途方案", { x: 5.2, y: 2.7, w: 3, h: 0.3, fontSize: 11, fontFace: F.body, color: G, margin: 0 });
  ["首页推荐30秒发现匹配竞赛", "用户画像+行为序列+时间维度", "混合推荐：70%CF+20%Content+10%Diversity", "竞赛日历自动调度+多级提醒"].forEach((r, i) => {
    s.addText(r, { x: 5.2, y: 3.05 + i * 0.38, w: 4.5, h: 0.3, fontSize: 13, fontFace: F.title, color: W, margin: 0 });
  });
}

// ═══════════════════════════════════════════
// SLIDE 8 — Innovation 2 (Knowledge Graph) WITH IMAGE
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png"); pn(s, 8);
  s.addText("创新点 ②", { x: 1.2, y: 0.5, w: 3, h: 0.5, fontSize: 10, fontFace: F.body, color: G, charSpacing: 8, margin: 0 });
  goldLine(s, 1.2, 1.05, 0.8);
  s.addText("三元知识图谱", { x: 1.2, y: 1.4, w: 7, h: 0.7, fontSize: 32, fontFace: F.display, color: W, margin: 0 });
  s.addText("对应痛点 ② 路径失序 → 最近发展区(ZPD) → 算法化的认知脚手架", { x: 1.2, y: 2.05, w: 7, h: 0.3, fontSize: 11, fontFace: F.body, color: G, margin: 0 });

  // KG image
  s.addImage({ path: img("02_knowledge_graph.png"), x: 0.8, y: 2.5, w: 4.5, h: 2.8, sizing: { type: "contain", w: 4.5, h: 2.8 } });

  // Text on right
  s.addText("竞赛-技能-论文\n三元关联建模", { x: 5.5, y: 2.6, w: 4.0, h: 1.0, fontSize: 18, fontFace: F.display, color: W, margin: 0, lineSpacingMultiple: 1.4 });
  s.addText("\"想参加数模竞赛？\" → 反向KG查询\n→ 所需技能序列 + 前置练习赛\n→ 参考获奖论文 → 最优成长路径", { x: 5.5, y: 3.8, w: 4.0, h: 1.2, fontSize: 12, fontFace: F.title, color: G, margin: 0, lineSpacingMultiple: 1.8 });
}

// ═══════════════════════════════════════════
// SLIDE 9 — Innovation 3 (Learning Loop) WITH IMAGE
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png"); pn(s, 9);
  s.addText("创新点 ③", { x: 1.2, y: 0.5, w: 3, h: 0.5, fontSize: 10, fontFace: F.body, color: G, charSpacing: 8, margin: 0 });
  goldLine(s, 1.2, 1.05, 0.8);
  s.addText("\"学—练—评—产\" 全链路AI闭环", { x: 1.2, y: 1.4, w: 7, h: 0.7, fontSize: 32, fontFace: F.display, color: W, margin: 0 });
  s.addText("对应痛点 ③ 知识孤岛 → 联通主义(Connectivism) → 学习即建立节点连接", { x: 1.2, y: 2.0, w: 8, h: 0.3, fontSize: 11, fontFace: F.body, color: G, margin: 0 });

  // Loop image - large
  s.addImage({ path: img("03_learning_loop.png"), x: 2.5, y: 2.3, w: 5.5, h: 3.5, sizing: { type: "contain", w: 5.5, h: 3.5 } });
}

// ═══════════════════════════════════════════
// SLIDE 10 — Part 3 Section Divider
// ═══════════════════════════════════════════
{
  const s = darkSlide("02_section_dark.png");
  s.addText("03", { x: 1.2, y: 1.2, w: 3, h: 0.6, fontSize: 14, fontFace: F.body, color: G, charSpacing: 6, margin: 0 });
  goldLine(s, 1.2, 1.9, 2.5);
  s.addText("成果验证", { x: 1.2, y: 2.2, w: 8, h: 1.0, fontSize: 40, fontFace: F.display, color: W, margin: 0 });
  s.addText("原型演示 · 落地数据 · 竞品分析 — 证明给我们看", { x: 1.2, y: 3.3, w: 8, h: 0.4, fontSize: 14, fontFace: F.title, color: C, margin: 0 });
}

// ═══════════════════════════════════════════
// SLIDE 11 — Data Dashboard (WITH IMAGE)
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png"); pn(s, 11);
  s.addText("落地验证", { x: 1.2, y: 0.5, w: 4, h: 0.5, fontSize: 10, fontFace: F.body, color: G, charSpacing: 8, margin: 0 });
  goldLine(s, 1.2, 1.05, 0.8);

  // Dashboard image
  s.addImage({ path: img("04_dashboard.png"), x: 0.5, y: 1.3, w: 9.0, h: 4.5, sizing: { type: "contain", w: 9.0, h: 4.5 } });

  // Data overlay text
  const metrics = [
    { v: "XXX", l: "种子用户", u: "人" }, { v: "X", l: "覆盖高校", u: "所" },
    { v: "XX%", l: "7日留存", u: "行业20-25%" }, { v: "XX%", l: "30日留存", u: "行业10-15%" },
    { v: "XX%", l: "报名转化率" }, { v: "XX", l: "NPS 净推荐值" }, { v: "XX", l: "课程完成率" }, { v: "XX min", l: "日均使用时长" },
  ];
  // Position as overlay at bottom
  metrics.forEach((m, i) => {
    const xx = 0.7 + (i % 4) * 2.2;
    const yy = 5.3 + Math.floor(i / 4) * 0.01; // hide overflow — dashboard image already shows data
  });
}

// ═══════════════════════════════════════════
// SLIDE 12 — Competitor Analysis (WITH IMAGE)
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png"); pn(s, 12);
  s.addText("竞品分析", { x: 1.2, y: 0.5, w: 4, h: 0.5, fontSize: 10, fontFace: F.body, color: G, charSpacing: 8, margin: 0 });
  goldLine(s, 1.2, 1.05, 0.8);

  // Radar image
  s.addImage({ path: img("05_competitor_radar.png"), x: 4.5, y: 0.5, w: 5.5, h: 5.2, sizing: { type: "contain", w: 5.5, h: 5.2 } });

  // Left side text
  const dims = [
    { d: "竞赛信息聚合", z: "★★★★★", zs: "赛氪 ★★★★" },
    { d: "AI个性化推荐", z: "★★★★★", zs: "行业 ★★" },
    { d: "技能学习路径", z: "★★★★★", zs: "MOOC ★★★★" },
    { d: "三场景打通", z: "★★★★★", zs: "竞品均 <★★" },
    { d: "知识图谱", z: "★★★★★", zs: "行业空白" },
    { d: "AI对话深度", z: "★★★★★", zs: "行业 ★★" },
  ];
  dims.forEach((d, i) => {
    const yy = 1.4 + i * 0.65;
    s.addText(d.d, { x: 1.2, y: yy, w: 3.0, h: 0.3, fontSize: 13, fontFace: F.display, color: W, margin: 0 });
    s.addText(d.z, { x: 1.2, y: yy + 0.25, w: 1.5, h: 0.25, fontSize: 10, fontFace: F.body, color: G, margin: 0 });
    s.addText(d.zs, { x: 2.8, y: yy + 0.25, w: 1.5, h: 0.25, fontSize: 9, fontFace: F.body, color: M, margin: 0 });
  });
}

// ═══════════════════════════════════════════
// SLIDE 13 — Tech Barriers (simple cards)
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png"); pn(s, 13);
  s.addText("技术壁垒", { x: 1.2, y: 0.5, w: 4, h: 0.5, fontSize: 10, fontFace: F.body, color: G, charSpacing: 8, margin: 0 });
  goldLine(s, 1.2, 1.05, 0.8);
  [{ l: "架构层", d: "全栈自研 Vue 3 + Express + SQLite\n前后端解耦，微服务化预备", b: "中" },
   { l: "算法层", d: "自研混合推荐 + 三元知识图谱\n需领域知识积累与标注数据", b: "高" },
   { l: "数据层", d: "用户行为数据闭环\n冷启动→热启动，推荐持续精进", b: "高" },
   { l: "生态层", d: "竞赛+课程+论文+UGC四维\n多边网络效应，后来者门槛极高", b: "极高" }].forEach((b, i) => {
    const xx = 0.7 + i * 2.3;
    s.addShape(pres.shapes.RECTANGLE, { x: xx, y: 1.4, w: 2.1, h: 2.8, fill: { color: "15151C" } });
    s.addText(b.l, { x: xx + 0.15, y: 1.55, w: 1.8, h: 0.35, fontSize: 13, fontFace: F.title, color: W, margin: 0 });
    goldLine(s, xx + 0.15, 1.95, 0.6);
    s.addText(b.d, { x: xx + 0.15, y: 2.2, w: 1.8, h: 1.2, fontSize: 10, fontFace: F.title, color: C, margin: 0, lineSpacingMultiple: 1.6 });
    s.addText("壁垒 " + b.b, { x: xx + 0.15, y: 3.7, w: 1.8, h: 0.3, fontSize: 14, fontFace: F.num, color: G, margin: 0 });
  });
}

// ═══════════════════════════════════════════
// SLIDE 14 — Part 4 Section Divider
// ═══════════════════════════════════════════
{
  const s = darkSlide("02_section_dark.png");
  s.addText("04", { x: 1.2, y: 1.2, w: 3, h: 0.6, fontSize: 14, fontFace: F.body, color: G, charSpacing: 6, margin: 0 });
  goldLine(s, 1.2, 1.9, 2.5);
  s.addText("产业价值", { x: 1.2, y: 2.2, w: 8, h: 1.0, fontSize: 40, fontFace: F.display, color: W, margin: 0 });
  s.addText("商业模式 · 财务预测 · 融资计划 — 为什么值得投资？", { x: 1.2, y: 3.3, w: 8, h: 0.4, fontSize: 14, fontFace: F.title, color: C, margin: 0 });
}

// ═══════════════════════════════════════════
// SLIDE 15 — Business Model
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png"); pn(s, 15);
  s.addText("商业模式", { x: 1.2, y: 0.5, w: 4, h: 0.5, fontSize: 10, fontFace: F.body, color: G, charSpacing: 8, margin: 0 });
  goldLine(s, 1.2, 1.05, 0.8);
  [{ m: "B2C 基础", d: "竞赛信息 + 基础课程\n免费 · 用户增长引擎", r: "" },
   { m: "B2C 增值", d: "AI深度路径规划\n无限AI问答", r: "会员订阅 XX元/月" },
   { m: "B2B 高校", d: "竞赛管理平台\n数据看板", r: "SaaS年费 XX万/校" },
   { m: "B2B2C", d: "官方报名通道\n数据分析报告", r: "项目制收费" }].forEach((b, i) => {
    const yy = 1.5 + i * 0.95;
    goldLine(s, 1.2, yy + 0.35, 0.6);
    s.addText(b.m, { x: 1.2, y: yy, w: 2.5, h: 0.4, fontSize: 18, fontFace: F.display, color: W, margin: 0 });
    s.addText(b.d, { x: 4.0, y: yy, w: 3.0, h: 0.8, fontSize: 12, fontFace: F.title, color: C, margin: 0, lineSpacingMultiple: 1.5 });
    s.addText(b.r, { x: 7.5, y: yy, w: 2.0, h: 0.8, fontSize: 14, fontFace: F.num, color: G, margin: 0, lineSpacingMultiple: 1.5 });
  });
}

// ═══════════════════════════════════════════
// SLIDE 16 — Funding
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png"); pn(s, 16);
  s.addText("融资计划", { x: 1.2, y: 0.5, w: 4, h: 0.5, fontSize: 10, fontFace: F.body, color: G, charSpacing: 8, margin: 0 });
  goldLine(s, 1.2, 1.05, 0.8);
  [{ l: "本轮融资", v: "XX 轮" }, { l: "融资金额", v: "XXX 万元" }, { l: "出让股权", v: "X%" }, { l: "资金用途", v: "研发 + 市场 + 内容 + 运营" }].forEach((t, i) => {
    const yy = 1.6 + i * 0.75;
    s.addText(t.l, { x: 1.2, y: yy, w: 2.5, h: 0.3, fontSize: 11, fontFace: F.body, color: M, margin: 0 });
    s.addText(t.v, { x: 3.8, y: yy, w: 5, h: 0.45, fontSize: 28, fontFace: F.num, color: W, margin: 0 });
    goldLine(s, 1.2, yy + 0.5, 3.0);
  });
  s.addText("财务预测：Y1→Y2→Y3 收入从 XX万→XXX万→XXXX万  第X年盈亏平衡", { x: 1.2, y: 4.8, w: 8, h: 0.4, fontSize: 11, fontFace: F.title, color: C, margin: 0 });
}

// ═══════════════════════════════════════════
// SLIDE 17 — Part 5 Section Divider
// ═══════════════════════════════════════════
{
  const s = darkSlide("02_section_dark.png");
  s.addText("05", { x: 1.2, y: 1.2, w: 3, h: 0.6, fontSize: 14, fontFace: F.body, color: G, charSpacing: 6, margin: 0 });
  goldLine(s, 1.2, 1.9, 2.5);
  s.addText("项目团队", { x: 1.2, y: 2.2, w: 8, h: 1.0, fontSize: 40, fontFace: F.display, color: W, margin: 0 });
  s.addText("负责人 · 核心成员 · 指导教师 — 凭什么这个团队能做？", { x: 1.2, y: 3.3, w: 8, h: 0.4, fontSize: 14, fontFace: F.title, color: C, margin: 0 });
}

// ═══════════════════════════════════════════
// SLIDE 18 — Team (WITH IMAGE)
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png"); pn(s, 18);
  s.addText("核心团队", { x: 1.2, y: 0.4, w: 4, h: 0.5, fontSize: 10, fontFace: F.body, color: G, charSpacing: 8, margin: 0 });
  goldLine(s, 1.2, 0.95, 0.8);

  // Team image as full background accent
  s.addImage({ path: img("08_team.png"), x: 5.0, y: 0.0, w: 5.5, h: 6.0, sizing: { type: "contain", w: 5.5, h: 6.0 } });

  [{ n: "XXX", r: "项目负责人/全栈架构师", s: "Vue · Node.js · ML" },
   { n: "XXX", r: "前端工程师", s: "Vue 3 · TypeScript" },
   { n: "XXX", r: "算法工程师", s: "Python · KG · LLM" },
   { n: "XXX", r: "后端工程师", s: "Express · DevOps" },
   { n: "XXX", r: "产品运营", s: "用户增长 · BD" },
   { n: "XXX", r: "UI/UX设计", s: "Figma · 品牌" }].forEach((m, i) => {
    const yy = 1.35 + i * 0.6;
    goldLine(s, 1.2, yy + 0.3, 0.35);
    s.addText(m.n, { x: 1.2, y: yy, w: 1.5, h: 0.3, fontSize: 15, fontFace: F.display, color: W, margin: 0 });
    s.addText(m.r, { x: 2.8, y: yy + 0.02, w: 2.5, h: 0.25, fontSize: 11, fontFace: F.title, color: C, margin: 0 });
    s.addText(m.s, { x: 2.8, y: yy + 0.28, w: 2.5, h: 0.2, fontSize: 9, fontFace: F.body, color: G, margin: 0 });
  });
  s.addText("六人团队覆盖 计算机 × AI × 管理 × 设计 四大学科", { x: 1.2, y: 5.0, w: 5, h: 0.3, fontSize: 11, fontFace: F.display, color: G, margin: 0 });
}

// ═══════════════════════════════════════════
// SLIDE 19 — Part 6 Section Divider
// ═══════════════════════════════════════════
{
  const s = darkSlide("02_section_dark.png");
  s.addText("06", { x: 1.2, y: 1.2, w: 3, h: 0.6, fontSize: 14, fontFace: F.body, color: G, charSpacing: 6, margin: 0 });
  goldLine(s, 1.2, 1.9, 2.5);
  s.addText("教育引领", { x: 1.2, y: 2.2, w: 8, h: 1.0, fontSize: 40, fontFace: F.display, color: W, margin: 0 });
  s.addText("教育公平 · 带动就业 · 未来规划 — 社会价值与远见", { x: 1.2, y: 3.3, w: 8, h: 0.4, fontSize: 14, fontFace: F.title, color: C, margin: 0 });
}

// ═══════════════════════════════════════════
// SLIDE 20 — Education Equality (WITH IMAGE)
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png"); pn(s, 20);
  s.addText("引领教育", { x: 1.2, y: 0.4, w: 4, h: 0.5, fontSize: 10, fontFace: F.body, color: G, charSpacing: 8, margin: 0 });
  goldLine(s, 1.2, 0.95, 0.8);

  // Equality image
  s.addImage({ path: img("06_equality.png"), x: 4.5, y: 0.3, w: 5.5, h: 5.5, sizing: { type: "contain", w: 5.5, h: 5.5 } });

  s.addText("从\"接入公平\"\n走向\"算法公平\"", { x: 1.2, y: 1.3, w: 3.5, h: 1.2, fontSize: 28, fontFace: F.display, color: W, margin: 0, lineSpacingMultiple: 1.3 });
  s.addText("让每个人——无论所在高校的层级——都能获得同等质量的智能导航服务。", { x: 1.2, y: 2.6, w: 3.5, h: 0.8, fontSize: 12, fontFace: F.title, color: C, margin: 0, lineSpacingMultiple: 1.5 });
  ["信息公平 — 算法为所有学生提供同等推荐", "路径公平 — KG为每个学生生成个性路径", "资源公平 — 整合公开资源+AI降低门槛", "能力公平 — 浏览器内编程零门槛实训"].forEach((d, i) => {
    s.addText(d, { x: 1.2, y: 3.6 + i * 0.38, w: 3.5, h: 0.3, fontSize: 10, fontFace: F.title, color: G, margin: 0 });
  });
}

// ═══════════════════════════════════════════
// SLIDE 21 — Future Roadmap (WITH IMAGE)
// ═══════════════════════════════════════════
{
  const s = darkSlide("04_content_navy.png"); pn(s, 21);
  s.addText("三阶段规划", { x: 1.2, y: 0.4, w: 4, h: 0.5, fontSize: 10, fontFace: F.body, color: G, charSpacing: 8, margin: 0 });
  goldLine(s, 1.2, 0.95, 0.8);

  // Roadmap image
  s.addImage({ path: img("07_roadmap.png"), x: 0.5, y: 1.5, w: 9.0, h: 3.0, sizing: { type: "contain", w: 9.0, h: 3.0 } });

  // Phase text overlay below
  [{ p: "Phase 1 深耕", t: "2026—2027", i: "核心功能完整 · XX高校试点 · X万种子 · 首轮融资" },
   { p: "Phase 2 扩展", t: "2027—2028", i: "全网推广 · 盈亏平衡 · A轮 · App上线" },
   { p: "Phase 3 引领", t: "2028—2029", i: "教育大模型 · 自适应学习 · XXX万用户 · 行业标杆" }].forEach((p, i) => {
    const xx = 1.2 + i * 2.9;
    s.addText(p.p, { x: xx, y: 4.3, w: 2.6, h: 0.35, fontSize: 16, fontFace: F.display, color: W, margin: 0 });
    s.addText(p.t, { x: xx, y: 4.6, w: 2.6, h: 0.25, fontSize: 10, fontFace: F.body, color: M, margin: 0 });
    s.addText(p.i, { x: xx, y: 4.9, w: 2.6, h: 0.5, fontSize: 10, fontFace: F.title, color: C, margin: 0, lineSpacingMultiple: 1.4 });
  });
}

// ═══════════════════════════════════════════
// SLIDE 22 — Closing
// ═══════════════════════════════════════════
{
  const s = imgSlide("01_hero_bg.png");
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 5.625, fill: { color: "000000", transparency: 50 } });
  goldLine(s, 3.5, 1.8, 3.0);
  s.addShape(pres.shapes.OVAL, { x: 6.6, y: 1.75, w: 0.1, h: 0.1, fill: { color: G } });
  s.addText("知途", { x: 0, y: 2.2, w: 10, h: 1.2, fontSize: 60, fontFace: F.display, color: W, bold: true, align: "center", margin: 0 });
  s.addText("AI 通识智研与算法赋能空间", { x: 0, y: 3.5, w: 10, h: 0.5, fontSize: 16, fontFace: F.title, color: C, align: "center", margin: 0 });
  s.addText("知者不惑，途者不迷", { x: 0, y: 4.1, w: 10, h: 0.4, fontSize: 15, fontFace: F.display, color: G, italic: true, align: "center", margin: 0 });
  s.addText("[联系方式]  ·  [邮箱]  ·  [微信]", { x: 0, y: 4.9, w: 10, h: 0.3, fontSize: 10, fontFace: F.body, color: M, align: "center", margin: 0 });
}

// ═══════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════
const OUT = "E:\\Q1.1\\output\\知途-V3-final.pptx";
pres.writeFile({ fileName: OUT }).then(() => {
  console.log("✅ 知途 V3 Final: " + OUT);
  console.log("📊 22 页 · DALL-E 图片已嵌入");
}).catch(e => { console.error(e.message); process.exit(1); });
