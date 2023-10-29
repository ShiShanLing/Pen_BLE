// pages/ConnectedDevicePage.ts
const app = getApp()
import {BLEMannage } from "../../BLEMannage"
import SystemInfoUtil from "../../tools";
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
    deviceList: [] as any[],
    //如果离开了当前页面就不再接受通知,
    isHidePages: true,
    bleMannage: {} as BLEMannage,
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad() {
    console.log("SystemInfoUtil.platform==", SystemInfoUtil.platform);
    
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

	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady() {

	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow() {
     let value = '3a'
    

      let numValue =  parseInt(value, 16)
      numValue = numValue < 10 ? 10:numValue;
      numValue = numValue > 90 ? 90:numValue;
      console.log("numValue==", numValue);
    this.setData({
      isHidePages: false
    })
    let self = this;
    this.setData({
      bleMannage: new BLEMannage()
    })
    this.data.bleMannage.bleReceiveValue = function (value) {
      console.log("bleReceiveValue-回调--", value);
        let hexStr = value
        if (hexStr.length < 40) {
          //不是我想要的数据
          return;
        }
        let hexStrList = hexStr.match(/[\da-f]{2}/gi)!
        console.log("hexStrList===", hexStrList);
        if (hexStrList.length != 20) {
          //不是我想要的数据
          return;
        }
        //获取当前连接的设备设置他的电量和充电状态
        //充电状态
        if (hexStr.indexOf("a103") != -1) {
          let Battery = parseInt(hexStrList[3], 16);
        let state = hexStrList[4];
        console.log(Battery, state);
        let newList = [...self.data.deviceList];
        newList.forEach((dev) => {
          if (dev.deviceId == app.currentConDevId) {
            dev["battery"] = Battery + '%'
            dev["chargingState"] =  Number(state) == 1 ?"充电中":"未充电"
          }
        })
        
        self.setData({
          deviceList:newList
        })
        console.log("获取到电量", self.data.deviceList);
   
        }


      //获取当前连接的设备设置他的电量和充电状态
      if (hexStrList.length == 20) {
       
      
        
      }
    }
    this.refreshData()
   
	},

	/**
	 * 生命周期函数--监听页面隐藏
	 */
	onHide() {
    this.setData({
      isHidePages: true
    })
	},

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload() {

	},

	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
	onPullDownRefresh() {

	},

	/**
	 * 页面上拉触底事件的处理函数
	 */
	onReachBottom() {

	},

	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage() {

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
    app.pushDetialsDevice = item;
    wx.navigateTo({ url: `../DeviceDetailsPage/DeviceDetailsPage`})
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
        console.log("self.data.deviceList==", self.data.deviceList);
        
        self.data.deviceList.forEach((dev)=>{
          console.log("dev.deviceId==", dev.deviceId, '----', devId);
          
          if (dev.deviceId == devId){
            dev["isConnection"] = true;
          }else{
            dev["isConnection"] = false;
          }
        })
        console.log("连接成功查看数据", self.data.deviceList);
        self.setData({
          deviceList:self.data.deviceList
        })
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
  },
  refreshData(){
    let self = this;
    // wx.showLoading({
    //   title:"正在获取数据"
    // })
    // wx.hideLoading()
    this.data.bleMannage.getConnectedDevices((devices)=>{
      //当前正在连接的设备也可能变了
      //这里不能直接覆盖 回来后可能新增了可能删除了-但是状态要记住-还有电量
      //获取到正在连接的获取他的信息
   
      self.setData({
        deviceList: devices
      })
      
      if (app.currentConDevId.length){
        self.onConnectingToDevice(app.currentConDevId)
      }
    })
  }

  

})