/**
 * POST /api/companies
 * 创建新企业 (需要认证)
 */
router.post('/', auth, async (req, res) => {
  try {
    console.log('创建企业，用户ID:', req.user.id);
    console.log('企业数据:', req.body);

    // 验证必填字段
    const requiredFields = ['name', 'description', 'category', 'subcategory', 'phone', 'email', 'address'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `缺少必填字段: ${missingFields.join(', ')}`
      });
    }

    // 检查用户积分是否足够
    const postCost = await UserManagement.getSystemConfig('post_costs.company');
    const userCredits = await UserManagement.getUserCredits(req.user.id);
    
    if (userCredits.current < postCost) {
      return res.status(400).json({
        success: false,
        message: `积分不足，发布企业信息需要 ${postCost} 积分，您当前有 ${userCredits.current} 积分`,
        code: 'INSUFFICIENT_CREDITS',
        data: {
          required: postCost,
          current: userCredits.current,
          shortage: postCost - userCredits.current
        }
      });
    }

    // 创建企业
    const newCompany = await Company.createCompany(req.body, req.user.id);
    
    // 扣除积分
    try {
      await UserManagement.chargeForPost(req.user.id, 'company', newCompany.id);
    } catch (creditError) {
      console.error('扣费失败，但企业已创建:', creditError);
    }
    
    res.status(201).json({
      success: true,
      data: newCompany,
      creditsSpent: postCost,
      message: '企业发布成功'
    });
  } catch (error) {
    console.error('创建企业失败:', error);
    res.status(500).json({
      success: false,
      message: '企业发布失败',
      error: error.message
    });
  }
});
