const { envId, containerService } = require('../config.js')

async function callContainer(path, method = 'GET', data = {}, extraHeader = {}) {
  if (!wx.cloud || !wx.cloud.callContainer) {
    throw new Error('callContainer 不可用，请在真机或高版本基础库测试')
  }
  const header = Object.assign({ 'X-WX-SERVICE': containerService, 'content-type': 'application/json' }, extraHeader)
  return await wx.cloud.callContainer({ config: { env: envId }, path, header, method, data })
}

module.exports = { callContainer }

