const { tests } = require('../../data/tests.js')

Page({
  data: { tests: [], cards: [], loggedIn: false, nickname: '', busy: false },
  onShow() { this.checkLogin() },
  // 自定义 tabbar 选中态
  onTabItemTap() {},
  onReady(){ this.setTab() },
  onShow(){ this.setTab(); this.checkLogin() },
  setTab(){ try { const tb = this.getTabBar && this.getTabBar(); if (tb && typeof tb.setData==='function') tb.setData({ selected: 0 }) } catch(_){} },
  onLoad() {
    // 构造卡片（两列布局），首个使用图片封面
    const cards = tests.map((t, i)=>({
      id: t.id,
      title: i===0 ? '分手风险评估' : t.name,
      cover: i===0 ? 'cloud://prod-3g6hhdfs1a90f835.7072-prod-3g6hhdfs1a90f835-1384203466/1.PNG' : 'cloud://prod-3g6hhdfs1a90f835.7072-prod-3g6hhdfs1a90f835-1384203466/1.PNG',
      entryPath: t.entryPath || `/pages/tests/${t.id}/index`
    }))
    // 加入占位测试：裁员风险评估（Coming soon）
    cards.push({ id: 'layoff', title: '裁员风险评估', cover: 'cloud://prod-3g6hhdfs1a90f835.7072-prod-3g6hhdfs1a90f835-1384203466/2.png', entryPath: '', disabled: true })
    this.setData({ tests, cards })
    this.checkLogin()
  },
  checkLogin(){
    const p = wx.getStorageSync('userProfile') || null
    this.setData({ loggedIn: !!(p && p.nickname), nickname: (p && p.nickname) || '' })
  },
  enter(e) {
    const path = e.currentTarget.dataset.path
    const disabled = !!e.currentTarget.dataset.disabled
    if (disabled) { wx.showToast({ title: '敬请期待', icon: 'none' }); return }
    if (path) wx.navigateTo({ url: path })
  },
  async login() {
    if (this.data.busy) return
    this.setData({ busy: true })
    try {
      // 仅获取头像昵称授权
      if (!wx.getUserProfile) { wx.showToast({ title: '请在真机或高版本基础库使用', icon: 'none' }); return }
      const prof = await wx.getUserProfile({ desc: '用于完善个人资料' })
      const profile = { nickname: prof.userInfo.nickName, avatarUrl: prof.userInfo.avatarUrl }
      // 云托管同步（失败不阻塞本地登录）
      try {
        const { callContainer } = require('../../utils/container.js')
        await callContainer('/api/user/upsert', 'POST', profile)
      } catch (e) { console.warn('container upsert failed', e) }
      // 本地持久化
      wx.setStorageSync('userProfile', profile)
      this.setData({ loggedIn: true, nickname: profile.nickname })
      wx.showToast({ title: '已登录', icon: 'success' })
    } catch (e) {
      console.warn('login failed', e)
      wx.showToast({ title: (e && e.errMsg) || '登录失败或已取消', icon: 'none' })
    } finally {
      this.setData({ busy: false })
    }
  },
  // 旧版兜底按钮（open-type=getUserInfo）
  async onGetUserInfo(e){
    if (!e.detail || !e.detail.userInfo) { wx.showToast({ title: '未授权头像昵称', icon: 'none' }); return }
    try {
      const ui = e.detail.userInfo
      const profile = { nickname: ui.nickName, avatarUrl: ui.avatarUrl }
      try {
        const { callContainer } = require('../../utils/container.js')
        await callContainer('/api/user/upsert', 'POST', profile)
      } catch(_) {}
      wx.setStorageSync('userProfile', profile)
      this.setData({ loggedIn: true, nickname: profile.nickname })
      wx.showToast({ title: '已登录', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: err.errMsg || '登录失败', icon: 'none' })
    }
  }
})
