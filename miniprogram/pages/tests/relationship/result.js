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
  async genImage() {
    try {
      wx.showLoading({ title: '生成中…', mask: true })
      const query = wx.createSelectorQuery()
      query.select('#poster').fields({ node: true, size: true })
      query.exec(async res => {
        const canvas = res && res[0] && res[0].node
        if (!canvas) { wx.hideLoading(); wx.showToast({ title: '画布不可用', icon: 'none' }); return }
        const dpr = wx.getSystemInfoSync().pixelRatio || 2
        const W = 640, H = 960
        canvas.width = W * dpr
        canvas.height = H * dpr
        const ctx = canvas.getContext('2d')
        ctx.scale(dpr, dpr)
        // background
        const grd = ctx.createLinearGradient(0, 0, 0, H)
        grd.addColorStop(0, '#FFF8F1'); grd.addColorStop(1, '#FFFFFF')
        ctx.fillStyle = grd
        ctx.fillRect(0, 0, W, H)
        // card
        const cardX=24, cardY=28, cardW=W-48, cardH=H-56
        roundRect(ctx, cardX, cardY, cardW, cardH, 18, '#FFFFFF', '#F7DDE1')
        // title
        ctx.fillStyle = '#594c4c'
        ctx.font = 'bold 22px sans-serif'
        ctx.fillText('关系评估结果', cardX+18, cardY+40)
        // BHI block
        const { result } = this.data
        const tier = this.data.riskTier || ''
        ctx.fillStyle = '#4f5560'
        ctx.font = 'bold 42px sans-serif'
        ctx.fillText(`BHI ${result.BHI||0}`, cardX+18, cardY+100)
        ctx.fillStyle = '#85A9F0'
        ctx.font = 'bold 18px sans-serif'
        ctx.fillText(`${tier}`, cardX+18, cardY+130)
        // range
        if (!result.hasSafety) {
          const rr = this.data.rangeRounded || [0,0]
          ctx.fillStyle = '#6b6b6b'
          ctx.font = '14px sans-serif'
          ctx.fillText(`预计剩余相处时长：${rr[0]}-${rr[1]} 月`, cardX+18, cardY+160)
        } else {
          ctx.fillStyle = '#c45a5a'
          ctx.font = '14px sans-serif'
          ctx.fillText('检测到安全风险，请优先保障安全', cardX+18, cardY+160)
        }
        // dims + radar
        const dims = this.data.dimList || []
        ctx.fillStyle = '#6f6f6f'
        ctx.font = '14px sans-serif'
        let y = cardY+200
        ctx.fillText('维度分数：', cardX+18, y)
        // radar at right
        const radarSize = 150
        drawRadar(ctx, cardX+cardW-radarSize-18, y-10, radarSize, dims)
        y += 24
        const leftCols = dims.slice(0, Math.min(6, dims.length))
        leftCols.forEach(it=>{ ctx.fillText(`${it.k}：${it.v}`, cardX+28, y); y += 22 })

        // insights and suggestions
        y += 6
        ctx.fillStyle = '#594c4c'
        ctx.font = 'bold 16px sans-serif'
        ctx.fillText('分析与建议', cardX+18, y)
        y += 18
        ctx.fillStyle = '#6f6f6f'
        ctx.font = '14px sans-serif'
        const insights = this.data.insights || []
        const suggestions = this.data.suggestions || []
        const lines = []
        insights.forEach(t=> lines.push(`• ${t}`))
        suggestions.forEach(t=> lines.push(`• ${t}`))
        y = drawWrapped(ctx, lines.join('\n'), cardX+18, y+6, cardW-36, 20)
        // footer
        ctx.fillStyle = '#8a7f7f'
        ctx.font = '12px sans-serif'
        const t = new Date()
        const pad=n=>String(n).padStart(2,'0')
        const ts = `${t.getFullYear()}-${pad(t.getMonth()+1)}-${pad(t.getDate())} ${pad(t.getHours())}:${pad(t.getMinutes())}`
        ctx.fillText(ts, cardX+18, H-32)

        // export
        wx.canvasToTempFilePath({
          canvas,
          x: 0, y: 0, width: W, height: H, destWidth: W*dpr, destHeight: H*dpr,
          success: (r)=>{
            const path = r.tempFilePath
            // try save to album
            wx.saveImageToPhotosAlbum({ filePath: path, success: ()=>{ wx.hideLoading(); wx.showToast({ title: '已保存到相册', icon: 'success' }) },
              fail: ()=>{ wx.hideLoading(); wx.previewImage({ urls: [path] }) } })
          },
          fail: ()=>{ wx.hideLoading(); wx.showToast({ title: '生成失败', icon: 'none' }) }
        })
      })
      function roundRect(ctx,x,y,w,h,r,fill,stroke){
        ctx.beginPath()
        ctx.moveTo(x+r,y)
        ctx.arcTo(x+w,y,x+w,y+h,r)
        ctx.arcTo(x+w,y+h,x,y+h,r)
        ctx.arcTo(x,y+h,x,y,r)
        ctx.arcTo(x,y,x+w,y,r)
        ctx.closePath()
        if (fill){ ctx.fillStyle=fill; ctx.fill() }
        if (stroke){ ctx.strokeStyle=stroke; ctx.lineWidth=1; ctx.stroke() }
      }
      function drawRadar(ctx, x, y, size, dimList){
        const N = dimList.length || 0
        if (N === 0) return
        const cx = x + size/2
        const cy = y + size/2
        const R = size/2 - 16
        // grid
        ctx.strokeStyle = '#F0E6E6'
        ctx.lineWidth = 1
        for(let r=0.3;r<=1.0;r+=0.2){
          ctx.beginPath()
          for(let i=0;i<N;i++){
            const ang = -Math.PI/2 + (2*Math.PI*i)/N
            const px = cx + R*r*Math.cos(ang)
            const py = cy + R*r*Math.sin(ang)
            if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py)
          }
          ctx.closePath(); ctx.stroke()
        }
        // polygon
        ctx.fillStyle = 'rgba(133,169,240,0.28)'
        ctx.strokeStyle = '#85A9F0'
        ctx.beginPath()
        for(let i=0;i<N;i++){
          const v = Math.max(0, Math.min(1, (dimList[i].v||0)/100))
          const ang = -Math.PI/2 + (2*Math.PI*i)/N
          const px = cx + R*v*Math.cos(ang)
          const py = cy + R*v*Math.sin(ang)
          if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py)
        }
        ctx.closePath(); ctx.fill(); ctx.stroke()
      }
      function drawWrapped(ctx, text, x, y, maxWidth, lineHeight){
        const words = text.split(/\n/)
        let yy = y
        for(const w of words){
          let line = ''
          for(const ch of w){
            const test = line + ch
            if (ctx.measureText(test).width > maxWidth){
              ctx.fillText(line, x, yy); yy += lineHeight; line = ch
            } else line = test
          }
          if (line){ ctx.fillText(line, x, yy); yy += lineHeight }
        }
        return yy
      }
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '生成失败', icon: 'none' })
    }
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
