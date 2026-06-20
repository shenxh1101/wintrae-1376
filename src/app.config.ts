export default defineAppConfig({
  pages: [
    'pages/board/index',
    'pages/clients/index',
    'pages/quotes/index',
    'pages/delivery/index',
    'pages/stats/index',
    'pages/order-detail/index',
    'pages/order-edit/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTitleText: '插画工作台',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F8F7FF'
  },
  tabBar: {
    color: '#9CA3AF',
    selectedColor: '#7B5CFF',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/board/index',
        text: '订单看板'
      },
      {
        pagePath: 'pages/clients/index',
        text: '客户资料'
      },
      {
        pagePath: 'pages/quotes/index',
        text: '报价单'
      },
      {
        pagePath: 'pages/delivery/index',
        text: '文件交付'
      },
      {
        pagePath: 'pages/stats/index',
        text: '收入统计'
      }
    ]
  }
})
