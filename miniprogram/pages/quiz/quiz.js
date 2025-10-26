const Q = require('../../data/questions.js')
const {
  scoreLikert,
  computeBHI,
  estimateMonthsLeft
} = require('../../utils/score.js')

Page({
  data: {
    questions: Q.questions,
    current: 0,
    answers: {},
    flagSafetyHint: false,
    answered: false,
    pct: 0,
  },
  onLoad(){ this.updateProgress(); this.updateAnswered(); },
  onLikert(e) {
    const v = Number(e.detail.value)
    const q = this.data.questions[this.data.current]
    const key = `answers.${q.id}`
    this.setData({ [key]: v }, ()=>{ this.updateAnswered() })
  },
  selectLikert(e){
    const v = parseInt(e.currentTarget.dataset.v, 10)
    const q = this.data.questions[this.data.current]
    const key = `answers.${q.id}`
    this.setData({ [key]: v, answered: true })
  },
  onYN(e) {
    const v = !!e.detail.value
    const q = this.data.questions[this.data.current]
    const key = `answers.${q.id}`
    const hint = q.id === 'flag_safety' && v
    this.setData({ [key]: v, flagSafetyHint: hint }, ()=>{ this.updateAnswered() })
    if (q.id === 'flag_safety' && v) {
      wx.showToast({ title: '已标记安全风险', icon: 'none' })
    }
  },
  selectYN(e){
    const v = e.currentTarget.dataset.v === true || e.currentTarget.dataset.v === 'true'
    const q = this.data.questions[this.data.current]
    const key = `answers.${q.id}`
    const hint = q.id === 'flag_safety' && v
    this.setData({ [key]: v, flagSafetyHint: hint }, ()=>{ this.updateAnswered() })
    if (q.id === 'flag_safety' && v) wx.showToast({ title: '已标记安全风险', icon: 'none' })
  },
  prev() {
    if (this.data.current > 0) {
      this.setData({ current: this.data.current - 1 }, ()=>{ this.updateProgress(); this.updateAnswered(); })
    }
  },
  next() {
    const last = this.data.current >= this.data.questions.length - 1
    if (!this.data.answered){ wx.showToast({title:'请选择选项',icon:'none'}); return }
    if (!last) {
      this.setData({ current: this.data.current + 1 }, ()=>{ this.updateProgress(); this.updateAnswered(); })
      return
    }
    const res = this.computeResult()
    const data = encodeURIComponent(JSON.stringify(res))
    wx.navigateTo({ url: `/pages/result/result?data=${data}` })
  },
  updateProgress(){
    const pct = Math.round(((this.data.current + 1) / this.data.questions.length) * 100)
    this.setData({ pct })
  },
  updateAnswered(){
    const q = this.data.questions[this.data.current]
    const v = this.data.answers[q.id]
    const answered = q.type === 'yn' ? (v === true || v === false) : (typeof v === 'number' && v >= 1 && v <= 5)
    this.setData({ answered })
  },
  computeResult() {
    const weights = Q.meta.weights
    const dims = { conflict: [], attachment: [], commitment: [], ritual: [], stress: [], values: [] }
    const flags = []
    for (const q of this.data.questions) {
      const v = this.data.answers[q.id]
      if (q.type === 'likert5') {
        const s = scoreLikert(v, !!q.reverse)
        if (dims[q.dim]) dims[q.dim].push(s)
      } else if (q.type === 'yn') {
        if (v === true) flags.push({ id: q.id, severity: q.severity, checked: true })
      }
    }
    const dimScores = {}
    Object.keys(dims).forEach(k => {
      if (dims[k].length) dimScores[k] = dims[k].reduce((a, b) => a + b, 0) / dims[k].length
    })
    const { S, M, BHI, hasSafety } = computeBHI(dimScores, weights, flags)
    const monthsTogether = parseInt(wx.getStorageSync('monthsTogether') || '0', 10)
    let monthsLeft = null
    let range = null
    if (!hasSafety) {
      const est = estimateMonthsLeft(BHI, monthsTogether)
      monthsLeft = est.expectMonths
      range = est.range
    }
    return { BHI: Math.round(BHI), S: Math.round(S), M, hasSafety, dimScores, monthsLeft, range, flags }
  }
})
