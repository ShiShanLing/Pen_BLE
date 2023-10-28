export class BLEMannage{
  
  constructor(){
    wx.onBLEConnectionStateChange(function (res) {
      console.log('BLEMannage--onBLEConnectionStateChange==', res.connected)

    })

    wx.onBLECharacteristicValueChange(function (res) {
			console.log("BLEMannage==接收到蓝牙回复的数据==", res);
      var receiveText = app.arrayBuffer2Hex(res.value)
      console.log('接收到数据：' + receiveText)
    })

  }

  closeBLEConnection(deviceId:string){
    wx.closeBLEConnection({
      deviceId: deviceId,
      success: function (res) {
        console.log('断开蓝牙', res);
      },
    })
  }
  onConnectedBle(deviceId:string, callback:((reuslt:boolean)=>void)){
    wx.createBLEConnection({
      deviceId: deviceId,
      success: function (res) {
        callback(true)
        //开始连接 并且保存设备
      },
      fail: function (res) {
        console.log(res)
        callback(false)
      }
    })
  }
}

//向蓝牙发送消息
/*
  currentConDevId:"",
  serveId:"",
  characteristicId_RX:"",
  characteristicId_TX:"",
*/
export function writeDataToBlLEDevice(hexStr:string){
   let deviceId = app.currentConDevId;
    let FA31 = app.characteristicId_TX;
		let FA32 = app.characteristicId_RX;
		let sId = app.serveId;


		if (that.data.connected) {
      
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
}
/*
  currentConDevId:"",
  serveId:"",
  characteristicId_RX:"",
  characteristicId_TX:"",
*/
//断开蓝牙

export function closeBLEConnection(deviceId:string){
  wx.closeBLEConnection({
    deviceId: deviceId,
    success: function (res) {
      console.log('断开蓝牙', res);
    },
  })
}


//添加监听
export function AddNotify(callBack:((result:boolean)=>void)) {
  wx.notifyBLECharacteristicValueChange({
    state: true,
    deviceId: app.currentConDevId,
    serviceId: app.serveId,
    characteristicId: app.characteristicId_TX,
    success: function (res) {
      callBack(true)
      console.log('启用notify成功')
    },
    fail: function (res) {
      callBack(false)
      console.log('启用notify失败---', res);
    }

  })
}

// 16进制字符串转ArrayBuffer
function hexStrToArrayBuffer(hexStr:string): ArrayBufferLike {
  // let hex_str = 'AA5504B10000B5'
  let typedArray = new Uint8Array(hexStr.match(/[\da-f]{2}/gi)!.map(function (h) {
    return parseInt(h, 16)
  }))
  let buffer = typedArray.buffer
  return buffer
}