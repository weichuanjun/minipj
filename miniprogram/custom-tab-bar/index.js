Component({
  data: { selected: 0 },
  methods: {
    switchTo(e) {
      const path = e.currentTarget.dataset.path
      const idx = Number(e.currentTarget.dataset.idx)
      if (typeof idx === 'number') this.setData({ selected: idx })
      if (path) wx.switchTab({ url: path })
    }
  }
})

