const { roundRange } = require('../../../utils/score.js')
const Q = require('../../../data/questions.js')

Page({
  data: {
    result: {},
    rangeRounded: [0, 0],
    dimList: [],
    suggestions: [],
    riskTier: '',
    showBasis: false,
    basis: null,
    radarH: 260,
    insights: [],
    empathy: '',
  },
  onLoad(query) {
    try {
      const data = JSON.parse(decodeURIComponent(query.data || '{}'))
      this.setData({ result: data })
      // 仅在非回放场景保存本地测试记录（不上传内容）
      const fromHistory = query && (query.fromHistory === '1' || query.fromHistory === 1)
      if (!fromHistory) this.saveLocalRecord(data)
      // 记录云端“做过的测试”但不包含结果
      this.recordCloud('relationship')
      const range = data.range ? roundRange(data.range) : [0, 0]
      this.setData({ rangeRounded: range })
      const dimMap = data.dimScores || {}
      const names = {
        conflict: '冲突/沟通', attachment: '依恋/情绪', commitment: '满意度/承诺', ritual: '互动仪式', stress: '压力外溢', values: '价值/规划'
      }
      const dimList = Object.keys(names).map(k => ({ k: names[k], v: Math.round(dimMap[k] || 0) }))
      this.setData({ dimList })
      this.drawRadar(dimList)
      this.buildSuggestions(data)
      this.classifyRisk()
      this.buildBasis()
      this.buildInsights()
    } catch (e) {
      console.error('parse result failed', e)
    }
  },
  saveLocalRecord(payload) {
    try {
      const arr = wx.getStorageSync('testResults') || []
      arr.unshift({ testId: 'relationship', name: '关系风险评估', time: Date.now(), payload })
      // 限制最大条数
      const trimmed = arr.slice(0, 50)
      wx.setStorageSync('testResults', trimmed)
    } catch (_) {}
  },
  async recordCloud(testId) {
    try {
      const { callContainer } = require('../../../utils/container.js')
      await callContainer('/api/user_tests/record', 'POST', { testId })
    } catch (_) {}
  },
  toIndex() { wx.reLaunch({ url: '/pages/home/home' }) },
  toggleBasis() { this.setData({ showBasis: !this.data.showBasis }) },

  classifyRisk() {
    const BHI = this.data.result.BHI || 0
    let tier = '中风险'
    if (BHI < 25) tier = '低风险'
    else if (BHI > 60) tier = '高风险'
    this.setData({ riskTier: tier })
  },

  buildBasis() {
    const r = this.data.result
    const t0 = parseInt(wx.getStorageSync('monthsTogether') || '0', 10)
    const lambda0 = 0.06
    const adjust = 1 / (1 + Math.sqrt((t0 || 0) / 24))
    const lambda = r.hasSafety ? null : (lambda0 * (1 + (r.BHI || 0) / 50) * adjust)
    const basis = {
      S: r.S,
      M: Number(r.M || 1).toFixed(2),
      BHI: r.BHI,
      t0,
      lambda: lambda ? Number(lambda).toFixed(3) : '-',
      weights: Q.meta && Q.meta.weights ? Q.meta.weights : {},
      note: 'S 仅由结构性维度计算（不含红旗），红旗影响通过乘子 M 体现；Likert 题已按题干方向做反向计分，使分数越高越稳定。'
    }
    this.setData({ basis })
  },

  drawRadar(dimList) {
    const query = wx.createSelectorQuery()
    query.select('#radarWrap').boundingClientRect()
    query.select('#radar').fields({ node: true, size: true })
    query.exec(res => {
      const rect = res && res[0]
      const canvas = res && res[1] && res[1].node
      if (!canvas || !rect) return
      const ctx = canvas.getContext('2d')
      const dpr = wx.getSystemInfoSync().pixelRatio || 2
      const size = Math.min(Math.max(240, rect.width), 360)
      this.setData({ radarH: size })
      canvas.width = size * dpr
      canvas.height = size * dpr
      ctx.scale(dpr, dpr)

      const cx = size / 2
      const cy = size / 2
      const R = Math.min(size * 0.36, size / 2 - 22)
      const N = dimList.length

      ctx.clearRect(0, 0, size, size)
      ctx.strokeStyle = '#ddd'
      ctx.lineWidth = 1
      // grid
      for (let r = 0.3; r <= 1.0; r += 0.2) {
        ctx.beginPath()
        for (let i = 0; i < N; i++) {
          const ang = -Math.PI / 2 + (2 * Math.PI * i) / N
          const x = cx + R * r * Math.cos(ang)
          const y = cy + R * r * Math.sin(ang)
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
        }
        ctx.closePath(); ctx.stroke()
      }
      // axes
      ctx.strokeStyle = '#eee'
      for (let i = 0; i < N; i++) {
        const ang = -Math.PI / 2 + (2 * Math.PI * i) / N
        ctx.beginPath(); ctx.moveTo(cx, cy)
        ctx.lineTo(cx + R * Math.cos(ang), cy + R * Math.sin(ang)); ctx.stroke()
      }
      // labels
      ctx.fillStyle = '#666'
      ctx.font = '12px sans-serif'
      for (let i = 0; i < N; i++) {
        const label = dimList[i].k
        const ang = -Math.PI / 2 + (2 * Math.PI * i) / N
        const rx = cx + (R + 12) * Math.cos(ang)
        const ry = cy + (R + 12) * Math.sin(ang)
        ctx.textAlign = Math.cos(ang) > 0.1 ? 'left' : (Math.cos(ang) < -0.1 ? 'right' : 'center')
        ctx.textBaseline = Math.abs(Math.sin(ang)) < 0.1 ? 'middle' : (Math.sin(ang) > 0 ? 'top' : 'bottom')
        ctx.fillText(label, rx, ry)
      }
      // data
      ctx.fillStyle = 'rgba(64,158,255,0.25)'
      ctx.strokeStyle = '#409eff'
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const v = Math.max(0, Math.min(1, (dimList[i].v || 0) / 100))
        const ang = -Math.PI / 2 + (2 * Math.PI * i) / N
        const x = cx + R * v * Math.cos(ang)
        const y = cy + R * v * Math.sin(ang)
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      ctx.closePath(); ctx.fill(); ctx.stroke()
      // markers
      ctx.fillStyle = '#409eff'
      for (let i = 0; i < N; i++) {
        const v = Math.max(0, Math.min(1, (dimList[i].v || 0) / 100))
        const ang = -Math.PI / 2 + (2 * Math.PI * i) / N
        const x = cx + R * v * Math.cos(ang)
        const y = cy + R * v * Math.sin(ang)
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill()
      }
    })
  },

  buildInsights() {
    const dim = this.data.result.dimScores || {}
    const names = { conflict: '冲突/沟通', attachment: '依恋/情绪', commitment: '满意度/承诺', ritual: '互动仪式', stress: '压力外溢', values: '价值/规划' }
    const entries = Object.keys(names).map(k => ({ k, name: names[k], v: Math.round(dim[k] || 0) }))
    const sorted = entries.sort((a, b) => a.v - b.v)
    const worst = sorted.slice(0, 2).map(e => `${e.name}较弱（${e.v}）`)
    const best = sorted.slice(-1).map(e => `${e.name}是你的优势（${e.v}）`)
    const insights = []
    if (worst.length) insights.push(`主要风险点：${worst.join('、')}。`)
    if (best.length) insights.push(`可利用的优势：${best.join('、')}。`)
    let empathy = '你已经迈出重要一步：愿意面对现状并寻找改进，这是关系修复最关键的起点。'
    if (this.data.riskTier === '低风险') empathy = '你们整体稳定，继续保持有效的互动仪式与修复尝试，会走得更久。'
    if (this.data.riskTier === '高风险') empathy = '看到这些结果或许不容易，但高风险并不等于注定分手，专注关键习惯的改变，常能带来转机。'
    this.setData({ insights, empathy })
  },

  buildSuggestions(data) {
    const sug = []
    const flags = data.flags || []
    const dim = data.dimScores || {}
    const low = (k, thr = 50) => (dim[k] || 0) < thr
    const high = (k, thr = 60) => (dim[k] || 0) < 100 && (dim[k] || 0) <= (100 - thr) // treat as inverse

    // Safety first
    if (data.hasSafety) {
      sug.push('优先安全：若存在控制/威胁/暴力，请尽快联系当地求助热线或警方，确保自身安全。')
    }
    // Red flags
    if (flags.find(f => f.id === 'flag_contempt' && f.checked)) {
      sug.push('本周执行“无嘲讽沟通契约”，用我感受+我需要句式，发生冲突后用修复脚本A。')
    }
    if (flags.find(f => f.id === 'flag_silent' && f.checked)) {
      sug.push('限定冷处理上限24小时，超时需预约30分钟修复对话（用计时器、轮流发言）。')
    }
    if (flags.find(f => f.id === 'flag_infidelity' && f.checked)) {
      sug.push('若存在不忠/隐瞒重大事项：先完成事实澄清与边界重建，再进入修复流程（如约定透明期、重建信任任务）。')
    }
    // Dimension-based
    if (low('commitment', 60)) {
      sug.push('做“投资清单复盘”：两人各写下已投入与可增加的共同投资（时间/金钱/社交/约定）。')
    }
    if (low('ritual', 60)) {
      sug.push('设定每周≥2次无手机高质量对话≥20分钟，加入每周约会微仪式。')
    }
    if (high('stress', 50)) {
      sug.push('设置“压力转移通道”：运动/倾诉窗口/晚间界限，避免把外部压力带入关系。')
    }
    if (low('values', 55)) {
      sug.push('对齐未来3年关键议题（城市/子女/金钱），采用结构化协商：列选项-估利弊-达共识。')
    }
    if (sug.length === 0) {
      sug.push('维持已有效的互动模式；每周一次复盘，记录1件欣赏与1件可改进之处。')
    }
    this.setData({ suggestions: sug.slice(0, 3) })
  },

  onShareAppMessage() {
    const t = `BHI ${this.data.result.BHI}/100`
    return { title: `关系评估：${t}`, path: '/pages/home/home' }
  }
})
