// Common poster rendering utils for result pages
// Draws a long poster mirroring the on-page layout with clear sections

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

function drawWrapped(ctx, text, x, y, maxWidth, lineHeight){
  const lines = String(text||'').split(/\n/)
  let yy = y
  for(const raw of lines){
    let line = ''
    for(const ch of raw){
      const test = line + ch
      if (ctx.measureText(test).width > maxWidth){
        ctx.fillText(line, x, yy); yy += lineHeight; line = ch
      } else line = test
    }
    if (line){ ctx.fillText(line, x, yy); yy += lineHeight }
  }
  return yy
}

function measureWrapped(ctx, text, maxWidth, lineHeight){
  const txt = String(text||'')
  const words = txt.split(/\n/)
  let h = 0
  for(const w of words){
    let line = ''
    for(const ch of w){
      const test = line + ch
      if (ctx.measureText(test).width > maxWidth){ h += lineHeight; line = ch } else line = test
    }
    if (line) h += lineHeight
  }
  return h
}

async function drawResultPoster(canvas, data, opts = {}){
  const theme = Object.assign({
    bgTop: '#FFF8F1', bgBottom: '#FFFFFF',
    cardFill: '#FFFFFF', cardStroke: '#F7DDE1',
    title: '#594c4c', text: '#6f6f6f', accent: '#85A9F0', strong: '#4f5560', warn: '#c45a5a'
  }, opts.theme || {})

  const dpr = wx.getSystemInfoSync().pixelRatio || 2
  const W = opts.width || 750
  // Estimate content height
  const ctx = canvas.getContext('2d')
  canvas.width = W * dpr
  canvas.height = (opts.height || 1600) * dpr
  ctx.scale(dpr, dpr)
  // Background
  const grd = ctx.createLinearGradient(0, 0, 0, canvas.height/dpr)
  grd.addColorStop(0, theme.bgTop); grd.addColorStop(1, theme.bgBottom)
  ctx.fillStyle = grd; ctx.fillRect(0,0, W, canvas.height/dpr)

  const pad = 24
  const cardX = pad, cardY = 28, cardW = W - pad*2
  // Title area height
  const titleH = 58
  // BHI area
  const bhiH = 120
  // Time window
  const timeH = 36

  // Dim + radar: text and image
  const radarSize = 260
  const dimTextW = cardW - radarSize - 48
  ctx.font = '18px sans-serif'
  const dimLines = (data.dimList||[]).map(it => `${it.k}：${it.v}分  ${it.desc||''}`).join('\n')
  const dimTextH = measureWrapped(ctx, dimLines, dimTextW, 28) + 40

  // Insights block
  ctx.font = '18px sans-serif'
  const insightsText = (data.insights||[]).map(t=>'• '+t).join('\n')
  const suggText = (data.suggestions||[]).map(t=>'• '+t).join('\n')
  const anaText = [insightsText, suggText].filter(Boolean).join('\n')
  const anaH = measureWrapped(ctx, anaText, cardW-48, 28) + 60

  // Footer promo height
  const promoH = 64

  const contentH = titleH + bhiH + timeH + Math.max(dimTextH, radarSize+48) + anaH + promoH + 160
  const H = Math.max(1280, Math.ceil(contentH/10)*10)
  canvas.height = H * dpr
  ctx.setTransform(dpr,0,0,dpr,0,0)
  // Repaint background with new H
  const grd2 = ctx.createLinearGradient(0, 0, 0, H)
  grd2.addColorStop(0, theme.bgTop); grd2.addColorStop(1, theme.bgBottom)
  ctx.fillStyle = grd2; ctx.fillRect(0,0,W,H)

  // Card
  const cardH = H - 56
  roundRect(ctx, cardX, cardY, cardW, cardH, 18, theme.cardFill, theme.cardStroke)

  let y = cardY + 46
  // Title
  ctx.fillStyle = theme.title
  ctx.font = 'bold 28px sans-serif'
  ctx.fillText('关系评估结果', cardX+24, y)
  y += 16
  // BHI tip
  ctx.fillStyle = theme.text
  ctx.font = '12px sans-serif'
  ctx.fillText('提示：各维度分数越高代表关系越稳定；BHI 越高代表分手风险越高。', cardX+24, y)
  y += 12
  // BHI row
  ctx.fillStyle = theme.strong
  ctx.font = 'bold 56px sans-serif'
  ctx.fillText(`BHI ${data.result.BHI||0}`, cardX+24, y+56)
  ctx.fillStyle = theme.accent
  ctx.font = 'bold 22px sans-serif'
  ctx.fillText(`${data.riskTier||''}`, cardX+24, y+92)
  y += bhiH

  // Time window or safety
  ctx.font = '18px sans-serif'
  if (!data.result.hasSafety){
    ctx.fillStyle = theme.text
    ctx.fillText(`参考时间窗：${(data.rangeRounded||[0,0])[0]}-${(data.rangeRounded||[0,0])[1]} 月`, cardX+24, y)
  } else {
    ctx.fillStyle = theme.warn
    ctx.fillText('检测到安全风险，请优先保障安全', cardX+24, y)
  }
  y += 36

  // Section: dims + radar
  ctx.fillStyle = theme.title
  ctx.font = 'bold 22px sans-serif'
  ctx.fillText('维度与雷达图', cardX+24, y)
  // Radar image on right
  if (opts.radarImage){
    // draw with padding
    const rx = cardX+cardW-radarSize-24
    const ry = y - 10
    ctx.drawImage(opts.radarImage, rx, ry, radarSize, radarSize)
  }
  // Dim text on left
  ctx.fillStyle = theme.text
  ctx.font = '18px sans-serif'
  y += 28
  for (const it of (data.dimList||[])){
    y = drawWrapped(ctx, `${it.k}：${it.v}分  ${it.desc||''}`, cardX+24, y, dimTextW, 28)
    y += 6
  }
  // Move y below radar if needed
  y = Math.max(y, (y-28) - (dimTextH-28) + radarSize + 32)

  // Section: analysis
  ctx.fillStyle = theme.title
  ctx.font = 'bold 22px sans-serif'
  ctx.fillText('分析与建议', cardX+24, y)
  y += 28
  ctx.fillStyle = theme.text
  ctx.font = '18px sans-serif'
  y = drawWrapped(ctx, anaText, cardX+24, y, cardW-48, 28)

  // Footer timestamp
  const t = new Date(); const pad2=n=>String(n).padStart(2,'0')
  const ts = `${t.getFullYear()}-${pad2(t.getMonth()+1)}-${pad2(t.getDate())} ${pad2(t.getHours())}:${pad2(t.getMinutes())}`
  ctx.fillStyle = '#8a7f7f'; ctx.font = '16px sans-serif'
  ctx.fillText(ts, cardX+24, H-84)

  // Promo bar
  const promo = '更多有趣内容更新，欢迎关注公众号[好好测测酱]'
  ctx.fillStyle = theme.accent
  roundRect(ctx, cardX+12, H-68, cardW-24, 44, 12, theme.accent)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 20px sans-serif'
  const tw = ctx.measureText(promo).width
  ctx.fillText(promo, cardX + (cardW - tw)/2, H-40)

  return { width: W, height: H }
}

