const { db } = require('./connection')
const fs = require('fs')
const path = require('path')

// Only seed if no courses exist yet
const count = db.prepare("SELECT COUNT(*) as c FROM skills WHERE chapters IS NOT NULL AND chapters != ''").get()
if (count.c > 0) {
  console.log(`Courses already seeded (${count.c} courses), skipping.`)
  return
}

const dir = path.join(__dirname, 'seed-courses')
let courses = []

if (fs.existsSync(dir)) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()
  for (const f of files) {
    const c = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
    courses = courses.concat(Array.isArray(c) ? c : [c])
  }
}

// Fallback: inline course data
if (courses.length === 0) {
  courses = [
    {
      title: 'Python编程基础',
      category: '编程语言',
      difficulty: '入门',
      hours: 40,
      chapters: [
        { title: 'Python简介与环境搭建', content: 'Python的发展历史、特点、应用领域，以及Windows/Mac/Linux下的Python环境搭建和IDE选择。' },
        { title: '变量与数据类型', content: 'Python中的变量命名规则、基本数据类型（int、float、str、bool）、类型转换等。' },
        { title: '运算符与表达式', content: '算术运算符、比较运算符、逻辑运算符、赋值运算符的使用方法和优先级。' },
        { title: '条件判断', content: 'if/elif/else语句的使用、嵌套条件、三元表达式。' },
        { title: '循环结构', content: 'for循环、while循环、break和continue、循环嵌套。' },
        { title: '列表与元组', content: '列表的创建、索引、切片、增删改查操作，以及元组的使用。' },
        { title: '字典与集合', content: '字典的键值对操作、遍历、嵌套，以及集合的去重和集合运算。' },
        { title: '函数定义与调用', content: '函数的定义、参数传递、返回值、作用域、lambda匿名函数。' },
        { title: '模块与包', content: '导入模块的几种方式、常用标准库介绍、pip安装第三方包。' },
        { title: '文件操作', content: '文件的打开、读取、写入、关闭，以及with语句的使用。' },
        { title: '异常处理', content: 'try/except/else/finally结构、常见异常类型、自定义异常。' },
        { title: '面向对象编程基础', content: '类与对象的概念、构造函数、实例方法、类变量、继承与多态。' }
      ]
    },
    {
      title: 'JavaScript全栈开发',
      category: 'Web开发',
      difficulty: '中级',
      hours: 80,
      chapters: [
        { title: 'JavaScript基础回顾', content: '变量、数据类型、运算符、流程控制、函数基础。' },
        { title: 'ES6+新特性', content: '箭头函数、解构赋值、模板字符串、展开运算符、Promise、async/await。' },
        { title: 'DOM操作与事件', content: '元素选择、属性修改、事件监听、事件委托、防抖节流。' },
        { title: 'Node.js入门', content: 'Node.js运行时、npm包管理、CommonJS模块系统、文件系统操作。' },
        { title: 'Express框架', content: '路由定义、中间件机制、请求处理、模板引擎、RESTful API设计。' },
        { title: '数据库操作', content: 'MongoDB与MySQL在Node.js中的使用、ORM工具、数据建模。' },
        { title: '用户认证与授权', content: 'JWT原理与实现、session管理、OAuth2.0、权限控制。' },
        { title: '前端框架Vue.js', content: 'Vue实例、组件化开发、响应式数据、生命周期、路由和状态管理。' },
        { title: '项目实战：博客系统', content: '从零搭建全栈博客：文章CRUD、用户评论、分类标签、搜索功能。' }
      ]
    },
    {
      title: '数据结构与算法',
      category: '计算机基础',
      difficulty: '进阶',
      hours: 120,
      chapters: [
        { title: '算法复杂度分析', content: '大O表示法、时间复杂度和空间复杂度、最好/最坏/平均情况分析。' },
        { title: '数组与链表', content: '动态数组实现、单链表、双向链表、循环链表、LRU缓存。' },
        { title: '栈与队列', content: '顺序栈与链栈、循环队列、双端队列、单调栈与单调队列。' },
        { title: '哈希表', content: '哈希函数设计、冲突解决（链地址法、开放寻址法）、实际应用场景。' },
        { title: '二叉树与遍历', content: '二叉树定义、前序/中序/后序/层序遍历、递归与非递归实现。' },
        { title: '二叉搜索树', content: 'BST性质、插入与删除、平衡二叉树AVL、红黑树简介。' },
        { title: '堆与优先队列', content: '二叉堆的插入与删除、堆排序、TopK问题、Dijkstra中的应用。' },
        { title: '图的表示与遍历', content: '邻接矩阵与邻接表、DFS与BFS、连通分量、拓扑排序。' },
        { title: '动态规划', content: 'DP思想、状态定义与转移方程、经典问题（背包、LCS、编辑距离）。' },
        { title: '贪心算法', content: '贪心策略、区间调度、哈夫曼编码、最小生成树。' },
        { title: '排序算法', content: '冒泡、选择、插入、快速、归并排序的对比与实现。' },
        { title: '字符串算法', content: 'KMP算法、Trie树、Rabin-Karp、AC自动机。' }
      ]
    },
    {
      title: '机器学习与人工智能',
      category: '人工智能',
      difficulty: '进阶',
      hours: 160,
      chapters: [
        { title: '机器学习概述', content: 'AI/ML/DL关系、监督/无监督/强化学习、模型评估指标。' },
        { title: '线性回归', content: '最小二乘法、梯度下降、正则化（L1/L2）、多元线性回归。' },
        { title: '逻辑回归与分类', content: 'Sigmoid函数、交叉熵损失、决策边界、多分类问题。' },
        { title: '决策树与随机森林', content: '信息增益、基尼系数、剪枝策略、集成学习Bagging与Boosting。' },
        { title: '支持向量机', content: '最大间隔分类、核函数技巧、软间隔、SVM参数调优。' },
        { title: '聚类算法', content: 'K-Means、层次聚类、DBSCAN、聚类评估指标。' },
        { title: '神经网络基础', content: '感知机、激活函数、反向传播、梯度消失与爆炸。' },
        { title: '深度学习框架', content: 'TensorFlow/PyTorch基础、模型构建、训练流程、GPU加速。' },
        { title: '卷积神经网络', content: '卷积层与池化层、经典架构（LeNet/ResNet）、图像分类实战。' },
        { title: '循环神经网络', content: 'RNN/LSTM/GRU原理、序列建模、NLP基础应用。' }
      ]
    },
    {
      title: 'Java企业级开发',
      category: '编程语言',
      difficulty: '中级',
      hours: 100,
      chapters: [
        { title: 'Java基础回顾', content: '面向对象三大特性、接口与抽象类、异常处理、泛型。' },
        { title: '集合框架', content: 'List/Set/Map体系、ArrayList与LinkedList对比、HashMap原理。' },
        { title: '多线程编程', content: '线程创建方式、线程安全、synchronized与Lock、线程池。' },
        { title: 'JDBC与数据库', content: 'JDBC操作流程、连接池、事务管理、SQL注入防范。' },
        { title: 'Spring框架基础', content: 'IoC与DI原理、Bean管理、AOP切面编程、注解开发。' },
        { title: 'Spring Boot入门', content: '自动配置、起步依赖、配置文件管理、Actuator监控。' },
        { title: 'MyBatis持久层', content: 'XML映射与注解方式、动态SQL、分页插件、缓存机制。' },
        { title: 'RESTful API设计', content: 'HTTP方法与状态码、接口版本管理、参数校验、统一返回格式。' }
      ]
    },
    {
      title: '数据库原理与SQL',
      category: '计算机基础',
      difficulty: '入门',
      hours: 60,
      chapters: [
        { title: '数据库概述', content: '数据库发展历史、关系型vs非关系型、常见数据库管理系统。' },
        { title: 'SQL基础', content: 'SELECT/FROM/WHERE子句、排序ORDER BY、去重DISTINCT、LIMIT分页。' },
        { title: '数据过滤与函数', content: 'AND/OR/IN/BETWEEN/LIKE、聚合函数、字符串和日期函数。' },
        { title: '多表查询', content: 'INNER/LEFT/RIGHT JOIN、自连接、子查询、UNION合并。' },
        { title: '数据操作', content: 'INSERT/UPDATE/DELETE语句、批量操作、事务ACID特性。' },
        { title: '表设计与范式', content: '数据类型选择、主键与外键、三大范式、索引设计与优化。' },
        { title: '视图与存储过程', content: '创建视图、存储过程与函数、触发器、优缺点分析。' },
        { title: '数据库优化', content: 'EXPLAIN执行计划分析、慢查询优化、读写分离与分库分表概念。' }
      ]
    }
  ]
}

const insert = db.prepare(`
  UPDATE skills SET chapters = ?, description = COALESCE(NULLIF(?, ''), description), category = COALESCE(NULLIF(?, ''), category), difficulty = COALESCE(NULLIF(?, ''), difficulty), estimated_hours = COALESCE(?, estimated_hours) WHERE title = ?
`)

db.transaction(() => {
  for (const c of courses) {
    if (!c.chapters?.length) continue
    const desc = c.cover || c.description || ''
    insert.run(JSON.stringify(c.chapters), desc, c.category, c.difficulty, c.hours || c.estimated_hours || 40, c.title)
    // If no row updated (course doesn't exist in seed.js skills), insert it
    const row = db.prepare('SELECT id FROM skills WHERE title = ?').get(c.title)
    if (!row) {
      db.prepare('INSERT INTO skills (title, description, category, difficulty, estimated_hours, chapters) VALUES (?, ?, ?, ?, ?, ?)').run(
        c.title, desc, c.category, c.difficulty, c.hours || 40, JSON.stringify(c.chapters)
      )
    }
  }
})()

let total = 0
for (const c of courses) total += c.chapters.length
console.log(`Seeded ${courses.length} courses, ${total} total chapters`)
