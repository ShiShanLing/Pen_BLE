export class BLEMannage {

  constructor() {
    console.log("BLEMannage---init");

    wx.onBLEConnectionStateChange(function (res) {
      console.log('BLEMannage--onBLEConnectionStateChange==', res.connected)

    })
    let self = this;
    wx.onBLECharacteristicValueChange(function (res) {
      console.log("BLEMannage==接收到蓝牙回复的数据==", res);
      var receiveText = arrayBuffeTo2HexStr(res.value)
      console.log('接收到数据：' + receiveText)
      if (self.bleReceiveValue) {
        self.bleReceiveValue(receiveText);
      }
    })
  }
  //蓝牙接收到新消息后的回调
  bleReceiveValue: ((result: string) => void) | undefined;
  //断开蓝牙
  closeBLEConnection(deviceId: string) {
    wx.closeBLEConnection({
      deviceId: deviceId,
      success: function (res) {
        console.log('断开蓝牙', res);
      },
    })
  }
  //连接蓝牙
  onConnectedBle(deviceId: string, callback: ((reuslt: boolean) => void)) {
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
  //走完说明获取完毕
  getDeviceServeIdAndCharacteristicId(deviceId: string, callback: ((serveId: string, RX: string, TX: string) => void)) {
    console.log("开始获取特征id", deviceId);

    wx.getBLEDeviceServices({
      deviceId: deviceId,
      success: function (res) {
        let tempSers = res.services
        let newList: any[] = [];
        let serveId = ""
        for (let index = 0; index < tempSers.length; index++) {
          if (tempSers[index].uuid.indexOf('FA30') != -1) {
            serveId = tempSers[index].uuid
            break;
          }
        }
        console.log("serveId===", serveId);

        if (serveId.length) {
          wx.getBLEDeviceCharacteristics({
            deviceId: deviceId,
            serviceId: serveId,
            success: function (res) {
              //获取到设备列表
              console.log("getBLEDeviceCharacteristics:", res.characteristics)
              let RX = "";
              let TX = ""
              res.characteristics.forEach((value) => {

                if (value.uuid.indexOf("FA32") != -1) {
                  RX = value.uuid
                }

                if (value.uuid.indexOf("FA31") != -1) {
                  TX = value.uuid
                }

              })
              if (TX.length && RX.length) {
                callback(serveId, RX, TX);
              }

            }
          })
        }
        for (let index = 0; index < newList.length; index++) {
          const element = newList[index];
        }
      },
      fail: function (error) {
        console.log("getBLEDeviceServices-error==", error);
      }
    })
  }
  //给蓝牙写入数据
  writeDataToBlLEDevice(hexStr: string, deviceId: string, serviceId: string, characteristicId: string) {

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

    // let dqdl = "A1211001030C0100000000000000000000000011"
    // 15+22+3
    //获取强度比
    // let dqdl = "A125000000000000000000000000000000000000"
    //设置强度比
    // let dqdl = "A124000900000000000000000000000000000009"
    //读取电量
    // let dqdl = 'A103000000000000000000000000000000000000'
    //读取按钮功能
    // let dqdl = "A122000100000000000000000000000000000000"
    // console.log("dqdl===", dqdl);
    let bufferArray = hexStrToArrayBuffer(hexStr)
    console.log("bufferArray==", bufferArray);
    wx.writeBLECharacteristicValue({
      deviceId: deviceId,
      serviceId: serviceId,
      characteristicId: characteristicId,
      value: bufferArray,
      success: function (res) {
        console.log('test_dataView发送成功', res)
      },
      fail: function (error) {
        console.log("test_dataView发送失败", error);
      }
    })

  }
  //添加监听
  //添加监听
  AddNotify(deviceId: string, serviceId: string, characteristicId: string, callBack: ((result: boolean) => void)) {
    wx.notifyBLECharacteristicValueChange({
      state: true,
      deviceId: deviceId,
      serviceId: serviceId,
      characteristicId: characteristicId,
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
  //获取到存储的可已连接的设备
  getConnectedDevices(callback:((result:any[])=>void)) {
    var self = this
    wx.getStorage({
      key: "deviceList",
      success(res) {
        console.log("wx.getStorage==-success", res.data);
        let storageDeviceList = res.data;
        let deviceIds: string[] = [];
        for (const index in storageDeviceList) {
          const element = storageDeviceList[index];
          element.advertisServiceUUIDs.forEach((serviceUUID: any) => {
            deviceIds.push(serviceUUID)
          });
        }
        // console.log("deviceIds==", deviceIds);
        wx.openBluetoothAdapter({
          success: function (res) {
            console.log(res)
            wx.getConnectedBluetoothDevices({
              services: deviceIds,
              success(res) {
                let newData:any[] = []
                let ids = res.devices.map((dev) => {
                  return dev.deviceId;
                })
                //只有已连接的设备才展示在列表中
                storageDeviceList.forEach((dev:any)=>{
                  if(ids.includes(dev.deviceId)){
                    newData.push(dev)
                  }
                })
                callback(newData)
                // console.log('获取到的可连接的设备---', newData);
              },
              fail(error) {
                console.log("getConnectedBluetoothDevices-error==", error);
              }
            })
          },
          fail: function (res) {
            console.log('startBluetoothDevicesDiscovery error--', res)
            wx.showModal({
              title: '提示',
              content: '请检查手机蓝牙是否打开',
              showCancel: false,
              success: function (res: any) {
                self.setData({
                  searching: false
                })
              }
            })
          }
        })

      },
      fail(result) {
        console.log("wx.getStorage==-fail", result);
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
// 16进制字符串转ArrayBuffer
function hexStrToArrayBuffer(hexStr: string): ArrayBufferLike {
  // let hex_str = 'AA5504B10000B5'
  let typedArray = new Uint8Array(hexStr.match(/[\da-f]{2}/gi)!.map(function (h) {
    return parseInt(h, 16)
  }))
  let buffer = typedArray.buffer
  return buffer
}

function arrayBuffeTo2HexStr(buffer: any) {
  const hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function (bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('')
}