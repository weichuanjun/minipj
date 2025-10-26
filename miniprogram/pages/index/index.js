// index.js (landing)
Page({
  data: {
    monthsTogether: wx.getStorageSync('monthsTogether') || '',
  },
  onMonths(e) {
    const v = e.detail.value
    this.setData({ monthsTogether: v })
    wx.setStorageSync('monthsTogether', String(v || ''))
  },
  startQuiz() {
    wx.navigateTo({ url: '/pages/quiz/quiz' })
  }
})
