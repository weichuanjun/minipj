Page({
  data: {
    loggedIn: false,
    nickname: '',
    avatarUrl: '',
    results: []
  },
  onLoad(){},
  onReady(){ this.setTab() },
  onShow() { this.setTab(); this.loadProfile(); this.loadResults() },
  setTab(){ try { const tb = this.getTabBar && this.getTabBar(); if (tb && typeof tb.setData==='function') tb.setData({ selected: 1 }) } catch(_){} },
  ts(ts) {
    const d = new Date(ts)
    const pad = (n)=> String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  },
  logout(){
    try { wx.removeStorageSync('userProfile') } catch(_){}
    this.setData({ loggedIn: false, nickname: '', avatarUrl: '' })
    wx.showToast({ title: '已退出', icon: 'none' })
  },
  loadProfile() {
    const p = wx.getStorageSync('userProfile') || null
    if (p && p.nickname) {
      this.setData({ loggedIn: true, nickname: p.nickname, avatarUrl: p.avatarUrl })
    } else {
      this.setData({ loggedIn: false, nickname: '', avatarUrl: '' })
    }
  },
  loadResults() {
    const arr = wx.getStorageSync('testResults') || []
    const results = arr.map(r => ({ ...r, timeText: this.ts(r.time) }))
    this.setData({ results })
  },
  async incCount(){
    try {
      const { callContainer } = require('../../utils/container.js')
      const res = await callContainer('/api/count', 'POST', { action: 'inc' })
      const val = (res && res.data && (res.data.count || res.data.data && res.data.data.count)) || 'ok'
      wx.showToast({ title: `计数+1：${val}`, icon: 'none' })
    } catch (e) {
      wx.showToast({ title: e.message || '调用失败', icon: 'none' })
    }
  },
  async login() {
    try {
      if (!wx.getUserProfile) { wx.showToast({ title: '请在真机或高版本基础库使用', icon: 'none' }); return }
      const prof = await wx.getUserProfile({ desc: '用于完善个人资料' })
      const profile = { nickname: prof.userInfo.nickName, avatarUrl: prof.userInfo.avatarUrl }
      try {
        const { callContainer } = require('../../utils/container.js')
        await callContainer('/api/user/upsert', 'POST', profile)
      } catch (e) { console.warn('container upsert failed', e) }
      wx.setStorageSync('userProfile', profile)
      this.setData({ loggedIn: true, nickname: profile.nickname, avatarUrl: profile.avatarUrl })
      wx.showToast({ title: '登录成功', icon: 'success' })
    } catch (e) {
      console.warn('login failed', e)
      wx.showToast({ title: e.errMsg || '登录失败或已取消', icon: 'none' })
    }
  },
  viewResult(e) {
    const idx = e.currentTarget.dataset.index
    const arr = wx.getStorageSync('testResults') || []
    const rec = arr[idx]
    if (!rec) return
    // 仅支持关系测试回放
    if (rec.testId === 'relationship') {
      const data = encodeURIComponent(JSON.stringify(rec.payload || {}))
      wx.navigateTo({ url: `/pages/tests/relationship/result?data=${data}&fromHistory=1` })
    }
  }
})
