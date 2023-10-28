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
    serviceId: '',
    characteristicId: ''

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

      let dqdl = "A103000000000000000000000000000000000000"
      let nnnewBuffer = hex2ArrayBuffer(dqdl)
      console.log("nnnewBuffer==", nnnewBuffer);

      wx.writeBLECharacteristicValue({
        deviceId: that.data.connectedDeviceId,
        serviceId: that.data.serviceId,
        characteristicId: that.data.characteristicId,
        value: nnnewBuffer,
        success: function (res) {
          if (res.errCode != 0) {
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
        fail: function (error) {
          console.log("test_dataView发送失败", error);
        }
      })

    } else {
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
  CloseBLEConnection: function () {
    var that = this

    wx.closeBLEConnection({
      deviceId: that.data.connectedDeviceId,
      success: function (res) {
        console.log('断开蓝牙', res);
      }
    })
  },
  getUint8Value: function (e, t) {
    for (var a = e, i = new DataView(a), n = "", s = 0; s < i.byteLength; s++) n += String.fromCharCode(i.getUint8(s));
    t(n);
  },
  string2buffer: function (str) {
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
				let newList = [];
        for (let index = 0; index < tempSers.length; index++) {
					if (tempSers[index].uuid.indexOf('FA30') != -1){
						tempSers[index]['characteristics'] = [];
						newList.push(tempSers[index]);
					} 
        }
        console.log(newList)
        that.setData({
          services: newList
        })
        console.log(" newList==", newList, "res.services==", res.services);
        for (let index = 0; index < newList.length; index++) {
          const element = newList[index];
          console.log("options.connectedDeviceId:", options.connectedDeviceId);
          wx.getBLEDeviceCharacteristics({
            deviceId: options.connectedDeviceId,
            serviceId: element.uuid,
            success: function (res) {
              console.log("index==", index, "elemen==t", element.uuid);
              //获取到设备列表
              console.log("getBLEDeviceCharacteristics:", res.characteristics)
              element.characteristics = res.characteristics
              that.setData({
                services: newList
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
			console.log("接收到的原始数据==", res);
      var receiveText = app.arrayBuffer2Hex(res.value)
      // for (const key in res.value) {
      //   const element = object[key];
      //   console.log("result==", element);

      // }
      // console.log("res.value", res.value);
      console.log('接收到数据：' + receiveText)
      that.setData({
        receiveText: receiveText
      })
    })


  },
  AddNotify: function (deviceId, serviceId, characteristicId) {
    var that = this
		console.log("添加监听", deviceId, serviceId, characteristicId);
    wx.notifyBLECharacteristicValueChange({
      state: true,
      deviceId: deviceId,
      serviceId: serviceId,
      characteristicId: characteristicId,
      success: function (res) {
        console.log('启用notify成功')
      },
      fail: function (res) {
        console.log('notifyBLECharacteristicValueChange=error==', res);
      }

    })
  },
  writeBle(event) {
		console.log(event.currentTarget.dataset.idtype) //是个数组
		
    let FA31 = event.currentTarget.dataset.idtype.characteristics[1].uuid;
		let FA32 = event.currentTarget.dataset.idtype.characteristics[0].uuid;
		let sId = event.currentTarget.dataset.idtype.uuid
		console.log("FA31===", FA31, "FA32===", FA32);
		console.log("event.currentTarget.dataset.idtype.uuid==", event.currentTarget.dataset.idtype.uuid);
		this.AddNotify(this.data.connectedDeviceId, event.currentTarget.dataset.idtype.uuid, FA31)

		// let uuids = event.currentTarget.dataset.idtype;
    // let sId = uuids[0];
		// let cId = uuids[1]
		
		// console.log("event.currentTarget.dataset.idtype.uuid==", event.currentTarget.dataset.idtype.uuid);
		this.AddNotify(this.data.connectedDeviceId, sId, FA32)

		setTimeout(()=>{
			this.setData({
				characteristicId: FA31,
				serviceId: sId,
			})
			console.log("this.services==", this.data.services);
			var that = this
			if (that.data.connected) {
				/*
				a122100108000c00000000000000000000000015

				0xA1 0x21 LEN AA BB CC DD 00 00 00 00 00 00 00 00 00 00 00 00 CRC
				A121000102030400000000000000000000000010
				A122000100000000000000000000000000000000
				A121100103020400000000000000000000000009
				a122100108000c00000000000000000000000015
				*/
				//
				//0xA1 0x21 LEN AA BB CC DD 00 00 00 00 00 00 00 00 00 00 00 00 CRC
									//A121100103120100000000000000000000000016
						/*
				可以成功的数据:
				A12110010B05010000000000000000000000000A
				这里的12 是 暂停/播放 但是为什么检验位是 17
				A121100103120100000000000000000000000017
				*/

				//A1211001030C0100000000000000000000000017

				let dqdl = "A1211001030C0100000000000000000000000011"
				
				// 15+22+3
				
				
				//获取强度比
				// let dqdl = "A125000000000000000000000000000000000000"
				//设置强度比
				// let dqdl = "A124000900000000000000000000000000000009"
				//读取电量
				// let dqdl = 'A103000000000000000000000000000000000000'
				//读取按钮功能
				// let dqdl = "A122000100000000000000000000000000000000"
				console.log("dqdl===", dqdl);
				let nnnewBuffer = hex2ArrayBuffer(dqdl)
				console.log("nnnewBuffer==", nnnewBuffer);
				//写入数据 
				console.log("写入数据--", that.data.connectedDeviceId, sId, FA31);
				wx.writeBLECharacteristicValue({
					deviceId: this.data.connectedDeviceId,
					serviceId: sId,
					characteristicId: FA31,
					value: nnnewBuffer,
					success: function (res) {
						if (res.errCode != 0) {
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
					fail: function (error) {
						console.log("test_dataView发送失败", error);
					}
				})
	
			} else {
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
		},1000);
		
 
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
    dataview.setUint8(i, arr[i])

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