function drawRadar(ctx, x, y, size, dimList){
  const N = (dimList||[]).length
  if (!N) return
  const cx = x + size/2
  const cy = y + size/2
  const R = size/2 - 16
  // grid
  ctx.strokeStyle = '#F0E6E6'; ctx.lineWidth = 1
  for(let r=0.3; r<=1.0; r+=0.2){
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
  ctx.fillStyle = 'rgba(133,169,240,0.28)'; ctx.strokeStyle = '#85A9F0'
  ctx.beginPath()
  for(let i=0;i<N;i++){
    const v = Math.max(0, Math.min(1, ((dimList[i].v||0)/100)))
    const ang = -Math.PI/2 + (2*Math.PI*i)/N
    const px = cx + R*v*Math.cos(ang)
    const py = cy + R*v*Math.sin(ang)
    if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py)
  }
  ctx.closePath(); ctx.fill(); ctx.stroke()
}

async function drawFullResultPoster(canvas, data, opts = {}){
  const theme = Object.assign({
    bgTop: '#FFF8F1', bgBottom: '#FFFFFF', cardFill: '#FFFFFF', cardStroke: '#F7DDE1',
    title: '#594c4c', text: '#6f6f6f', accent: '#85A9F0', strong: '#4f5560', warn: '#c45a5a'
  }, opts.theme || {})
  const dpr = wx.getSystemInfoSync().pixelRatio || 2
  const W = 750
  const pad = 24
  const cardPad = 18
  const cardX = pad, cardW = W - pad*2
  const ctx = canvas.getContext('2d')

  // Build section strings
  const dimTextStr = (data.dimList||[]).map(it=>`${it.k}：${it.v}分  ${it.desc||''}`).join('\n')
  const riskText = data.result?.hasSafety ? '检测到安全风险，请优先保障安全' : `参考时间窗：${(data.rangeRounded||[0,0])[0]}-${(data.rangeRounded||[0,0])[1]} 月`
  const analysisStr = [
    ...(data.empathy?[`${data.empathy}`]:[]),
    ...((data.insights||[]).map(t=>`• ${t}`))
  ].join('\n')
  const suggestStr = ((data.suggestions||[]).map(t=>`• ${t}`)).join('\n')

  // Measure heights precisely
  const hdrH28 = 28, hdrH22 = 22, tipH = 14, bhiH = 56, tierH = 22, subH = 18
  ctx.font = '18px sans-serif'
  const dimTextH = measureWrapped(ctx, dimTextStr, cardW - 260 - 48, 28)
  const dimsContentH = hdrH22 + 12 + Math.max(dimTextH, 260)
  const analysisBodyH = measureWrapped(ctx, analysisStr, cardW-36, 28)
  const suggestBodyH = measureWrapped(ctx, suggestStr, cardW-36, 28)
  const card1H = cardPad + hdrH28 + 8 + tipH + 12 + bhiH + 8 + tierH + 12 + subH + cardPad
  const card2H = cardPad + dimsContentH + cardPad
  const card3H = cardPad + hdrH22 + 12 + analysisBodyH + cardPad
  const card4H = cardPad + hdrH22 + 12 + suggestBodyH + cardPad
  const promoH = 56
  const totalH = pad + card1H + 12 + card2H + 12 + card3H + 12 + card4H + promoH + pad
  const H = Math.max(1280, Math.ceil(totalH/10)*10)

  // Init canvas
  canvas.width = W * dpr
  canvas.height = H * dpr
  ctx.setTransform(dpr,0,0,dpr,0,0)
  const grd = ctx.createLinearGradient(0, 0, 0, H)
  grd.addColorStop(0, theme.bgTop); grd.addColorStop(1, theme.bgBottom)
  ctx.fillStyle = grd; ctx.fillRect(0,0,W,H)
  // Use top-baseline so y 即为文字顶边，避免基线偏移导致的重叠
  ctx.textBaseline = 'top'

  let y = pad
  // Card 1: BHI
  roundRect(ctx, cardX, y, cardW, card1H, 18, theme.cardFill, theme.cardStroke)
  let cy = y + cardPad
  ctx.fillStyle = theme.title; ctx.font = 'bold 28px sans-serif'; ctx.fillText('关系评估结果', cardX+cardPad, cy)
  cy += hdrH28 + 8
  ctx.fillStyle = theme.text; ctx.font = '12px sans-serif'; ctx.fillText('提示：各维度分数越高代表关系越稳定；BHI 越高代表分手风险越高。', cardX+cardPad, cy)
  cy += tipH + 12
  ctx.fillStyle = theme.strong; ctx.font = 'bold 56px sans-serif'; ctx.fillText(`BHI ${data.result?.BHI||0}`, cardX+cardPad, cy)
  cy += bhiH + 8
  ctx.fillStyle = theme.accent; ctx.font = 'bold 22px sans-serif'; ctx.fillText(`${data.riskTier||''}`, cardX+cardPad, cy)
  cy += tierH + 12
  ctx.fillStyle = data.result?.hasSafety ? theme.warn : theme.text; ctx.font = '18px sans-serif'
  ctx.fillText(riskText, cardX+cardPad, cy)
  cy += subH
  y += card1H + 12

  // Card 2: Dims + Radar
  roundRect(ctx, cardX, y, cardW, card2H, 18, theme.cardFill, theme.cardStroke)
  cy = y + cardPad
  ctx.fillStyle = theme.title; ctx.font = 'bold 22px sans-serif'; ctx.fillText('维度与雷达图', cardX+cardPad, cy)
  cy += hdrH22 + 12
  // Left text
  ctx.fillStyle = theme.text; ctx.font = '18px sans-serif'
  const tx = cardX + cardPad
  const textW = cardW - 260 - 48
  let ty = cy
  ty = drawWrapped(ctx, dimTextStr, tx, ty, textW, 28)
  // Radar on right
  const rx = cardX + cardW - 260 - cardPad
  const ry = y + cardPad + hdrH22 + 12
  drawRadar(ctx, rx, ry, 260, data.dimList || [])
  y += card2H + 12

  // Card 3: 分项分析与风险点
  roundRect(ctx, cardX, y, cardW, card3H, 18, theme.cardFill, theme.cardStroke)
  cy = y + cardPad
  ctx.fillStyle = theme.title; ctx.font = 'bold 22px sans-serif'; ctx.fillText('分项分析与风险点', cardX+cardPad, cy)
  cy += hdrH22 + 12
  ctx.fillStyle = theme.text; ctx.font = '18px sans-serif'
  drawWrapped(ctx, analysisStr, cardX+cardPad, cy, cardW-36, 28)
  y += card3H + 12

  // Card 4: 个性化建议
  roundRect(ctx, cardX, y, cardW, card4H, 18, theme.cardFill, theme.cardStroke)
  cy = y + cardPad
  ctx.fillStyle = theme.title; ctx.font = 'bold 22px sans-serif'; ctx.fillText('个性化建议', cardX+cardPad, cy)
  cy += hdrH22 + 12
  ctx.fillStyle = theme.text; ctx.font = '18px sans-serif'
  drawWrapped(ctx, suggestStr, cardX+cardPad, cy, cardW-36, 28)
  y += card4H

  // Footer promo
  const promo = '更多有趣内容更新，欢迎关注公众号[好好测测酱]'
  ctx.fillStyle = theme.accent
  roundRect(ctx, cardX+12, H- pad - 56, cardW-24, 44, 12, theme.accent)
  ctx.fillStyle = '#fff'; ctx.font = 'bold 20px sans-serif'
  const tw = ctx.measureText(promo).width
  ctx.fillText(promo, cardX + (cardW - tw)/2, H - pad - 56 + 30)
}

module.exports = { drawResultPoster, drawFullResultPoster }
