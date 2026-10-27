// 照 manifest 的規則修改原版 app.asar（規則跟 tools/patch-rules.mjs 是同一份）
use crate::asar::Asar;
use crate::manifest::{DesktopLanguage, PatchSpec};
use anyhow::{Context, Result};
use regex::Regex;

pub struct Target<'a> {
    pub groups: Vec<String>,
    pub menu_name: &'a str,
    pub html_lang: &'a str,
    /// 要放進 ko 槽位的字典；None 就保留原本的韓文
    pub dict: Option<&'a [u8]>,
}

impl<'a> Target<'a> {
    pub fn language(lang: &'a DesktopLanguage, dict: &'a [u8]) -> Self {
        Self { groups: lang.groups.clone(), menu_name: &lang.menu_name, html_lang: &lang.html_lang, dict: Some(dict) }
    }

    fn fill(&self, s: &str) -> String {
        s.replace("{{menu_name}}", self.menu_name).replace("{{html_lang}}", self.html_lang)
    }
}

/// 規則對不上遊戲的程式碼：多半是遊戲改版了，要等翻譯更新（jobs 會改用英文原版開遊戲）
#[derive(Debug)]
pub struct RuleMismatch(pub String);

impl std::fmt::Display for RuleMismatch {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "{}（遊戲可能改版了，要等翻譯更新）", self.0)
    }
}

impl std::error::Error for RuleMismatch {}

fn find_asset(names: &[String], pattern: &str) -> Result<String> {
    let re = Regex::new(pattern).with_context(|| format!("規則裡的檔名 regex 有誤：{pattern}"))?;
    let hits: Vec<_> = names.iter().filter(|n| re.is_match(n)).collect();
    if hits.len() != 1 {
        return Err(RuleMismatch(format!("找到 {} 個符合 {pattern} 的檔案，預期 1 個", hits.len())).into());
    }
    Ok(hits[0].clone())
}

pub fn build(original: Vec<u8>, spec: &PatchSpec, target: &Target) -> Result<Vec<u8>> {
    let mut asar = Asar::parse(original)?;
    let dir = spec.assets_dir.trim_end_matches('/');
    let names = asar.list(dir)?;
    let path = |name: &str| format!("{dir}/{name}");

    if let Some(dict) = target.dict {
        let value: serde_json::Value = serde_json::from_slice(dict).context("字典不是有效的 JSON")?;
        let file = find_asset(&names, &spec.dict_target.file)?;
        let js = spec.dict_target.template.replace("{{dict}}", &serde_json::to_string(&value)?);
        asar.write(&path(&file), js.into_bytes())?;
    }

    for rule in spec.rules.iter().filter(|r| r.groups.iter().any(|g| target.groups.contains(g))) {
        let from = target.fill(&rule.from);
        let to = target.fill(&rule.to);
        let file = match &rule.file {
            Some(p) => find_asset(&names, p)?,
            None => {
                let mut hits = Vec::new();
                for n in names.iter().filter(|n| n.ends_with(".js")) {
                    if asar.read_string(&path(n))?.contains(&from) {
                        hits.push(n.clone());
                    }
                }
                if hits.len() != 1 {
                    return Err(RuleMismatch(format!("「{}」：預期在 1 個檔案裡，實際 {} 個", rule.label, hits.len())).into());
                }
                hits.remove(0)
            }
        };
        let text = asar.read_string(&path(&file))?;
        let n = text.matches(&from).count();
        if n != 1 {
            return Err(RuleMismatch(format!("「{}」：預期出現 1 次，實際 {n} 次", rule.label)).into());
        }
        asar.write(&path(&file), text.replacen(&from, &to, 1).into_bytes())?;
    }

    asar.pack()
}
