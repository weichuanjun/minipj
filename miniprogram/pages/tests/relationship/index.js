// relationship test landing
Page({
  data: {
    monthsTogether: Number(wx.getStorageSync('monthsTogether') || 0),
    monthsOptions: Array.from({ length: 241 }, (_, i) => i),
    monthsIndex: 0,
  },
  onLoad(){
    const mt = Number(wx.getStorageSync('monthsTogether') || 0)
    const idx = Math.max(0, Math.min(this.data.monthsOptions.length - 1, mt))
    this.setData({ monthsTogether: mt, monthsIndex: idx })
  },
  onMonthsChange(e){
    const idx = Number(e.detail.value)
    const val = this.data.monthsOptions[idx] || 0
    this.setData({ monthsIndex: idx, monthsTogether: val })
    wx.setStorageSync('monthsTogether', String(val))
  },
  startQuiz() { wx.navigateTo({ url: '/pages/tests/relationship/quiz' }) }
})
