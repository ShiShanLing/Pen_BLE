// pages/ConnectedDevice/ConnectedDevice.ts
const app = getApp()
import {BLEMannage } from "../../BLEMannage"
import SystemInfoUtil from "../../tools";
Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },
  pageLifetimes: {
    show: function () {
      this.setData({
        isHidePages: false
      })
      // 页面被展示
    },
    hide: function () {
      this.setData({
        isHidePages: true
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
    connectedDeviceIds: [] as string[],
    //如果离开了当前页面就不再接受通知,
    isHidePages: true,
    bleMannage: {} as BLEMannage,
    currentConDevId:app.currentConDevId
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onLoad: function () {
      if (SystemInfoUtil.platform == "android") {
        wx.authorize({ scope: "" })
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
      //添加蓝牙状态变更监听
      wx.onBLEConnectionStateChange(function (res) {
        console.log('onBLEConnectionStateChange==', res)
        self.setData({
          connected: res.connected
        })
      })
      wx.openBluetoothAdapter({
        success:function(result){
          console.log("openBluetoothAdapter-成功");
        },
        fail:function(error){
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
          console.log("openBluetoothAdapter-失败");
        }
      });
    },
    onShow: function () {

      let self = this;
      this.setData({
        bleMannage: new BLEMannage()
      })
      this.data.bleMannage.bleReceiveValue = function (value) {
        console.log("bleReceiveValue-回调--", value);
        let hexStr = value
        let hexStrList = hexStr.match(/[\da-f]{2}/gi)!
          console.log("hexStrList===", hexStrList);
        //获取当前连接的设备设置他的电量和充电状态
        if (hexStrList.length == 20) {
         
          let Battery = hexStrList[3];
          let state = hexStrList[4];
          console.log(Battery, state);
          let newList = [...self.data.deviceList];
          newList.forEach((dev) => {
            if (dev.deviceId == app.currentConDevId) {
              dev["battery"] = Number(Battery) + '%'
              dev["chargingState"] =  Number(state) == 1 ?"充电中":"未充电"
            }
          })
          
          self.setData({
            deviceList:newList
          })
          console.log("获取到电量", self.data.deviceList);
          
        }
      }
      this.data.bleMannage.getConnectedDevices((devices)=>{
        //当前正在连接的设备也可能变了
        //这里不能直接覆盖 回来后可能新增了可能删除了-但是状态要记住-还有电量
        //获取到正在连接的获取他的信息
        self.onConnectingToDevice(app.currentConDevId)
        self.setData({
          deviceList: devices
        })
      })
    },
    //跳转到添加设备页面
    onAddDevice: function () {
      wx.navigateTo({ url: '../AddDevice/AddDevice?' })
    },
    //跳转到详情页面
    toDeviceDetails(event:any) {
      console.log("跳转详情");
      let item = event.currentTarget.dataset.item;
      console.log("item==", item);
      wx.navigateTo({ url: `../DeviceDetails/DeviceDetails?deviceInfo=${item}` })
    },
    //点击cell中的开启或者关闭蓝牙按钮
    onClickSwitchBLEState(event: any) {
      //这里需要考虑断开连接的逻辑
      let self = this;
      let devId = event.currentTarget.dataset.devid;
      let isConnection = event.currentTarget.dataset.connection;
      console.log("this.data.bleMannage===", this.data.bleMannage);

      //如果是已连接状态那么需要断开连接
      if (isConnection) {
        //如果已连接那么久断开
        this.data.bleMannage.closeBLEConnection(devId)
        app.currentConDevId = ""
        self.data.deviceList.forEach((dev)=>{
          dev["isConnection"] = false;
        })
        console.log("self.data.deviceLis=", self.data.deviceList);
        self.setData({
          deviceList:self.data.deviceList
        })
        return;
      }
      console.log("event==", event);
      console.log("devId", devId);

      self.onConnectingToDevice(devId);

    },
    //连接到设备
    onConnectingToDevice(deviceId:string){
      let devId = deviceId
      let self = this;
      wx.showLoading({
        title: '正在连接...',
      })
      self.data.bleMannage.onConnectedBle(devId, ((result) => {
        wx.hideLoading()
        if (result) {
          wx.showToast({
            title: '连接成功',
            icon: 'success',
            duration: 1000
          })
          app.currentConDevId = devId;
          self.data.deviceList.forEach((dev)=>{
            if (dev.deviceId == devId){
              dev["isConnection"] = true;
            }else{
              dev["isConnection"] = false;
            }
          })
          console.log("连接成功查看数据", self.data.deviceList);
          
          //获取连接设备的服务id和特征id

          /*
            currentConDevId:"",
  serveId:"",
  characteristicId_RX:"",
  characteristicId_TX:"",
          */
          self.data.bleMannage.getDeviceServeIdAndCharacteristicId(devId, ((serveId: string, RX: string, TX: string) => {
            console.log('获取特征ID成功--', `serveId=${serveId}  RX==${RX} TX==${TX}`);
            app.serveId = serveId;
            app.characteristicId_RX = RX;
            app.characteristicId_TX = TX;
            //获取电量前要添加监听
            //这里要获取电量
            self.data.bleMannage.AddNotify(app.currentConDevId, app.serveId, app.characteristicId_RX, ((result) => {
              if (result) {
                self.data.bleMannage.writeDataToBlLEDevice("A103000000000000000000000000000000000000", app.currentConDevId, app.serveId, app.characteristicId_TX)
              }
            }))

          }))

        } else {
          wx.showModal({
            title: '提示',
            content: '连接失败',
            showCancel: false
          })
        }
      }))
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