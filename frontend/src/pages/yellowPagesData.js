/** Subcategories per category — shared by YellowPages and YellowPagesPostPage */
export const YP_CATEGORIES_SUBS = {
  '仓储货代': ['收货仓', '海外仓', '货代公司'],
  '报关清关': ['中美清关行', 'T86'],
  '卡车服务': ['买卖车行', '维修保养', '交通罚单', '拖车服务', '配件装潢'],
  '保险服务': ['汽车保险', '人身保险', '其他保险'],
  '金融服务': ['设备', '仓库', '生意', '等金融贷款', '税务会计', '理财'],
  '技术服务': ['软件商', '设备商', '硬件配件商'],
  '律师服务': ['交通意外伤害', '综合律师', '民诉律师', '商业律师', '华人事务所'],
  '其他服务': []
};

export function resolveCategoryForSubcategory(subcategory) {
  for (const [catName, subs] of Object.entries(YP_CATEGORIES_SUBS)) {
    if (subs.includes(subcategory)) return catName;
  }
  return '';
}
