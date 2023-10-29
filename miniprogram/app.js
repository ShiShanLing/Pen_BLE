const { default: SystemInfoUtil } = require("./tools")

// app.ts

App({

  buf2hex: function (buffer) {
    return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('')
  },
  buf2string: function (buffer) {
    var arr = Array.prototype.map.call(new Uint8Array(buffer), x => x)
    var str = ''
    for (var i = 0; i < arr.length; i++) {
      str += String.fromCharCode(arr[i])
    }
    return str
	},
	arrayBuffer2Hex(buffer) {
		const hexArr = Array.prototype.map.call(
			new Uint8Array(buffer),
			function (bit) {
				return ('00' + bit.toString(16)).slice(-2)
			}
		)
		return hexArr.join('')
		},
  onLaunch() {
    SystemInfoUtil.init();
		//每次启动都删除一下本地数据;
		// wx.removeStorage({key: "deviceList"})
    // 登录
    wx.login({
      success: res => {
        console.log(res.code)
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      },
    })

		this.globalData.SystemInfo = wx.getSystemInfoSync()
	},
  globalData: {SystemInfo: {}},
  //同时只能有一个设备id 服务id 特征id
  currentConDevId:"",
  serveId:"",
  characteristicId_RX:"",
  characteristicId_TX:"",
  //仅用于页面传值
  pushDetialsDevice:{}
})