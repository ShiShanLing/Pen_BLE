// pages/DeviceDetailsPage/DeviceDetailsPage.ts
const app = getApp()
import {BLEMannage } from "../../BLEMannage"
import SystemInfoUtil from "../../tools";
Page({
  /**
   * 页面的初始数据
   */
  data: {
    deviceInfo: {} as any,
    columns: ['杭州', '宁波', '温州', '嘉兴', '湖州'],
    isShowPicker: false,
    nibStrength:'--',
    //数据类型 key:1 上键 2下键, func:1 单击 2双击 3长按
    settingType: {} as { key: number, interactive: number },
    pickerTitle: "",
    //当前上按键功能 展示用-设置成功后需要刷新 如果是-1说明没拉取到按键功能
    currentTopKey: { click: -1, doubleClick: -1, longPress: -1 },
    //需要修改的上按键功能 用于上传数据
    toTopKey: { click: -1, doubleClick: -1, longPress: -1 },
    //当前下按键功能 展示用-设置成功后需要刷新
    currentBottomKey: { click: -1, doubleClick: -1, longPress: -1 },
    //需要修改的下按键功能 用于上传数据
    toBottomKey: { click: -1, doubleClick: -1, longPress: -1 },
    bleMannage: {} as BLEMannage,
    funcList:[
      'HOME键',
      '电源键',
      '亮度+',
      '亮度-',
      '任务栏',
      '音量+',
      '音量-',
      '上一页',
      '下一页',
      '静音',
      '搜索',
      '拍照',
      '快速截屏',
      '编辑截屏',
      '撤销',
      '笔/橡皮檫切换',
      '全屏',
      '黑屏',
      '播放/暂停',
      '上一曲',
      '下一曲',
      '快速添加分页（快速创建笔记）',
      ' 添加（移除）尺子',
      '快速创建语言转文字备忘录',
      '无功能',
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options: any) {
    this.setData({
      deviceInfo: app.pushDetialsDevice
    })
    console.log("this.data.deviceInfo==", this.data.deviceInfo);

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
    let self = this;

    console.log("self.properties.deviceInfo==", self.data.deviceInfo);
    this.setData({
      bleMannage: new BLEMannage()
    })
    this.data.bleMannage.bleReceiveValue = function (value) {
      console.log("bleReceiveValue-回调--", value);
      let hexStr = value
      if (hexStr.length < 40){
        //不是我想要的数据
        return;
      }
      let hexStrList = hexStr.match(/[\da-f]{2}/gi)!
      console.log("hexStrList===", hexStrList);
      if (hexStrList.length != 20){
        //不是我想要的数据
        return;
      }
      //获取当前连接的设备设置他的电量和充电状态
      //充电状态
      if (hexStr.indexOf("a103") != -1){
        //电量和充电状态
        console.log("获取到电量",hexStrList);
        let Battery = hexStrList[3];
        let state = hexStrList[4];
        console.log(Battery, state);
        self.data.deviceInfo["battery"] = Number(Battery) + '%';
        self.data.deviceInfo["chargingState"] =  Number(state) == 1 ?"充电中":"未充电"
        self.setData({
          deviceInfo:self.data.deviceInfo
        })
        console.log("获取到电量",self.data.deviceInfo);
      }else if (hexStr.indexOf("a125") != -1){
        //笔尖强度比
        console.log("获取到笔尖强度比",self.data.deviceInfo);
        let value = hexStrList[3];
        self.setData({
          nibStrength:`${Number(value)}`
        })
        // a125100000000000000000000000000000000000
      }else if (hexStr.indexOf("a122") != -1){
        console.log("获取到按键类型",self.data.deviceInfo);
        //按键类型
        if (hexStrList[3] == '01'){//下
         let one = '0x' + hexStrList[4];
         one = eval(one).toString(10)
         let two = '0x' + hexStrList[5];
         two = eval(two).toString(10)
         let long = '0x' + hexStrList[6]
         long = eval(long).toString(10)
         console.log(`01---- 单击=${one} 双击=${two} 长按=${long}`);
         self.setData({
           currentBottomKey:{ click: Number(one), doubleClick: Number(two), longPress: Number(long) },
         });

 
    //当前下按键功能 展示用-设置成功后需要刷新
    // currentBottomKey: { click: -1, doubleClick: -1, longPress: -1 },
         
        }else if (hexStrList[3] == '00'){//上
          let one = '0x' + hexStrList[4];
          one = eval(one).toString(10)
          let two = '0x' + hexStrList[5];
          two = eval(two).toString(10)
          let long = '0x' + hexStrList[6]
          long = eval(long).toString(10)
          console.log(`02---- 单击=${one} 双击=${two} 长按=${long}`);
          self.setData({
            currentTopKey:{ click: Number(one), doubleClick: Number(two), longPress: Number(long) },
          });
        }
      }else if (hexStr.indexOf("a103") != -1){
        
      }else if (hexStr.indexOf("a103") != -1){
        
      }else if (hexStr.indexOf("A103") != -1){
        
      }else if (hexStr.indexOf("A103") != -1){
        
      }else if (hexStr.indexOf("A103") != -1){
        
      }

    }
    this.getPenKeyBoradFunc();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

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
  //展示功能选择器
  onShowPicker(event: any) {

    let tag: string = event.currentTarget.dataset.tag;
    let subStrs = tag.split('.')
    console.log("subStrs===", subStrs);
    //分割字符串
    this.setData({
      settingType: { key: Number(subStrs[0]), func: Number(subStrs[1]) },
      isShowPicker: true
    })
    this.setPickerTitle();
  },
  onPickerChange(event: any) {
    console.log("onPickerChange===", event);
  },
  onPickerClose() {
    this.setData({
      isShowPicker: false
    })
    // isShowPicker = false;
  },
  setPickerTitle() {
    let key = this.data.settingType.key == 1 ? "上键" : "下键"
    let interactive = ''
    if (this.data.settingType.interactive == 1) {
      interactive = "单按"
    } else if (this.data.settingType.interactive == 2) {
      interactive = "双按"
    } else {
      interactive = "长按"
    }
    this.setData({
      pickerTitle: `设置"${interactive}${key}"`
    })
  },
  //获取按键功能 以及笔尖强度
  getPenKeyBoradFunc() {
    if (!app.currentConDevId.length){
      //如果设备未连接
      return;
    }
    this.data.bleMannage.writeDataToBlLEDevice("A125000000000000000000000000000000000000", app.currentConDevId, app.serveId, app.characteristicId_TX);
    this.data.bleMannage.writeDataToBlLEDevice("A122000100000000000000000000000000000000", app.currentConDevId, app.serveId, app.characteristicId_TX);
    this.data.bleMannage.writeDataToBlLEDevice("A122000000000000000000000000000000000000", app.currentConDevId, app.serveId, app.characteristicId_TX);
    /*
    获取笔尖强度
    A125000000000000000000000000000000000000
    获取上按键功能
    A122000100000000000000000000000000000000
    获取下按键功能
    A122000200000000000000000000000000000000
    */
    
  },
  //获取按键写入的view
  getBLEWriteValue(funcNum: number) {
    //01 02
    //三个按钮都要传,穿之前需要先获取三个按钮的功能
    let key = this.data.settingType.key;
    let interactive = this.data.settingType.interactive;
    let click = "";
    let doubleClick = "";
    let longPress = "";
    let CRC = "";
    let writeValueStr = `A12110${key}${click}${doubleClick}${longPress}000000000000000000000000${CRC}`

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
        self.data.deviceInfo["isConnection"] = false;
        
        console.log("self.data.deviceInfo=", self.data.deviceInfo);
        self.setData({
          deviceInfo:self.data.deviceInfo
        })
        return;
      }
  
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
          self.data.deviceInfo["isConnection"] = true;
        
          console.log("self.data.deviceInfo=", self.data.deviceInfo);
          self.setData({
            deviceInfo:self.data.deviceInfo
          })
          console.log("连接成功查看数据", self.data.deviceInfo);
          
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
                //获取电量
                self.data.bleMannage.writeDataToBlLEDevice("A103000000000000000000000000000000000000", app.currentConDevId, app.serveId, app.characteristicId_TX);
                self.getPenKeyBoradFunc();
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
  

})


/*
能索引 功能描述

12 快速截屏
13 编辑截屏
14 撤销
15 笔/橡皮檫切换
16 全屏
17 黑屏
18 播放/暂停
19 上一曲
20 下一曲
21 快速添加分页（快速创建笔记）
22 添加（移除）尺子
23 快速创建语言转文字备忘录
24 无功能
*/