const app = getApp()
Page({
  data: {
    inputText: 'Hello World!',
    receiveText: '',
    name: '',
    connectedDeviceId: '',
		services: [],

    characteristics: {},
    connected: true,
    serviceId:'',
    characteristicId:''

  },
  bindInput: function (e) {
    this.setData({
      inputText: e.detail.value
    })
    console.log(e.detail.value)
  },
  Send: function () {

		console.log("this.services==", this.data.services);
    var that = this
    if (that.data.connected) {
			let key = "01"
			//拍照 11
			//按键 0-2 ? 为什么是三个按钮
			//单击
			let click = "03"
			//十进制转16进制
			const clickHex = Number(click).toString(16);
			//双击
			let doubleClick = "00"
			const doubleClickHex = Number(doubleClick).toString(16);
			//长按
			let longPress  = "00"
			const longPressHex = Number(longPress).toString(16);
			console.log(`clickHex=${clickHex} doubleClickHex=${doubleClickHex} longPressHex=${longPressHex}`);
			let codedingsOne = ['A1', '21', '00', key, clickHex, doubleClickHex, longPressHex, '00', '00', '00', '00','00', '00', '00', '00', '00', '00', '00', '00', '08'];
			let codedingStr = `A12100${key}${click}${doubleClick}${longPress}00000000000000000000000003`
			//计算3-18
			let total = 0
			for (let index = 4; index < 19; index++) {
				let tn = Number('0x'+codedingsOne[index])
				total += tn;
				console.log('十进制', tn);
			}
			console.log("总大小应该是12---", total);
			codedingsOne[19] = total.toString(16)
			console.log("修改后的codedingsOne==", codedingsOne);
 //看样子这个可以,--
			let tempArray = []
			//十进制的数组
			for (let index = 0; index < codedingsOne.length; index++) {
				let element = codedingsOne[index];
				if (element.length == 0){
					element = '0'+element
				}
				tempArray.push('0x'+element)
			}
			console.log("tempArray==", tempArray);
 			let oneAB = hexStrToBuf(tempArray);
			console.log("看样子这个可以---oneAB=", oneAB);

			//发送数据
			console.log(`deviceId:${that.data.connectedDeviceId} serviceId:${that.data.serviceId} characteristicId:${that.data.characteristicId}`);
			
			
     // var codedingStr = `0xA10x21LEN${key}${click}${doubleClick}${longPress}000000000000000000000000CRC`
      console.log("codedingStr==", codedingStr);
 			//0xA1 0x21 LEN 01 11 00 00 00 00 00 00 00 00 00 00 00 00 00 00 CRC
       var buffer = new ArrayBuffer(codedingStr)
       var dataView = new Uint8Array(buffer)
      
      for (var i = 0; i <codedingStr; i++) {
        dataView[i] = codedingStr.charCodeAt(i)
       }
			 console.log("buffer==", buffer);
			 //读取电量:
			 let dqdl = "A103000000000000000000000000000000000000"
			 let nnnewBuffer = hex2ArrayBuffer(dqdl)
			 console.log("nnnewBuffer==", nnnewBuffer);

			wx.writeBLECharacteristicValue({
				deviceId: that.data.connectedDeviceId,
				serviceId: that.data.serviceId,
				characteristicId: that.data.characteristicId,
				value: nnnewBuffer,
				success: function (res) {
					if (res.errCode != 0){
						wx.showModal({
							title: '提示',
							content: `发送失败:${res.errno}, ${res.errMsg}`,
							showCancel: false,
							success: function (res) {
								that.setData({
									searching: false
								})
							}
						})
					}
					console.log('test_dataView发送成功', res)
				},
				fail: function(error) {
					console.log("test_dataView发送失败", error);
				}
			})
   
    }
    else {
      wx.showModal({
        title: '提示',
        content: '蓝牙已断开',
        showCancel: false,
        success: function (res) {
          that.setData({
            searching: false
          })
        }
      })
    }

  },
  CloseBLEConnection:function(){
    var that = this

    wx.closeBLEConnection({
      deviceId: that.data.connectedDeviceId,
      success: function(res){
        console.log('断开蓝牙', res);
      }
    })
  },
  getUint8Value: function (e, t) {
    for (var a = e, i = new DataView(a), n = "", s = 0; s < i.byteLength; s++) n += String.fromCharCode(i.getUint8(s));
    t(n);
  },
  string2buffer:function (str) {
    if (!str) return;
    var val = "";
    for (var i = 0; i < str.length; i++) {
        val += str.charCodeAt(i).toString(16);
    }
    str = val;
    val = "";
    let length = str.length;
    let index = 0;
    let array = []
    while (index < length) {
        array.push(str.substring(index, index + 2));
        index = index + 2;
    }
    val = array.join(",");
    // 将16进制转化为ArrayBuffer
    return new Uint8Array(val.match(/[\da-f]{2}/gi).map(function (h) {
        return parseInt(h, 16)
    })).buffer
  },
  onLoad: function (options) {
    var that = this
    console.log("characterList==", options)
    that.setData({
      name: options.name,
      connectedDeviceId: options.connectedDeviceId
		})
		console.log("that.data.connectedDeviceId=", that.data.connectedDeviceId);
    wx.getBLEDeviceServices({
      deviceId: that.data.connectedDeviceId,
      success: function (res) {
				
				let tempSers = res.services
				for (let index = 0; index < tempSers.length; index++) {
					tempSers[index]['characteristics'] = [];
				}
				console.log(tempSers)
        that.setData({
          services: tempSers
        })
        console.log(" tempSers==",  tempSers, "res.services==", res.services);
        for (let index = 0; index < tempSers.length; index++) {
					const element = tempSers[index];
					
          
         console.log("options.connectedDeviceId:", options.connectedDeviceId);
          wx.getBLEDeviceCharacteristics({
            deviceId: options.connectedDeviceId,
            serviceId:element.uuid,
            success: function (res) 
            {
              console.log("index==", index, "elemen==t", element.uuid);
              //获取到设备列表
							console.log("getBLEDeviceCharacteristics:",res.characteristics)
							element.characteristics = res.characteristics
              that.setData({
								services: tempSers
							})
							console.log("循环完毕查看==", that.data.services);
            }
          })
        }
			 
				
      }
    })
    wx.onBLEConnectionStateChange(function (res) {
      console.log('onBLEConnectionStateChange==', res.connected)
      that.setData({
        connected: res.connected
      })
    })
    wx.onBLECharacteristicValueChange(function (res) {
			var receiveText = app.buf2string(res.value)
			for (const key in res.value) {
				const element = object[key];
				console.log("result==", element);	
				
			}
			console.log("res.value", res.value);
      console.log('接收到数据：' + receiveText)
      that.setData({
        receiveText: receiveText
      })
    })
  
  
  },
  AddNotify:function(deviceId,serviceId, characteristicId){
		var that = this
		const mtu = 128
		wx.getBLEMTU({
			deviceId: deviceId,
			success:(value)=>{
				console.log("getBLEMTU成功", value);
			},
			fail:(value)=>{
				console.log("getBLEMTU失败", value);
			}
		})
		// wx.setBLEMTU({
		// 	deviceId: deviceId,
		// 	mtu: 128,
		// 	success:(value)=>{
		// 		console.log("setBLEMTU成功", value);
		// 	},
		// 	fail:(value)=>{
		// 		console.log("setBLEMTU失败", value);
		// 	}
		// })



    wx.notifyBLECharacteristicValueChange({
      state: true,
      deviceId: deviceId,
      serviceId: serviceId,
      characteristicId: characteristicId,
      success: function (res) {
        console.log('启用notify成功')
      },
      fail:function(res){
        console.log('notifyBLECharacteristicValueChange=error==',res);
      }
    
    })
	},
	sendText(event){
		console.log(event.currentTarget.dataset.idtype)//是个数组
		let uuids = event.currentTarget.dataset.idtype
		let sId = uuids[0];
		let cId = uuids[1]
		this.setData({
			characteristicId:cId,
			serviceId:sId,
		})
		this.AddNotify(this.data.connectedDeviceId,sId, cId)
		this.Send();
		

		// console.log("serviceId==", serviceId, "characteristicId==", characteristicId);
	},
  onReady: function () {

  },
  onShow: function () {

  },
  onHide: function () {

  }
})



// hex转ArrayBuffer
function hexStrToBuf(arr) {
  var length = arr.length
  var buffer = new ArrayBuffer(length)
	var dataview = new DataView(buffer)
	var dataIntView = new Uint8Array(buffer)
  for (let i = 0; i < length; i++) {
		dataview.setUint8(i,arr[i])
		
		// dataIntView[i] = Number('0x' + arr[i])
		// dataIntView[i] = arr[i]
  }
  return buffer
}


    // 16进制字符串转ArrayBuffer
    function hex2ArrayBuffer(hex_str) {
      // let hex_str = 'AA5504B10000B5'
      let typedArray = new Uint8Array(hex_str.match(/[\da-f]{2}/gi).map(function (h) {
        return parseInt(h, 16)
      }))
      let buffer = typedArray.buffer
      return buffer
    }