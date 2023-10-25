// pages/ConnectedDevice/ConnectedDevice.ts
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

	},

	/**
	 * 组件的方法列表
	 */
	methods: {
    onLoad:function(){
      this.getStorageDeviceInfo()
    },
      addDev(){
        console.log("点击了添加设备");
        wx.navigateTo({url:'../AddDevice/AddDevice?'})
      },
      //event:any
      toDeviceDetails(){
        wx.navigateTo({url:'../DeviceDetails/DeviceDetails?'})
      },
      getConnectedDevices(){
        var that = this
        wx.getStorage({
          key: "deviceId",
          success(res) {
            console.log("wx.getStorage==-success", res.data);
            let tempList:any[] = [];
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
                  success: function (res:any) {
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
      //获取本地存储的设备信息
      getStorageDeviceInfo(){
        var that = this
        wx.getStorage({
          key: "connectedDeviceList",
          success(res) {
            console.log("wx.getStorage==-success", res.data);
          },
          fail(result){
            console.log("wx.getStorage==-fail", result);
          }
          
        })
      }
	}
})

/*
deviceid会发生变化 不可靠 但是已经存储的设备需要使用这个ID连接

那么advertisServiceUUIDs呢? 暂时定为他不会变

*/