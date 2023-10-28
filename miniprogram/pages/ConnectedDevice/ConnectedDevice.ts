// pages/ConnectedDevice/ConnectedDevice.ts
const app = getApp()
import {AddNotify, closeBLEConnection, BLEMannage} from "../../BLEMannage"
import SystemInfoUtil from "../../tools";
Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },
  pageLifetimes: {
    show: function() {
      this.setData({
        isHidePages:false
      })
      // 页面被展示
    },
    hide: function() {
      this.setData({
        isHidePages:true
      })
      // 页面被隐藏
    },
  },
  /**
   * 组件的初始数据
   */
  data: {
    deviceList: [] as any[],
    //已连接设备id
    connectedDeviceIds:[] as string[],
    //如果离开了当前页面就不再接受通知,
    isHidePages:true,
    
    },

  /**
   * 组件的方法列表
   */
  methods: {
    onLoad: function () {
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
      let self = this;
      this.getConnectedDevices()
      //添加蓝牙状态变更监听
      wx.onBLEConnectionStateChange(function (res) {
        console.log('onBLEConnectionStateChange==', res)
        self.setData({
          connected: res.connected
        })
        self.getConnectedDevices();
      })
      wx.onBLECharacteristicValueChange(function (res) {
        if (!self.data.isHidePages){
          console.log("接收到的原始数据==", res);
          var receiveText = app.arrayBuffer2Hex(res.value)
          console.log('接收到数据：' + receiveText)
        }
      })
    },
    onRefresh:function(){
      //导航条加载动画
    wx.showNavigationBarLoading()
    //loading 提示框
    wx.showLoading({
      title: 'Loading...',
    })
    console.log("下拉刷新啦");
    setTimeout(function () {
      wx.hideLoading();
      wx.hideNavigationBarLoading();
      //停止下拉刷新
      wx.stopPullDownRefresh();
    }, 2000)
    },
    //添加设备
    onAddDevice:function(){
      wx.navigateTo({ url: '../AddDevice/AddDevice?' })
    },
    //event:any
    toDeviceDetails() {
      console.log("跳转详情");
      
      // wx.navigateTo({ url: '../DeviceDetails/DeviceDetails?' })
    },
    getConnectedDevices() {
      var self = this
      wx.getStorage({
        key: "deviceList",
        success(res) {
          console.log("wx.getStorage==-success", res.data);
          self.setData({
            deviceList: res.data
          })
          /*
          获取到存储的设备信息
          查看设备信息有没有 服务id和特征id
          如果没有就立即获取
          */
          
          //获取存储的设备列表
          let deviceIds:string[] = [];
          for (const index in res.data) {
            const element = res.data[index];
            element.advertisServiceUUIDs.forEach((serviceUUID:any) => {
              deviceIds.push(serviceUUID)
            });

          }
          

          console.log("deviceIds==", deviceIds);
          
          wx.openBluetoothAdapter({
            success: function (res) {
              console.log(res)
              self.getDeviceServeIdAndCharacteristicId();
              wx.getConnectedBluetoothDevices({
                services: deviceIds,
                success(res) {
                  let newData = self.data.deviceList
                  let ids = res.devices.map((dev)=>{
                    
                    return dev.deviceId;
                  })
                  self.setData({
                    deviceList: newData
                  })
                  console.log("getConnectedBluetoothDevices-success==", res)
                  console.log(self.data.deviceList);
                  
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

    },
    //获取本地存储的设备信息
    getStorageDeviceInfo() {
      var that = this
      wx.getStorage({
        key: "deviceList",
        success(res) {
          console.log("wx.getStorage==-success", res.data);
        },
        fail(result) {
          console.log("wx.getStorage==-fail", result);
        }

      })
    },
    getDeviceConnectedState(diviceId:string):boolean{
     console.log("getDeviceConnectedState");
     
      return  diviceId == app.currentConDevId;
    },
    //获取设备服务id和特征id
    getDeviceServeIdAndCharacteristicId(){
      console.log("开始获取特征id", this.data.deviceList);
        let self = this;
        if (app.currentConDevId && !(app.characteristicId && app.serveId)){
          //如果有已连接的设备但是 特征和服务id都是空的
          console.log("/如果有已连接的设备但是 特征和服务id都是空的");
          wx.getBLEDeviceServices({
            deviceId: app.currentConDevId,
            success: function (res) {
              let tempSers = res.services
              let newList:any[] = [];
              for (let index = 0; index < tempSers.length; index++) {
                if (tempSers[index].uuid.indexOf('FA30') != -1){
                  app.serveId = tempSers[index].uuid
                } 
              }
              if (app.serveId){
                wx.getBLEDeviceCharacteristics({
                  deviceId: app.currentConDevId,
                  serviceId:app.serveId,
                  success: function (res) {
                    //获取到设备列表
                    console.log("getBLEDeviceCharacteristics:", res.characteristics)
                    res.characteristics.forEach((value)=>{
                      if (value.uuid.indexOf("FA32") != -1){
                        app.characteristicId_RX = value.uuid
                      }
                      if (value.uuid.indexOf("FA31") != -1){
                        app.characteristicId_TX = value.uuid
                      }
                      if (app.characteristicId_TX.length && app.characteristicId_RX.length){
                          AddNotify((result)=>{
                            if (result){
                              //获取电量
                              
                            }
                          })
                      }
                    })

                  }
                })
              }
              for (let index = 0; index < newList.length; index++) {
                const element = newList[index];
              }
            },
            fail:function(error){
              console.log("getBLEDeviceServices-error==", error);
            }
          })
        }else if(app.currentConDevId && app.characteristicId && app.serveId){
          //如果都有
        }
    },
    onClickSwitchBLEState(event:any){
      let devId = event.currentTarget.dataset.devid;
      for (const index in  this.data.deviceList) {
        let device = this.data.deviceList[index];
        if (device.deviceId == devId){
          device["isConnection"] = true;
        }else{
          if (device["isConnection"] == true){

          }
        }
      }
      this.data.deviceList.forEach((value:any)=>{
        if (value.deviceId == devId){
          value["isConnection"] = true;
        }else{
          value["isConnection"] = false;
        }
      })
      console.log("event==", event);
     console.log("devId", devId);
          this.onConnectedBle(devId);
    },
    onConnectedBle(deviceId:string){
      let self = this;
      wx.showLoading({
        title: '正在连接...',
      })
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
          let tempList = self.data.deviceList;
          tempList.forEach((value:any)=>{
            if (value.deviceId == deviceId){
              value["isConnection"] = true;
            }else{
              value["isConnection"] = false;
            }
          })

          app.currentConDevId = deviceId;
          self.getDeviceServeIdAndCharacteristicId();
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
    }

  }
})

/*
deviceid会发生变化 不可靠 但是已经存储的设备需要使用这个ID连接

那么advertisServiceUUIDs呢? 暂时定为他不会变
添加的数据结构
[{
  name:"",
  divId:"",
  advertisServiceUUIDs:serid
}]
RSSI: -53
advertisData: ""
advertisServiceUUIDs: Array(2)
connectable: true
deviceId: "4DA926D6-0A9B-6C89-5B8D-CA5660D04C01"
localName: "Pencil"
name: "Pencil"
*/