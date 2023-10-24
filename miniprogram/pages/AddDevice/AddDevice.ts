// pages/AddDevice/AddDevice.ts

import SystemInfoUtil from "../../tools";
const app = getApp()
Component({

	/**
	 * 组件的属性列表
	 */
	properties: {
    
	},

	/**
	 * 组件的初始数据
	 */
	data: {
    searching: false,
    devicesList: [] as any[]
	},
  
	/**
	 * 组件的方法列表
	 */
	methods: {
    onLoad:function(){
      console.log("AddDevice-onLoad");
      var that = this
      //添加蓝牙状态变更监听
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
      //找到蓝牙设备回调
      wx.onBluetoothDeviceFound(function (devices:any) {
        //获取到设备开始获取服务ID
        //剔除重复设备，兼容不同设备API的不同返回值
        var isnotexist = true
        if (devices.deviceId) {
          if (devices.advertisData) {
            devices.advertisData = app.buf2hex(devices.advertisData)
          } else {
            devices.advertisData = ''
          }
          console.log(devices)
          for (var i = 0; i < that.data.devicesList.length; i++) {
            if (devices.deviceId == (that.data.devicesList[i] as any).deviceId) {
              isnotexist = false
            }
          }
          if (isnotexist) {
            //在这里获取服务uuid
            that.data.devicesList.push(devices)
          }
        } else if (devices.devices) {
          if (devices.devices[0].advertisData) {
            devices.devices[0].advertisData = app.buf2hex(devices.devices[0].advertisData)
          } else {
            devices.devices[0].advertisData = ''
          }
          console.log(devices.devices[0])
          for (var i = 0; i < that.data.devicesList.length; i++) {
            if (devices.devices[0].deviceId == that.data.devicesList[i].deviceId) {
              isnotexist = false
            }
           
          }
          if (isnotexist) {
            //在这里获取服务uuid
            that.data.devicesList.push(devices.devices[0])
          }
        } else if (devices[0]) {
          if (devices[0].advertisData) {
            devices[0].advertisData = app.buf2hex(devices[0].advertisData)
          } else {
            devices[0].advertisData = ''
          }
          console.log(devices[0])
          for (var i = 0; i < that.data.devicesList.length; i++) {
            if (devices[0].deviceId == that.data.devicesList[i].deviceId) {
              isnotexist = false
            }
          }
          if (isnotexist) {
            //在这里获取服务uuid
            that.data.devicesList.push(devices[0])
          }
        }
        that.setData({
          devicesList: that.data.devicesList
        })
      })
      console.log("SystemInfoUtil.platform==", SystemInfoUtil.platform);
      if (SystemInfoUtil.platform == "android"){
        wx.authorize({scope:""})
        wx.getLocation({
          type: 'gcj02', //默认为 wgs84 返回 gps 坐标，gcj02 返回可用于wx.openLocation的坐标
          success: (res) => {
            console.log(res)
          },
          fail: (err) => {
            console.log(err)
          }
        })

      }
      //申请蓝牙权限
      wx.authorize({ scope: "scope.bluetooth" }) 
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
    },
    //开始搜索
    beginSearch: function () {
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
                    console.log("startBluetoothDevicesDiscovery==", res)
                    that.setData({
                      searching: true,
                      devicesList: []
                    })
                  }
                })
              },
              fail: function (res) {
                console.log("startBluetoothDevicesDiscovery==fail", res)
                wx.showModal({
                  title: '提示',
                  content: '请检查手机蓝牙和定位是否打开',
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
    onCollPencli(e:any){
      // let deviceId = "4DA926D6-0A9B-6C89-5B8D-CA5660D04C01";
      let deviceId = e.currentTarget.id;
      console.log("deviceId==", deviceId);
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
          wx.navigateTo({
            url: '../device/device?connectedDeviceId=' + deviceId + '&name=' + "Pencli"
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
	}
})