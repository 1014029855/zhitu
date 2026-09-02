const PHASE_NAMES = ['基础篇', '核心篇', '进阶篇', '实践篇', '拓展篇']

const PSYCHOLOGY_MODULES = [
  { title: '心理学如何研究心智', description: '从科学方法进入大脑与行为。', start: 0, end: 5 },
  { title: '感觉、知觉与意识', description: '理解大脑如何选择并解释外界信息。', start: 5, end: 10 },
  { title: '学习、记忆与思维', description: '用实验理解经验如何改变行为与判断。', start: 10, end: 18 },
  { title: '动机、情绪与个体差异', description: '解释人为什么行动，以及人与人为何不同。', start: 18, end: 24 },
  { title: '心理健康与干预', description: '辨认心理困扰，并理解有效干预的证据。', start: 24, end: 28 },
  { title: '人与社会情境', description: '观察群体、文化与情境如何塑造行为。', start: 28, end: 36 },
  { title: '发展、自我与幸福', description: '把心理学用于一生的发展与更好的生活。', start: 36, end: Number.POSITIVE_INFINITY }
]

const INTERACTIVE_LESSONS = {
  0: {
    title: '什么让心理学成为科学',
    summary: '从一条看似可信的学习建议出发，分清经验判断与可检验的证据。',
    scenario: {
      eyebrow: '先做判断',
      title: '迷迭香真的能提高考试成绩吗？',
      body: '校园账号声称：“考前闻迷迭香，记忆力能提高 30%。”帖子有两千次点赞，也有不少同学留言说有效。你会怎样验证这句话？'
    },
    activities: [
      {
        type: 'single_choice',
        prompt: '下面哪种做法最能检验迷迭香是否真的影响成绩？',
        knowledgePoint: '科学方法',
        config: {
          choices: [
            { id: 'a', label: '采访使用过迷迭香的高分同学', feedback: '这只能收集成功案例，无法排除原本成绩和期待效应。' },
            { id: 'b', label: '随机分组并控制学习时间，再比较两组成绩', feedback: '随机分组和控制变量能把香味的影响从其他因素中分离出来。' },
            { id: 'c', label: '继续搜索更多支持这条说法的帖子', feedback: '支持帖数量不能替代对照，也容易放大确认偏误。' },
            { id: 'd', label: '让全班都使用，再看平均分是否提高', feedback: '没有对照组时，题目难度和复习投入都可能解释变化。' }
          ],
          correctAnswer: 'b',
          hint: '想一想：怎样让两组同学除了“是否闻到香味”之外尽量相同？'
        },
        explanation: '心理学之所以是科学，不在于它研究“人”，而在于它提出可证伪的问题，用对照、测量和重复来约束解释。'
      }
    ]
  },
  8: {
    summary: '把视觉错觉当成线索，观察经验与感觉信息如何共同生成知觉。',
    scenario: {
      eyebrow: '观察实验',
      title: '你看到的，并不等于眼睛收到的',
      body: '同一个模糊符号放在 A-C 和 12-14 之间，人们会分别把它读成 B 和 13。物理刺激没有改变，解释却变了。'
    },
    activities: [
      {
        type: 'classify',
        prompt: '把下面线索归入更主要的加工方式。',
        knowledgePoint: '自上而下与自下而上',
        config: {
          categories: [
            { id: 'bottom_up', label: '自下而上' },
            { id: 'top_down', label: '自上而下' }
          ],
          items: [
            { id: 'a', label: '视网膜接收到线条的方向与亮度' },
            { id: 'b', label: '前后字符让你预期它是字母' },
            { id: 'c', label: '过去阅读数字的经验' }
          ],
          correctMatches: { a: 'bottom_up', b: 'top_down', c: 'top_down' },
          hint: '外界特征从感受器向上加工；知识与期待从已有经验向下影响解释。'
        },
        explanation: '知觉是感觉输入和既有模型的协商结果。错觉不是系统失灵，而是大脑通常高效推断世界时留下的可见痕迹。'
      }
    ]
  },
  10: {
    summary: '不用背术语，先把条件作用发生的顺序排出来。',
    scenario: {
      eyebrow: '行为实验',
      title: '为什么提示音会让人立刻紧张？',
      body: '小林每次收到课程平台的提示音，紧接着都会看到临近截止的任务。几周后，即使没有任务，提示音也会让他心跳加快。'
    },
    activities: [
      {
        type: 'sequence',
        prompt: '按经典条件作用形成的逻辑排列四个事件。',
        knowledgePoint: '条件反射',
        config: {
          items: [
            { id: 'a', label: '临近截止的任务自然引发紧张' },
            { id: 'b', label: '提示音反复与截止任务同时出现' },
            { id: 'c', label: '提示音逐渐成为条件刺激' },
            { id: 'd', label: '只听到提示音也出现紧张反应' }
          ],
          correctOrder: ['a', 'b', 'c', 'd'],
          hint: '先找出不需要学习就会发生的反应，再看原本中性的刺激怎样获得意义。'
        },
        explanation: '经典条件作用不是简单的“刺激后有反应”，而是原本中性的线索通过稳定配对获得了预测意义。'
      }
    ]
  },
  14: {
    summary: '比较四种复习安排，用提取和间隔原则设计真正有效的学习。',
    scenario: {
      eyebrow: '学习设计',
      title: '同样用 90 分钟，怎么安排更牢？',
      body: '你需要在一周后记住 30 个概念。四名同学提出不同安排，但时间预算完全相同。'
    },
    activities: [
      {
        type: 'multiple_choice',
        prompt: '哪些安排同时利用了“间隔效应”和“主动提取”？',
        knowledgePoint: '间隔效应',
        config: {
          choices: [
            { id: 'a', label: '连续读三遍讲义并划重点' },
            { id: 'b', label: '分三天用空白纸回忆概念，再核对遗漏' },
            { id: 'c', label: '每天做一组打乱顺序的小测' },
            { id: 'd', label: '考前一晚集中背完全部概念' }
          ],
          correctAnswers: ['b', 'c'],
          hint: '“看起来熟悉”不等于“能从记忆中取出”。同时留意练习是否分散到了多天。'
        },
        explanation: '分散练习制造适度遗忘，主动提取则迫使大脑重建路径；两者结合比重复阅读更能预测延迟测验表现。'
      }
    ]
  },
  15: {
    title: '记忆为什么会失真',
    summary: '像研究员一样判断证据，区分编码差异、提取困难与重构记忆。',
    knowledgePoints: ['编码', '提取', '重构记忆'],
    scenario: {
      eyebrow: '目击者案例',
      title: '两个人看见同一场事故，为什么说法不同？',
      body: '昨晚 8 点，小李和小周在校门口目击一辆黑色轿车急停。事后，两人对车速和行人倒地的位置描述不一致。'
    },
    activities: [
      {
        type: 'classify',
        prompt: '把每条证据放到它最支持的解释中。',
        knowledgePoint: '重构记忆',
        config: {
          categories: [
            { id: 'encoding', label: '编码差异' },
            { id: 'retrieval', label: '提取困难' },
            { id: 'reconstruction', label: '重构记忆' }
          ],
          items: [
            { id: 'a', label: '事发时路灯较暗，两人距离现场约 20 米' },
            { id: 'b', label: '小李访谈前先被问“那辆飞驰的车有多快”' },
            { id: 'c', label: '两人事后在社交媒体看过不同角度的照片' }
          ],
          correctMatches: { a: 'encoding', b: 'reconstruction', c: 'reconstruction' },
          hint: '问自己：差异发生在最初看见时，还是后来回忆被新信息改写时？'
        },
        explanation: '记忆不是保存后原样播放的录像。提问措辞、事后信息和反复想象都可能进入下一次回忆，使人真诚却不准确。'
      },
      {
        type: 'single_choice',
        prompt: '为了减少访谈对记忆的污染，调查者下一步最应该怎么做？',
        knowledgePoint: '提取',
        config: {
          choices: [
            { id: 'a', label: '告诉两人其他目击者已经确认车速很快', feedback: '这会引入社会信息，进一步改变回忆。' },
            { id: 'b', label: '分别请两人用自己的话自由叙述，再追问中性细节', feedback: '自由回忆和中性提问能减少调查者把答案带入问题。' },
            { id: 'c', label: '反复询问同一个细节，直到答案一致', feedback: '重复施压可能提高信心，却不一定提高准确性。' },
            { id: 'd', label: '让两人先互相讨论，形成完整版本', feedback: '共同讨论会造成记忆趋同，难以保留独立证据。' }
          ],
          correctAnswer: 'b',
          hint: '最好的问题应该尽量少带入调查者自己的假设。'
        },
        explanation: '认知访谈优先使用开放、中性的提示，让目击者自行恢复情境；准确性来自程序约束，而不是把不同叙述强行统一。'
      },
      {
        type: 'single_choice',
        prompt: '操控提问措辞，观察它如何改变目击者对车速的估计。',
        knowledgePoint: '重构记忆',
        config: {
          variant: 'simulation',
          controlLabel: '访谈中的动词',
          controls: [
            { id: 'contacted', label: '接触', value: 34 },
            { id: 'hit', label: '碰撞', value: 41 },
            { id: 'smashed', label: '猛烈撞击', value: 48 }
          ],
          outputLabel: '平均估计车速',
          outputUnit: 'km/h',
          choices: [
            { id: 'memory', label: '事故本身的真实车速在访谈后发生了改变' },
            { id: 'wording', label: '提问措辞参与了回忆的重构' },
            { id: 'random', label: '结果只是随机波动，与访谈无关' }
          ],
          correctConclusion: 'wording',
          hint: '只改变一个变量：问题里的动词。看输出是否出现方向一致的变化。'
        },
        explanation: '这类实验把“事后信息”变成可操控变量。措辞越强烈，参与者报告的速度通常越高，说明回忆会吸收访谈时的新线索。'
      },
      {
        type: 'single_choice',
        prompt: '校保卫处明天要重新访谈两名目击者。请写出一套不少于两步的访谈方案，并说明它如何减少记忆污染。',
        knowledgePoint: '提取',
        config: {
          variant: 'short_answer',
          placeholder: '例如：先分别请两人……；随后用……追问，因为……',
          minLength: 36,
          expectedKeywords: ['开放', '中性', '分别', '独立', '自由叙述'],
          minimumMatches: 2,
          hint: '方案要同时回答“怎么问”和“为什么这样问”。'
        },
        explanation: '高质量方案通常包含独立访谈、自由叙述和中性追问。它们不能保证回忆完全准确，但能减少调查程序本身制造的新偏差。'
      }
    ]
  },
  17: {
    summary: '在真实选择中识别框架效应、可得性启发式和确认偏误。',
    scenario: {
      eyebrow: '判断实验',
      title: '“成功率 90%”和“失败率 10%”一样吗？',
      body: '两种治疗方案的数据完全相同，但用“90% 的人存活”描述时，人们明显更愿意选择它。'
    },
    activities: [
      {
        type: 'single_choice',
        prompt: '这项结果最直接说明了哪一种判断偏差？',
        knowledgePoint: '框架效应',
        config: {
          choices: [
            { id: 'a', label: '确认偏误', feedback: '确认偏误强调只寻找支持原有立场的信息。' },
            { id: 'b', label: '可得性启发式', feedback: '可得性依赖例子被想起的容易程度。' },
            { id: 'c', label: '框架效应', feedback: '同一概率因收益或损失的表达方式不同而改变选择。' },
            { id: 'd', label: '功能固着', feedback: '功能固着发生在我们只按物品的惯常用途思考时。' }
          ],
          correctAnswer: 'c',
          hint: '数据没有变，改变的是表达同一数据的方式。'
        },
        explanation: '框架效应提醒我们，在高风险决策中应把相同数据同时转换为收益与损失表述，再比较绝对数字。'
      }
    ]
  }
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value || '')
  } catch {
    return fallback
  }
}

