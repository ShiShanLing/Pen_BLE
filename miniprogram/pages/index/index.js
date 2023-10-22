const app = getApp()
Page({
  data: {
    searching: false,
    devicesList: []
  },
  Search: function () {
    var that = this
    if (!that.data.searching) {
      wx.closeBluetoothAdapter({
        complete: function (res) {
          console.log(res)
          wx.openBluetoothAdapter({
            success: function (res) {
              console.log(res)
              wx.getBluetoothAdapterState({
                success: function (res) {
                  console.log(res)
                }
              })
              wx.startBluetoothDevicesDiscovery({
                allowDuplicatesKey: false,
                success: function (res) {
                  console.log(res)
                  that.setData({
                    searching: true,
                    devicesList: []
                  })
                }
              })
            },
            fail: function (res) {
              console.log('startBluetoothDevicesDiscovery error--', res)
              wx.showModal({
                title: '提示',
                content: '请检查手机蓝牙是否打开',
                showCancel: false,
                success: function (res) {
                  that.setData({
                    searching: false
                  })
                }
              })
            }
          })
        }
      })
    } else {
      wx.stopBluetoothDevicesDiscovery({
        success: function (res) {
          console.log(res)
          that.setData({
            searching: false
          })
        }
      })
    }
  },

	onCollPencli(event){
		
		var that = this
		console.log(event.currentTarget.dataset.device)//是个数组
		// wx.navigateTo({
		// 	url: '../characterList/characterList'
		// })
		// return;
		// let deviceId = "4DA926D6-0A9B-6C89-5B8D-CA5660D04C01";
		let devObjc = event.currentTarget.dataset.device
		let deviceId = devObjc.deviceId;
		console.log("deviceId==", deviceId);

		console.log("that.data.devicesList==", that.data.devicesList);

		//设备主服务ID
		

		wx.stopBluetoothDevicesDiscovery({
      success: function (res) {
        console.log(res)
        that.setData({
          searching: false
        })
      }
    })

		//e.currentTarget.id
    //开始链接
    wx.createBLEConnection({
      deviceId: deviceId,
      success: function (res) {
        console.log(res)
        wx.hideLoading()
        wx.showToast({
          title: '连接成功',
          icon: 'success',
          duration: 1000
				})
				if (devObjc.advertisServiceUUIDs?.length != 0){
					that.storageDeviceId(devObjc.advertisServiceUUIDs);
				}
				
        wx.navigateTo({
          url: '../characterList/characterList?connectedDeviceId=' + deviceId + '&name=' + "Pencli"
        })
      },
      fail: function (res) {
        console.log(res)
        wx.hideLoading()
        wx.showModal({
          title: '提示',
          content: '连接失败',
          showCancel: false
        })
      }
    })
	},
	storageDeviceId(deviceIds){
		console.log("storageDeviceId");
		wx.getStorage({
			key: "deviceId",
			success(res) {
				console.log("wx.getStorage==-success", res.data);
				let tempList = res.data
				if(tempList){
					for (const index in deviceIds) {
						const element = deviceIds[index];
						if (tempList.indexOf(element) == -1){
							tempList.push(element);
						}
					}
				}else{
					tempList = deviceIds
				}
				console.log("查看存储成功的设备--", tempList);
			
				
				wx.setStorage({
					key:'deviceId',
					data: tempList,
				})
			
			},
			fail(result){
				console.log("wx.getStorage==-fail", result);
				wx.setStorage({
					key:'deviceId',
					data: deviceIds,
				})
			}
			
		})
	
	
	},
  onLoad: function (options) {

		var that = this
    var list_height = ((app.globalData.SystemInfo.windowHeight - 50) * (750 / app.globalData.SystemInfo.windowWidth)) - 60
    that.setData({
      list_height: list_height
		})



    wx.onBluetoothAdapterStateChange(function (res) {
      console.log(res)
      that.setData({
        searching: res.discovering
      })
      if (!res.available) {
        that.setData({
          searching: false
        })
      }
    })
    wx.onBluetoothDeviceFound(function (devices) {
      //剔除重复设备，兼容不同设备API的不同返回值
      var isnotexist = true
      if (devices.deviceId) {
				console.log("11111");
        if (devices.advertisData) {
          devices.advertisData = app.buf2hex(devices.advertisData)
        } else {
          devices.advertisData = ''
				}
        console.log("devices.name==", devices.name)
        for (var i = 0; i < that.data.devicesList.length; i++) {
          if (devices.deviceId == that.data.devicesList[i].deviceId || devices.name.length == 0) {
            isnotexist = false
          }
        }
        if (isnotexist) {
          that.data.devicesList.push(devices)
        }
      } else if (devices.devices) {
				console.log("222222", devices.devices);
        if (devices.devices[0].advertisData) {
          devices.devices[0].advertisData = app.buf2hex(devices.devices[0].advertisData)
        } else {
          devices.devices[0].advertisData = ''
        }
        console.log(devices.devices[0])
        for (var i = 0; i < that.data.devicesList.length; i++) {
          if (devices.devices[0].deviceId == that.data.devicesList[i].deviceId || devices.devices[0].name.length == 0 || devices.devices[0].advertisServiceUUIDs?.length == 0) {
            isnotexist = false
          }
        }
        if (isnotexist) {
					if (devices.devices[0].name=="Pencil"){
						console.log("devices.devices[0]==", devices.devices[0]);
					}
          that.data.devicesList.push(devices.devices[0])
        }
      } else if (devices[0]) {
				console.log("333333");
        if (devices[0].advertisData) {
          devices[0].advertisData = app.buf2hex(devices[0].advertisData)
        } else {
          devices[0].advertisData = ''
        }
        console.log(devices[0])
        for (var i = 0; i < devices_list.length; i++) {
          if (devices[0].deviceId == that.data.devicesList[i].deviceId || devices.devices[0].name.length == 0) {
            isnotexist = false
          }
        }
        if (isnotexist) {
          that.data.devicesList.push(devices[0])
        }
      }
      that.setData({
        devicesList: that.data.devicesList
      })
		})
		wx.authorize({ scope: "scope.bluetooth" }) 

	},
	getConnectedDevices(){
		var that = this
		wx.getStorage({
			key: "deviceId",
			success(res) {
				console.log("wx.getStorage==-success", res.data);
				let tempList = [];
				for (const index in res.data) {
					const element = res.data[index];
					console.log("element==", element);
					if (element.length != 0){
						tempList.push(element);
					}
				}
				wx.openBluetoothAdapter({
					success: function (res) {
						console.log(res)
						wx.getConnectedBluetoothDevices({
							services: tempList,
							success (res) {
								that.setData({
									devicesList:res.devices
								})
								console.log("getConnectedBluetoothDevices-success==", res)
							},
							fail(error){
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
							success: function (res) {
								that.setData({
									searching: false
								})
							}
						})
					}
				})
		
			},
			fail(result){
				console.log("wx.getStorage==-fail", result);
			}
			
		})
		
	},
  onReady: function () {

  },
  onShow: function () {

  },
  onHide: function () {
    var that = this
    that.setData({
      devicesList: []
    })
    if (this.data.searching) {
      wx.stopBluetoothDevicesDiscovery({
        success: function (res) {
          console.log(res)
          that.setData({
            searching: false
          })
        }
      })
    }
  }
})

function TypedArrays(Type, Bin, begin, Num) {
  switch (Type) {
    case 0:
      return new Int8Array(Bin, begin, Num)[0];
    case 1:
      return new Uint8Array(Bin, begin, Num)[0];
    case 2:
      return new Int16Array(Bin, begin, Num)[0];
    case 3:
      return new Uint16Array(Bin, begin, Num)[0];
    case 4:
      return new Int32Array(Bin, begin, Num)[0];
    case 5:
      return new Uint32Array(Bin, begin, Num)[0];
    case 6:
      return new Float32Array(Bin, begin, Num)[0];
    case 7:
      return new Float64Array(Bin, begin, Num)[0];
    default:
      return -1;
  }
}

// hex转ArrayBuffer
function hexStrToBuf(arr) {
  var length = arr.length
  var buffer = new ArrayBuffer(length)
	// var dataview = new DataView(buffer)
	var dataIntView = new Uint8Array(buffer)
  for (let i = 0; i < length; i++) {
		// dataview.setUint8(i, '0x' + arr[i])
		dataIntView[i] = '0x' + arr[i]
	}

	console.log("Uint8Array==", dataIntView);
	// console.log("DataView==", dataview);
	console.log("buffer==", buffer);

  return dataIntView
}
// ArrayBuffer转16进度字符串示例
function abTohex(buffer) {
  const hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function (bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('')
}
//
var crc16 = function (buffer, len) {
  var crc = 0xFFFF;
  for (var pos = 0; pos < len; pos++) {
    var x = 0x0000;
    x = TypedArrays(1, buffer, pos, 1);
    crc ^= x // XOR byte into least sig. byte of crc
    for (var i = 8; i != 0; i--) // Loop over each bit
    {
      if ((crc & 0x0001) != 0) // If the LSB is set
      {
        crc >>= 1; // Shift right and XOR 0xA001
        crc ^= 0xA001;
      } else // Else LSB is not set
      {
        crc >>= 1; // Just shift right
      }

    }
  } //高低字节转换

  return crc;
}


function CRC16func(AllDATA) {
	var cnCRC_CCITT = 0x1021;
	var i = -1,
		j = -1;
	var nData = -1,
		nAccum = -1,
		nYAccum = -1;
	var Table_CRC = [];
	var aSize = AllDATA.length;
	for (i = 0; i  <  256; i++) {
		nData = C16func.call(this, i, 8); 
		nAccum = 0;
		for (j = 0; j  <  8; j++) { 
			if ((nData ^ nAccum) & 0x8000) { 
				nAccum = C16func.call(this, nAccum, 1); 
				nAccum = nAccum ^ cnCRC_CCITT; 
			} else { 
				nAccum = C16func.call(this, nAccum, 1); 
				nAccum = nAccum;
			}
			nData = C16func.call(this, nData, 1); 
		}
		Table_CRC[i] = nAccum;
	} 
	nAccum = 0;
	for (i = 0; i  <  aSize; i++) { 
		nYAccum = nAccum; 
		nAccum = C16func.call(this, nAccum, 8); 
		nAccum = nAccum ^ Table_CRC[(nYAccum  >>> 8) ^ (AllDATA[i])];//数组
		// nAccum = nAccum ^ Table_CRC[(nYAccum  >>> 8) ^ (AllDATA.charCodeAt(i))];//字符串
	} 
	return  nAccum.toString(16).toUpperCase();
}


function  C16func(cData, cLen) { 
	if (((cData  <<  cLen).toString(2).length  >  16) && (cData.toString(2).length  <=  16)) { 
		cData = (cData  <<  cLen).toString(2).substr((cData  <<  cLen).toString(2).length - 16, 16); 
		cData = parseInt(cData, 2);
	} else { 
		cData = cData  <<  cLen;
	}
	return  cData; 
}

//16进制转10进制