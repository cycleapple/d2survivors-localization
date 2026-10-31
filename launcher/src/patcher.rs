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

/// 修改好的 app.asar，和對不上、略過的加分規則（label）
pub struct Built {
    pub bytes: Vec<u8>,
    pub skipped: Vec<String>,
}

pub fn build(original: Vec<u8>, spec: &PatchSpec, target: &Target) -> Result<Built> {
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

    let mut skipped = Vec::new();
    for rule in spec.rules.iter().filter(|r| r.groups.iter().any(|g| target.groups.contains(g))) {
        let from = target.fill(&rule.from);
        let to = target.fill(&rule.to);
        // 先找到、確認只出現一次，最後才寫：加分的規則對不上時略過，這個檔案保持原樣。
        // 有 find 用 find／replace（不怕壓縮後的名稱改掉），沒有就逐字比對 from／to
        // app 的規則改 assets 以外、asar 裡指定路徑的檔案，只看 app 裡的 find／replace
        let (find, replace) = match &rule.app {
            Some(a) => (Some(a.find.as_str()), a.replace.as_str()),
            None => (rule.find.as_deref(), rule.replace.as_deref().unwrap_or("")),
        };
        let find = match find {
            Some(f) => Some(Find::new(f).with_context(|| format!("「{}」的 find 有誤", rule.label))?),
            None => None,
        };
        let replace = target.fill(replace);
        let found = (|| -> Result<(String, String)> {
            // asar 裡的完整路徑
            let candidates: Vec<String> = match (&rule.app, &rule.file) {
                (Some(a), _) => vec![a.path.clone()],
                (None, Some(p)) => vec![path(&find_asset(&names, p)?)],
                (None, None) => names.iter().filter(|n| n.ends_with(".js")).map(|n| path(n)).collect(),
            };
            let mut hits = Vec::new();
            for n in candidates {
                // app 的路徑在這個版本的遊戲裡沒有：當成對不上
                let Ok(text) = asar.read_string(&n) else { continue };
                let (count, out) = match &find {
                    Some(f) => f.apply(&text, &replace),
                    None => {
                        let count = text.matches(&from).count();
                        (count, (count == 1).then(|| text.replacen(&from, &to, 1)))
                    }
                };
                if count > 0 {
                    hits.push((n, count, out));
                }
            }
            match hits.as_slice() {
                [(n, 1, Some(out))] => Ok((n.clone(), out.clone())),
                _ => {
                    let seen = if hits.is_empty() { "0 次".to_string() } else { hits.iter().map(|(n, c, _)| format!("{n}×{c}")).collect::<Vec<_>>().join("、") };
                    Err(RuleMismatch(format!("「{}」：預期在 1 個檔案裡出現 1 次，實際 {seen}", rule.label)).into())
                }
            }
        })();
        match found {
            Ok((file, out)) => asar.write(&file, out.into_bytes())?,
            Err(e) if rule.optional && e.downcast_ref::<RuleMismatch>().is_some() => skipped.push(rule.label.clone()),
            Err(e) => return Err(e),
        }
    }

    Ok(Built { bytes: asar.pack()?, skipped })
}

/// 規則的 find：JavaScript 寫法的 regex（只用跳脫過的字元、([A-Za-z0-9_$]+)、([\s\S]*?) 和反向參照 \1…）。
/// Rust 的 regex 沒有反向參照：換成一個新的群組，比對到之後再確認跟原本那個群組一樣
pub struct Find {
    re: Regex,
    /// 原本的群組號碼 → 換過之後的群組號碼（[0] 是整段）
    groups: Vec<usize>,
    /// (換過之後的群組, 要跟它一樣的群組)
    same: Vec<(usize, usize)>,
}

