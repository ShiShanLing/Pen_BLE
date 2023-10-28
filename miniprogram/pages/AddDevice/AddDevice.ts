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
    devicesList: [] as any[],
    searchTime:0 as any
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
        // console.log("onBluetoothDeviceFound==", devices);
        
        //剔除重复设备，兼容不同设备API的不同返回值
        var isnotexist = true
       if (devices.devices.length) {
          if (devices.devices[0].advertisData) {
            devices.devices[0].advertisData = app.buf2hex(devices.devices[0].advertisData)
          } else {
            devices.devices[0].advertisData = ''
          }
          //判断列表中有没有当前设备
          for (var i = 0; i < that.data.devicesList.length; i++) {
     
            
            if (devices.devices[0].deviceId == that.data.devicesList[i].deviceId) {
     
              isnotexist = false
              break;
            }
            if(!devices.devices[0].name?.length){
              console.log("222222222222222");
              isnotexist = false
              break;
            }
            
            if(!devices.devices[0].advertisServiceUUIDs?.length){
      
              isnotexist = false
              break;
            }
          }
          
 
          //如果列表中没有 再判断 advertisServiceUUIDs 中有没有想要的设备 
          if(devices.devices[0].advertisServiceUUIDs?.length && isnotexist){
            let advertisServiceUUIDs = devices.devices[0].advertisServiceUUIDs
            for (const index in advertisServiceUUIDs) {
              const serviceUUID = advertisServiceUUIDs[index];
              //找到 FA30就添加设备 停止循环
              if (serviceUUID.indexOf('FA30') != -1){
                console.log("devices.devices[0]", devices.devices[0]);
                devices.devices[0].advertisServiceUUIDs = [serviceUUID]
                that.data.devicesList.push(devices.devices[0])
                break;
              }
            }
          }else if(devices.devices[0].name=="Pencil"&&!devices.devices[0].advertisServiceUUIDs?.length){
            //到了这里说明没有advertisServiceUUIDs需要重新搜索
            console.log("advertisServiceUUIDs", devices.devices[0]);
            that.stopSearchBLEDevices();
            that.beginSearch();
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
       that.data.searchTime = setTimeout(()=>{
        that.stopSearchBLEDevices()
        },15000)
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
        clearTimeout(that.data.searchTime);
       that.stopSearchBLEDevices()
      }
		},
		//我想要的不只是一个id而是整个设备对象
    onCollPencli(e:any){
      wx.showLoading({
        title: '正在连接...',
      })
			let self = this;
			// let deviceId = "4DA926D6-0A9B-6C89-5B8D-CA5660D04C01";
      let index = e.currentTarget.id;
      let deviceObjc = this.data.devicesList[index]; 
      let deviceId = deviceObjc.deviceId;
      console.log("deviceObjc==", deviceObjc);
      // self.storageDeviceInfo(deviceObjc)
      // return;
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
          app.currentConDevId = deviceId;
					self.storageDeviceInfo(deviceObjc)
          //开始连接 并且保存设备
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
    stopSearchBLEDevices(){
      let that = this;
      wx.stopBluetoothDevicesDiscovery({
        success: function (res) {
          console.log(res)
          that.setData({
            searching: false
          })
        }
      })
		},
		//这里需要写一个测试数据--测试存储是否正常-每次进入页面都删除
    storageDeviceInfo(device:any){
			console.log("storageDeviceId", device);
			let self = this;
			//这里需要直接存储对象--
      wx.getStorage({
        key: "deviceList",
        success(res) {
          console.log("wx.getStorage==-success", res.data);
          let tempList:any[] = res.data
          let isHave = false;
          let newList = [...tempList];
          if(tempList as any[]){
            for (const key in newList) {
              const element = newList[key];
                if (element.deviceId == device.deviceId){
                  isHave = true;
                }
            }
            if (!isHave){
              newList.push(device);
            }
          }else{
            newList = [device];
          }
          console.log("查看存储成功的设备--", tempList, newList);
          if (tempList.length != newList.length){
            wx.setStorage({
              key:'deviceList',
              data: tempList,
              success:function(){
                console.log("存储成功");
                self.stopSearchBLEDevices();
                // 存储成功
                wx.navigateBack();
              }
            })
          }else{
            self.stopSearchBLEDevices();
            // 设备已存在
            wx.navigateBack();
          }
 
        },
        fail(result){
					//如果读取失败那就是空的
          console.log("wx.getStorage==-fail", result);
          wx.setStorage({
            key:'deviceList',
						data: [device],
						success:function(){
              console.log("存储成功");
              // 存储成功
              self.stopSearchBLEDevices();
							wx.navigateBack();
						},
          })
        }
        
      })
    
    
    },
	}
})