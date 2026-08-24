const bcrypt = require('bcryptjs')

module.exports = function seedData(db) {
  const shouldSeedDefaultUsers = process.env.NODE_ENV !== 'production' || process.env.SEED_DEFAULT_USERS === 'true'
  const insertDefaultUser = db.prepare(`
    INSERT INTO users (username, email, password_hash, real_name, student_id, account_type, is_active)
    VALUES (@username, @email, @passwordHash, @realName, @studentId, @accountType, TRUE)
    ON CONFLICT(username) DO NOTHING
  `)

  if (shouldSeedDefaultUsers) {
    insertDefaultUser.run({
      username: 'lufuping',
      email: 'lufuping@platform.local',
      passwordHash: bcrypt.hashSync('lu1203', 10),
      realName: '管理员',
      studentId: null,
      accountType: 'admin'
    })

    insertDefaultUser.run({
      username: 'student1',
      email: 'student1@platform.local',
      passwordHash: bcrypt.hashSync('123123123', 10),
      realName: '默认学生',
      studentId: 'student1',
      accountType: 'student'
    })

    insertDefaultUser.run({
      username: 'teacher',
      email: 'teacher@platform.local',
      passwordHash: bcrypt.hashSync('teacher123', 10),
      realName: '指导老师',
      studentId: null,
      accountType: 'teacher'
    })
  }

  const competitionCount = db.prepare('SELECT COUNT(*) as count FROM competitions').get().count
  if (competitionCount > 0) return

  // Insert competitions
  const insertCompetition = db.prepare(`
    INSERT INTO competitions (title, description, category, level, status, start_date, end_date, deadline, organizer, website, max_team_size, image_url, tags, prize_info)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  // Insert skills
  const insertSkill = db.prepare(`
    INSERT INTO skills (title, description, category, difficulty, estimated_hours, image_url, tags, learning_objectives, resources)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  // Insert papers
  const insertPaper = db.prepare(`
    INSERT INTO papers (title, authors, abstract, keywords, category, year, source, publication_date, citations, pages, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  // Insert carousel
  const insertCarousel = db.prepare(`
    INSERT INTO carousel (title, image_url, link_url, sort_order)
    VALUES (?, ?, ?, ?)
  `)

  const insertMany = db.transaction(() => {
    // 6 competitions
    insertCompetition.run(
      '全国大学生数学建模竞赛',
      '由中国工业与应用数学学会主办，是首批列入"高校学科竞赛排行榜"的19项竞赛之一。',
      '数学建模', '国家级', '报名中',
      '2026-09-10', '2026-09-13', '2026-08-31',
      '中国工业与应用数学学会', 'https://www.mcm.edu.cn', 3,
      '/assets/photo/home/home_1.jpg',
      '["数学建模","算法","团队合作"]',
      '全国一等奖、全国二等奖、省级一、二、三等奖'
    )
    insertCompetition.run(
      '中国国际"互联网+"大学生创新创业大赛',
      '由教育部等部门主办，是国内规模最大、影响力最广的创新创业类竞赛。',
      '创新创业', '国家级', '进行中',
      '2026-03-01', '2026-10-31', '2026-05-31',
      '教育部', 'https://cy.ncss.cn', 10,
      '/assets/photo/home/home_2.jpg',
      '["创新创业","商业计划","团队协作"]',
      '金奖、银奖、铜奖'
    )
    insertCompetition.run(
      'ACM-ICPC国际大学生程序设计竞赛',
      '全球历史最悠久、影响力最大、难度最高的算法竞赛，被誉为"算法界的奥林匹克"。',
      '程序设计', '国际级', '即将开始',
      '2026-09-01', '2026-12-31', '2026-08-15',
      '国际计算机学会', 'https://icpc.global', 3,
      '/assets/photo/home/home_3.jpg',
      '["算法","数据结构","编程竞赛"]',
      '全球总决赛金、银、铜牌'
    )
    insertCompetition.run(
      '蓝桥杯全国软件和信息技术专业人才大赛',
      '由工业和信息化部人才交流中心主办，国内参与人数最多的计算机类入门竞赛。',
      '程序设计', '国家级', '报名中',
      '2026-04-01', '2026-06-30', '2026-04-30',
      '工业和信息化部人才交流中心', 'https://www.lanqiao.cn', 1,
      '/assets/photo/home/home_1.jpg',
      '["编程","算法","入门竞赛"]',
      '国赛一、二、三等奖，省赛一、二、三等奖'
    )
    insertCompetition.run(
      '"挑战杯"全国大学生课外学术科技作品竞赛',
      '由共青团中央、中国科协、教育部等主办，国内最具影响力的大学生课外学术科技活动。',
      '科技创新', '国家级', '即将开始',
      '2027-03-01', '2027-11-30', '2027-04-30',
      '共青团中央、中国科协', 'https://www.tiaozhanbei.net', 10,
      '/assets/photo/home/home_2.jpg',
      '["科技创新","学术作品","团队合作"]',
      '特等奖、一、二、三等奖'
    )
    insertCompetition.run(
      'CCPC中国大学生程序设计竞赛',
      '由中国计算机学会主办，采用与ACM-ICPC高度相似的赛制，近年来认可度迅速提升。',
      '程序设计', '国家级', '进行中',
      '2026-10-01', '2027-03-31', '2026-09-15',
      '中国计算机学会', 'https://ccpc.io', 3,
      '/assets/photo/home/home_3.jpg',
      '["算法","程序设计","团队竞赛"]',
      '总决赛金、银、铜牌'
    )

    // 6 skills
    insertSkill.run(
      'Python编程基础',
      'Python是一种高级、解释型、通用的编程语言，以其简洁易读的语法而闻名。',
      '编程语言', '入门', 40,
      '/assets/photo/home/home_1.jpg',
      '["Python","编程基础","入门"]',
      '["掌握Python基本语法和数据类型","理解函数和面向对象编程","能够使用Python解决实际问题","熟悉Python标准库的使用"]',
      '[{"title":"Python官方文档","url":"https://docs.python.org/zh-cn/3/","type":"文档"},{"title":"《Python编程：从入门到实践》","url":"","type":"书籍"},{"title":"freeCodeCamp Python课程","url":"https://www.freecodecamp.org","type":"在线课程"}]'
    )
    insertSkill.run(
      'JavaScript全栈开发',
      'JavaScript是前端开发必备语言，也可以用于后端开发（Node.js）。',
      'Web开发', '中级', 80,
      '/assets/photo/home/home_2.jpg',
      '["JavaScript","Web开发","全栈"]',
      '["掌握JavaScript核心概念和ES6+语法","理解DOM操作和事件处理","能够使用Node.js开发后端服务","熟悉React或Vue等前端框架"]',
      '[{"title":"MDN Web Docs","url":"https://developer.mozilla.org","type":"文档"},{"title":"《JavaScript高级程序设计》","url":"","type":"书籍"},{"title":"The Odin Project","url":"https://www.theodinproject.com","type":"在线课程"}]'
    )
    insertSkill.run(
      '数据结构与算法',
      '数据结构与算法是程序员的基本功，是大厂面试的核心考察点。',
      '计算机基础', '进阶', 120,
      '/assets/photo/home/home_3.jpg',
      '["数据结构","算法","面试必备"]',
      '["掌握常见数据结构（数组、链表、栈、队列、树、图）","理解常用算法（排序、查找、动态规划、贪心）","能够分析算法的时间复杂度和空间复杂度"]',
      '[{"title":"LeetCode","url":"https://leetcode.cn","type":"在线练习"},{"title":"牛客网","url":"https://www.nowcoder.com","type":"在线练习"},{"title":"《算法竞赛入门经典》","url":"","type":"书籍"}]'
    )
    insertSkill.run(
      '机器学习与人工智能',
      '人工智能在诸多领域的应用取得了突破性进展。机器学习是AI的核心技术。',
      '人工智能', '进阶', 160,
      '/assets/photo/home/home_1.jpg',
      '["机器学习","AI","深度学习"]',
      '["理解机器学习基本概念和原理","掌握常用机器学习算法","能够使用Python实现机器学习模型","了解深度学习基础"]',
      '[{"title":"吴恩达机器学习课程","url":"https://www.coursera.org","type":"在线课程"},{"title":"Kaggle","url":"https://www.kaggle.com","type":"数据竞赛"},{"title":"《统计学习方法》","url":"","type":"书籍"}]'
    )
    insertSkill.run(
      'Java企业级开发',
      'Java是企业级应用广泛使用的语言，适用于Android开发、Web后端开发等。',
      '编程语言', '中级', 100,
      '/assets/photo/home/home_2.jpg',
      '["Java","后端开发","企业级"]',
      '["掌握Java核心语法和面向对象编程","理解集合框架和多线程编程","能够使用Spring Boot开发Web应用"]',
      '[{"title":"Java官方文档","url":"https://docs.oracle.com","type":"文档"},{"title":"《Java核心技术》","url":"","type":"书籍"},{"title":"Spring官方文档","url":"https://spring.io","type":"文档"}]'
    )
    insertSkill.run(
      '数据库原理与SQL',
      '数据库是软件系统的核心组件。掌握数据库原理和SQL是后端开发、数据分析等岗位的必备技能。',
      '计算机基础', '入门', 60,
      '/assets/photo/home/home_3.jpg',
      '["数据库","SQL","MySQL"]',
      '["理解关系型数据库基本原理","掌握SQL基本语法和高级查询","能够设计规范化的数据库schema"]',
      '[{"title":"MySQL官方文档","url":"https://dev.mysql.com","type":"文档"},{"title":"《SQL必知必会》","url":"","type":"书籍"},{"title":"HackerRank SQL练习","url":"https://www.hackerrank.com","type":"在线练习"}]'
    )

    // 6 papers
    insertPaper.run(
      'From Articles to Code: On-Demand Generation of Core Algorithms from Scientific Publications',
      'Cameron S. Movassaghi, Amanda Momenzadeh, Jesse G. Meyer',
      '探讨了利用大型语言模型从科学出版物中生成核心算法代码的可能性。',
      '["大语言模型","代码生成","可重复性"]',
      '人工智能', 2025, 'arXiv', '2025-07-01', 128, 15,
      '/assets/photo/home/home_1.jpg'
    )
    insertPaper.run(
      '基于改进YOLOv8的轻量化无人机图像小目标检测算法',
      '唐克, 魏飞鸣, 李东瀛, 郁文贤',
      '针对无人机图像中小目标实例多、目标间存在遮挡所导致的漏检和误检等现象，提出一种基于改进YOLOv8的轻量化无人机图像小目标检测算法。',
      '["目标检测","YOLOv8","无人机图像"]',
      '计算机视觉', 2026, '计算机工程', '2026-04-01', 45, 12,
      '/assets/photo/home/home_2.jpg'
    )
    insertPaper.run(
      '可解释人工智能的研究进展与未来趋势',
      '廖勇, 韩小金, 刘金林, 汪浩',
      '可解释人工智能成为构建可信、透明的智能系统的关键要素。本文综述可解释人工智能的国内外研究进展。',
      '["可解释人工智能","XAI","可信AI"]',
      '人工智能', 2026, '计算机工程', '2026-03-15', 89, 18,
      '/assets/photo/home/home_3.jpg'
    )
    insertPaper.run(
      '人类社会群体智能的概念框架与核心内涵',
      '前沿观点与综述团队',
      '群体智能是国家《新一代人工智能发展规划》提出的5个趋势方向之一。',
      '["群体智能","人工智能","复杂系统"]',
      '人工智能', 2026, '计算机工程', '2026-02-20', 67, 22,
      '/assets/photo/home/home_1.jpg'
    )
    insertPaper.run(
      'GRD: 基于GNN和扩散模型的多变量时序数据异常检测算法',
      '计算机工程编辑部',
      '针对多变量时序数据异常检测问题，提出了一种基于图神经网络和扩散模型的新型异常检测算法。',
      '["异常检测","图神经网络","扩散模型"]',
      '数据科学', 2026, '计算机工程', '2026-04-10', 34, 10,
      '/assets/photo/home/home_2.jpg'
    )
    insertPaper.run(
      'EmoRepLKNet: 一种基于UniRepLKNet的面部情绪识别神经网络',
      '计算机视觉与图形图像处理团队',
      '针对面部情绪识别任务，提出了一种基于UniRepLKNet的改进网络EmoRepLKNet。',
      '["情绪识别","计算机视觉","深度学习"]',
      '计算机视觉', 2026, '计算机工程', '2026-03-01', 28, 14,
      '/assets/photo/home/home_3.jpg'
    )

    const insertExercise = db.prepare(`
      INSERT INTO exercises (title, description, difficulty, category, language, template_code, test_cases, solution_code, hint)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    // 题目1: 两数之和 (Python)
    insertExercise.run(
      '两数之和',
      '给定一个整数数组 nums 和一个整数目标值 target，请你在该数组中找出和为目标值 target 的那两个整数，并返回它们的数组下标。\n\n你可以假设每种输入只会对应一个答案，并且你不能使用两次相同的元素。\n\n示例：\n输入：nums = [2,7,11,15], target = 9\n输出：[0,1]\n解释：因为 nums[0] + nums[1] == 9，返回 [0, 1]。',
      'easy', '数组与哈希表', 'python',
      '# 请完成 twoSum 函数\ndef twoSum(nums, target):\n    # 在此编写代码\n    pass\n\n# 测试代码\nif __name__ == "__main__":\n    nums = [2, 7, 11, 15]\n    target = 9\n    print(twoSum(nums, target))',
      '[{"input":"2,7,11,15\\n9","expected":"[0, 1]"},{"input":"3,2,4\\n6","expected":"[1, 2]"}]',
      'def twoSum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    return []',
      '提示：可以使用哈希表（字典）存储已经遍历过的数字及其下标，将时间复杂度优化到 O(n)。'
    )

    // 题目2: 两数之和 (C++)
    insertExercise.run(
      '两数之和',
      '给定一个整数数组 nums 和一个整数目标值 target，请你在该数组中找出和为目标值 target 的那两个整数，并返回它们的数组下标。\n\n你可以假设每种输入只会对应一个答案，并且你不能使用两次相同的元素。\n\n示例：\n输入：nums = [2,7,11,15], target = 9\n输出：[0,1]',
      'easy', '数组与哈希表', 'c++',
      '#include <iostream>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n    // 在此编写代码\n    return {};\n}\n\nint main() {\n    vector<int> nums = {2, 7, 11, 15};\n    int target = 9;\n    vector<int> result = twoSum(nums, target);\n    cout << "[" << result[0] << ", " << result[1] << "]" << endl;\n    return 0;\n}',
      '[{"input":"2,7,11,15\\n9","expected":"[0, 1]"},{"input":"3,2,4\\n6","expected":"[1, 2]"}]',
      'vector<int> twoSum(vector<int>& nums, int target) {\n    unordered_map<int, int> seen;\n    for (int i = 0; i < nums.size(); i++) {\n        int complement = target - nums[i];\n        if (seen.count(complement)) {\n            return {seen[complement], i};\n        }\n        seen[nums[i]] = i;\n    }\n    return {};\n}',
      '提示：使用 unordered_map 存储已经遍历过的数字及其下标。'
    )

    // 题目3: 反转字符串 (Python)
    insertExercise.run(
      '反转字符串',
      '编写一个函数，将输入的字符串反转并返回。不允许使用内置的 reversed() 函数或切片 [::-1]。\n\n示例：\n输入：hello\n输出：olleh',
      'easy', '字符串', 'python',
      '# 请完成 reverseString 函数\ndef reverseString(s):\n    # 在此编写代码\n    pass\n\nif __name__ == "__main__":\n    s = input()\n    print(reverseString(s))',
      '[{"input":"hello","expected":"olleh"},{"input":"world","expected":"dlrow"},{"input":"abcde","expected":"edcba"}]',
      'def reverseString(s):\n    chars = list(s)\n    left, right = 0, len(chars) - 1\n    while left < right:\n        chars[left], chars[right] = chars[right], chars[left]\n        left += 1\n        right -= 1\n    return "".join(chars)',
      '提示：使用双指针法，左右指针分别指向字符串首尾，交换字符后向中间移动。'
    )

    // 题目4: 反转字符串 (C++)
    insertExercise.run(
      '反转字符串',
      '编写一个函数，将输入的字符串反转并返回。\n\n示例：\n输入：hello\n输出：olleh',
      'easy', '字符串', 'c++',
      '#include <iostream>\n#include <string>\nusing namespace std;\n\nstring reverseString(string s) {\n    // 在此编写代码\n    return "";\n}\n\nint main() {\n    string s;\n    cin >> s;\n    cout << reverseString(s) << endl;\n    return 0;\n}',
      '[{"input":"hello","expected":"olleh"},{"input":"world","expected":"dlrow"}]',
      'string reverseString(string s) {\n    int left = 0, right = s.length() - 1;\n    while (left < right) {\n        swap(s[left], s[right]);\n        left++;\n        right--;\n    }\n    return s;\n}',
      '提示：使用双指针法，左右指针分别指向字符串首尾，交换字符后向中间移动。'
    )

    // 题目5: 斐波那契数列 (Python)
    insertExercise.run(
      '斐波那契数列',
      '斐波那契数列定义为：F(0) = 0, F(1) = 1, F(n) = F(n-1) + F(n-2) (n >= 2)。给定一个非负整数 n，请计算 F(n)。\n\n示例：\n输入：10\n输出：55',
      'easy', '动态规划', 'python',
      '# 请完成 fib 函数\ndef fib(n):\n    # 在此编写代码\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    print(fib(n))',
      '[{"input":"10","expected":"55"},{"input":"0","expected":"0"},{"input":"20","expected":"6765"}]',
      'def fib(n):\n    if n <= 1:\n        return n\n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b',
      '提示：使用迭代方式（循环），只需要保存前两个值，空间复杂度 O(1)。递归会超时。'
    )

    // 题目6: 判断回文数 (Java)
    insertExercise.run(
      '判断回文数',
      '给你一个整数 x，如果 x 是一个回文整数，返回 true；否则返回 false。回文数是指正序和倒序读都是一样的整数。\n\n示例：\n输入：121\n输出：true\n\n输入：-121\n输出：false（从左向右读为 -121，从右向左读为 121-）',
      'easy', '数学', 'java',
      'import java.util.Scanner;\n\npublic class Main {\n    public static boolean isPalindrome(int x) {\n        // 在此编写代码\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int x = sc.nextInt();\n        System.out.println(isPalindrome(x));\n        sc.close();\n    }\n}',
      '[{"input":"121","expected":"true"},{"input":"-121","expected":"false"},{"input":"10","expected":"false"}]',
      'public static boolean isPalindrome(int x) {\n    if (x < 0 || (x % 10 == 0 && x != 0)) return false;\n    int reversed = 0;\n    while (x > reversed) {\n        reversed = reversed * 10 + x % 10;\n        x /= 10;\n    }\n    return x == reversed || x == reversed / 10;\n}',
      '提示：负数一定不是回文数。可以将数字反转一半，当原数 <= 反转数时停止，然后比较。'
    )

    // 3 carousel items — 使用纯色渐变占位图（由前端 fallback 显示）
    insertCarousel.run('全国大学生数学建模竞赛', '', '/competition/1', 1)
    insertCarousel.run('中国国际"互联网+"大学生创新创业大赛', '', '/competition/2', 2)
    insertCarousel.run('ACM-ICPC国际大学生程序设计竞赛', '', '/competition/3', 3)
  })

  insertMany()
  console.log('Seed data inserted successfully.')
}