impl Find {
    pub fn new(src: &str) -> Result<Self> {
        let chars: Vec<char> = src.chars().collect();
        let (mut out, mut groups, mut same, mut count, mut i) = (String::new(), vec![0usize], Vec::new(), 0usize, 0usize);
        while i < chars.len() {
            let c = chars[i];
            if c == '\\' && i + 1 < chars.len() {
                let digits: String = chars[i + 1..].iter().take_while(|c| c.is_ascii_digit()).collect();
                if digits.is_empty() {
                    out.push(c);
                    out.push(chars[i + 1]);
                    i += 2;
                } else {
                    let n: usize = digits.parse()?;
                    let to = *groups.get(n).with_context(|| format!("反向參照 \\{n} 前面沒有那個群組"))?;
                    count += 1;
                    out.push_str("([A-Za-z0-9_$]+)");
                    same.push((count, to));
                    i += 1 + digits.len();
                }
                continue;
            }
            if c == '[' {
                // 字元類別照抄到 ]（裡面的跳脫也照抄）
                out.push(c);
                i += 1;
                while i < chars.len() && chars[i] != ']' {
                    if chars[i] == '\\' && i + 1 < chars.len() {
                        out.push(chars[i]);
                        i += 1;
                    }
                    out.push(chars[i]);
                    i += 1;
                }
                continue;
            }
            if c == '(' && chars.get(i + 1) != Some(&'?') {
                count += 1;
                groups.push(count);
            }
            out.push(c);
            i += 1;
        }
        Ok(Self { re: Regex::new(&out)?, groups, same })
    }

    /// 出現幾次（反向參照對不上的不算），剛好一次時傳回代換後的文字
    pub fn apply(&self, text: &str, replace: &str) -> (usize, Option<String>) {
        let hits: Vec<regex::Captures> = self
            .re
            .captures_iter(text)
            .filter(|c| self.same.iter().all(|&(a, b)| c.get(a).map(|m| m.as_str()) == c.get(b).map(|m| m.as_str())))
            .collect();
        if hits.len() != 1 {
            return (hits.len(), None);
        }
        let c = &hits[0];
        let m = c.get(0).expect("整段");
        let group = |n: usize| self.groups.get(n).and_then(|&g| c.get(g)).map_or("", |m| m.as_str());
        (1, Some(format!("{}{}{}", &text[..m.start()], expand(replace, self.groups.len() - 1, group), &text[m.end()..])))
    }
}

/// replace 的代換，跟 tools/patch-rules.mjs 的 expandReplace 一樣：$$ → $；$ 加數字是群組（兩位數只在有那麼多群組時）；其他照原樣
fn expand<'a>(rep: &str, groups: usize, group: impl Fn(usize) -> &'a str) -> String {
    let b: Vec<char> = rep.chars().collect();
    let mut out = String::new();
    let mut i = 0;
    while i < b.len() {
        let (c, d1, d2) = (b[i], b.get(i + 1).and_then(|d| d.to_digit(10)), b.get(i + 2).and_then(|d| d.to_digit(10)));
        if c == '$' && b.get(i + 1) == Some(&'$') {
            out.push('$');
            i += 2;
            continue;
        }
        if let (true, Some(d1)) = (c == '$', d1) {
            let two = d2.map(|d2| (d1 * 10 + d2) as usize).filter(|&n| n <= groups);
            let n = two.unwrap_or(d1 as usize);
            if n >= 1 && n <= groups {
                out.push_str(group(n));
                i += if two.is_some() { 3 } else { 2 };
                continue;
            }
        }
        out.push(c);
        i += 1;
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn find_with_backrefs() {
        let f = Find::new(r"function ([A-Za-z0-9_$]+)\(([A-Za-z0-9_$]+)\)\{return ([A-Za-z0-9_$]+)\?\3\.go\(\2\):\2\}").unwrap();
        // 第二段的 M 跟 N 不一樣，不算
        let text = "a;function R(e){return M?M.go(e):e}b;function S(e){return M?N.go(e):e}";
        let (n, out) = f.apply(text, "$$x=1;function $1($2){return $3?$3.go2($2):$2}${$1}");
        assert_eq!(n, 1);
        assert_eq!(out.unwrap(), "a;$x=1;function R(e){return M?M.go2(e):e}${R}b;function S(e){return M?N.go(e):e}");
    }

    #[test]
    fn expand_like_js() {
        let g = |n: usize| ["", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J"][n];
        assert_eq!(expand("$1$10$11$$$a${x}$0", 10, g), "AJA1$$a${x}$0");
        assert_eq!(expand("$10", 9, g), "A0");
    }
}
