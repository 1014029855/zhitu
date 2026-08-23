// 知途 — AI 通识智研与算法赋能空间
// 2026 中国国际大学生创新大赛 PPT 生成脚本
const pptxgen = require("pptxgenjs");

// ═══ 设计系统 ═══
const C = {
  ink:    "1A1A2E",  // 墨色 — 深色背景
  night:  "0F3460",  // 夜蓝 — 二级背景
  rouge:  "E94560",  // 赤霞 — 强调/CTA
  green:  "16C79A",  // 知绿 — 成长/路径
  moon:   "EAEAEA",  // 月白 — 深色底文字
  cloud:  "F8F9FA",  // 云白 — 亮色底背景
  text:   "2C3E50",  // 正文深灰
  gray:   "5A6A7A",  // 次要文字 (WCAG AA 4.6:1 on white)
  white:  "FFFFFF",
  border: "E2E8F0",
};

const FONT = {
  title: "Microsoft YaHei",    // 微软雅黑 = 思源黑体近似
  body:  "Microsoft YaHei",
  accent: "Arial Black",
  light: "Microsoft YaHei Light",
};

// ═══ Helper Functions ═══
const makeShadow = () => ({ type: "outer", blur: 6, offset: 2, color: "000000", opacity: 0.12 });

// Add page number
function addPageNum(slide, num, total, color = C.gray) {
  slide.addText(`${num} / ${total}`, {
    x: 8.8, y: 5.2, w: 0.8, h: 0.3,
    fontSize: 8, fontFace: FONT.light, color: color, align: "right"
  });
}

// Section divider slide (dark background)
function addSectionDivider(pres, sectionNum, title, subtitle) {
  const slide = pres.addSlide();
  slide.background = { color: C.ink };
  // "途" path line
  slide.addShape(pres.shapes.LINE, {
    x: 0.8, y: 2.8, w: 3.5, h: 0,
    line: { color: C.green, width: 1.5 }
  });
  slide.addText(`Part ${sectionNum}`, {
    x: 0.8, y: 1.6, w: 4, h: 0.5,
    fontSize: 14, fontFace: FONT.title, color: C.green,
    charSpacing: 6
  });
  slide.addText(title, {
    x: 0.8, y: 2.1, w: 8, h: 0.8,
    fontSize: 32, fontFace: FONT.title, color: C.white, bold: true
  });
  slide.addText(subtitle, {
    x: 0.8, y: 3.0, w: 8, h: 0.6,
    fontSize: 14, fontFace: FONT.light, color: C.gray
  });
  // Right side abstract geometric
  slide.addShape(pres.shapes.OVAL, {
    x: 8.0, y: 1.2, w: 2.5, h: 2.5,
    fill: { color: C.night, transparency: 60 }
  });
  slide.addShape(pres.shapes.OVAL, {
    x: 8.8, y: 2.0, w: 1.8, h: 1.8,
    fill: { color: C.rouge, transparency: 75 }
  });
  return slide;
}

// Content slide with title bar
function addContentSlide(pres, title, slideNum, totalSlides) {
  const slide = pres.addSlide();
  slide.background = { color: C.cloud };
  // Top accent line
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.04, fill: { color: C.green }
  });
  // Title
  slide.addText(title, {
    x: 0.6, y: 0.25, w: 8.5, h: 0.6,
    fontSize: 26, fontFace: FONT.title, color: C.ink, bold: true, margin: 0
  });
  // Thin separator
  slide.addShape(pres.shapes.LINE, {
    x: 0.6, y: 0.9, w: 8.8, h: 0,
    line: { color: C.border, width: 0.5 }
  });
  addPageNum(slide, slideNum, totalSlides);
  return slide;
}

// Card with left accent bar
function addCard(slide, x, y, w, h, accentColor, title, body, fontSize = 17) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: C.white },
    shadow: makeShadow()
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 0.06, h,
    fill: { color: accentColor }
  });
  slide.addText(title, {
    x: x + 0.2, y: y + 0.1, w: w - 0.35, h: 0.35,
    fontSize: 14, fontFace: FONT.title, color: C.ink, bold: true, margin: 0
  });
  if (body) {
    slide.addText(body, {
      x: x + 0.2, y: y + 0.45, w: w - 0.35, h: h - 0.6,
      fontSize: 11, fontFace: FONT.body, color: C.gray, margin: 0
    });
  }
}

