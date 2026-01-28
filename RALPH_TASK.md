---
task: Build a Web page app in Vue
---

# Task: CLI Todo App (TypeScript)


## Requirements
针对公司内部不同岗位员工对 AI 工具的差异化需求，我们搭建了一个全岗位 AI 需求愿望收集平台。该平台会将用户提交的需求愿望按照职业需求进行分类，用户在不同分类界面可以查看各职业用户提交的需求愿望，点击可查看愿望的详细信息（包括愿望名称、描述、提交者岗位），用户可以为现有愿望点赞、评论，平台根据点赞数进行排行，还支持大家提交自己的新需求愿望。用户借此能够直观查找、快速探索适配自身岗位的优质 AI 工具需求，最终打造一个需求共享、高效匹配岗位需求的内部 AI 工具交流阵地。


## Success Criteria
1. []**愿望收集**：获取各职业对 AI 工具的需求愿望相关信息，建立网站初始愿望库
2. []**愿望单展示页面**：按职业/岗位（如开发、设计、行政）分类展示用户提交的愿望
- 展示方式为按岗位类别分类展示，以及按提交新旧顺序进行展示
3. []**建立愿望提交页面**：由用户发起“提交愿望”并填写愿望相关信息：
信息包括以下字段：愿望名称、需求描述、提交者岗位
4. []**互动与收藏**：用户可以对已展示的愿望进行“点赞”或“收藏”
5. []**系统管理**：管理员有权限编辑、下架所有愿望信息。普通用户仅有权限编辑或删除自己“未提交暂存”状态的愿望信息
6. []**岗位匹配分析**：若用户提供岗位信息，系统可基于岗位标签对愿望进行匹配度分析，并在愿望详情页展示匹配结果 

## Example Output

```
you can add output by your understanding of my Requirements
```

---

## Ralph Instructions
Read .ralph/progress.md to see what's been done
Check .ralph/guardrails.md for signs to follow
Work on the next incomplete criterion
Update .ralph/progress.md with your progress
Commit your changes with descriptive messages
When ALL criteria are met (all [ ] → [x]), output: <ralph>COMPLETE</ralph>
If stuck on the same issue 3+ times, output: <ralph>GUTTER</ralph>
