module.exports = {
  meta: {
    version: '0.2.0',
    weights: {
      communication: 22,
      attachment: 16,
      commitment: 20,
      rituals: 12,
      stress: 12,
      values: 8,
      redflags: 10,
    },
  },
  questions: [
    // 沟通与修复（communication）
    { id: 'comm_repair_speed', dim: 'communication', type: 'likert5', reverse: false, text: '表达不满后，24小时内能达成修复。', anchorL: '从不', anchorR: '总是' },
    { id: 'comm_listen', dim: 'communication', type: 'likert5', reverse: false, text: '对方会认真倾听，不随意打断或防御。', anchorL: '从不', anchorR: '总是' },
    { id: 'comm_escalate', dim: 'communication', type: 'likert5', reverse: true, text: '争执容易升级（批评、指责、拉黑/走人）。', anchorL: '从不', anchorR: '非常频繁' },
    { id: 'comm_repair_signal', dim: 'communication', type: 'likert5', reverse: false, text: '冲突中能识别并接住修复信号（道歉/缓和）。', anchorL: '几乎不能', anchorR: '总是可以' },

    // 依恋与情绪（attachment）
    { id: 'att_reassure', dim: 'attachment', type: 'likert5', reverse: false, text: '情绪波动时能得到安抚与回应。', anchorL: '几乎没有', anchorR: '总能得到' },
    { id: 'att_space', dim: 'attachment', type: 'likert5', reverse: false, text: '彼此能尊重并商量个人空间与边界。', anchorL: '很难做到', anchorR: '做得很好' },
    { id: 'att_anxiety', dim: 'attachment', type: 'likert5', reverse: true, text: '分开后我会强烈不安（担心被抛弃）。', anchorL: '从不', anchorR: '总是' },
    { id: 'att_avoid', dim: 'attachment', type: 'likert5', reverse: true, text: '我会刻意回避亲密话题/肢体亲密。', anchorL: '从不', anchorR: '经常' },

    // 承诺与满意（commitment）
    { id: 'com_sat', dim: 'commitment', type: 'likert5', reverse: false, text: '对关系总体满意。', anchorL: '很不满意', anchorR: '很满意' },
    { id: 'com_invest', dim: 'commitment', type: 'likert5', reverse: false, text: '我为这段关系投入了难以转移的资源。', anchorL: '几乎没有', anchorR: '很多' },
    { id: 'com_alts', dim: 'commitment', type: 'likert5', reverse: true, text: '我认为容易找到更好的替代对象。', anchorL: '非常不同意', anchorR: '非常同意' },
    { id: 'com_intent', dim: 'commitment', type: 'likert5', reverse: true, text: '近期有过认真分开的念头。', anchorL: '从不', anchorR: '经常' },
    { id: 'com_future', dim: 'commitment', type: 'likert5', reverse: false, text: '我们对未来一年有清晰共同计划。', anchorL: '没有', anchorR: '很清晰' },

    // 互动仪式（rituals）
    { id: 'rit_weekly', dim: 'rituals', type: 'likert5', reverse: false, text: '每周至少2次无手机高质量相处≥20分钟。', anchorL: '从不', anchorR: '总是' },
    { id: 'rit_appreciate', dim: 'rituals', type: 'likert5', reverse: false, text: '彼此会表达欣赏与感谢。', anchorL: '很少', anchorR: '经常' },
    { id: 'rit_touch', dim: 'rituals', type: 'likert5', reverse: false, text: '有稳定的小仪式（拥抱/问候/晚安）。', anchorL: '几乎没有', anchorR: '很稳定' },
    { id: 'rit_fun', dim: 'rituals', type: 'likert5', reverse: false, text: '有共同的轻松活动（散步/游戏/运动）。', anchorL: '几乎没有', anchorR: '经常' },

    // 压力与外溢（stress）
    { id: 'str_spill', dim: 'stress', type: 'likert5', reverse: true, text: '外部压力经常迁怒/带入关系。', anchorL: '从不', anchorR: '非常频繁' },
    { id: 'str_coping', dim: 'stress', type: 'likert5', reverse: false, text: '我们有减压与情绪调节的方法。', anchorL: '没有', anchorR: '很有效' },
    { id: 'str_recover', dim: 'stress', type: 'likert5', reverse: false, text: '冲突后能较快恢复到平稳状态。', anchorL: '很难', anchorR: '很快' },
    { id: 'str_support', dim: 'stress', type: 'likert5', reverse: false, text: '彼此会在高压期相互支持分担。', anchorL: '几乎不会', anchorR: '经常会' },

    // 价值与规划（values）
    { id: 'val_kids', dim: 'values', type: 'likert5', reverse: true, text: '在子女/育儿观上存在较大分歧。', anchorL: '没有', anchorR: '非常大' },
    { id: 'val_money', dim: 'values', type: 'likert5', reverse: true, text: '在金钱/消费/储蓄上经常冲突。', anchorL: '从不', anchorR: '经常' },
    { id: 'val_roles', dim: 'values', type: 'likert5', reverse: false, text: '对家庭分工有共识且能落地。', anchorL: '不同步', anchorR: '高度一致' },
    { id: 'val_city', dim: 'values', type: 'likert5', reverse: false, text: '对城市/职业节奏的选择大体一致。', anchorL: '完全不一致', anchorR: '基本一致' },

    // 红旗（redflags）仅用于乘子 M
    { id: 'flag_contempt',  dim: 'redflags', type: 'yn', severity: 'mid',  text: '是否每周至少一次出现轻蔑（嘲讽/翻白眼/讥笑）？' },
    { id: 'flag_silent',    dim: 'redflags', type: 'yn', severity: 'mid',  text: '是否故意冷处理≥72小时？' },
    { id: 'flag_infidelity',dim: 'redflags', type: 'yn', severity: 'mid',  text: '是否存在明确不忠或隐瞒重大事项？' },
    { id: 'flag_safety',    dim: 'redflags', type: 'yn', severity: 'high', text: '是否存在控制/威胁/暴力等安全风险？' },
  ],
}
