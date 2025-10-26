Page({
  data: { text: '', items: [] },
  onLoad() {
    this.load()
  },
  onInput(e) { this.setData({ text: e.detail.value }) },
  load() {
    const list = wx.getStorageSync('feedback_list') || []
    this.setData({ items: list })
  },
  save() {
    const t = (this.data.text || '').trim()
    if (!t) { wx.showToast({ title: '请输入内容', icon: 'none' }); return }
    const list = wx.getStorageSync('feedback_list') || []
    const ts = new Date()
    const pad = (n) => (n < 10 ? '0' + n : n)
    const tsStr = `${ts.getFullYear()}-${pad(ts.getMonth()+1)}-${pad(ts.getDate())} ${pad(ts.getHours())}:${pad(ts.getMinutes())}`
    list.unshift({ id: Date.now(), ts: tsStr, text: t })
    wx.setStorageSync('feedback_list', list)
    this.setData({ text: '' })
    this.load()
    wx.showToast({ title: '已保存到本地', icon: 'success' })
  }
})