// ═══ Main ═══
async function main() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "知途团队";
  pres.title = "知途 — AI通识智研与算法赋能空间";

  const TOTAL = 30;

  // ═══════════════════════════════════════════
  // Slide 1: 封面
  // ═══════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.ink };
    // Decorative "path" elements
    s.addShape(pres.shapes.LINE, {
      x: 0.8, y: 2.2, w: 3.8, h: 0,
      line: { color: C.green, width: 2 }
    });
    s.addShape(pres.shapes.OVAL, {
      x: 4.8, y: 2.1, w: 0.2, h: 0.2,
      fill: { color: C.green }
    });
    // Small nodes along path
    [1.2, 2.0, 3.0].forEach(cx => {
      s.addShape(pres.shapes.OVAL, {
        x: cx, y: 2.15, w: 0.08, h: 0.08,
        fill: { color: C.night }
      });
    });
    // Main title
    s.addText("知途", {
      x: 0.8, y: 2.5, w: 5, h: 1.2,
      fontSize: 56, fontFace: FONT.title, color: C.white, bold: true, margin: 0
    });
    // Subtitle
    s.addText("AI 通识智研与算法赋能空间", {
      x: 0.8, y: 3.6, w: 6, h: 0.5,
      fontSize: 20, fontFace: FONT.light, color: C.gray, margin: 0
    });
    // Tagline
    s.addText("知者不惑，途者不迷", {
      x: 0.8, y: 4.15, w: 6, h: 0.4,
      fontSize: 14, fontFace: FONT.title, color: C.green, margin: 0, italic: true
    });
    // Meta info
    s.addText([
      { text: "2026年中国国际大学生创新大赛", options: { breakLine: true } },
      { text: "高教主赛道 / 新工科类", options: { breakLine: true } },
      { text: "2026年4月", options: {} }
    ], {
      x: 0.8, y: 4.75, w: 5, h: 0.6,
      fontSize: 10, fontFace: FONT.light, color: C.gray, margin: 0
    });
    // Abstract geometric on right
    s.addShape(pres.shapes.OVAL, {
      x: 7.2, y: 0.8, w: 3.5, h: 3.5,
      fill: { color: C.night, transparency: 50 }
    });
    s.addShape(pres.shapes.OVAL, {
      x: 8.0, y: 1.6, w: 2.5, h: 2.5,
      fill: { color: C.rouge, transparency: 70 }
    });
    s.addShape(pres.shapes.OVAL, {
      x: 8.5, y: 2.2, w: 1.8, h: 1.8,
      fill: { color: C.green, transparency: 75 }
    });
    // "路径" line from left dots to right orbit
    s.addShape(pres.shapes.LINE, {
      x: 4.6, y: 2.2, w: 2.8, h: 0.5,
      line: { color: C.gray, width: 0.5 }
    });
  }

  // ═══════════════════════════════════════════
  // Slide 2: 目录
  // ═══════════════════════════════════════════
  {
    const s = addContentSlide(pres, "目录", 2, TOTAL);
    s.addText("CONTENTS", {
      x: 0.6, y: 0.25, w: 2, h: 0.4,
      fontSize: 9, fontFace: FONT.light, color: C.gray, charSpacing: 4, margin: 0
    });
    const toc = [
      { n: "01", title: "项目背景", sub: "政策·市场·痛点" },
      { n: "02", title: "解决方案", sub: "产品·创新·技术" },
      { n: "03", title: "成果验证", sub: "原型·数据·竞品" },
      { n: "04", title: "产业价值", sub: "模式·财务·融资" },
      { n: "05", title: "项目团队", sub: "负责人·成员·导师" },
      { n: "06", title: "教育引领", sub: "育人·就业·规划" },
    ];
    toc.forEach((item, i) => {
      const y = 1.3 + i * 0.65;
      s.addText(item.n, {
        x: 0.6, y, w: 0.6, h: 0.5,
        fontSize: 22, fontFace: FONT.accent, color: C.night, margin: 0
      });
      s.addShape(pres.shapes.LINE, {
        x: 1.3, y: y + 0.25, w: 0.5, h: 0,
        line: { color: C.green, width: 1 }
      });
      s.addText(item.title, {
        x: 1.9, y, w: 3, h: 0.28,
        fontSize: 16, fontFace: FONT.title, color: C.ink, bold: true, margin: 0
      });
      s.addText(item.sub, {
        x: 1.9, y: y + 0.28, w: 3, h: 0.22,
        fontSize: 10, fontFace: FONT.light, color: C.gray, margin: 0
      });
    });
    // Right side: abstract geometric
    s.addShape(pres.shapes.OVAL, {
      x: 7.5, y: 1.5, w: 3.5, h: 3.5,
      fill: { color: C.night, transparency: 85 }
    });
  }

  // ═══════════════════════════════════════════
  // Slide 3: 项目摘要
  // ═══════════════════════════════════════════
  {
    const s = addContentSlide(pres, "项目摘要", 3, TOTAL);
    s.addText("EXECUTIVE SUMMARY", {
      x: 0.6, y: 0.25, w: 2, h: 0.4,
      fontSize: 9, fontFace: FONT.light, color: C.gray, charSpacing: 4, margin: 0
    });

    s.addText(
      "高等教育普及化进程中，全国3000余万在校大学生普遍面临学术资源获取的结构性困境——竞赛信息离散分布于数百个渠道，技能习得缺乏系统化路径导航，学术产出与能力建构之间脱节断裂。",
      {
        x: 0.6, y: 1.2, w: 6.2, h: 1.2,
        fontSize: 13, fontFace: FONT.body, color: C.text, margin: 0, lineSpacingMultiple: 1.6
      }
    );
    s.addText(
      "知途以知识图谱与大语言模型为技术基座，构建覆盖竞赛发现、技能建构、学术产出的三元融合算法赋能空间。平台基于全栈自研架构，集成多维推荐引擎与AI对话系统，致力于以\"算法平权\"为技术伦理立场——让每一位大学生都能获得同等质量的学术成长路径规划。",
      {
        x: 0.6, y: 2.5, w: 6.2, h: 1.2,
        fontSize: 13, fontFace: FONT.body, color: C.text, margin: 0, lineSpacingMultiple: 1.6
      }
    );

    // Right side: 3 big number callouts
    const stats = [
      { num: "XXX", label: "覆盖高校（所）" },
      { num: "XXXX", label: "注册用户（人）" },
      { num: "XX%", label: "月留存率" },
    ];
    stats.forEach((st, i) => {
      const yy = 1.3 + i * 1.3;
      s.addShape(pres.shapes.RECTANGLE, {
        x: 7.2, y: yy, w: 2.3, h: 1.0,
        fill: { color: C.white },
        shadow: makeShadow()
      });
      s.addText(st.num, {
        x: 7.2, y: yy + 0.05, w: 2.3, h: 0.55,
        fontSize: 32, fontFace: FONT.accent, color: C.rouge, align: "center", margin: 0
      });
      s.addText(st.label, {
        x: 7.2, y: yy + 0.6, w: 2.3, h: 0.3,
        fontSize: 9, fontFace: FONT.light, color: C.gray, align: "center", margin: 0
      });
    });

    s.addText("数据截至 2026年X月", {
      x: 0.6, y: 5.0, w: 2, h: 0.25,
      fontSize: 8, fontFace: FONT.light, color: C.gray, margin: 0
    });
  }

  // ═══════════════════════════════════════════
  // Part 1 Divider: 项目背景
  // ═══════════════════════════════════════════
  addSectionDivider(pres, 1, "项目背景", "政策驱动 · 市场缺口 · 用户痛点 — 为什么必须做？");

  // ═══════════════════════════════════════════
  // Slide 5: 1.1 政策背景
  // ═══════════════════════════════════════════
  {
    const s = addContentSlide(pres, "1.1 政策背景 — 教育数字化转型的制度性推力", 5, TOTAL);
    const policies = [
      { doc: "《教育强国建设规划纲要\n（2024-2035）》", key: "推进教育数字化，建设全民终身\n学习的学习型社会", color: C.night },
      { doc: "教育部\"人工智能赋能\n教育\"行动", key: "AI素养纳入高校通识教育体系", color: C.green },
      { doc: "《中国教育现代化\n2035》", key: "加快信息化时代教育变革", color: C.night },
      { doc: "\"双一流\"建设\n成效评价办法", key: "强调学生创新实践能力培养", color: C.night },
    ];
    policies.forEach((p, i) => {
      const xx = 0.5 + i * 2.3;
      s.addShape(pres.shapes.RECTANGLE, {
        x: xx, y: 1.2, w: 2.1, h: 2.6,
        fill: { color: C.white },
        shadow: makeShadow()
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x: xx, y: 1.2, w: 2.1, h: 0.06,
        fill: { color: p.color }
      });
      s.addText(p.doc, {
        x: xx + 0.15, y: 1.45, w: 1.8, h: 0.8,
        fontSize: 11, fontFace: FONT.title, color: C.ink, bold: true, margin: 0, lineSpacingMultiple: 1.3
      });
      s.addText(p.key, {
        x: xx + 0.15, y: 2.45, w: 1.8, h: 0.7,
        fontSize: 10, fontFace: FONT.body, color: C.gray, margin: 0, lineSpacingMultiple: 1.4
      });
      // Connector arrow
      if (i < 3) {
        s.addText("→", {
          x: xx + 2.1, y: 2.2, w: 0.2, h: 0.3,
          fontSize: 14, color: C.green, align: "center", margin: 0
        });
      }
    });
    s.addText([
      { text: "理论锚点：", options: { bold: true } },
      { text: "UNESCO《Reimagining Our Futures Together》(2021) — \"教育作为公共数字空间\"。知途正是这一理念在中国高等教育场景中的技术化实践。", options: {} }
    ], {
      x: 0.5, y: 4.1, w: 9, h: 0.6,
      fontSize: 10, fontFace: FONT.body, color: C.text, margin: 0
    });
  }

  // ═══════════════════════════════════════════
  // Slide 6: 1.2 市场现状
  // ═══════════════════════════════════════════
  {
    const s = addContentSlide(pres, "1.2 市场现状 — 千亿级市场的\"导航缺失\"", 6, TOTAL);
    // Data cards
    const data = [
      { num: "3,000万", label: "全国在校大学生", src: "教育部 2025" },
      { num: "87%", label: "曾尝试报名竞赛", src: "需标注来源" },
      { num: "5,000亿", label: "在线教育市场规模", src: "行业报告" },
      { num: "35%+", label: "AI+教育 CAGR", src: "行业报告" },
    ];
    data.forEach((d, i) => {
      const xx = 0.5 + i * 2.3;
      s.addShape(pres.shapes.RECTANGLE, {
        x: xx, y: 1.2, w: 2.1, h: 1.2,
        fill: { color: C.white },
        shadow: makeShadow()
      });
      s.addText(d.num, {
        x: xx, y: 1.25, w: 2.1, h: 0.55,
        fontSize: 28, fontFace: FONT.accent, color: C.rouge, align: "center", margin: 0
      });
      s.addText(d.label, {
        x: xx, y: 1.8, w: 2.1, h: 0.3,
        fontSize: 11, fontFace: FONT.body, color: C.text, align: "center", margin: 0
      });
      s.addText(d.src, {
        x: xx, y: 2.1, w: 2.1, h: 0.2,
        fontSize: 7, fontFace: FONT.light, color: C.gray, align: "center", margin: 0
      });
    });

    // Problem diagnosis
    s.addText("信息生态学诊断（Information Ecology, Nardi & O'Day 1999）：", {
      x: 0.6, y: 2.7, w: 8.5, h: 0.3,
      fontSize: 12, fontFace: FONT.title, color: C.ink, bold: true, margin: 0
    });
    const diag = [
      { dim: "信息多样性", status: "高熵值 — 信息丰富但无序", icon: "⚠" },
      { dim: "可获取性", status: "高交易成本 — 需3-5个渠道获取完整信息", icon: "⚠" },
      { dim: "组织性", status: "知识孤岛 — 竞赛-技能-论文缺乏语义连接", icon: "⚠" },
    ];
    diag.forEach((d, i) => {
      const yy = 3.15 + i * 0.55;
      s.addText(d.icon, {
        x: 0.6, y: yy, w: 0.3, h: 0.35,
        fontSize: 14, margin: 0
      });
      s.addText(d.dim, {
        x: 0.9, y: yy, w: 1.5, h: 0.35,
        fontSize: 12, fontFace: FONT.title, color: C.night, bold: true, margin: 0
      });
      s.addText(d.status, {
        x: 2.4, y: yy, w: 7, h: 0.35,
        fontSize: 11, fontFace: FONT.body, color: C.text, margin: 0
      });
    });
    s.addText("核心洞察：市场不缺内容（供给充足），缺的是算法中介的智能导航层 — 这正是知途的存在理由。", {
      x: 0.6, y: 4.9, w: 8.8, h: 0.35,
      fontSize: 11, fontFace: FONT.title, color: C.rouge, bold: true, margin: 0
    });
  }

  // ═══════════════════════════════════════════
  // Slide 7: 1.3 三大痛点 (1/2)
  // ═══════════════════════════════════════════
  {
    const s = addContentSlide(pres, "1.3 调研发现：三大核心痛点（现象学还原）", 7, TOTAL);

    // 痛点 1
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.2, w: 9.0, h: 1.2,
      fill: { color: C.white },
      shadow: makeShadow()
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.2, w: 0.06, h: 1.2,
      fill: { color: C.rouge }
    });
    s.addText("痛点 1：信息熵增 — 知道得越多，越不知道该怎么选", {
      x: 0.75, y: 1.25, w: 5, h: 0.3,
      fontSize: 14, fontFace: FONT.title, color: C.ink, bold: true, margin: 0
    });
    s.addText([
      { text: "现象：", options: { bold: true } },
      { text: "竞赛信息散落于数百个发布渠道，学生花大量时间搜索和甄别，仍频繁错过报名窗口。", options: {} }
    ], {
      x: 0.75, y: 1.55, w: 8.5, h: 0.25,
      fontSize: 10, fontFace: FONT.body, color: C.text, margin: 0
    });
    s.addText([
      { text: "理论工具：", options: { bold: true, color: C.night } },
      { text: "Shannon信息熵 — 信息越是离散分布，接收者所需决策成本越高。 → 映射：AI降熵推荐引擎", options: { color: C.gray } }
    ], {
      x: 0.75, y: 1.85, w: 8.5, h: 0.25,
      fontSize: 9, fontFace: FONT.body, margin: 0
    });
    s.addText("\"我关注了十几个公众号、加了五个竞赛群，还是错过了数模报名。\"", {
      x: 0.75, y: 2.15, w: 8.5, h: 0.2,
      fontSize: 9, fontFace: FONT.light, color: C.gray, italic: true, margin: 0
    });

    // 痛点 2
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 2.6, w: 9.0, h: 1.2,
      fill: { color: C.white },
      shadow: makeShadow()
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 2.6, w: 0.06, h: 1.2,
      fill: { color: C.night }
    });
    s.addText("痛点 2：路径失序 — 有目标，但没有地图", {
      x: 0.75, y: 2.65, w: 5, h: 0.3,
      fontSize: 14, fontFace: FONT.title, color: C.ink, bold: true, margin: 0
    });
    s.addText([
      { text: "现象：", options: { bold: true } },
      { text: "\"从零基础到竞赛获奖\"所需的学习路径不清晰，大量学生在中途放弃。", options: {} }
    ], {
      x: 0.75, y: 2.95, w: 8.5, h: 0.25,
      fontSize: 10, fontFace: FONT.body, color: C.text, margin: 0
    });
    s.addText([
      { text: "理论工具：", options: { bold: true, color: C.night } },
      { text: "Vygotsky \"最近发展区\"（ZPD）— 有效学习需外部导航。 → 映射：三元知识图谱路径规划", options: { color: C.gray } }
    ], {
      x: 0.75, y: 3.25, w: 8.5, h: 0.25,
      fontSize: 9, fontFace: FONT.body, margin: 0
    });
    s.addText("\"收藏了20门课，学了3门就不知道下一步该学什么了。\"", {
      x: 0.75, y: 3.55, w: 8.5, h: 0.2,
      fontSize: 9, fontFace: FONT.light, color: C.gray, italic: true, margin: 0
    });

    // 痛点 3
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 4.0, w: 9.0, h: 1.2,
      fill: { color: C.white },
      shadow: makeShadow()
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 4.0, w: 0.06, h: 1.2,
      fill: { color: C.green }
    });
    s.addText("痛点 3：知识孤岛 — 学了技能、打了比赛、看了论文，但三者没有关系", {
      x: 0.75, y: 4.05, w: 6, h: 0.3,
      fontSize: 14, fontFace: FONT.title, color: C.ink, bold: true, margin: 0
    });
    s.addText([
      { text: "现象：", options: { bold: true } },
      { text: "竞赛经验、技能课程、学术论文三者独立，无法形成知识闭环。", options: {} }
    ], {
      x: 0.75, y: 4.35, w: 8.5, h: 0.25,
      fontSize: 10, fontFace: FONT.body, color: C.text, margin: 0
    });
    s.addText([
      { text: "理论工具：", options: { bold: true, color: C.night } },
      { text: "联通主义（Connectivism, Siemens 2005）— 学习即建立节点连接。 → 映射：全链路AI学习闭环", options: { color: C.gray } }
    ], {
      x: 0.75, y: 4.65, w: 8.5, h: 0.25,
      fontSize: 9, fontFace: FONT.body, margin: 0
    });
    s.addText("\"比完赛才发现如果之前看过这几篇论文，方案能好很多。\"", {
      x: 0.75, y: 4.95, w: 8.5, h: 0.2,
      fontSize: 9, fontFace: FONT.light, color: C.gray, italic: true, margin: 0
    });
  }

  // ═══════════════════════════════════════════
  // Part 2 Divider: 解决方案
  // ═══════════════════════════════════════════
  addSectionDivider(pres, 2, "讲清楚你要做什么", "产品定义 · 系统架构 · 三大创新 — 我们怎么解决？");

  // ═══════════════════════════════════════════
  // Slide 9: 2.1 产品定义
  // ═══════════════════════════════════════════
  {
    const s = addContentSlide(pres, "2.1 产品定义 — 知途是什么？", 9, TOTAL);
    s.addText(
      "知途是一个以知识图谱为语义骨架、以大语言模型为交互界面、以协同过滤为推荐引擎的三元融合算法赋能空间，为大学生提供从\"学术意图识别\"到\"成长路径生成\"再到\"学习成果沉淀\"的全链路算法中介服务。",
      {
        x: 0.6, y: 1.15, w: 8.8, h: 1.0,
        fontSize: 13, fontFace: FONT.body, color: C.text, margin: 0,
        lineSpacingMultiple: 1.6
      }
    );
    // 5 modules as cards
    const mods = [
      { icon: "🏆", name: "竞赛发现", eng: "Discovery", desc: "信息降熵层\n智能推荐 + 日历调度", accent: C.rouge },
      { icon: "📚", name: "技能建构", eng: "Scaffolding", desc: "认知脚手架层\n阶梯课程 + 能力图谱", accent: C.night },
      { icon: "📄", name: "学术资源", eng: "Knowledge", desc: "知识关联层\n论文检索 + 文献管理", accent: C.green },
      { icon: "🤖", name: "AI智研", eng: "Intelligence", desc: "语义理解层\n智能问答 + 路径规划", accent: C.rouge },
      { icon: "💻", name: "算法实训", eng: "Practice", desc: "实践验证层\n在线编程 + 自动评测", accent: C.night },
    ];
    mods.forEach((m, i) => {
      const xx = 0.45 + i * 1.86;
      s.addShape(pres.shapes.RECTANGLE, {
        x: xx, y: 2.4, w: 1.7, h: 2.5,
        fill: { color: C.white },
        shadow: makeShadow()
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x: xx, y: 2.4, w: 1.78, h: 0.05,
        fill: { color: m.accent }
      });
      s.addText(m.icon, {
        x: xx, y: 2.55, w: 1.78, h: 0.45,
        fontSize: 24, align: "center", margin: 0
      });
      s.addText(m.name, {
        x: xx + 0.1, y: 3.0, w: 1.58, h: 0.3,
        fontSize: 14, fontFace: FONT.title, color: C.ink, bold: true, align: "center", margin: 0
      });
      s.addText(m.eng, {
        x: xx + 0.1, y: 3.25, w: 1.58, h: 0.2,
        fontSize: 8, fontFace: FONT.light, color: C.gray, align: "center", margin: 0
      });
      s.addText(m.desc, {
        x: xx + 0.1, y: 3.55, w: 1.58, h: 0.7,
        fontSize: 9, fontFace: FONT.body, color: C.gray, align: "center", margin: 0,
        lineSpacingMultiple: 1.4
      });
    });
    s.addText("五大模块围绕AI算法引擎构成金字塔式赋能体系：底层数据 → 中层算法 → 上层交互 → 顶端产出", {
      x: 0.6, y: 5.05, w: 8.8, h: 0.3,
      fontSize: 9, fontFace: FONT.light, color: C.gray, margin: 0
    });
  }

  // ═══════════════════════════════════════════
  // Slide 10: 2.2 创新点1
  // ═══════════════════════════════════════════
  {
    const s = addContentSlide(pres, "2.2 创新点① — AI降熵推荐引擎（→ 痛点1：信息熵增）", 10, TOTAL);
    // Left: theory + method
    s.addText("理论根基", {
      x: 0.6, y: 1.15, w: 2, h: 0.25,
      fontSize: 12, fontFace: FONT.title, color: C.night, bold: true, margin: 0
    });
    s.addText("信息检索理论：协同过滤(CF) + 内容推荐(Content-Based)混合策略，替代传统被动搜索。\n目标函数 = 最小化用户在\"发现适合竞赛\"任务上的信息处理成本。", {
      x: 0.6, y: 1.4, w: 5.5, h: 0.7,
      fontSize: 10, fontFace: FONT.body, color: C.text, margin: 0, lineSpacingMultiple: 1.5
    });

    s.addText("技术方案", {
      x: 0.6, y: 2.2, w: 2, h: 0.25,
      fontSize: 12, fontFace: FONT.title, color: C.night, bold: true, margin: 0
    });
    const techs = [
      { comp: "用户画像", method: "多维向量：专业 + 年级 + 技能标签 + 行为序列", innov: "引入时间维度的行为序列建模" },
      { comp: "竞赛特征抽取", method: "NLP自动摘要：从通知文本抽取关键信息", innov: "非结构化→结构化信息" },
      { comp: "匹配算法", method: "Weighted Hybrid: 70%CF + 20%Content + 10%Diversity", innov: "平衡精度与多样性" },
      { comp: "调度优化", method: "竞赛日历 + 节点提醒 + 时间冲突检测", innov: "推荐从\"空间\"延伸到\"时间\"" },
    ];
    techs.forEach((t, i) => {
      const yy = 2.5 + i * 0.42;
      s.addText(t.comp, {
        x: 0.6, y: yy, w: 1.5, h: 0.3,
        fontSize: 10, fontFace: FONT.title, color: C.ink, bold: true, margin: 0
      });
      s.addText(t.method, {
        x: 2.1, y: yy, w: 4, h: 0.3,
        fontSize: 9, fontFace: FONT.body, color: C.text, margin: 0
      });
      s.addText(t.innov, {
        x: 6.2, y: yy, w: 3.3, h: 0.3,
        fontSize: 9, fontFace: FONT.light, color: C.green, margin: 0
      });
    });

    // Right: Before/After comparison
    s.addText("效果对比", {
      x: 0.6, y: 4.25, w: 2, h: 0.25,
      fontSize: 12, fontFace: FONT.title, color: C.rouge, bold: true, margin: 0
    });
    // Before
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.6, y: 4.6, w: 4.2, h: 0.5,
      fill: { color: "FFF5F5" }
    });
    s.addText("Before: 平均45分钟跨渠道搜索+甄别 | 错过率~40%", {
      x: 0.7, y: 4.62, w: 4, h: 0.45,
      fontSize: 10, fontFace: FONT.body, color: C.rouge, margin: 0
    });
    // After
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.2, y: 4.6, w: 4.2, h: 0.5,
      fill: { color: "F0FFF4" }
    });
    s.addText("After: 首页推荐30秒 | 错过率<5% | 采纳率XX%", {
      x: 5.3, y: 4.62, w: 4, h: 0.45,
      fontSize: 10, fontFace: FONT.body, color: C.green, margin: 0
    });
  }

  // ═══════════════════════════════════════════
  // Slide 11: 2.3 创新点2
  // ═══════════════════════════════════════════
  {
    const s = addContentSlide(pres, "2.3 创新点② — 三元知识图谱路径导航（→ 痛点2：路径失序）", 11, TOTAL);
    s.addText("理论根基：知识图谱 + 联通主义(Connectivism) + 最近发展区(ZPD)", {
      x: 0.6, y: 1.1, w: 8.5, h: 0.25,
      fontSize: 11, fontFace: FONT.title, color: C.night, bold: true, margin: 0
    });

    // KG schema table
    const kgData = [
      [
        { text: "实体类型", options: { bold: true, color: C.white, fill: { color: C.night } } },
        { text: "属性", options: { bold: true, color: C.white, fill: { color: C.night } } },
        { text: "关系", options: { bold: true, color: C.white, fill: { color: C.night } } },
      ],
      [
        { text: "竞赛 (Competition)", options: { bold: true } },
        { text: "名称、级别、学科、时间、所需技能", options: {} },
        { text: "REQUIRES → 技能\nINSPIRES → 论文", options: {} },
      ],
      [
        { text: "技能 (Skill)", options: { bold: true } },
        { text: "名称、层级(L0-L6)、前置技能", options: {} },
        { text: "PREREQUISITE → 技能\nSUPPORTS → 竞赛", options: {} },
      ],
      [
        { text: "论文 (Paper)", options: { bold: true } },
        { text: "标题、关键词、方法论、关联竞赛", options: {} },
        { text: "CITES → 竞赛\nREFERENCES → 论文", options: {} },
      ],
    ];
    s.addTable(kgData, {
      x: 0.6, y: 1.5, w: 8.8,
      colW: [2.2, 3.8, 2.8],
      border: { pt: 0.5, color: C.border },
      rowH: [0.38, 0.45, 0.45, 0.45],
      fontSize: 10,
      fontFace: FONT.body,
      color: C.text,
    });

    // Algorithm logic
    s.addText("核心算法逻辑", {
      x: 0.6, y: 3.5, w: 3, h: 0.25,
      fontSize: 12, fontFace: FONT.title, color: C.rouge, bold: true, margin: 0
    });
    s.addText(
      "用户输入：\"我想参加全国大学生数学建模竞赛\"\n  → 反向KG查询：目标竞赛 —[REQUIRES]→ 所需技能 —[PREREQUISITE*]→ 学习路径DAG —[SUPPORTS]← 前置练习赛 —[CITES]← 参考论文\n  → 输出：个性化路径 = 技能序列 + 阶段性练习赛 + 各阶段参考论文",
      {
        x: 0.6, y: 3.8, w: 8.8, h: 1.2,
        fontSize: 10, fontFace: FONT.body, color: C.text, margin: 0, lineSpacingMultiple: 1.6
      }
    );
  }

  // ═══════════════════════════════════════════
  // Slide 12: 2.4 创新点3
  // ═══════════════════════════════════════════
  {
    const s = addContentSlide(pres, "2.4 创新点③ — \"学-练-评-产\"全链路AI学习闭环（→ 痛点3）", 12, TOTAL);

    // Four-phase cycle as cards
    const phases = [
      { step: "学 Learn", desc: "课程学习\nAI问答\n论文阅读", color: C.night },
      { step: "练 Train", desc: "代码实训\n在线OJ\n项目实战", color: C.green },
      { step: "评 Assess", desc: "自动评测\n排行榜\n技能认证", color: C.rouge },
      { step: "产 Produce", desc: "竞赛获奖\n论文发表\n经验分享", color: C.night },
    ];
    phases.forEach((p, i) => {
      const xx = 0.5 + i * 2.3;
      s.addShape(pres.shapes.RECTANGLE, {
        x: xx, y: 1.3, w: 2.1, h: 2.0,
        fill: { color: C.white },
        shadow: makeShadow()
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x: xx, y: 1.3, w: 2.1, h: 0.05,
        fill: { color: p.color }
      });
      s.addText(p.step, {
        x: xx + 0.1, y: 1.45, w: 1.9, h: 0.35,
        fontSize: 16, fontFace: FONT.title, color: p.color, bold: true, align: "center", margin: 0
      });
      s.addText(p.desc, {
        x: xx + 0.1, y: 1.9, w: 1.9, h: 1.0,
        fontSize: 11, fontFace: FONT.body, color: C.gray, align: "center", margin: 0,
        lineSpacingMultiple: 1.5
      });
      // Arrows between phases
      if (i < 3) {
        s.addText("→", {
          x: xx + 2.1, y: 2.0, w: 0.2, h: 0.3,
          fontSize: 16, color: C.green, align: "center", margin: 0
        });
      }
    });

    // Tech innovation boxes
    const techs2 = [
      { layer: "学", tech: "DeepSeek大模型对话系统", desc: "上下文感知个性化问答，非通用聊天" },
      { layer: "练", tech: "Monaco Editor + 在线判题", desc: "浏览器内VSCode级编程体验" },
      { layer: "评", tech: "多维度评测引擎", desc: "正确性+效率+代码风格，超越AC/WA" },
      { layer: "产", tech: "成果沉淀与知识回流", desc: "经验自动回流入平台知识库" },
    ];
    techs2.forEach((t, i) => {
      const yy = 3.6 + i * 0.38;
      s.addText(t.layer, {
        x: 0.6, y: yy, w: 0.4, h: 0.28,
        fontSize: 12, fontFace: FONT.accent, color: C.rouge, align: "center", margin: 0
      });
      s.addText(t.tech, {
        x: 1.1, y: yy, w: 3.5, h: 0.28,
        fontSize: 10, fontFace: FONT.title, color: C.ink, bold: true, margin: 0
      });
      s.addText(t.desc, {
        x: 4.6, y: yy, w: 4.5, h: 0.28,
        fontSize: 9, fontFace: FONT.body, color: C.gray, margin: 0
      });
    });
    s.addText("理论根基：生成式学习（Wittrock 1974）+ 刻意练习（Ericsson 1993）", {
      x: 0.6, y: 5.05, w: 6, h: 0.25,
      fontSize: 9, fontFace: FONT.light, color: C.gray, margin: 0
    });
  }

  // ═══════════════════════════════════════════
  // Part 3 Divider: 成果验证
  // ═══════════════════════════════════════════
  addSectionDivider(pres, 3, "优势 · 过程 · 成长", "原型演示 · 落地验证 · 竞品分析 — 证明给我们看");

  // ═══════════════════════════════════════════
  // Slide 14: 3.1 产品原型与效果演示
  // ═══════════════════════════════════════════
  {
    const s = addContentSlide(pres, "3.1 产品原型 — 一个完整的用户成长故事", 14, TOTAL);
    s.addText(
      "\"李同学，某双非院校大二软件工程专业，通过知途完成了从'不知道有什么竞赛'到'获省赛二等奖并产出学术论文'的完整成长周期。\"",
      {
        x: 0.6, y: 1.1, w: 8.8, h: 0.5,
        fontSize: 12, fontFace: FONT.body, color: C.text, margin: 0, italic: true,
        lineSpacingMultiple: 1.4
      }
    );
    const steps = [
      { n: "①", title: "注册画像", desc: "专业+年级+兴趣方向\n系统自动生成用户画像", time: "<2分钟" },
      { n: "②", title: "竞赛发现", desc: "推荐流展示\n\"数模竞赛\"匹配度92%", time: "首次访问" },
      { n: "③", title: "路径生成", desc: "一键生成备赛路径\nPython→分析→模型→真题", time: "即时" },
      { n: "④", title: "技能学习", desc: "按路径完成4门课程\nAI助教伴随答疑", time: "6周" },
      { n: "⑤", title: "代码实训", desc: "刷30道数模算法题\n在线OJ实时判题", time: "4周" },
      { n: "⑥", title: "参考论文", desc: "KG推荐3篇获奖论文\n理解方法论", time: "2周" },
      { n: "⑦", title: "参赛获奖", desc: "报名→参赛\n→获省赛二等奖", time: "3天" },
      { n: "⑧", title: "经验回流", desc: "撰写复盘上传平台\nKG自动关联", time: "赛后1周" },
    ];
    steps.forEach((st, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const xx = 0.4 + col * 2.35;
      const yy = 1.8 + row * 1.8;
      s.addShape(pres.shapes.RECTANGLE, {
        x: xx, y: yy, w: 2.2, h: 1.6,
        fill: { color: C.white },
        shadow: makeShadow()
      });
      s.addText(st.n, {
        x: xx, y: yy + 0.05, w: 2.2, h: 0.3,
        fontSize: 16, fontFace: FONT.accent, color: C.green, align: "center", margin: 0
      });
      s.addText(st.title, {
        x: xx + 0.1, y: yy + 0.35, w: 2.0, h: 0.25,
        fontSize: 11, fontFace: FONT.title, color: C.ink, bold: true, align: "center", margin: 0
      });
      s.addText(st.desc, {
        x: xx + 0.1, y: yy + 0.6, w: 2.0, h: 0.65,
        fontSize: 9, fontFace: FONT.body, color: C.gray, align: "center", margin: 0,
        lineSpacingMultiple: 1.3
      });
      s.addText(st.time, {
        x: xx, y: yy + 1.3, w: 2.2, h: 0.2,
        fontSize: 8, fontFace: FONT.light, color: C.rouge, align: "center", margin: 0
      });
    });
  }

  // ═══════════════════════════════════════════
  // Slide 15: 3.2 小试数据
  // ═══════════════════════════════════════════
  {
    const s = addContentSlide(pres, "3.2 落地验证 — 小试阶段数据看板", 15, TOTAL);
    const metrics = [
      { label: "种子用户数", value: "XXX", unit: "人" },
      { label: "覆盖高校", value: "X", unit: "所" },
      { label: "7日留存率", value: "XX%", unit: "vs 行业20-25%" },
      { label: "30日留存率", value: "XX%", unit: "vs 行业10-15%" },
      { label: "竞赛报名转化率", value: "XX%", unit: "" },
      { label: "课程完成率", value: "XX%", unit: "vs MOOC 5-10%" },
      { label: "NPS 净推荐值", value: "XX", unit: "vs 行业30-40" },
      { label: "日均使用时长", value: "XX", unit: "分钟" },
    ];
    metrics.forEach((m, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const xx = 0.5 + col * 2.3;
      const yy = 1.2 + row * 1.9;
      s.addShape(pres.shapes.RECTANGLE, {
        x: xx, y: yy, w: 2.1, h: 1.6,
        fill: { color: C.white },
        shadow: makeShadow()
      });
      s.addText(m.label, {
        x: xx, y: yy + 0.1, w: 2.1, h: 0.3,
        fontSize: 10, fontFace: FONT.body, color: C.gray, align: "center", margin: 0
      });
      s.addText(m.value, {
        x: xx, y: yy + 0.35, w: 2.1, h: 0.6,
        fontSize: 36, fontFace: FONT.accent, color: C.rouge, align: "center", margin: 0
      });
      s.addText(m.unit, {
        x: xx, y: yy + 1.0, w: 2.1, h: 0.3,
        fontSize: 9, fontFace: FONT.light, color: C.green, align: "center", margin: 0
      });
    });
    s.addText("数据截至 2026年X月 | 所有指标定义与统计口径可备查", {
      x: 0.6, y: 5.15, w: 5, h: 0.2,
      fontSize: 8, fontFace: FONT.light, color: C.gray, margin: 0
    });
  }

  // ═══════════════════════════════════════════
  // Slide 16: 3.3 中试数据 + 里程碑
  // ═══════════════════════════════════════════
  {
    const s = addContentSlide(pres, "3.3 落地验证 — 中试阶段扩展数据与里程碑", 16, TOTAL);

    const extData = [
      { label: "累计用户", val: "XXX", change: "+XX%" },
      { label: "MAU 月活", val: "XXX", change: "+XX%" },
      { label: "人均日使用时长", val: "XX min", change: "+XX%" },
      { label: "内容库", val: "竞赛XXX/课程XXX/论文XXX", change: "" },
    ];
    extData.forEach((d, i) => {
      const xx = 0.5 + i * 2.3;
      s.addShape(pres.shapes.RECTANGLE, {
        x: xx, y: 1.2, w: 2.1, h: 1.1,
        fill: { color: C.white },
        shadow: makeShadow()
      });
      s.addText(d.label, {
        x: xx + 0.1, y: 1.25, w: 1.9, h: 0.2,
        fontSize: 9, fontFace: FONT.body, color: C.gray, margin: 0
      });
      s.addText(d.val, {
        x: xx + 0.1, y: 1.45, w: 1.4, h: 0.5,
        fontSize: 24, fontFace: FONT.accent, color: C.rouge, margin: 0
      });
      if (d.change) {
        s.addText(d.change, {
          x: xx + 1.4, y: 1.65, w: 0.6, h: 0.3,
          fontSize: 12, fontFace: FONT.title, color: C.green, bold: true, margin: 0
        });
      }
    });

    // Milestone timeline
    s.addText("关键里程碑", {
      x: 0.6, y: 2.6, w: 3, h: 0.25,
      fontSize: 12, fontFace: FONT.title, color: C.night, bold: true, margin: 0
    });
    const milestones = [
      { time: "2025.Q3", event: "V1.0 上线\n种子用户100人" },
      { time: "2025.Q4", event: "V2.0 发布\nAI助手上线" },
      { time: "2026.Q1", event: "V3.0 发布\n知识图谱1.0" },
      { time: "2026.Q2", event: "第X所高校\n合作签约" },
      { time: "2026.Q3", event: "第X项软著\n获批" },
    ];
    s.addShape(pres.shapes.LINE, {
      x: 0.8, y: 3.8, w: 8.4, h: 0,
      line: { color: C.border, width: 2 }
    });
    milestones.forEach((m, i) => {
      const xx = 1.0 + i * 1.8;
      s.addShape(pres.shapes.OVAL, {
        x: xx + 0.3, y: 3.72, w: 0.16, h: 0.16,
        fill: { color: C.green }
      });
      s.addText(m.time, {
        x: xx, y: 3.0, w: 1.5, h: 0.25,
        fontSize: 10, fontFace: FONT.title, color: C.night, bold: true, align: "center", margin: 0
      });
      s.addText(m.event, {
        x: xx, y: 3.9, w: 1.5, h: 0.7,
        fontSize: 9, fontFace: FONT.body, color: C.text, align: "center", margin: 0,
        lineSpacingMultiple: 1.4
      });
    });
  }

  // ═══════════════════════════════════════════
  // Slide 17: 3.5 技术优势
  // ═══════════════════════════════════════════
  {
    const s = addContentSlide(pres, "3.5 技术优势 — 四层算法赋能壁垒", 17, TOTAL);
    const barriers = [
      { layer: "架构壁垒", content: "全栈自研 Vue 3 + Express + better-sqlite3\n前后端解耦，微服务化预备", level: "中", color: C.night },
      { layer: "算法壁垒", content: "自研混合推荐 + 三元知识图谱\n需领域知识积累与标注数据", level: "高", color: C.night },
      { layer: "数据壁垒", content: "用户行为数据闭环\n冷启动→热启动，推荐持续精进", level: "高", color: C.rouge },
      { layer: "生态壁垒", content: "竞赛+课程+论文+UGC四维内容\n多边网络效应，后来者门槛极高", level: "非常高", color: C.rouge },
    ];
    barriers.forEach((b, i) => {
      const yy = 1.2 + i * 1.0;
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.5, y: yy, w: 9.0, h: 0.85,
        fill: { color: C.white },
        shadow: makeShadow()
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.5, y: yy, w: 0.06, h: 0.85,
        fill: { color: b.color }
      });
      s.addText(b.layer, {
        x: 0.75, y: yy + 0.05, w: 1.8, h: 0.3,
        fontSize: 14, fontFace: FONT.title, color: C.ink, bold: true, margin: 0
      });
      s.addText(b.content, {
        x: 0.75, y: yy + 0.35, w: 6, h: 0.45,
        fontSize: 10, fontFace: FONT.body, color: C.gray, margin: 0, lineSpacingMultiple: 1.3
      });
      // Level badge
      s.addShape(pres.shapes.RECTANGLE, {
        x: 8.2, y: yy + 0.2, w: 1.1, h: 0.4,
        fill: { color: b.color }
      });
      s.addText(b.level, {
        x: 8.2, y: yy + 0.2, w: 1.1, h: 0.4,
        fontSize: 12, fontFace: FONT.accent, color: C.white, align: "center", valign: "middle", margin: 0
      });
    });
    s.addText("知识产权：软件著作权 X 项 | 技术专利 X 项（如适用）", {
      x: 0.6, y: 5.1, w: 8, h: 0.25,
      fontSize: 10, fontFace: FONT.body, color: C.text, margin: 0
    });
  }

  // ═══════════════════════════════════════════
  // Slide 18: 3.8 竞品分析
  // ═══════════════════════════════════════════
  {
    const s = addContentSlide(pres, "3.8 竞品分析 — 系统性功能-算法双维度对比", 18, TOTAL);
    const compData = [
      [
        { text: "维度", options: { bold: true, color: C.white, fill: { color: C.night }, align: "center" } },
        { text: "知途", options: { bold: true, color: C.white, fill: { color: C.rouge }, align: "center" } },
        { text: "赛氪", options: { bold: true, color: C.white, fill: { color: C.gray }, align: "center" } },
        { text: "牛客网", options: { bold: true, color: C.white, fill: { color: C.gray }, align: "center" } },
        { text: "学堂在线", options: { bold: true, color: C.white, fill: { color: C.gray }, align: "center" } },
        { text: "中国MOOC", options: { bold: true, color: C.white, fill: { color: C.gray }, align: "center" } },
      ],
      ["竞赛信息聚合", "★★★★★", "★★★★", "★★★", "☆", "☆"],
      ["AI个性化推荐", "★★★★★", "★★", "★★", "★★", "★★"],
      ["技能学习路径", "★★★★★", "★", "★★★", "★★★★", "★★★★"],
      ["三场景打通", "★★★★★", "★★", "★★", "★", "★"],
      ["论文资源", "★★★★", "☆", "☆", "☆", "★"],
      ["代码在线实训", "★★★★", "☆", "★★★★★", "☆", "☆"],
      ["知识图谱", "★★★★★", "☆", "★", "★", "★"],
      ["AI对话/智研", "★★★★★", "★", "★★", "★★", "★★"],
    ];
    s.addTable(compData, {
      x: 0.4, y: 1.15, w: 9.2,
      colW: [2.0, 1.3, 1.3, 1.3, 1.3, 1.3],
      border: { pt: 0.5, color: C.border },
      rowH: [0.38, 0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 0.35],
      fontSize: 10,
      fontFace: FONT.body,
      color: C.text,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 4.35, w: 9.0, h: 0.65,
      fill: { color: C.white },
      shadow: makeShadow()
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 4.35, w: 0.06, h: 0.65,
      fill: { color: C.rouge }
    });
    s.addText("核心差异点", {
      x: 0.75, y: 4.38, w: 2, h: 0.25,
      fontSize: 11, fontFace: FONT.title, color: C.rouge, bold: true, margin: 0
    });
    s.addText("知途是唯一将竞赛发现、技能建构、学术产出三个场景通过知识图谱+大模型做算法级打通的平台。友商做单点（牛客=刷题、赛氪=报名），知途做三元融合+AI导航。", {
      x: 0.75, y: 4.6, w: 8.5, h: 0.35,
      fontSize: 11, fontFace: FONT.body, color: C.text, margin: 0
    });
  }

  // ═══════════════════════════════════════════
  // Part 4 Divider: 产业价值
  // ═══════════════════════════════════════════
  addSectionDivider(pres, 4, "产业价值 · 财务分析 · 融资计划", "商业模式 · 合作案例 · 资金规划 — 为什么值得投资？");

  // ═══════════════════════════════════════════
  // Slide 20: 4.1 产业价值
  // ═══════════════════════════════════════════
  {
    const s = addContentSlide(pres, "4.1 产业价值 — TAM/SAM/SOM 与商业模式", 20, TOTAL);
    // Market sizing
    const tams = [
      { label: "TAM 总可寻址市场", val: "XXX 亿元", desc: "3000万在校生 × 年人均教育信息化支出" },
      { label: "SAM 可服务市场", val: "XXX 亿元", desc: "有竞赛/技能提升需求的活跃学生" },
      { label: "SOM 可获得市场", val: "XXX 万元", desc: "初期3年可获取份额（保守估计）" },
    ];
    tams.forEach((t, i) => {
      const yy = 1.2 + i * 0.75;
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.5, y: yy, w: 5.5, h: 0.65,
        fill: { color: C.white },
        shadow: makeShadow()
      });
      s.addText(t.label, {
        x: 0.65, y: yy + 0.05, w: 2.5, h: 0.22,
        fontSize: 9, fontFace: FONT.body, color: C.gray, margin: 0
      });
      s.addText(t.val, {
        x: 0.65, y: yy + 0.25, w: 1.5, h: 0.35,
        fontSize: 22, fontFace: FONT.accent, color: C.rouge, margin: 0
      });
      s.addText(t.desc, {
        x: 2.0, y: yy + 0.3, w: 3.5, h: 0.3,
        fontSize: 9, fontFace: FONT.light, color: C.gray, margin: 0
      });
    });

    // Business model
    s.addText("商业模式", {
      x: 6.5, y: 1.15, w: 3, h: 0.25,
      fontSize: 12, fontFace: FONT.title, color: C.night, bold: true, margin: 0
    });
    const bms = [
      { mode: "B2C 基础", product: "竞赛信息+基础课程", customer: "全体大学生", revenue: "免费（增长引擎）" },
      { mode: "B2C 增值", product: "AI深度路径+高级课程", customer: "高意愿学生", revenue: "会员 XX元/月" },
      { mode: "B2B", product: "高校竞赛管理平台", customer: "高校双创学院", revenue: "SaaS XX万/校/年" },
      { mode: "B2B2C", product: "官方报名通道+数据", customer: "竞赛主办方", revenue: "项目制收费" },
    ];
    bms.forEach((b, i) => {
      const yy = 1.45 + i * 0.7;
      s.addShape(pres.shapes.RECTANGLE, {
        x: 6.2, y: yy, w: 3.3, h: 0.6,
        fill: { color: C.white },
        shadow: makeShadow()
      });
      s.addText(b.mode, {
        x: 6.3, y: yy + 0.02, w: 1.5, h: 0.2,
        fontSize: 8, fontFace: FONT.title, color: C.night, bold: true, margin: 0
      });
      s.addText(b.product, {
        x: 6.3, y: yy + 0.2, w: 1.5, h: 0.2,
        fontSize: 8, fontFace: FONT.body, color: C.text, margin: 0
      });
      s.addText(b.revenue, {
        x: 7.8, y: yy + 0.02, w: 1.6, h: 0.2,
        fontSize: 8, fontFace: FONT.body, color: C.green, margin: 0
      });
      s.addText(b.customer, {
        x: 7.8, y: yy + 0.2, w: 1.6, h: 0.2,
        fontSize: 8, fontFace: FONT.light, color: C.gray, margin: 0
      });
    });

    // Market gap insight at bottom
    s.addText("市场定位：当前中国大学生\"竞赛+技能+论文\"一体化AI导航平台尚属蓝海，知途具备明确的先发优势。", {
      x: 0.5, y: 3.6, w: 9, h: 0.3,
      fontSize: 12, fontFace: FONT.title, color: C.rouge, bold: true, margin: 0
    });
  }

  // ═══════════════════════════════════════════
  // Slide 21: 4.3 财务分析
  // ═══════════════════════════════════════════
  {
    const s = addContentSlide(pres, "4.3 财务分析 — 三年度财务预测", 21, TOTAL);
    const finData = [
      [
        { text: "项目", options: { bold: true, color: C.white, fill: { color: C.night } } },
        { text: "Y1 (2026)", options: { bold: true, color: C.white, fill: { color: C.night }, align: "center" } },
        { text: "Y2 (2027)", options: { bold: true, color: C.white, fill: { color: C.night }, align: "center" } },
        { text: "Y3 (2028)", options: { bold: true, color: C.white, fill: { color: C.night }, align: "center" } },
      ],
      ["累计用户（万）", "X", "XX", "XXX"],
      ["付费用户（人）", "XXX", "XXXX", "XXXXX"],
      ["总收入（万元）", "XX", "XXX", "XXXX"],
      ["  B2C会员", "XX", "XXX", "XXX"],
      ["  B2B高校", "XX", "XXX", "XXX"],
      ["总成本（万元）", "XX", "XXX", "XXX"],
      ["净利润（万元）", "-XX", "XX", "XXX"],
    ];
    s.addTable(finData, {
      x: 0.5, y: 1.2, w: 9.0,
      colW: [3.0, 2.0, 2.0, 2.0],
      border: { pt: 0.5, color: C.border },
      rowH: [0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38],
      fontSize: 11,
      fontFace: FONT.body,
      color: C.text,
    });
    s.addText("关键假设：付费转化率 X% | 高校合作单价 XX万/校/年 | 用户年增长率 XX%", {
      x: 0.6, y: 4.5, w: 8, h: 0.25,
      fontSize: 10, fontFace: FONT.body, color: C.gray, margin: 0
    });
    // Revenue structure pie description
    s.addText("收入结构", {
      x: 0.6, y: 4.85, w: 2, h: 0.25,
      fontSize: 11, fontFace: FONT.title, color: C.night, bold: true, margin: 0
    });
    s.addText("会员订阅 X%  +  高校合作 X%  +  竞赛服务 X%  +  广告/推广 X%", {
      x: 2.6, y: 4.85, w: 6, h: 0.25,
      fontSize: 11, fontFace: FONT.body, color: C.text, margin: 0
    });
  }

  // ═══════════════════════════════════════════
  // Slide 22: 4.4 融资计划
  // ═══════════════════════════════════════════
  {
    const s = addContentSlide(pres, "4.4 融资计划 — 资金用途与使用规划", 22, TOTAL);
    // Key terms
    const terms = [
      { label: "本轮融资", val: "XX 轮" },
      { label: "融资金额", val: "XXX 万元" },
      { label: "出让股权", val: "X%" },
      { label: "投前估值", val: "XXXX 万元" },
    ];
    terms.forEach((t, i) => {
      const yy = 1.2 + i * 0.75;
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.5, y: yy, w: 4.0, h: 0.6,
        fill: { color: C.white },
        shadow: makeShadow()
      });
      s.addText(t.label, {
        x: 0.65, y: yy + 0.05, w: 1.5, h: 0.22,
        fontSize: 9, fontFace: FONT.body, color: C.gray, margin: 0
      });
      s.addText(t.val, {
        x: 0.65, y: yy + 0.25, w: 3.0, h: 0.3,
        fontSize: 22, fontFace: FONT.accent, color: C.rouge, margin: 0
      });
    });

    // Fund usage
    s.addText("资金使用规划", {
      x: 5.2, y: 1.15, w: 4, h: 0.25,
      fontSize: 12, fontFace: FONT.title, color: C.night, bold: true, margin: 0
    });
    const usage = [
      { item: "算法研发", pct: "XX%", desc: "知识图谱2.0 + 推荐引擎优化 + LLM fine-tune" },
      { item: "产品迭代", pct: "XX%", desc: "移动端App + 全平台体验优化" },
      { item: "市场拓展", pct: "XX%", desc: "高校BD团队 + 线上获客" },
      { item: "内容建设", pct: "XX%", desc: "课程开发 + 竞赛数据采购" },
      { item: "运营储备", pct: "XX%", desc: "6-12个月运营资金" },
    ];
    usage.forEach((u, i) => {
      const yy = 1.45 + i * 0.58;
      s.addShape(pres.shapes.RECTANGLE, {
        x: 5.2, y: yy, w: 4.3, h: 0.5,
        fill: { color: C.white },
        shadow: makeShadow()
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x: 5.2, y: yy, w: 0.05, h: 0.5,
        fill: { color: i === 0 ? C.rouge : C.green }
      });
      s.addText(u.item, {
        x: 5.4, y: yy + 0.02, w: 1.8, h: 0.2,
        fontSize: 10, fontFace: FONT.title, color: C.ink, bold: true, margin: 0
      });
      s.addText(u.desc, {
        x: 5.4, y: yy + 0.22, w: 3.0, h: 0.22,
        fontSize: 8, fontFace: FONT.body, color: C.gray, margin: 0
      });
      s.addText(u.pct, {
        x: 8.3, y: yy, w: 1.0, h: 0.5,
        fontSize: 18, fontFace: FONT.accent, color: C.rouge, align: "center", valign: "middle", margin: 0
      });
    });
  }

  // ═══════════════════════════════════════════
  // Part 5 Divider: 项目团队
  // ═══════════════════════════════════════════
  addSectionDivider(pres, 5, "项目团队", "负责人 · 成员 · 导师 · 顾问 — 凭什么这个团队能做？");

  // ═══════════════════════════════════════════
  // Slide 24: 5.1 项目负责人
  // ═══════════════════════════════════════════
  {
    const s = addContentSlide(pres, "5.1 项目负责人 & 核心团队", 24, TOTAL);
    // Leader card
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.2, w: 4.2, h: 3.2,
      fill: { color: C.white },
      shadow: makeShadow()
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.2, w: 4.2, h: 0.06,
      fill: { color: C.rouge }
    });
    s.addText("项目负责人", {
      x: 0.7, y: 1.35, w: 2, h: 0.25,
      fontSize: 10, fontFace: FONT.body, color: C.rouge, margin: 0
    });
    s.addText("XXX", {
      x: 0.7, y: 1.6, w: 3.5, h: 0.4,
      fontSize: 24, fontFace: FONT.title, color: C.ink, bold: true, margin: 0
    });
    s.addText([
      { text: "XX级 XX专业", options: { breakLine: true } },
      { text: "角色：项目负责人 / 全栈架构师", options: { breakLine: true } },
      { text: "", options: { breakLine: true, fontSize: 6 } },
      { text: "核心能力：", options: { bold: true, breakLine: true } },
      { text: "• Vue 3 / Node.js / Python / ML", options: { breakLine: true } },
      { text: "• XX竞赛获奖 / XX论文发表", options: { breakLine: true } },
      { text: "• 带领XX人团队 / XX个月持续交付", options: {} },
    ], {
      x: 0.7, y: 2.1, w: 3.8, h: 2.0,
      fontSize: 10, fontFace: FONT.body, color: C.text, margin: 0, lineSpacingMultiple: 1.5
    });

    // Team summary
    s.addText("团队结构", {
      x: 5.2, y: 1.15, w: 4, h: 0.25,
      fontSize: 12, fontFace: FONT.title, color: C.night, bold: true, margin: 0
    });
    const members = [
      { name: "XXX", major: "计算机科学", role: "技术负责人", skills: "架构/推荐算法" },
      { name: "XXX", major: "软件工程", role: "前端工程师", skills: "Vue 3/TypeScript" },
      { name: "XXX", major: "数据科学/AI", role: "算法工程师", skills: "Python/KG/LLM" },
      { name: "XXX", major: "信息管理", role: "后端工程师", skills: "Express/DevOps" },
      { name: "XXX", major: "工商管理", role: "产品运营", skills: "用户增长/BD" },
      { name: "XXX", major: "设计学", role: "UI/UX设计", skills: "Figma/品牌" },
    ];
    members.forEach((m, i) => {
      const yy = 1.45 + i * 0.5;
      s.addShape(pres.shapes.RECTANGLE, {
        x: 5.2, y: yy, w: 4.3, h: 0.42,
        fill: { color: C.white },
        shadow: makeShadow()
      });
      s.addText(m.name, {
        x: 5.3, y: yy + 0.02, w: 1.2, h: 0.18,
        fontSize: 10, fontFace: FONT.title, color: C.ink, bold: true, margin: 0
      });
      s.addText(m.major, {
        x: 5.3, y: yy + 0.2, w: 1.2, h: 0.18,
        fontSize: 7, fontFace: FONT.light, color: C.gray, margin: 0
      });
      s.addText(m.role, {
        x: 6.5, y: yy + 0.02, w: 1.8, h: 0.18,
        fontSize: 9, fontFace: FONT.body, color: C.text, margin: 0
      });
      s.addText(m.skills, {
        x: 6.5, y: yy + 0.2, w: 2.0, h: 0.18,
        fontSize: 8, fontFace: FONT.light, color: C.green, margin: 0
      });
    });

    s.addText("六人团队覆盖计算机 × AI × 管理 × 设计四大学科，具备从算法研发到产品落地的全栈执行力。", {
      x: 0.5, y: 4.7, w: 9, h: 0.3,
      fontSize: 11, fontFace: FONT.title, color: C.rouge, bold: true, margin: 0
    });
  }

  // ═══════════════════════════════════════════
  // Slide 25: 5.3 指导教师
  // ═══════════════════════════════════════════
  {
    const s = addContentSlide(pres, "5.3 指导教师 & 专家顾问", 25, TOTAL);
    // Advisor card
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.2, w: 4.2, h: 2.5,
      fill: { color: C.white },
      shadow: makeShadow()
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.2, w: 4.2, h: 0.06,
      fill: { color: C.night }
    });
    s.addText("指导教师", {
      x: 0.7, y: 1.35, w: 2, h: 0.25,
      fontSize: 11, fontFace: FONT.title, color: C.night, bold: true, margin: 0
    });
    s.addText([
      { text: "姓名：XXX", options: { breakLine: true } },
      { text: "职称：XX大学XX学院 教授", options: { breakLine: true } },
      { text: "研究方向：[教育技术/知识图谱/推荐系统]", options: { breakLine: true } },
      { text: "", options: { breakLine: true, fontSize: 6 } },
      { text: "代表性学术贡献：", options: { bold: true, breakLine: true } },
      { text: "• [代表性论文/项目/奖项]", options: { breakLine: true } },
      { text: "", options: { breakLine: true, fontSize: 6 } },
      { text: "对知途的指导贡献：", options: { bold: true, breakLine: true } },
      { text: "• [具体指导内容]", options: {} },
    ], {
      x: 0.7, y: 1.65, w: 3.8, h: 1.9,
      fontSize: 10, fontFace: FONT.body, color: C.text, margin: 0, lineSpacingMultiple: 1.5
    });

    // Consultants
    s.addText("专家顾问团队（如适用）", {
      x: 5.2, y: 1.15, w: 4, h: 0.25,
      fontSize: 12, fontFace: FONT.title, color: C.night, bold: true, margin: 0
    });
    const advisors = [
      { name: "XXX", title: "XX大学XX学院 教授", field: "教育技术" },
      { name: "XXX", title: "XX科技公司 CTO", field: "AI/推荐系统" },
      { name: "XXX", title: "XX创投 合伙人", field: "创业孵化" },
    ];
    advisors.forEach((a, i) => {
      const yy = 1.5 + i * 0.7;
      s.addShape(pres.shapes.RECTANGLE, {
        x: 5.2, y: yy, w: 4.3, h: 0.6,
        fill: { color: C.white },
        shadow: makeShadow()
      });
      s.addText(a.name, {
        x: 5.35, y: yy + 0.05, w: 2, h: 0.22,
        fontSize: 12, fontFace: FONT.title, color: C.ink, bold: true, margin: 0
      });
      s.addText(a.title, {
        x: 5.35, y: yy + 0.28, w: 3, h: 0.22,
        fontSize: 9, fontFace: FONT.body, color: C.gray, margin: 0
      });
      s.addText(a.field, {
        x: 7.8, y: yy + 0.1, w: 1.5, h: 0.3,
        fontSize: 10, fontFace: FONT.light, color: C.green, margin: 0
      });
    });
  }

  // ═══════════════════════════════════════════
  // Part 6 Divider: 教育引领
  // ═══════════════════════════════════════════
  addSectionDivider(pres, 6, "补分点 · 战略规划", "引领教育 · 带动就业 · 未来规划 — 项目的社会价值与远见");

  // ═══════════════════════════════════════════
  // Slide 27: 6.1 引领教育
  // ═══════════════════════════════════════════
  {
    const s = addContentSlide(pres, "6.1 引领教育 — 以算法平权推进教育公平", 27, TOTAL);

    // Theory position
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.2, w: 9.0, h: 0.7,
      fill: { color: C.white },
      shadow: makeShadow()
    });
    s.addText("理论立场：教育公平不应止于\"接入公平\"（让每个人都有网），而应走向\"算法公平\"——让每个人都能获得同等质量的智能导航服务，而非在信息海洋中凭家庭文化资本\"自我导航\"。", {
      x: 0.7, y: 1.25, w: 8.6, h: 0.55,
      fontSize: 11, fontFace: FONT.body, color: C.text, margin: 0, lineSpacingMultiple: 1.5
    });

    // Four dimensions
    const dims = [
      { dim: "信息公平", before: "985学生凭学长学姐口口相传获取信息优势", after: "算法为所有学生提供同等质量的竞赛推荐", color: C.night },
      { dim: "路径公平", before: "家庭有学术背景的学生更易知道\"下一步\"", after: "知识图谱为每个学生生成个性化学习路径", color: C.green },
      { dim: "资源公平", before: "高质量课程/论文集中于头部高校", after: "平台整合公开资源+AI助教降低门槛", color: C.night },
      { dim: "能力公平", before: "编程训练依赖学校实验室条件", after: "浏览器内Monaco Editor+OJ零门槛实训", color: C.green },
    ];
    dims.forEach((d, i) => {
      const yy = 2.15 + i * 0.72;
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.5, y: yy, w: 9.0, h: 0.62,
        fill: { color: C.white },
        shadow: makeShadow()
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.5, y: yy, w: 0.06, h: 0.62,
        fill: { color: d.color }
      });
      s.addText(d.dim, {
        x: 0.7, y: yy + 0.05, w: 1.5, h: 0.25,
        fontSize: 12, fontFace: FONT.title, color: C.ink, bold: true, margin: 0
      });
      s.addText(d.before, {
        x: 0.7, y: yy + 0.3, w: 4.0, h: 0.25,
        fontSize: 9, fontFace: FONT.body, color: C.gray, margin: 0
      });
      s.addText("→", {
        x: 4.4, y: yy + 0.3, w: 0.3, h: 0.25,
        fontSize: 10, color: C.green, align: "center", margin: 0
      });
      s.addText(d.after, {
        x: 4.7, y: yy + 0.3, w: 4.5, h: 0.25,
        fontSize: 9, fontFace: FONT.body, color: C.green, margin: 0
      });
    });

    // Impact data
    s.addText([
      { text: "育人成效：", options: { bold: true } },
      { text: "XXX名\"双非\"院校学生首次通过知途成功报名国家级竞赛 | XXX名学生完成首个完整学习路径 | XX名学生从零基础到竞赛获奖", options: {} }
    ], {
      x: 0.5, y: 5.05, w: 9, h: 0.3,
      fontSize: 10, fontFace: FONT.body, color: C.text, margin: 0
    });
  }

  // ═══════════════════════════════════════════
  // Slide 28: 6.2 带动就业
  // ═══════════════════════════════════════════
  {
    const s = addContentSlide(pres, "6.2 带动就业 — 从学术能力到职业竞争力", 28, TOTAL);

    // Conduction chain
    s.addText("知途 → 就业的传导链", {
      x: 0.6, y: 1.15, w: 5, h: 0.25,
      fontSize: 12, fontFace: FONT.title, color: C.night, bold: true, margin: 0
    });
    const chain = ["算法推荐竞赛", "系统学习技能", "竞赛获奖", "论文产出", "简历信号增强", "获得工作/深造"];
    chain.forEach((c, i) => {
      const xx = 0.5 + i * 1.55;
      s.addShape(pres.shapes.RECTANGLE, {
        x: xx, y: 1.5, w: 1.4, h: 0.55,
        fill: { color: i === chain.length - 1 ? C.rouge : C.night }
      });
      s.addText(c, {
        x: xx, y: 1.5, w: 1.4, h: 0.55,
        fontSize: 9, fontFace: FONT.title, color: C.white, align: "center", valign: "middle", margin: 0
      });
      if (i < chain.length - 1) {
        s.addText("→", {
          x: xx + 1.4, y: 1.55, w: 0.15, h: 0.4,
          fontSize: 11, color: C.green, align: "center", valign: "middle", margin: 0
        });
      }
    });

    // Three mechanisms
    const mechs = [
      { title: "信号增强", desc: "竞赛获奖记录+技能认证徽章 → 生成\"能力档案\"，替代传统简历中难以量化的\"综合能力\"", icon: "📡" },
      { title: "能力积累", desc: "代码实训 → GitHub式提交记录 → 可展示的作品集，用实际项目替代空洞的课程成绩", icon: "📈" },
      { title: "市场对齐", desc: "校企数据对接 → 匹配企业技能需求 → 有针对性学习路径，从\"学了再说\"到\"市场导向\"", icon: "🎯" },
    ];
    mechs.forEach((m, i) => {
      const yy = 2.4 + i * 0.85;
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.5, y: yy, w: 9.0, h: 0.72,
        fill: { color: C.white },
        shadow: makeShadow()
      });
      s.addText(m.icon, {
        x: 0.65, y: yy + 0.1, w: 0.45, h: 0.45,
        fontSize: 20, margin: 0
      });
      s.addText(m.title, {
        x: 1.2, y: yy + 0.05, w: 2, h: 0.28,
        fontSize: 13, fontFace: FONT.title, color: C.ink, bold: true, margin: 0
      });
      s.addText(m.desc, {
        x: 1.2, y: yy + 0.33, w: 7.5, h: 0.33,
        fontSize: 10, fontFace: FONT.body, color: C.text, margin: 0
      });
    });

    s.addText("数据支撑（需填入）：通过平台学习后XX%的学生表示\"简历更有竞争力\" | XX%获得实习/工作机会", {
      x: 0.5, y: 5.1, w: 9, h: 0.25,
      fontSize: 9, fontFace: FONT.light, color: C.gray, margin: 0
    });
  }

  // ═══════════════════════════════════════════
  // Slide 29: 6.3 未来规划
  // ═══════════════════════════════════════════
  {
    const s = addContentSlide(pres, "6.3 未来规划 — 三阶段发展路线图", 29, TOTAL);

    const phases = [
      { phase: "Phase 1: 深耕验证", time: "2026-2027", items: "• V1.0→V2.0 核心功能完整\n• XX高校试点\n• X万种子用户\n• 商业模式验证\n• 首轮融资", color: C.night },
      { phase: "Phase 2: 规模扩展", time: "2027-2028", items: "• V3.0→V4.0 全网推广\n• XXX高校签约\n• XX万注册用户\n• 盈亏平衡\n• A轮融资", color: C.green },
      { phase: "Phase 3: 生态引领", time: "2028-2029", items: "• 教育大模型\n• 自适应学习系统\n• XXX万用户\n• 市场前3\n• A+轮融资", color: C.rouge },
    ];
    phases.forEach((p, i) => {
      const xx = 0.5 + i * 3.15;
      s.addShape(pres.shapes.RECTANGLE, {
        x: xx, y: 1.2, w: 2.95, h: 2.8,
        fill: { color: C.white },
        shadow: makeShadow()
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x: xx, y: 1.2, w: 2.95, h: 0.06,
        fill: { color: p.color }
      });
      s.addText(p.phase, {
        x: xx + 0.15, y: 1.35, w: 2.65, h: 0.3,
        fontSize: 13, fontFace: FONT.title, color: C.ink, bold: true, margin: 0
      });
      s.addText(p.time, {
        x: xx + 0.15, y: 1.62, w: 2.65, h: 0.22,
        fontSize: 9, fontFace: FONT.light, color: C.gray, margin: 0
      });
      s.addText(p.items, {
        x: xx + 0.15, y: 1.95, w: 2.65, h: 1.85,
        fontSize: 10, fontFace: FONT.body, color: C.text, margin: 0,
        lineSpacingMultiple: 1.6
      });
      if (i < 2) {
        s.addText("→", {
          x: xx + 2.95, y: 2.3, w: 0.2, h: 0.3,
          fontSize: 20, color: C.green, align: "center", margin: 0
        });
      }
    });

    // Tech evolution timeline
    s.addText("技术演进路线", {
      x: 0.6, y: 4.2, w: 3, h: 0.25,
      fontSize: 11, fontFace: FONT.title, color: C.night, bold: true, margin: 0
    });
    const techEvo = [
      { year: "2026", item: "协同过滤1.0 + KG 1.0" },
      { year: "2027", item: "深度推荐2.0 + KG 2.0" },
      { year: "2028", item: "教育大模型 fine-tune" },
      { year: "2029", item: "自适应学习 + 多模态AI" },
    ];
    s.addShape(pres.shapes.LINE, {
      x: 0.8, y: 4.9, w: 8.4, h: 0,
      line: { color: C.border, width: 2 }
    });
    techEvo.forEach((t, i) => {
      const xx = 1.0 + i * 2.2;
      s.addShape(pres.shapes.OVAL, {
        x: xx, y: 4.82, w: 0.16, h: 0.16,
        fill: { color: i === 0 ? C.green : i === 3 ? C.rouge : C.night }
      });
      s.addText(t.year, {
        x: xx - 0.3, y: 4.5, w: 1.0, h: 0.22,
        fontSize: 10, fontFace: FONT.accent, color: C.night, align: "center", margin: 0
      });
      s.addText(t.item, {
        x: xx - 0.5, y: 5.02, w: 1.8, h: 0.3,
        fontSize: 8, fontFace: FONT.body, color: C.text, align: "center", margin: 0
      });
    });
  }

  // ═══════════════════════════════════════════
  // Slide 30: 结束页
  // ═══════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.ink };
    // Decorative path
    s.addShape(pres.shapes.LINE, {
      x: 3.0, y: 2.1, w: 4.0, h: 0,
      line: { color: C.green, width: 1.5 }
    });
    s.addShape(pres.shapes.OVAL, {
      x: 7.2, y: 2.03, w: 0.14, h: 0.14,
      fill: { color: C.green }
    });
    s.addText("知途", {
      x: 0, y: 2.3, w: 10, h: 1.0,
      fontSize: 48, fontFace: FONT.title, color: C.white, bold: true, align: "center", margin: 0
    });
    s.addText("AI 通识智研与算法赋能空间", {
      x: 0, y: 3.2, w: 10, h: 0.5,
      fontSize: 16, fontFace: FONT.light, color: C.gray, align: "center", margin: 0
    });
    s.addText("知者不惑，途者不迷", {
      x: 0, y: 3.7, w: 10, h: 0.4,
      fontSize: 14, fontFace: FONT.title, color: C.green, align: "center", italic: true, margin: 0
    });
    s.addText([
      { text: "联系方式：[电话]  |  [邮箱]  |  [微信]", options: { breakLine: true } },
      { text: "扫描关注：[公众号/小程序二维码]", options: {} }
    ], {
      x: 0, y: 4.5, w: 10, h: 0.5,
      fontSize: 10, fontFace: FONT.light, color: C.gray, align: "center", margin: 0
    });
    s.addText("🤖 本文档由 AI 辅助生成 | 知途团队 © 2026", {
      x: 0, y: 5.2, w: 10, h: 0.25,
      fontSize: 7, fontFace: FONT.light, color: C.gray, align: "center", margin: 0
    });
  }

  // ═══════════════════════════════════════════
  // Export
  // ═══════════════════════════════════════════
  const outPath = "E:\\Q1.1\\output\\知途-国创赛2026.pptx";
  await pres.writeFile({ fileName: outPath });
  console.log(`✅ PPT 已生成: ${outPath}`);
  console.log(`📊 共 ${TOTAL} 页幻灯片`);
  return outPath;
}

main().catch(err => {
  console.error("❌ 生成失败:", err.message);
  process.exit(1);
});