function makeGenericModules(chapters) {
  const unitCount = Math.min(PHASE_NAMES.length, Math.max(1, Math.ceil(chapters.length / 8)))
  const size = Math.ceil(chapters.length / unitCount)
  return Array.from({ length: unitCount }, (_, index) => {
    const start = index * size
    const end = Math.min(chapters.length, start + size)
    const first = chapters[start]
    return {
      title: `${PHASE_NAMES[index]}：${first?.title || '课程内容'}`,
      description: `围绕 ${first?.title || '核心概念'} 建立本单元的知识结构。`,
      start,
      end
    }
  }).filter(module => module.start < chapters.length)
}

function seedCourse(db, course) {
  const existing = db.prepare('SELECT id FROM course_modules WHERE skill_id = ? LIMIT 1').get(course.id)
  if (existing) return false

  const chapters = parseJson(course.chapters, [])
  if (!chapters.length) return false

  const isPsychology = course.title === '心理学导论'
  const modules = isPsychology ? PSYCHOLOGY_MODULES : makeGenericModules(chapters)
  const insertModule = db.prepare(`
    INSERT INTO course_modules (skill_id, title, description, sort_order)
    VALUES (?, ?, ?, ?)
  `)
  const insertLesson = db.prepare(`
    INSERT INTO course_lessons (
      module_id, legacy_chapter_order, title, summary, lesson_type,
      estimated_minutes, sort_order, status, prerequisite_lesson_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?)
  `)
  const insertKnowledge = db.prepare(`
    INSERT INTO knowledge_points (skill_id, title, description, sort_order)
    VALUES (?, ?, ?, ?) ON CONFLICT(skill_id, title) DO UPDATE SET title = excluded.title
  `)
  const findKnowledge = db.prepare('SELECT id FROM knowledge_points WHERE skill_id = ? AND title = ?')
  const linkKnowledge = db.prepare(`
    INSERT OR IGNORE INTO lesson_knowledge_points (lesson_id, knowledge_point_id, weight)
    VALUES (?, ?, ?)
  `)
  const insertBlock = db.prepare(`
    INSERT INTO lesson_blocks (lesson_id, type, sort_order, content_json)
    VALUES (?, ?, ?, ?)
  `)
  const insertActivity = db.prepare(`
    INSERT INTO learning_activities (
      lesson_id, knowledge_point_id, type, prompt, config_json,
      explanation, points, sort_order, is_required
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `)

  let previousLessonId = null
  let knowledgeOrder = 0
  for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex += 1) {
    const module = modules[moduleIndex]
    const moduleId = Number(insertModule.run(
      course.id,
      module.title,
      module.description,
      moduleIndex
    ).lastInsertRowid)

    const end = Math.min(chapters.length, module.end)
    for (let chapterIndex = module.start; chapterIndex < end; chapterIndex += 1) {
      const chapter = chapters[chapterIndex]
      const rich = isPsychology ? INTERACTIVE_LESSONS[chapterIndex] : null
      const title = rich?.title || chapter.title
      const summary = rich?.summary || `用一个课时理解“${chapter.title}”的核心概念与应用。`
      const minutes = Math.max(8, Math.min(22, Math.ceil((chapter.content || '').length / 55) + 7))
      const lessonId = Number(insertLesson.run(
        moduleId,
        chapterIndex,
        title,
        summary,
        rich ? 'interactive' : 'reading',
        minutes,
        chapterIndex - module.start,
        previousLessonId
      ).lastInsertRowid)
      previousLessonId = lessonId

      const knowledgeIds = new Map()
      const points = Array.from(new Set(rich?.knowledgePoints || [...(chapter.key_points || []), ...(rich?.activities || []).map(a => a.knowledgePoint)]))
        .filter(Boolean)
      for (const point of points) {
        insertKnowledge.run(course.id, point, `来自课时“${title}”的核心概念。`, knowledgeOrder)
        const pointId = findKnowledge.get(course.id, point).id
        knowledgeIds.set(point, pointId)
        linkKnowledge.run(lessonId, pointId, 1)
        knowledgeOrder += 1
      }

      let order = 0
      if (rich?.scenario) {
        insertBlock.run(lessonId, 'scenario', order, JSON.stringify(rich.scenario))
        order += 10
      }

      insertBlock.run(lessonId, 'text', order, JSON.stringify({
        title: rich ? '建立解释' : '',
        body: chapter.content || ''
      }))
      order += 10

      if (rich?.activities?.length) {
        for (const activity of rich.activities) {
          insertActivity.run(
            lessonId,
            knowledgeIds.get(activity.knowledgePoint) || null,
            activity.type,
            activity.prompt,
            JSON.stringify(activity.config),
            activity.explanation,
            10,
            order
          )
          order += 10
        }
      }

      if (chapter.key_points?.length) {
        insertBlock.run(lessonId, 'key_points', order, JSON.stringify({
          title: '带走这三点',
          items: chapter.key_points
        }))
      }
    }
  }

  db.prepare(`
    UPDATE skills
    SET course_status = 'published',
        instructor_name = CASE WHEN title = '心理学导论' THEN '知途心理学教研组' ELSE '知途教研组' END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(course.id)
  return true
}

function syncCuratedLessonKnowledge(db) {
  const course = db.prepare("SELECT id FROM skills WHERE title = '心理学导论'").get()
  if (!course) return

  const findLesson = db.prepare(`
    SELECT l.id FROM course_lessons l
    JOIN course_modules m ON m.id = l.module_id
    WHERE m.skill_id = ? AND l.legacy_chapter_order = ?
  `)
  const insertKnowledge = db.prepare(`
    INSERT INTO knowledge_points (skill_id, title, description, sort_order)
    VALUES (?, ?, ?, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM knowledge_points WHERE skill_id = ?))
    ON CONFLICT(skill_id, title) DO NOTHING
  `)
  const findKnowledge = db.prepare('SELECT id FROM knowledge_points WHERE skill_id = ? AND title = ?')
  const clearLinks = db.prepare('DELETE FROM lesson_knowledge_points WHERE lesson_id = ?')
  const linkKnowledge = db.prepare('INSERT OR IGNORE INTO lesson_knowledge_points (lesson_id, knowledge_point_id, weight) VALUES (?, ?, 1)')
  const findActivities = db.prepare('SELECT id FROM learning_activities WHERE lesson_id = ? ORDER BY sort_order, id')
  const updateActivityKnowledge = db.prepare('UPDATE learning_activities SET knowledge_point_id = ? WHERE id = ?')
  const updateLesson = db.prepare(`
    UPDATE course_lessons SET title = ?, summary = ?, lesson_type = 'interactive', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `)
  const updateScenario = db.prepare(`
    UPDATE lesson_blocks SET content_json = ?, updated_at = CURRENT_TIMESTAMP
    WHERE lesson_id = ? AND type = 'scenario'
  `)
  const updateActivity = db.prepare(`
    UPDATE learning_activities SET knowledge_point_id = ?, type = ?, prompt = ?, config_json = ?,
      explanation = ?, points = 10, sort_order = ?, is_required = 1, is_active = 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `)
  const insertActivity = db.prepare(`
    INSERT INTO learning_activities (
      lesson_id, knowledge_point_id, type, prompt, config_json, explanation,
      points, sort_order, is_required, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, 10, ?, 1, 1)
  `)

  for (const [chapterOrder, lessonConfig] of Object.entries(INTERACTIVE_LESSONS)) {
    const configuredPoints = Array.from(new Set([
      ...(lessonConfig.knowledgePoints || []),
      ...(lessonConfig.activities || []).map(activity => activity.knowledgePoint)
    ])).filter(Boolean)
    if (!configuredPoints.length) continue
    const lesson = findLesson.get(course.id, Number(chapterOrder))
    if (!lesson) continue

    const knowledgeIds = new Map()
    clearLinks.run(lesson.id)
    for (const title of configuredPoints) {
      insertKnowledge.run(course.id, title, `课时“${lessonConfig.title}”的核心概念。`, course.id)
      const pointId = findKnowledge.get(course.id, title).id
      knowledgeIds.set(title, pointId)
      linkKnowledge.run(lesson.id, pointId)
    }

    updateLesson.run(lessonConfig.title || db.prepare('SELECT title FROM course_lessons WHERE id = ?').get(lesson.id).title, lessonConfig.summary || '', lesson.id)
    if (lessonConfig.scenario) updateScenario.run(JSON.stringify(lessonConfig.scenario), lesson.id)

    const activities = findActivities.all(lesson.id)
    lessonConfig.activities.forEach((activityConfig, index) => {
      const pointId = knowledgeIds.get(activityConfig.knowledgePoint) || null
      const existingActivity = activities[index]
      const sortOrder = 20 + index * 10
      if (existingActivity) {
        updateActivity.run(
          pointId,
          activityConfig.type,
          activityConfig.prompt,
          JSON.stringify(activityConfig.config),
          activityConfig.explanation,
          sortOrder,
          existingActivity.id
        )
        if (pointId) updateActivityKnowledge.run(pointId, existingActivity.id)
      } else {
        insertActivity.run(
          lesson.id,
          pointId,
          activityConfig.type,
          activityConfig.prompt,
          JSON.stringify(activityConfig.config),
          activityConfig.explanation,
          sortOrder
        )
      }
    })
  }
}

module.exports = function seedLearning(db) {
  const courses = db.prepare(`
    SELECT id, title, chapters FROM skills
    WHERE chapters IS NOT NULL AND chapters NOT IN ('', '[]')
    ORDER BY id
  `).all()

  let seeded = 0
  db.transaction(() => {
    for (const course of courses) {
      if (seedCourse(db, course)) seeded += 1
    }
    syncCuratedLessonKnowledge(db)
  })()

  db.prepare(`
    UPDATE skills SET description = ?, updated_at = CURRENT_TIMESTAMP
    WHERE title = '心理学导论' AND description LIKE '%30章%'
  `).run('从日常判断和经典实验出发，理解记忆、情绪、人格与社会行为。')

  if (seeded > 0) console.log(`Seeded structured learning paths for ${seeded} courses`)
}
