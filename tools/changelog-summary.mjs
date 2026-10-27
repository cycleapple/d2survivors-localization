// 更新紀錄沒有人寫 summary 時，依統計自動產生每種網站介面語言的一句話（publish.mjs 用）
//   autoSummary(stats, { rulesChanged, launcher })
//   stats：[{ id, status, added, changed, removed, new?, statusFrom? }]（跟上一次發布比）
// 網站每種介面語言都要有（docs/manifest-v2.md）：zh-TW、zh-CN、en、ja、de、fr、ru、pl
const UI = {
  'zh-TW': {
    names: { 'zh-TW': '繁中', 'zh-CN': '簡中', ja: '日文', de: '德文', fr: '法文', ru: '俄文', pl: '波蘭文' }, glue: '',
    changed: n => `修正 ${n} 條`, added: n => `新增 ${n} 條`, removed: n => `刪除 ${n} 條`, new: n => `新增${n}`, beta: '（測試中）',
    join: '、', sep: '；', rules: '更新修改規則', launcher: v => `啟動器 ${v}`, none: '更新翻譯', nowAvailable: '改為正式版', nowBeta: '改為測試中',
  },
  'zh-CN': {
    names: { 'zh-TW': '繁中', 'zh-CN': '简中', ja: '日文', de: '德文', fr: '法文', ru: '俄文', pl: '波兰文' }, glue: '',
    changed: n => `修正 ${n} 条`, added: n => `新增 ${n} 条`, removed: n => `删除 ${n} 条`, new: n => `新增${n}`, beta: '（测试中）',
    join: '、', sep: '；', rules: '更新修改规则', launcher: v => `启动器 ${v}`, none: '更新翻译', nowAvailable: '改为正式版', nowBeta: '改为测试中',
  },
  en: {
    names: { 'zh-TW': 'Traditional Chinese', 'zh-CN': 'Simplified Chinese', ja: 'Japanese', de: 'German', fr: 'French', ru: 'Russian', pl: 'Polish' }, glue: ': ',
    changed: n => `${n} fixed`, added: n => `${n} added`, removed: n => `${n} removed`, new: n => `New: ${n}`, beta: ' (beta)',
    join: ', ', sep: '; ', rules: 'Updated patch rules', launcher: v => `Launcher ${v}`, none: 'Updated translations', nowAvailable: 'now available', nowBeta: 'now in beta',
  },
  ja: {
    names: { 'zh-TW': '繁体字中国語', 'zh-CN': '簡体字中国語', ja: '日本語', de: 'ドイツ語', fr: 'フランス語', ru: 'ロシア語', pl: 'ポーランド語' }, glue: '：',
    changed: n => `${n} 件を修正`, added: n => `${n} 件を追加`, removed: n => `${n} 件を削除`, new: n => `${n}を追加`, beta: '（テスト中）',
    join: '、', sep: '／', rules: 'パッチルールを更新', launcher: v => `ランチャー ${v}`, none: '翻訳を更新', nowAvailable: '正式版に', nowBeta: 'テスト中に',
  },
  de: {
    names: { 'zh-TW': 'Traditionelles Chinesisch', 'zh-CN': 'Vereinfachtes Chinesisch', ja: 'Japanisch', de: 'Deutsch', fr: 'Französisch', ru: 'Russisch', pl: 'Polnisch' }, glue: ': ',
    changed: n => `${n} korrigiert`, added: n => `${n} hinzugefügt`, removed: n => `${n} entfernt`, new: n => `Neu: ${n}`, beta: ' (Beta)',
    join: ', ', sep: '; ', rules: 'Patch-Regeln aktualisiert', launcher: v => `Launcher ${v}`, none: 'Übersetzungen aktualisiert', nowAvailable: 'jetzt verfügbar', nowBeta: 'jetzt in der Beta',
  },
  fr: {
    names: { 'zh-TW': 'Chinois traditionnel', 'zh-CN': 'Chinois simplifié', ja: 'Japonais', de: 'Allemand', fr: 'Français', ru: 'Russe', pl: 'Polonais' }, glue: ' : ',
    changed: n => `${n} corrections`, added: n => `${n} ajouts`, removed: n => `${n} suppressions`, new: n => `Nouveau : ${n}`, beta: ' (bêta)',
    join: ', ', sep: ' ; ', rules: 'Règles de patch mises à jour', launcher: v => `Lanceur ${v}`, none: 'Traductions mises à jour', nowAvailable: 'désormais disponible', nowBeta: 'désormais en bêta',
  },
  ru: {
    names: { 'zh-TW': 'Традиционный китайский', 'zh-CN': 'Упрощенный китайский', ja: 'Японский', de: 'Немецкий', fr: 'Французский', ru: 'Русский', pl: 'Польский' }, glue: ': ',
    changed: n => `исправлено ${n}`, added: n => `добавлено ${n}`, removed: n => `удалено ${n}`, new: n => `Новый язык: ${n}`, beta: ' (бета)',
    join: ', ', sep: '; ', rules: 'Обновлены правила патча', launcher: v => `Лаунчер ${v}`, none: 'Обновлены переводы', nowAvailable: 'теперь доступен', nowBeta: 'теперь в бете',
  },
  pl: {
    names: { 'zh-TW': 'Chiński tradycyjny', 'zh-CN': 'Chiński uproszczony', ja: 'Japoński', de: 'Niemiecki', fr: 'Francuski', ru: 'Rosyjski', pl: 'Polski' }, glue: ': ',
    changed: n => `poprawiono ${n}`, added: n => `dodano ${n}`, removed: n => `usunięto ${n}`, new: n => `Nowy język: ${n}`, beta: ' (beta)',
    join: ', ', sep: '; ', rules: 'Zaktualizowano reguły łatki', launcher: v => `Launcher ${v}`, none: 'Zaktualizowano tłumaczenia', nowAvailable: 'teraz dostępny', nowBeta: 'teraz w becie',
  },
};

export const UI_LANGUAGES = Object.keys(UI);

export function autoSummary(stats, { rulesChanged = false, launcher = null } = {}) {
  return Object.fromEntries(Object.entries(UI).map(([ui, w]) => {
    const parts = stats.map(s => {
      const name = w.names[s.id] ?? s.id;
      if (s.new) return w.new(name) + (s.status === 'beta' ? w.beta : '');
      const counts = ['changed', 'added', 'removed'].filter(k => s[k]).map(k => w[k](s[k]));
      if (s.statusFrom) counts.unshift(w[s.status === 'available' ? 'nowAvailable' : 'nowBeta']);
      return counts.length ? `${name}${w.glue}${counts.join(w.join)}` : null;
    }).filter(Boolean);
    if (rulesChanged) parts.push(w.rules);
    if (launcher) parts.push(w.launcher(launcher));
    return [ui, parts.join(w.sep) || w.none];
  }));
}
