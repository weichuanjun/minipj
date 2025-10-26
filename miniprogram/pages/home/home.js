const { tests } = require('../../data/tests.js')

Page({
  data: { tests: [] },
  onLoad() {
    this.setData({ tests })
  },
  enter(e) {
    const path = e.currentTarget.dataset.path
    if (path) wx.navigateTo({ url: path })
  }
})

